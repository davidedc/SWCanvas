/**
 * LineOps - Static methods for optimized line rendering
 * Follows PolygonFiller pattern with static methods.
 *
 * Direct rendering is available exclusively via dedicated Context2D methods:
 * strokeLine()
 *
 * Path-based lines (beginPath() + moveTo() + lineTo() + stroke()) use the
 * generic polygon pipeline for consistent, predictable behavior.
 *
 * CALL HIERARCHY:
 * ---------------
 * Layer 0 (Foundation): SpanOps.fill_Opaq, SpanOps.fill_Alpha
 *
 * Layer 1 (Internal):
 *   _strokeThick_PolyScan (polygon scanline for thick lines)
 *
 * Layer 2 (Public dispatcher):
 *   stroke_Any → Bresenham (thin), SpanOps (thick AA), _strokeThick_PolyScan
 *
 * NAMING PATTERN: {operation}_{opacity}
 *   - Any = Handles all opacity/thickness cases (dispatcher)
 *   - (No orientation suffix - lines handle all angles)
 */
class LineOps {
    /**
     * Optimized line stroke - dispatches to appropriate rendering algorithm
     * @param {Surface} surface - Target surface
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number} lineWidth - Stroke width
     * @param {Color} paintSource - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     * @param {boolean} isOpaqueColor - True if color is opaque with full alpha
     * @param {boolean} isSemiTransparentColor - True if color needs alpha blending
     * @returns {boolean} True if direct rendering was used, false if path-based rendering needed
     */
    static stroke_Any(surface, x1, y1, x2, y2, lineWidth, paintSource, globalAlpha, clipBuffer, isOpaqueColor, isSemiTransparentColor) {
        const width = surface.width;
        const height = surface.height;

        if (isOpaqueColor && lineWidth <= THIN_LINE_THRESHOLD) {
            // Direct rendering for thin lines: Bresenham algorithm
            const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);
            const data32 = surface.data32;

            let x1i = Math.floor(x1);
            let y1i = Math.floor(y1);
            let x2i = Math.floor(x2);
            let y2i = Math.floor(y2);

            // Shorten horizontal/vertical lines by 1 pixel to match HTML5 Canvas
            if (x1i === x2i) {
                if (y2i > y1i) y2i--; else y1i--;
            }
            if (y1i === y2i) {
                if (x2i > x1i) x2i--; else x1i--;
            }

            let dx = Math.abs(x2i - x1i);
            let dy = Math.abs(y2i - y1i);
            const sx = x1i < x2i ? 1 : -1;
            const sy = y1i < y2i ? 1 : -1;
            let err = dx - dy;

            let x = x1i;
            let y = y1i;

            while (true) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const pixelIndex = y * width + x;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                            data32[pixelIndex] = packedColor;
                        }
                    } else {
                        data32[pixelIndex] = packedColor;
                    }
                }

                if (x === x2i && y === y2i) break;

                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
            return true;
        } else if (isOpaqueColor) {
            // Direct rendering for thick axis-aligned lines: render as rectangle
            const x1i = Math.floor(x1);
            const y1i = Math.floor(y1);
            const x2i = Math.floor(x2);
            const y2i = Math.floor(y2);
            const data32 = surface.data32;

            if (y1i === y2i) {
                // Horizontal thick line - render as filled rectangle
                const halfWidth = lineWidth / 2;
                const topY = Math.floor(y1 - halfWidth);
                const bottomY = Math.floor(y1 + halfWidth);
                const leftX = Math.min(x1i, x2i);
                const rightX = Math.max(x1i, x2i);
                const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);

                for (let y = topY; y < bottomY; y++) {
                    SpanOps.fill_Opaq(data32, width, height, leftX, y, rightX - leftX, packedColor, clipBuffer);
                }
                return true;
            } else if (x1i === x2i) {
                // Vertical thick line - render as filled rectangle
                const halfWidth = lineWidth / 2;
                const leftX = Math.floor(x1 - halfWidth);
                const rightX = Math.floor(x1 + halfWidth);
                const topY = Math.min(y1i, y2i);
                const bottomY = Math.max(y1i, y2i);
                const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);

                for (let y = topY; y < bottomY; y++) {
                    SpanOps.fill_Opaq(data32, width, height, leftX, y, rightX - leftX, packedColor, clipBuffer);
                }
                return true;
            } else {
                // Non-axis-aligned thick line - use polygon scan algorithm
                LineOps._strokeThick_PolyScan(surface, x1, y1, x2, y2, lineWidth, paintSource, globalAlpha, clipBuffer, false);
                return true;
            }
        } else if (isSemiTransparentColor && lineWidth <= THIN_LINE_THRESHOLD) {
            // Direct rendering for thin semitransparent lines: Bresenham with alpha blending
            const data = surface.data;
            const r = paintSource.r;
            const g = paintSource.g;
            const b = paintSource.b;
            const a = paintSource.a;

            const incomingAlpha = (a / 255) * globalAlpha;
            const inverseIncomingAlpha = 1 - incomingAlpha;

            let x1i = Math.floor(x1);
            let y1i = Math.floor(y1);
            let x2i = Math.floor(x2);
            let y2i = Math.floor(y2);

            if (x1i === x2i) {
                if (y2i > y1i) y2i--; else y1i--;
            }
            if (y1i === y2i) {
                if (x2i > x1i) x2i--; else x1i--;
            }

            let dx = Math.abs(x2i - x1i);
            let dy = Math.abs(y2i - y1i);
            const sx = x1i < x2i ? 1 : -1;
            const sy = y1i < y2i ? 1 : -1;
            let err = dx - dy;

            let x = x1i;
            let y = y1i;

            while (true) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const pixelIndex = y * width + x;
                    let drawPixel = true;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (!(clipBuffer[byteIndex] & (1 << bitIndex))) {
                            drawPixel = false;
                        }
                    }

                    if (drawPixel) {
                        const index = pixelIndex * 4;
                        const oldAlpha = data[index + 3] / 255;
                        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
                        const newAlpha = incomingAlpha + oldAlphaScaled;

                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[index] = (r * incomingAlpha + data[index] * oldAlphaScaled) * blendFactor;
                            data[index + 1] = (g * incomingAlpha + data[index + 1] * oldAlphaScaled) * blendFactor;
                            data[index + 2] = (b * incomingAlpha + data[index + 2] * oldAlphaScaled) * blendFactor;
                            data[index + 3] = newAlpha * 255;
                        }
                    }
                }

                if (x === x2i && y === y2i) break;

                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
            return true;
        } else if (isSemiTransparentColor) {
            // Direct rendering for thick semitransparent lines: polygon scan with alpha blending
            LineOps._strokeThick_PolyScan(surface, x1, y1, x2, y2, lineWidth, paintSource, globalAlpha, clipBuffer, true);
            return true;
        }

        // No direct rendering available
        return false;
    }

    /**
     * Fast thick line rendering using polygon scanline algorithm
     * Treats the thick line as a quadrilateral and fills it using scanline rendering.
     * @param {Surface} surface - Target surface
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number} lineWidth - Stroke width
     * @param {Color} paintSource - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     * @param {boolean} useSemiTransparent - If true, use alpha blending
     */
    static _strokeThick_PolyScan(surface, x1, y1, x2, y2, lineWidth, paintSource, globalAlpha, clipBuffer, useSemiTransparent = false) {
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;
        const data = surface.data;

        const r = paintSource.r;
        const g = paintSource.g;
        const b = paintSource.b;
        const a = paintSource.a;

        const packedColor = useSemiTransparent ? 0 : Surface.packColor(r, g, b, 255);

        const incomingAlpha = useSemiTransparent ? (a / 255) * globalAlpha : 0;
        const inverseIncomingAlpha = useSemiTransparent ? 1 - incomingAlpha : 0;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (lineLength === 0) {
            // Handle zero-length line case - draw a square
            const radius = (lineWidth / 2) | 0;
            const centerX = x1 | 0;
            const centerY = y1 | 0;

            for (let py = -radius; py <= radius; py++) {
                const y = centerY + py;
                if (y < 0 || y >= height) continue;
                const leftX = Math.max(0, centerX - radius);
                const rightX = Math.min(width - 1, centerX + radius);
                if (useSemiTransparent) {
                    SpanOps.fill_Alpha(data, width, height, leftX, y, rightX - leftX + 1, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                } else {
                    SpanOps.fill_Opaq(data32, width, height, leftX, y, rightX - leftX + 1, packedColor, clipBuffer);
                }
            }
            return;
        }

        // Calculate perpendicular vector
        const invLineLength = 1 / lineLength;
        const perpX = -dy * invLineLength;
        const perpY = dx * invLineLength;
        const halfThick = lineWidth * 0.5;

        const perpXHalfThick = perpX * halfThick;
        const perpYHalfThick = perpY * halfThick;

        // Calculate 4 corners of the thick line rectangle
        const corners = [
            { x: x1 + perpXHalfThick, y: y1 + perpYHalfThick },
            { x: x1 - perpXHalfThick, y: y1 - perpYHalfThick },
            { x: x2 - perpXHalfThick, y: y2 - perpYHalfThick },
            { x: x2 + perpXHalfThick, y: y2 + perpYHalfThick }
        ];

        // Find bounding box
        const minY = Math.max(0, Math.floor(Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));
        const maxY = Math.min(height - 1, Math.floor(Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));

        // Pre-compute edge data for faster intersection calculation
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];

            if (p1.y !== p2.y) {
                edges.push({
                    p1: p1,
                    p2: p2,
                    invDeltaY: 1 / (p2.y - p1.y),
                    deltaX: p2.x - p1.x
                });
            }
        }

        const intersections = [];

        // Scanline fill
        for (let y = minY; y <= maxY; y++) {
            intersections.length = 0;

            // Find x-intersections with polygon edges
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                const p1 = edge.p1;
                const p2 = edge.p2;

                if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
                    const t = (y - p1.y) * edge.invDeltaY;
                    intersections.push(p1.x + t * edge.deltaX);
                }
            }

            if (intersections.length === 1) {
                // Single intersection - draw one pixel
                const x = intersections[0] | 0;
                if (x >= 0 && x < width) {
                    const pixelIndex = y * width + x;
                    let drawPixel = true;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (!(clipBuffer[byteIndex] & (1 << bitIndex))) {
                            drawPixel = false;
                        }
                    }

                    if (drawPixel) {
                        if (useSemiTransparent) {
                            const index = pixelIndex * 4;
                            const oldAlpha = data[index + 3] / 255;
                            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
                            const newAlpha = incomingAlpha + oldAlphaScaled;

                            if (newAlpha > 0) {
                                const blendFactor = 1 / newAlpha;
                                data[index] = (r * incomingAlpha + data[index] * oldAlphaScaled) * blendFactor;
                                data[index + 1] = (g * incomingAlpha + data[index + 1] * oldAlphaScaled) * blendFactor;
                                data[index + 2] = (b * incomingAlpha + data[index + 2] * oldAlphaScaled) * blendFactor;
                                data[index + 3] = newAlpha * 255;
                            }
                        } else {
                            data32[pixelIndex] = packedColor;
                        }
                    }
                }
            } else if (intersections.length >= 2) {
                // Two or more intersections - draw span between min and max
                const x1i = intersections[0];
                const x2i = intersections[1];
                const leftX = Math.max(0, Math.floor(Math.min(x1i, x2i)));
                const rightX = Math.min(width - 1, Math.floor(Math.max(x1i, x2i)));
                const spanLength = rightX - leftX + 1;

                if (spanLength > 0) {
                    if (useSemiTransparent) {
                        SpanOps.fill_Alpha(data, width, height, leftX, y, spanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                    } else {
                        SpanOps.fill_Opaq(data32, width, height, leftX, y, spanLength, packedColor, clipBuffer);
                    }
                }
            }
        }
    }
}
