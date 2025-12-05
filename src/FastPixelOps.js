/**
 * FastPixelOps - High-performance pixel operations for SWCanvas
 *
 * Provides CrispSwCanvas-style optimizations:
 * - 32-bit packed writes for opaque pixels (4x fewer memory operations)
 * - Inline clip buffer access with bitwise operations
 * - Pre-computed values outside hot loops
 * - Byte-level clip skipping (skip 8 pixels at once when fully clipped)
 *
 * This class centralizes the performance-critical pixel operations that are
 * used by shape renderers and the polygon filler for maximum speed.
 */
class FastPixelOps {
    /**
     * Create FastPixelOps for a surface
     * @param {Surface} surface - Target surface for pixel operations
     */
    constructor(surface) {
        this.surface = surface;
        this.width = surface.width;
        this.height = surface.height;
        this.data = surface.data;
        this.data32 = surface.data32;
    }

    /**
     * Check if pixel is clipped (inline-optimized static method)
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null if no clipping)
     * @param {number} pixelIndex - Linear pixel index (y * width + x)
     * @returns {boolean} True if pixel is clipped (should skip rendering)
     */
    static isClipped(clipBuffer, pixelIndex) {
        if (!clipBuffer) return false;
        const byteIndex = pixelIndex >> 3;
        const bitIndex = pixelIndex & 7;
        return (clipBuffer[byteIndex] & (1 << bitIndex)) === 0;
    }

    /**
     * Check if entire byte is clipped (skip 8 pixels optimization)
     * @param {Uint8Array} clipBuffer - Raw clip mask buffer
     * @param {number} byteIndex - Byte index in clip buffer
     * @returns {boolean} True if all 8 pixels in byte are clipped
     */
    static isByteFullyClipped(clipBuffer, byteIndex) {
        return clipBuffer[byteIndex] === 0;
    }

    /**
     * Set single pixel with clipping and optional alpha blending
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-255)
     * @param {number} globalAlpha - Global alpha multiplier (0-1)
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null)
     */
    setPixel(x, y, r, g, b, a, globalAlpha, clipBuffer) {
        // Bounds check
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        const pixelIndex = y * this.width + x;

        // Clip check with inline bitwise operations
        if (clipBuffer) {
            const byteIndex = pixelIndex >> 3;
            const bitIndex = pixelIndex & 7;
            if ((clipBuffer[byteIndex] & (1 << bitIndex)) === 0) return;
        }

        // Fast path for fully opaque pixels
        if (a === 255 && globalAlpha >= 1.0) {
            this.data32[pixelIndex] = 0xFF000000 | (b << 16) | (g << 8) | r;
            return;
        }

        // Alpha blending path (source-over compositing)
        const idx = pixelIndex * 4;
        const srcAlpha = (a / 255) * globalAlpha;
        const invSrcAlpha = 1 - srcAlpha;
        const dstAlpha = this.data[idx + 3] / 255;
        const outAlpha = srcAlpha + dstAlpha * invSrcAlpha;

        if (outAlpha <= 0) return;

        const blendFactor = 1 / outAlpha;
        this.data[idx]     = (r * srcAlpha + this.data[idx]     * dstAlpha * invSrcAlpha) * blendFactor;
        this.data[idx + 1] = (g * srcAlpha + this.data[idx + 1] * dstAlpha * invSrcAlpha) * blendFactor;
        this.data[idx + 2] = (b * srcAlpha + this.data[idx + 2] * dstAlpha * invSrcAlpha) * blendFactor;
        this.data[idx + 3] = outAlpha * 255;
    }

    /**
     * Set pixel using pre-packed color (fastest single-pixel write)
     * No bounds checking - caller must ensure validity
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} packedColor - Pre-packed 32-bit ABGR color
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null)
     */
    setPixelPacked(pixelIndex, packedColor, clipBuffer) {
        if (clipBuffer) {
            const byteIndex = pixelIndex >> 3;
            const bitIndex = pixelIndex & 7;
            if ((clipBuffer[byteIndex] & (1 << bitIndex)) === 0) return;
        }
        this.data32[pixelIndex] = packedColor;
    }

