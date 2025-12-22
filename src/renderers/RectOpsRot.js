/**
 * RectOpsRot - Static methods for rotated rectangle rendering
 *
 * This module handles all rotated (non-axis-aligned) rectangle rendering.
 * Called directly by Context2D for rotated operations.
 *
 * CALL HIERARCHY:
 * ---------------
 * Layer 0 (Foundation): none (uses inline blending)
 *
 * Layer 1 (Primitives - do atomic rendering):
 *   fill_Rot_Any
 *   _stroke_Rot_Alpha (internal)
 *
 * Layer 2 (Composites - call other *Ops methods):
 *   stroke_Rot_Any       → LineOps.stroke_Any (for edges), _stroke_Rot_Alpha
 *   fillStroke_Rot_Any   → fill_Rot_Any + stroke_Rot_Any
 *
 * Helpers (private, used by rotated methods):
 *   _extendLine, _shortenLine, _blendPixelAlpha,
 *   _renderAndCollectLinePixels, _renderLinePixelsWithCheck
 */
class RectOpsRot {
    // ========================================================================
    // PRIVATE HELPERS (used by rotated rendering)
    // ========================================================================

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
     * Used by _stroke_Rot_Alpha for overdraw prevention.
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
     * Used for "short" edges that render first in _stroke_Rot_Alpha.
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
                    RectOpsRot._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
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
                    RectOpsRot._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            }
        }
    }

    /**
     * Render thick line pixels with alpha, checking Set to skip already-rendered.
     * Used for "long" edges that render second in _stroke_Rot_Alpha.
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
                        RectOpsRot._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
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
                        RectOpsRot._blendPixelAlpha(data, pos, r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                    }
                }
            }
        }
    }

    // ========================================================================
    // ROTATED FILL IMPLEMENTATION
    // ========================================================================

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
    static fill_Rot_Any(surface, centerX, centerY, width, height, rotation, color, globalAlpha, clipBuffer) {
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

    // ========================================================================
    // ROTATED STROKE IMPLEMENTATIONS
    // ========================================================================

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
    static _stroke_Rot_Alpha(surface, centerX, centerY, width, height, rotation,
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

        // Calculate 4 corners (same as stroke_Rot_Any)
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
            const line = extend ? RectOpsRot._extendLine(p1, p2, halfStroke)
                                : RectOpsRot._shortenLine(p1, p2, halfStroke);
            if (renderFirst) {
                RectOpsRot._renderAndCollectLinePixels(surface, data,
                    line.start.x, line.start.y, line.end.x, line.end.y, lineWidth,
                    r, g, b, effectiveAlpha, invAlpha, clipBuffer, renderedPixels);
            } else {
                RectOpsRot._renderLinePixelsWithCheck(surface, data,
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
    static stroke_Rot_Any(surface, centerX, centerY, width, height, rotation, lineWidth, color, globalAlpha, clipBuffer) {
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
            return RectOpsRot._stroke_Rot_Alpha(surface, centerX, centerY, width, height,
                rotation, lineWidth, color, globalAlpha, clipBuffer);
        }

        // Handle 1px strokes (no corner adjustment needed - minimal overlap issue)
        if (lineWidth <= 1) {
            for (let i = 0; i < 4; i++) {
                const p1 = corners[i];
                const p2 = corners[(i + 1) % 4];

                LineOps.stroke_Any(
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
            const line = RectOpsRot._extendLine(p1, p2, halfStroke);

            LineOps.stroke_Any(
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
            const line = RectOpsRot._shortenLine(p1, p2, halfStroke);

            LineOps.stroke_Any(
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

    // ========================================================================
    // COMBINED FILL+STROKE
    // ========================================================================

    /**
     * Fill and stroke a rotated rectangle in a single operation.
     *
     * Note: There is no performance advantage to unifying fill and stroke into a single
     * rendering routine because:
     * - fill_Rot_Any() uses an efficient bounding-box scan with edge functions (O(area))
     * - stroke_Rot_Any() uses a line-based algorithm that only touches perimeter pixels
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
    static fillStroke_Rot_Any(surface, centerX, centerY, width, height, rotation,
                                lineWidth, fillColor, strokeColor, globalAlpha, clipBuffer) {
        // Fill first, then stroke on top
        if (fillColor && fillColor.a > 0) {
            RectOpsRot.fill_Rot_Any(surface, centerX, centerY, width, height,
                               rotation, fillColor, globalAlpha, clipBuffer);
        }
        if (strokeColor && strokeColor.a > 0 && lineWidth > 0) {
            RectOpsRot.stroke_Rot_Any(surface, centerX, centerY, width, height,
                                 rotation, lineWidth, strokeColor, globalAlpha, clipBuffer);
        }
    }
}
