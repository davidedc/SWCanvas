/**
 * RectOps - Static methods for optimized rectangle rendering
 * Follows PolygonFiller pattern with static methods.
 *
 * Direct rendering is available exclusively via dedicated Context2D methods:
 * fillRect(), strokeRect()
 *
 * Path-based rectangles (beginPath() + rect() + fill()/stroke()) use the
 * generic polygon pipeline for consistent, predictable behavior.
 */
class RectOps {
    /**
     * Optimized 1px opaque rectangle stroke using direct pixel drawing
     * Matches Canvas grid-line to pixel-coordinate conversion
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static stroke1pxOpaque(surface, x, y, width, height, color, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Calculate rectangle pixel bounds
        // For strokeRect(132.5, 126.5, 135, 47):
        // - Path spans (132.5, 126.5) to (267.5, 173.5)
        // - 1px stroke renders at: left=132, right=267, top=126, bottom=173
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.floor(x + width);
        const bottom = Math.floor(y + height);

        // Helper to set pixel with clipping check
        const setPixel = (px, py) => {
            const pos = py * surfaceWidth + px;
            if (clipBuffer) {
                const byteIndex = pos >> 3;
                const bitIndex = pos & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
            }
            data32[pos] = packedColor;
        };

        // Draw top edge (horizontal): pixels from left to right (inclusive)
        if (top >= 0 && top < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                setPixel(px, top);
            }
        }

        // Draw bottom edge (horizontal): pixels from left to right (inclusive)
        if (bottom >= 0 && bottom < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                setPixel(px, bottom);
            }
        }

        // Draw left edge (vertical): skip corners (already drawn)
        if (left >= 0 && left < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                setPixel(left, py);
            }
        }

        // Draw right edge (vertical): skip corners (already drawn)
        if (right >= 0 && right < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                setPixel(right, py);
            }
        }
    }

    /**
     * Optimized 1px semi-transparent rectangle stroke using direct pixel drawing
     * Matches Canvas grid-line to pixel-coordinate conversion
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static stroke1pxAlpha(surface, x, y, width, height, color, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Calculate effective alpha
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Calculate rectangle pixel bounds
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.floor(x + width);
        const bottom = Math.floor(y + height);

        // Helper function to blend a pixel with clipping check
        const blendPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;
            const pos = py * surfaceWidth + px;
            if (clipBuffer) {
                const byteIndex = pos >> 3;
                const bitIndex = pos & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
            }
            const idx = pos * 4;
            const oldAlpha = data[idx + 3] / 255;
            const oldAlphaScaled = oldAlpha * invAlpha;
            const newAlpha = effectiveAlpha + oldAlphaScaled;
            if (newAlpha > 0) {
                const blendFactor = 1 / newAlpha;
                data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                data[idx + 3] = newAlpha * 255;
            }
        };

        // Draw top edge (horizontal): pixels from left to right (inclusive)
        for (let px = left; px <= right; px++) {
            blendPixel(px, top);
        }

        // Draw bottom edge (horizontal): pixels from left to right (inclusive)
        for (let px = left; px <= right; px++) {
            blendPixel(px, bottom);
        }

        // Draw left edge (vertical): skip corners (already drawn)
        for (let py = top + 1; py < bottom; py++) {
            blendPixel(left, py);
        }

        // Draw right edge (vertical): skip corners (already drawn)
        for (let py = top + 1; py < bottom; py++) {
            blendPixel(right, py);
        }
    }

    /**
     * Optimized thick stroke rectangle using direct pixel drawing
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static strokeThickOpaque(surface, x, y, width, height, lineWidth, color, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;
        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        const halfStroke = lineWidth / 2;

        // Calculate stroke geometry (edge centers)
        // Keep as floats - don't floor early for sub-pixel accuracy
        // and only floors when calculating actual pixel positions
        const left = x;
        const top = y;
        const right = x + width;
        const bottom = y + height;

        // Helper to set pixel with optional clipping
        const setPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;

            if (clipBuffer) {
                const pixelIndex = py * surfaceWidth + px;
                const byteIndex = pixelIndex >> 3;
                const bitIndex = pixelIndex & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
            }

            data32[py * surfaceWidth + px] = packedColor;
        };

        // Draw horizontal strokes (top and bottom edges with full thickness)
        for (let px = Math.floor(left - halfStroke); px < right + halfStroke; px++) {
            for (let t = -halfStroke; t < halfStroke; t++) {
                // Top edge
                setPixel(px, Math.floor(top + t));
                // Bottom edge
                setPixel(px, Math.floor(bottom + t));
            }
        }

        // Draw vertical strokes (left and right edges, excluding corners already drawn)
        for (let py = Math.floor(top + halfStroke); py < bottom - halfStroke; py++) {
            for (let t = -halfStroke; t < halfStroke; t++) {
                // Left edge
                setPixel(Math.floor(left + t), py);
                // Right edge
                setPixel(Math.floor(right + t), py);
            }
        }
    }

    /**
     * Optimized thick stroke rectangle with alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static strokeThickAlpha(surface, x, y, width, height, lineWidth, color, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Calculate effective alpha
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const halfStroke = lineWidth / 2;

        // Calculate stroke geometry (edge centers)
        // Keep as floats - don't floor early for sub-pixel accuracy
        // and only floors when calculating actual pixel positions
        const left = x;
        const top = y;
        const right = x + width;
        const bottom = y + height;

        // Helper function to blend a pixel with optional clipping
        const blendPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;

            const pixelIndex = py * surfaceWidth + px;

            if (clipBuffer) {
                const byteIndex = pixelIndex >> 3;
                const bitIndex = pixelIndex & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
            }

            const idx = pixelIndex * 4;
            const oldAlpha = data[idx + 3] / 255;
            const oldAlphaScaled = oldAlpha * invAlpha;
            const newAlpha = effectiveAlpha + oldAlphaScaled;
            if (newAlpha > 0) {
                const blendFactor = 1 / newAlpha;
                data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                data[idx + 3] = newAlpha * 255;
            }
        };

        // Draw horizontal strokes (top and bottom edges with full thickness)
        for (let px = Math.floor(left - halfStroke); px < right + halfStroke; px++) {
            for (let t = -halfStroke; t < halfStroke; t++) {
                // Top edge
                blendPixel(px, Math.floor(top + t));
                // Bottom edge
                blendPixel(px, Math.floor(bottom + t));
            }
        }

        // Calculate exact Y bounds to prevent corner overlap with non-integer geometry
        // The t loop iterates ceil(lineWidth) times, so the last t value is:
        const numTIterations = Math.ceil(lineWidth);
        const lastT = -halfStroke + numTIterations - 1;
        const topStrokeMaxY = Math.floor(top + lastT);
        const bottomStrokeMinY = Math.floor(bottom - halfStroke);

        // Draw vertical strokes (left and right edges, excluding corners)
        // Use px-based iteration to match horizontal stroke X coverage
        for (let py = topStrokeMaxY + 1; py < bottomStrokeMinY; py++) {
            // Left edge
            for (let px = Math.floor(left - halfStroke); px < left + halfStroke; px++) {
                blendPixel(px, py);
            }
            // Right edge
            for (let px = Math.floor(right - halfStroke); px < right + halfStroke; px++) {
                blendPixel(px, py);
            }
        }
    }

    // Angle tolerance for axis-aligned detection (~0.057 degrees)
    static ANGLE_TOLERANCE = 0.001;

    /**
     * Check if rotation angle is near axis-aligned (0°, 90°, 180°, 270°)
     * @param {number} angle - Rotation angle in radians
     * @returns {boolean} True if near axis-aligned
     */
    static isNearAxisAligned(angle) {
        const tolerance = RectOps.ANGLE_TOLERANCE;
        const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        return (
            Math.abs(normalized) < tolerance ||
            Math.abs(normalized - Math.PI / 2) < tolerance ||
            Math.abs(normalized - Math.PI) < tolerance ||
            Math.abs(normalized - 3 * Math.PI / 2) < tolerance ||
            Math.abs(normalized - 2 * Math.PI) < tolerance
        );
    }

