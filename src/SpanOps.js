/**
 * SpanOps - Static utility methods for horizontal span filling
 * Used by RectOps, CircleOps, and LineOps for optimized pixel rendering.
 * Follows PolygonFiller pattern with static methods.
 */
class SpanOps {
    /**
     * Fast horizontal span fill with 32-bit writes (opaque colors only)
     * @param {Uint32Array} data32 - 32-bit view of surface pixel data
     * @param {number} surfaceWidth - Surface width in pixels
     * @param {number} surfaceHeight - Surface height in pixels
     * @param {number} startX - Starting X coordinate
     * @param {number} y - Y coordinate of the span
     * @param {number} length - Length of the span in pixels
     * @param {number} packedColor - Pre-packed 32-bit RGBA color
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillOpaque(data32, surfaceWidth, surfaceHeight, startX, y, length, packedColor, clipBuffer) {
        // Y bounds check - use floor for consistent pixel alignment
        const yi = Math.floor(y);
        if (yi < 0 || yi >= surfaceHeight) return;

        // X clipping to surface bounds - use floor for consistent pixel alignment
        let x = Math.floor(startX);
        let len = length;
        if (x < 0) {
            len += x;
            x = 0;
        }
        if (x + len > surfaceWidth) {
            len = surfaceWidth - x;
        }
        if (len <= 0) return;

        let pixelIndex = yi * surfaceWidth + x;
        const endIndex = pixelIndex + len;

        if (clipBuffer) {
            // With clipping
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
            // No clipping - fastest path
            for (; pixelIndex < endIndex; pixelIndex++) {
                data32[pixelIndex] = packedColor;
            }
        }
    }

    /**
     * Horizontal span fill with alpha blending (source-over)
     * @param {Uint8Array|Uint8ClampedArray} data - 8-bit view of surface pixel data
     * @param {number} surfaceWidth - Surface width in pixels
     * @param {number} surfaceHeight - Surface height in pixels
     * @param {number} startX - Starting X coordinate
     * @param {number} y - Y coordinate of the span
     * @param {number} length - Length of the span in pixels
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} alpha - Alpha as fraction (0-1)
     * @param {number} invAlpha - Inverse alpha (1 - alpha)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillAlpha(data, surfaceWidth, surfaceHeight, startX, y, length, r, g, b, alpha, invAlpha, clipBuffer) {
        // Y bounds check - use floor for consistent pixel alignment
        const yi = Math.floor(y);
        if (yi < 0 || yi >= surfaceHeight) return;

        // X clipping to surface bounds - use floor for consistent pixel alignment
        let x = Math.floor(startX);
        let len = length;
        if (x < 0) {
            len += x;
            x = 0;
        }
        if (x + len > surfaceWidth) {
            len = surfaceWidth - x;
        }
        if (len <= 0) return;

        const endX = x + len;
        const rowOffset = yi * surfaceWidth * 4;

        if (clipBuffer) {
            // With clipping - includes byte-skip optimization
            let px = x;
            while (px < endX) {
                const pixelIndex = yi * surfaceWidth + px;
                const byteIndex = pixelIndex >> 3;

                // Skip fully clipped bytes (8 pixels at a time)
                if (clipBuffer[byteIndex] === 0) {
                    const nextByteBoundary = (byteIndex + 1) << 3;
                    // Convert back to X coordinate with bounds check
                    px = Math.min(nextByteBoundary - yi * surfaceWidth, endX);
                    continue;
                }

                const bitOffset = pixelIndex & 7;
                if ((clipBuffer[byteIndex] & (1 << bitOffset)) !== 0) {
                    const offset = rowOffset + px * 4;
                    SpanOps.blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha);
                }
                px++;
            }
        } else {
            // No clipping
            for (let px = x; px < endX; px++) {
                const offset = rowOffset + px * 4;
                SpanOps.blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha);
            }
        }
    }

    /**
     * Blend a single pixel with source-over alpha compositing
     * @param {Uint8Array|Uint8ClampedArray} data - 8-bit view of surface pixel data
     * @param {number} offset - Byte offset into data array
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} alpha - Alpha as fraction (0-1)
     * @param {number} invAlpha - Inverse alpha (1 - alpha)
     */
    static blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha) {
        // Source-over alpha blending formula
        const dstA = data[offset + 3] / 255;
        const dstAScaled = dstA * invAlpha;
        const outA = alpha + dstAScaled;

        if (outA > 0) {
            const blendFactor = 1 / outA;
            data[offset]     = (r * alpha + data[offset] * dstAScaled) * blendFactor;
            data[offset + 1] = (g * alpha + data[offset + 1] * dstAScaled) * blendFactor;
            data[offset + 2] = (b * alpha + data[offset + 2] * dstAScaled) * blendFactor;
            data[offset + 3] = outA * 255;
        }
    }
}