    /**
     * Clear pixel to fully transparent
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    clearPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.data32[y * this.width + x] = 0;
    }

    /**
     * Fill horizontal run with solid color (optimized for scanline rendering)
     * @param {number} x - Starting X coordinate
     * @param {number} y - Y coordinate
     * @param {number} length - Run length in pixels
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-255)
     * @param {number} globalAlpha - Global alpha multiplier (0-1)
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null)
     */
    fillRun(x, y, length, r, g, b, a, globalAlpha, clipBuffer) {
        // Y bounds check
        if (y < 0 || y >= this.height) return;

        // X clipping to surface bounds
        if (x < 0) {
            length += x;
            x = 0;
        }
        if (x + length > this.width) {
            length = this.width - x;
        }
        if (length <= 0) return;

        const isOpaque = a === 255 && globalAlpha >= 1.0;
        let pixelIndex = y * this.width + x;
        const endIndex = pixelIndex + length;
        const data32 = this.data32;

        if (isOpaque) {
            const packedColor = 0xFF000000 | (b << 16) | (g << 8) | r;

            if (clipBuffer) {
                // Opaque with clipping - use byte-level skip optimization
                while (pixelIndex < endIndex) {
                    const byteIndex = pixelIndex >> 3;

                    // Skip fully clipped bytes (8 pixels at a time)
                    if (clipBuffer[byteIndex] === 0) {
                        const nextByteBoundary = (byteIndex + 1) << 3;
                        pixelIndex = Math.min(nextByteBoundary, endIndex);
                        continue;
                    }

                    // Check individual pixel within partially visible byte
                    const bitIndex = pixelIndex & 7;
                    if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                        data32[pixelIndex] = packedColor;
                    }
                    pixelIndex++;
                }
            } else {
                // Opaque without clipping - fastest path
                for (; pixelIndex < endIndex; pixelIndex++) {
                    data32[pixelIndex] = packedColor;
                }
            }
        } else {
            // Alpha blending path
            const srcAlpha = (a / 255) * globalAlpha;
            if (srcAlpha <= 0) return;

            const invSrcAlpha = 1 - srcAlpha;
            const data = this.data;

            if (clipBuffer) {
                while (pixelIndex < endIndex) {
                    const byteIndex = pixelIndex >> 3;

                    // Skip fully clipped bytes
                    if (clipBuffer[byteIndex] === 0) {
                        const nextByteBoundary = (byteIndex + 1) << 3;
                        pixelIndex = Math.min(nextByteBoundary, endIndex);
                        continue;
                    }

                    const bitIndex = pixelIndex & 7;
                    if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                        const idx = pixelIndex * 4;
                        const dstAlpha = data[idx + 3] / 255;
                        const outAlpha = srcAlpha + dstAlpha * invSrcAlpha;

                        if (outAlpha > 0) {
                            const blendFactor = 1 / outAlpha;
                            data[idx]     = (r * srcAlpha + data[idx]     * dstAlpha * invSrcAlpha) * blendFactor;
                            data[idx + 1] = (g * srcAlpha + data[idx + 1] * dstAlpha * invSrcAlpha) * blendFactor;
                            data[idx + 2] = (b * srcAlpha + data[idx + 2] * dstAlpha * invSrcAlpha) * blendFactor;
                            data[idx + 3] = outAlpha * 255;
                        }
                    }
                    pixelIndex++;
                }
            } else {
                // Blending without clipping
                for (; pixelIndex < endIndex; pixelIndex++) {
                    const idx = pixelIndex * 4;
                    const dstAlpha = data[idx + 3] / 255;
                    const outAlpha = srcAlpha + dstAlpha * invSrcAlpha;

                    if (outAlpha > 0) {
                        const blendFactor = 1 / outAlpha;
                        data[idx]     = (r * srcAlpha + data[idx]     * dstAlpha * invSrcAlpha) * blendFactor;
                        data[idx + 1] = (g * srcAlpha + data[idx + 1] * dstAlpha * invSrcAlpha) * blendFactor;
                        data[idx + 2] = (b * srcAlpha + data[idx + 2] * dstAlpha * invSrcAlpha) * blendFactor;
                        data[idx + 3] = outAlpha * 255;
                    }
                }
            }
        }
    }

    /**
     * Fill horizontal run with pre-packed opaque color (fastest run fill)
     * No bounds checking - caller must ensure validity
     * @param {number} startIndex - Starting linear pixel index
     * @param {number} length - Number of pixels to fill
     * @param {number} packedColor - Pre-packed 32-bit ABGR color
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null)
     */
    fillRunPacked(startIndex, length, packedColor, clipBuffer) {
        const endIndex = startIndex + length;
        const data32 = this.data32;

        if (clipBuffer) {
            let pixelIndex = startIndex;
            while (pixelIndex < endIndex) {
                const byteIndex = pixelIndex >> 3;

                // Skip fully clipped bytes
                if (clipBuffer[byteIndex] === 0) {
                    const nextByteBoundary = (byteIndex + 1) << 3;
                    pixelIndex = Math.min(nextByteBoundary, endIndex);
                    continue;
                }

                const bitIndex = pixelIndex & 7;
                if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                    data32[pixelIndex] = packedColor;
                }
                pixelIndex++;
            }
        } else {
            // No clipping - direct fill
            for (let i = startIndex; i < endIndex; i++) {
                data32[i] = packedColor;
            }
        }
    }

    /**
     * Fill multiple horizontal runs with the same color (batch operation)
     * Runs format: flat array of [x, y, length, x, y, length, ...]
     * @param {Array<number>} runs - Flat array of run triplets [x, y, length, ...]
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-255)
     * @param {number} globalAlpha - Global alpha multiplier (0-1)
     * @param {Uint8Array|null} clipBuffer - Raw clip mask buffer (or null)
     */
    fillRuns(runs, r, g, b, a, globalAlpha, clipBuffer) {
        for (let i = 0; i < runs.length; i += 3) {
            this.fillRun(runs[i], runs[i + 1], runs[i + 2], r, g, b, a, globalAlpha, clipBuffer);
        }
    }

    /**
     * Set pixel in clipping mask (for building clip regions)
     * @param {Uint8Array} clipBuffer - Target clip mask buffer
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    clipPixel(clipBuffer, x, y) {
        // Convert to integer with bitwise OR
        x = x | 0;
        y = y | 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        const pixelPos = y * this.width + x;
        const byteIndex = pixelPos >> 3;
        const bitIndex = pixelPos & 7;

        // OR the bit to mark pixel as visible in clip mask
        clipBuffer[byteIndex] |= (1 << bitIndex);
    }
}