    /**
     * Get adjusted dimensions for 90°/270° rotations (swap width/height)
     * @param {number} width - Original width
     * @param {number} height - Original height
     * @param {number} angle - Rotation angle in radians
     * @returns {{adjustedWidth: number, adjustedHeight: number}} Adjusted dimensions
     */
    static getRotatedDimensions(width, height, angle) {
        const tolerance = RectOps.ANGLE_TOLERANCE;
        const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (Math.abs(normalized - Math.PI / 2) < tolerance ||
            Math.abs(normalized - 3 * Math.PI / 2) < tolerance) {
            return { adjustedWidth: height, adjustedHeight: width };
        }
        return { adjustedWidth: width, adjustedHeight: height };
    }

    /**
     * Optimized opaque rectangle fill using direct 32-bit pixel writes
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Color} color - Fill color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillOpaque(surface, x, y, width, height, color, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;
        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.ceil(x + width);
        const bottom = Math.ceil(y + height);

        for (let py = Math.max(0, top); py < Math.min(bottom, surfaceHeight); py++) {
            for (let px = Math.max(0, left); px < Math.min(right, surfaceWidth); px++) {
                const pixelIndex = py * surfaceWidth + px;

                if (clipBuffer) {
                    const byteIndex = pixelIndex >> 3;
                    const bitIndex = pixelIndex & 7;
                    if (!(clipBuffer[byteIndex] & (1 << bitIndex))) continue;
                }

                data32[pixelIndex] = packedColor;
            }
        }
    }

    /**
     * Optimized alpha-blended rectangle fill
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAlpha(surface, x, y, width, height, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.ceil(x + width);
        const bottom = Math.ceil(y + height);

        for (let py = Math.max(0, top); py < Math.min(bottom, surfaceHeight); py++) {
            for (let px = Math.max(0, left); px < Math.min(right, surfaceWidth); px++) {
                const pixelIndex = py * surfaceWidth + px;

                if (clipBuffer) {
                    const byteIndex = pixelIndex >> 3;
                    const bitIndex = pixelIndex & 7;
                    if (!(clipBuffer[byteIndex] & (1 << bitIndex))) continue;
                }

                const idx = pixelIndex * 4;
                const oldAlpha = data[idx + 3] / 255;
                const oldAlphaScaled = oldAlpha * invAlpha;
                const newAlpha = effectiveAlpha + oldAlphaScaled;

                if (newAlpha > 0) {
                    const blendFactor = 1 / newAlpha;
                    data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                    data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                    data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                    data[idx + 3] = newAlpha * 255;
                }
            }
        }
    }

    /**
     * Combined fill and stroke for rectangles - single-scan span-based rendering.
     * Uses fill-first ordering for correct semi-transparent stroke blending.
     *
     * For semi-transparent strokes: fill renders to PATH extent first, then stroke
     * renders on top and blends correctly with the fill underneath.
     *
     * For opaque strokes: fill renders to INNER extent (stroke covers overlap anyway).
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Rectangle X coordinate
     * @param {number} y - Rectangle Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} fillColor - Fill color (may be null)
     * @param {Color} strokeColor - Stroke color (may be null)
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAndStroke(surface, x, y, width, height, lineWidth, fillColor, strokeColor, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;
        const data32 = surface.data32;

        // Check what we need to draw
        const hasFill = fillColor && fillColor.a > 0;
        const hasStroke = strokeColor && strokeColor.a > 0 && lineWidth > 0;

        if (!hasFill && !hasStroke) return;

        const halfStroke = hasStroke ? lineWidth / 2 : 0;

        // Determine rendering modes
        const fillIsOpaque = hasFill && fillColor.a === 255 && globalAlpha >= 1.0;
        const fillEffectiveAlpha = hasFill ? (fillColor.a / 255) * globalAlpha : 0;
        const fillInvAlpha = 1 - fillEffectiveAlpha;

        const strokeIsOpaque = hasStroke && strokeColor.a === 255 && globalAlpha >= 1.0;
        const strokeEffectiveAlpha = hasStroke ? (strokeColor.a / 255) * globalAlpha : 0;
        const strokeInvAlpha = 1 - strokeEffectiveAlpha;

        // Key check: is stroke semi-transparent? (needs fill-first blending)
        const strokeIsSemiTransparent = hasStroke && !strokeIsOpaque;

        // Packed colors for opaque rendering
        const fillPacked = fillIsOpaque ? Surface.packColor(fillColor.r, fillColor.g, fillColor.b, 255) : 0;
        const strokePacked = strokeIsOpaque ? Surface.packColor(strokeColor.r, strokeColor.g, strokeColor.b, 255) : 0;

        // Calculate bounds
        // Path bounds (fill boundary)
        const pathLeft = Math.floor(x);
        const pathTop = Math.floor(y);
        const pathRight = Math.ceil(x + width);
        const pathBottom = Math.ceil(y + height);

        // Stroke outer bounds (scan region when stroke present)
        const strokeOuterLeft = hasStroke ? Math.floor(x - halfStroke) : pathLeft;
        const strokeOuterTop = hasStroke ? Math.floor(y - halfStroke) : pathTop;
        const strokeOuterRight = hasStroke ? Math.ceil(x + width + halfStroke) : pathRight;
        const strokeOuterBottom = hasStroke ? Math.ceil(y + height + halfStroke) : pathBottom;

        // Stroke inner bounds (interior where no stroke is drawn)
        const strokeInnerLeft = hasStroke ? Math.ceil(x + halfStroke) : pathLeft;
        const strokeInnerTop = hasStroke ? Math.ceil(y + halfStroke) : pathTop;
        const strokeInnerRight = hasStroke ? Math.floor(x + width - halfStroke) : pathRight;
        const strokeInnerBottom = hasStroke ? Math.floor(y + height - halfStroke) : pathBottom;

        // Span rendering helpers
        const renderFillSpan = (left, right, py) => {
            const spanLeft = Math.max(0, left);
            const spanRight = Math.min(surfaceWidth, right);
            const length = spanRight - spanLeft;
            if (length <= 0) return;

            if (fillIsOpaque) {
                SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, spanLeft, py, length, fillPacked, clipBuffer);
            } else {
                SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, spanLeft, py, length,
                    fillColor.r, fillColor.g, fillColor.b, fillEffectiveAlpha, fillInvAlpha, clipBuffer);
            }
        };

        const renderStrokeSpan = (left, right, py) => {
            const spanLeft = Math.max(0, left);
            const spanRight = Math.min(surfaceWidth, right);
            const length = spanRight - spanLeft;
            if (length <= 0) return;

            if (strokeIsOpaque) {
                SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, spanLeft, py, length, strokePacked, clipBuffer);
            } else {
                SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, spanLeft, py, length,
                    strokeColor.r, strokeColor.g, strokeColor.b, strokeEffectiveAlpha, strokeInvAlpha, clipBuffer);
            }
        };

        // Single-pass scanline rendering
        for (let py = strokeOuterTop; py < strokeOuterBottom; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            const inVerticalStrokeZone = hasStroke && (py < strokeInnerTop || py >= strokeInnerBottom);

            // STEP 1: Render fill span FIRST
            // For semi-transparent stroke: fill to PATH extent (stroke will blend on top)
            // For opaque stroke: fill to INNER extent (stroke covers overlap, no point filling there)
            // For no stroke: fill to PATH extent
            // For semi-transparent strokes, also render fill in vertical stroke zones
            // so the top/bottom stroke can blend with the fill underneath
            const shouldRenderFill = hasFill && py >= pathTop && py < pathBottom &&
                (!inVerticalStrokeZone || strokeIsSemiTransparent);

            if (shouldRenderFill) {
                let fillLeft, fillRight;

                if (!hasStroke) {
                    // No stroke: fill entire path width
                    fillLeft = pathLeft;
                    fillRight = pathRight;
                } else if (strokeIsSemiTransparent) {
                    // Semi-transparent stroke: fill to PATH extent
                    // Stroke will blend with this fill for correct alpha blending
                    fillLeft = pathLeft;
                    fillRight = pathRight;
                } else {
                    // Opaque stroke: fill to INNER extent (stroke covers overlap anyway)
                    fillLeft = strokeInnerLeft;
                    fillRight = strokeInnerRight;
                }

                if (fillLeft < fillRight) {
                    renderFillSpan(fillLeft, fillRight, py);
                }
            }

            // STEP 2: Render stroke spans ON TOP
            if (hasStroke) {
                if (inVerticalStrokeZone) {
                    // Full horizontal stroke span (top or bottom edge)
                    renderStrokeSpan(strokeOuterLeft, strokeOuterRight, py);
                } else {
                    // Left and right stroke segments only
                    if (strokeOuterLeft < strokeInnerLeft) {
                        renderStrokeSpan(strokeOuterLeft, strokeInnerLeft, py);
                    }
                    if (strokeInnerRight < strokeOuterRight) {
                        renderStrokeSpan(strokeInnerRight, strokeOuterRight, py);
                    }
                }
            }
        }
    }

    /**
     * Fill and stroke a rotated rectangle in a single operation.
     *
     * Note: There is no performance advantage to unifying fill and stroke into a single
     * rendering routine because:
     * - fillRotated() uses an efficient bounding-box scan with edge functions (O(area))
     * - strokeRotated() uses a line-based algorithm that only touches perimeter pixels
     *   (O(perimeter × strokeWidth)), which is more efficient than scanning the entire
     *   bounding box for stroke regions
     * - A unified approach would require scanning the larger bounding box and testing
     *   each pixel against 8 edge functions, which has higher complexity than the current
     *   line-based stroke algorithm for typical rectangles
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} fillColor - Fill color (may be null)
     * @param {Color} strokeColor - Stroke color (may be null)
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAndStrokeRotated(surface, centerX, centerY, width, height, rotation,
                                lineWidth, fillColor, strokeColor, globalAlpha, clipBuffer) {
        // Fill first, then stroke on top
        if (fillColor && fillColor.a > 0) {
            RectOps.fillRotated(surface, centerX, centerY, width, height,
                               rotation, fillColor, globalAlpha, clipBuffer);
        }
        if (strokeColor && strokeColor.a > 0 && lineWidth > 0) {
            RectOps.strokeRotated(surface, centerX, centerY, width, height,
                                 rotation, lineWidth, strokeColor, globalAlpha, clipBuffer);
        }
    }

    /**
     * Rotated rectangle fill using edge-function algorithm
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillRotated(surface, centerX, centerY, width, height, rotation, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;

        const isOpaque = effectiveAlpha >= 1.0;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;
        const packedColor = isOpaque ? Surface.packColor(r, g, b, 255) : 0;

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;
        const hh = height / 2;

        // Calculate 4 corners
        const corners = [
            { x: centerX + hw * cos - hh * sin, y: centerY + hw * sin + hh * cos },
            { x: centerX + hw * cos + hh * sin, y: centerY + hw * sin - hh * cos },
            { x: centerX - hw * cos + hh * sin, y: centerY - hw * sin - hh * cos },
            { x: centerX - hw * cos - hh * sin, y: centerY - hw * sin + hh * cos }
        ];

        // Create edge functions (ax + by + c = 0) for each edge
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            edges.push({
                a: p2.y - p1.y,
                b: p1.x - p2.x,
                c: p2.x * p1.y - p1.x * p2.y
            });
        }

        // Find bounding box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const corner of corners) {
            minX = Math.min(minX, corner.x);
            maxX = Math.max(maxX, corner.x);
            minY = Math.min(minY, corner.y);
            maxY = Math.max(maxY, corner.y);
        }
        minX = Math.max(0, Math.floor(minX));
        maxX = Math.min(surfaceWidth - 1, Math.ceil(maxX));
        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(surfaceHeight - 1, Math.ceil(maxY));

        // Test each pixel using edge functions
        for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
                // Check if point is inside all edges
                let inside = true;
                for (let i = 0; i < 4; i++) {
                    if (edges[i].a * px + edges[i].b * py + edges[i].c < 0) {
                        inside = false;
                        break;
                    }
                }

                if (!inside) continue;

                const pixelIndex = py * surfaceWidth + px;

                if (clipBuffer) {
                    const byteIndex = pixelIndex >> 3;
                    const bitIndex = pixelIndex & 7;
                    if (!(clipBuffer[byteIndex] & (1 << bitIndex))) continue;
                }

                if (isOpaque) {
                    data32[pixelIndex] = packedColor;
                } else {
                    const idx = pixelIndex * 4;
                    const oldAlpha = data[idx + 3] / 255;
                    const oldAlphaScaled = oldAlpha * invAlpha;
                    const newAlpha = effectiveAlpha + oldAlphaScaled;

                    if (newAlpha > 0) {
                        const blendFactor = 1 / newAlpha;
                        data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                        data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                        data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                        data[idx + 3] = newAlpha * 255;
                    }
                }
            }
        }
    }

    /**
     * Extends a line segment by a given amount at both ends.
     * Used for proper miter joins at rectangle corners.
     * @param {Object} p1 - Start point {x, y}
     * @param {Object} p2 - End point {x, y}
     * @param {number} amount - Amount to extend at each end
     * @returns {Object} Extended line {start: {x, y}, end: {x, y}}
     */
    static _extendLine(p1, p2, amount) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return { start: p1, end: p2 };

        const dirX = dx / len;
        const dirY = dy / len;

        return {
            start: { x: p1.x - dirX * amount, y: p1.y - dirY * amount },
            end: { x: p2.x + dirX * amount, y: p2.y + dirY * amount }
        };
    }

    /**
     * Shortens a line segment by a given amount at both ends.
     * Used for proper miter joins at rectangle corners.
     * @param {Object} p1 - Start point {x, y}
     * @param {Object} p2 - End point {x, y}
     * @param {number} amount - Amount to shorten at each end
     * @returns {Object} Shortened line {start: {x, y}, end: {x, y}}
     */
    static _shortenLine(p1, p2, amount) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return { start: p1, end: p2 };

        const dirX = dx / len;
        const dirY = dy / len;

        return {
            start: { x: p1.x + dirX * amount, y: p1.y + dirY * amount },
            end: { x: p2.x - dirX * amount, y: p2.y - dirY * amount }
        };
    }

    /**
     * Blend a single pixel with alpha (with clipping check)
     * Used by strokeRotatedAlpha for overdraw prevention.
     * @param {Uint8ClampedArray} data - Surface data array
     * @param {number} pos - Pixel position (y * width + x)
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} effectiveAlpha - Effective alpha (0-1)
     * @param {number} invAlpha - 1 - effectiveAlpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static _blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer) {
        if (clipBuffer) {
            const byteIndex = pos >> 3;
            const bitIndex = pos & 7;
            if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
        }
        const idx = pos * 4;
        const oldAlpha = data[idx + 3] / 255;
        const oldAlphaScaled = oldAlpha * invAlpha;
        const newAlpha = effectiveAlpha + oldAlphaScaled;
        if (newAlpha > 0) {
            const blendFactor = 1 / newAlpha;
            data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
            data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
            data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
            data[idx + 3] = newAlpha * 255;
        }
    }

    /**
     * Render thick line pixels with alpha AND add to Set.
     * Used for "short" edges that render first in strokeRotatedAlpha.
     * Based on LineOps.strokeThickPolygonScan() polygon scan algorithm.
     */
    static _renderAndCollectLinePixels(surface, data, x1, y1, x2, y2, lineWidth,
                                        r, g, b, effectiveAlpha, invAlpha, clipBuffer, pixelSet) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (lineLength === 0) {
            // Zero-length line - render a square of pixels
            const radius = (lineWidth / 2) | 0;
            const centerX = x1 | 0;
            const centerY = y1 | 0;
            for (let py = -radius; py <= radius; py++) {
                const y = centerY + py;
                if (y < 0 || y >= surfaceHeight) continue;
                for (let x = Math.max(0, centerX - radius); x <= Math.min(surfaceWidth - 1, centerX + radius); x++) {
                    const pos = y * surfaceWidth + x;
                    pixelSet.add(pos);
                    RectOps._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            }
            return;
        }

        // Calculate perpendicular vector and 4 corners
        const invLineLength = 1 / lineLength;
        const perpX = -dy * invLineLength;
        const perpY = dx * invLineLength;
        const halfThick = lineWidth * 0.5;
        const perpXHalfThick = perpX * halfThick;
        const perpYHalfThick = perpY * halfThick;

        const corners = [
            { x: x1 + perpXHalfThick, y: y1 + perpYHalfThick },
            { x: x1 - perpXHalfThick, y: y1 - perpYHalfThick },
            { x: x2 - perpXHalfThick, y: y2 - perpYHalfThick },
            { x: x2 + perpXHalfThick, y: y2 + perpYHalfThick }
        ];

        const minY = Math.max(0, Math.floor(Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));
        const maxY = Math.min(surfaceHeight - 1, Math.floor(Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));

        // Pre-compute edges
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            if (p1.y !== p2.y) {
                edges.push({ p1, p2, invDeltaY: 1 / (p2.y - p1.y), deltaX: p2.x - p1.x });
            }
        }

        // Scanline rendering + collection
        const intersections = [];
        for (let y = minY; y <= maxY; y++) {
            intersections.length = 0;
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                const p1 = edge.p1;
                const p2 = edge.p2;
                if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
                    intersections.push(p1.x + (y - p1.y) * edge.invDeltaY * edge.deltaX);
                }
            }
            if (intersections.length >= 2) {
                const leftX = Math.max(0, Math.floor(Math.min(intersections[0], intersections[1])));
                const rightX = Math.min(surfaceWidth - 1, Math.floor(Math.max(intersections[0], intersections[1])));
                for (let x = leftX; x <= rightX; x++) {
                    const pos = y * surfaceWidth + x;
                    pixelSet.add(pos);
                    RectOps._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            }
        }
    }

    /**
     * Render thick line pixels with alpha, checking Set to skip already-rendered.
     * Used for "long" edges that render second in strokeRotatedAlpha.
     * Based on LineOps.strokeThickPolygonScan() polygon scan algorithm.
     */
    static _renderLinePixelsWithCheck(surface, data, x1, y1, x2, y2, lineWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer, pixelSet) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (lineLength === 0) {
            // Zero-length line - render a square of pixels (with check)
            const radius = (lineWidth / 2) | 0;
            const centerX = x1 | 0;
            const centerY = y1 | 0;
            for (let py = -radius; py <= radius; py++) {
                const y = centerY + py;
                if (y < 0 || y >= surfaceHeight) continue;
                for (let x = Math.max(0, centerX - radius); x <= Math.min(surfaceWidth - 1, centerX + radius); x++) {
                    const pos = y * surfaceWidth + x;
                    if (!pixelSet.has(pos)) {
                        RectOps._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                    }
                }
            }
            return;
        }

        // Calculate perpendicular vector and 4 corners
        const invLineLength = 1 / lineLength;
        const perpX = -dy * invLineLength;
        const perpY = dx * invLineLength;
        const halfThick = lineWidth * 0.5;
        const perpXHalfThick = perpX * halfThick;
        const perpYHalfThick = perpY * halfThick;

        const corners = [
            { x: x1 + perpXHalfThick, y: y1 + perpYHalfThick },
            { x: x1 - perpXHalfThick, y: y1 - perpYHalfThick },
            { x: x2 - perpXHalfThick, y: y2 - perpYHalfThick },
            { x: x2 + perpXHalfThick, y: y2 + perpYHalfThick }
        ];

        const minY = Math.max(0, Math.floor(Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));
        const maxY = Math.min(surfaceHeight - 1, Math.floor(Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));

        // Pre-compute edges
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            if (p1.y !== p2.y) {
                edges.push({ p1, p2, invDeltaY: 1 / (p2.y - p1.y), deltaX: p2.x - p1.x });
            }
        }

        // Scanline rendering with Set check
        const intersections = [];
        for (let y = minY; y <= maxY; y++) {
            intersections.length = 0;
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                const p1 = edge.p1;
                const p2 = edge.p2;
                if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
                    intersections.push(p1.x + (y - p1.y) * edge.invDeltaY * edge.deltaX);
                }
            }
            if (intersections.length >= 2) {
                const leftX = Math.max(0, Math.floor(Math.min(intersections[0], intersections[1])));
                const rightX = Math.min(surfaceWidth - 1, Math.floor(Math.max(intersections[0], intersections[1])));
                for (let x = leftX; x <= rightX; x++) {
                    const pos = y * surfaceWidth + x;
                    if (!pixelSet.has(pos)) {
                        RectOps._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                    }
                }
            }
        }
    }

    /**
     * Rotated rectangle stroke with alpha blending (no overdraw).
     * Single-pass optimization: render short edges first (add to Set), then long edges (check Set).
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeRotatedAlpha(surface, centerX, centerY, width, height, rotation,
                              lineWidth, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;
        const hh = height / 2;
        const halfStroke = lineWidth / 2;

        // Calculate 4 corners (same as strokeRotated)
        const corners = [
            { x: centerX - hw * cos - hh * sin, y: centerY - hw * sin + hh * cos },
            { x: centerX + hw * cos - hh * sin, y: centerY + hw * sin + hh * cos },
            { x: centerX + hw * cos + hh * sin, y: centerY + hw * sin - hh * cos },
            { x: centerX - hw * cos + hh * sin, y: centerY - hw * sin - hh * cos }
        ];

        // Determine which edge pair is shorter at runtime
        // Extended edges (0,2): approx width + lineWidth
        // Shortened edges (1,3): approx height - lineWidth
        const extendedLength = width + lineWidth;
        const shortenedLength = Math.max(0, height - lineWidth);

        const renderedPixels = new Set();

        // Helper to process a single edge
        const processEdge = (i, extend, renderFirst) => {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            const line = extend ? RectOps._extendLine(p1, p2, halfStroke)
                                : RectOps._shortenLine(p1, p2, halfStroke);
            if (renderFirst) {
                RectOps._renderAndCollectLinePixels(surface, data,
                    line.start.x, line.start.y, line.end.x, line.end.y, lineWidth,
                    r, g, b, effectiveAlpha, invAlpha, clipBuffer, renderedPixels);
            } else {
                RectOps._renderLinePixelsWithCheck(surface, data,
                    line.start.x, line.start.y, line.end.x, line.end.y, lineWidth,
                    r, g, b, effectiveAlpha, invAlpha, clipBuffer, renderedPixels);
            }
        };

        if (shortenedLength <= extendedLength) {
            // Shortened edges are shorter: render+add first, then extended with check
            processEdge(1, false, true);  // shortened
            processEdge(3, false, true);  // shortened
            processEdge(0, true, false);  // extended with check
            processEdge(2, true, false);  // extended with check
        } else {
            // Extended edges are shorter: render+add first, then shortened with check
            processEdge(0, true, true);   // extended
            processEdge(2, true, true);   // extended
            processEdge(1, false, false); // shortened with check
            processEdge(3, false, false); // shortened with check
        }
    }

    /**
     * Rotated rectangle stroke using LineOps for edges.
     * Uses extend/shorten strategy for proper miter joins at corners.
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width in pixels
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha (0-1)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeRotated(surface, centerX, centerY, width, height, rotation, lineWidth, color, globalAlpha, clipBuffer) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;
        const hh = height / 2;

        // Calculate 4 corners
        const corners = [
            { x: centerX - hw * cos - hh * sin, y: centerY - hw * sin + hh * cos },
            { x: centerX + hw * cos - hh * sin, y: centerY + hw * sin + hh * cos },
            { x: centerX + hw * cos + hh * sin, y: centerY + hw * sin - hh * cos },
            { x: centerX - hw * cos + hh * sin, y: centerY - hw * sin - hh * cos }
        ];

        const isOpaqueColor = color.a === 255 && globalAlpha >= 1.0;
        const isSemiTransparentColor = !isOpaqueColor && color.a > 0;

        // For thick semitransparent strokes, use Set-based approach to prevent overdraw
        if (lineWidth > 1 && isSemiTransparentColor) {
            return RectOps.strokeRotatedAlpha(surface, centerX, centerY, width, height,
                rotation, lineWidth, color, globalAlpha, clipBuffer);
        }

        // Handle 1px strokes (no corner adjustment needed - minimal overlap issue)
        if (lineWidth <= 1) {
            for (let i = 0; i < 4; i++) {
                const p1 = corners[i];
                const p2 = corners[(i + 1) % 4];

                LineOps.strokeDirect(
                    surface,
                    p1.x, p1.y,
                    p2.x, p2.y,
                    lineWidth,
                    color,
                    globalAlpha,
                    clipBuffer,
                    isOpaqueColor,
                    isSemiTransparentColor
                );
            }
            return;
        }

        // Handle thick strokes with extend/shorten for proper miter corners
        const halfStroke = lineWidth / 2;

        // Draw even-indexed edges (0→1, 2→3) with EXTENDED lines
        // These extended edges form the corner regions
        for (let i = 0; i < 4; i += 2) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            const line = RectOps._extendLine(p1, p2, halfStroke);

            LineOps.strokeDirect(
                surface,
                line.start.x, line.start.y,
                line.end.x, line.end.y,
                lineWidth,
                color,
                globalAlpha,
                clipBuffer,
                isOpaqueColor,
                isSemiTransparentColor
            );
        }

        // Draw odd-indexed edges (1→2, 3→0) with SHORTENED lines
        // These shortened edges fit between the extended edges without overlap
        for (let i = 1; i < 4; i += 2) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            const line = RectOps._shortenLine(p1, p2, halfStroke);

            LineOps.strokeDirect(
                surface,
                line.start.x, line.start.y,
                line.end.x, line.end.y,
                lineWidth,
                color,
                globalAlpha,
                clipBuffer,
                isOpaqueColor,
                isSemiTransparentColor
            );
        }
    }
}
