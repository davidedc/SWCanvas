/**
 * ArcOps - Static methods for optimized partial arc rendering
 * Follows CircleOps/PolygonFiller pattern with static methods.
 *
 * Unlike CircleOps (which handles full circles), ArcOps handles partial arcs
 * by filtering pixels based on angle range using isAngleInRange().
 */
class ArcOps {
    /**
     * Check if the angle of point (px, py) relative to origin is within [startAngle, endAngle]
     * @param {number} px - X coordinate relative to center
     * @param {number} py - Y coordinate relative to center
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians (must be > startAngle after normalization)
     * @returns {boolean} True if point's angle is within the arc range
     */
    static isAngleInRange(px, py, startAngle, endAngle) {
        let angle = Math.atan2(py, px);
        if (angle < 0) angle += 2 * Math.PI;
        if (angle < startAngle) angle += 2 * Math.PI;
        return angle >= startAngle && angle <= endAngle;
    }

    /**
     * Normalize angles for consistent arc rendering
     * Ensures endAngle > startAngle and handles anticlockwise direction
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {boolean} anticlockwise - Direction flag
     * @returns {object} { start, end } normalized angles
     */
    static normalizeAngles(startAngle, endAngle, anticlockwise) {
        let start = startAngle;
        let end = endAngle;

        // Normalize to [0, 2π) range
        start = start % (2 * Math.PI);
        if (start < 0) start += 2 * Math.PI;
        end = end % (2 * Math.PI);
        if (end < 0) end += 2 * Math.PI;

        if (anticlockwise) {
            // Swap and adjust for anticlockwise
            const temp = start;
            start = end;
            end = temp;
        }

        // Ensure end > start
        if (end <= start) {
            end += 2 * Math.PI;
        }

        return { start, end };
    }

    /**
     * Fill an arc (pie slice) with opaque color - fast path
     * Uses O(r²) bounding box scan with angle filtering
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {Color} color - Fill color
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillOpaque(surface, cx, cy, radius, startAngle, endAngle, color, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // CrispSWCanvas center adjustment
        const adjCX = cx - 1;
        const adjCY = cy - 1;

        const radiusSquared = (radius - 0.5) * (radius - 0.5);
        const intRadius = Math.ceil(radius);

        // Scan bounding box
        for (let dy = -intRadius; dy <= intRadius; dy++) {
            const py = Math.round(adjCY + dy);
            if (py < 0 || py >= height) continue;

            for (let dx = -intRadius; dx <= intRadius; dx++) {
                const px = Math.round(adjCX + dx);
                if (px < 0 || px >= width) continue;

                // Check distance AND angle
                if (dx * dx + dy * dy <= radiusSquared &&
                    ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        data32[pos] = packedColor;
                    }
                }
            }
        }
    }

    /**
     * Fill an arc (pie slice) with alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAlpha(surface, cx, cy, radius, startAngle, endAngle, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // CrispSWCanvas center adjustment
        const adjCX = cx - 1;
        const adjCY = cy - 1;

        const radiusSquared = (radius - 0.5) * (radius - 0.5);
        const intRadius = Math.ceil(radius);

        // Scan bounding box
        for (let dy = -intRadius; dy <= intRadius; dy++) {
            const py = Math.round(adjCY + dy);
            if (py < 0 || py >= height) continue;

            for (let dx = -intRadius; dx <= intRadius; dx++) {
                const px = Math.round(adjCX + dx);
                if (px < 0 || px >= width) continue;

                // Check distance AND angle
                if (dx * dx + dy * dy <= radiusSquared &&
                    ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
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
                }
            }
        }
    }

    /**
     * Add thick stroke pixels to the set, respecting angle bounds
     * @param {Set} strokePixels - Set to add pixel positions to
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} px - Pixel X
     * @param {number} py - Pixel Y
     * @param {number} thickness - Stroke thickness
     * @param {number} startAngle - Start angle
     * @param {number} endAngle - End angle
     * @param {number} width - Surface width
     * @param {number} height - Surface height
     */
    static addThickArcPoint(strokePixels, cx, cy, px, py, thickness, startAngle, endAngle, width, height) {
        const halfThick = Math.floor(thickness / 2);
        for (let tdy = -halfThick; tdy < thickness - halfThick; tdy++) {
            for (let tdx = -halfThick; tdx < thickness - halfThick; tdx++) {
                const strokeX = Math.round(px + tdx);
                const strokeY = Math.round(py + tdy);

                // Bounds check
                if (strokeX < 0 || strokeX >= width || strokeY < 0 || strokeY >= height) continue;

                // Check if this thick point pixel is within the arc's angle range
                const relX = strokeX - cx;
                const relY = strokeY - cy;
                let angle = Math.atan2(relY, relX);
                if (angle < 0) angle += 2 * Math.PI;
                if (angle < startAngle) angle += 2 * Math.PI;

                if (angle >= startAngle && angle <= endAngle) {
                    strokePixels.add(strokeY * width + strokeX);
                }
            }
        }
    }

    /**
     * Stroke outer arc with opaque color using Bresenham + angle filtering
     * Uses Set to collect unique pixels for correct rendering
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeOuterOpaque(surface, cx, cy, radius, startAngle, endAngle, lineWidth, color, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // CrispSWCanvas center adjustment
        const adjCX = cx - 1;
        const adjCY = cy - 1;

        // Thickness adjustment (from CrispSWCanvas)
        let thickness = lineWidth;
        if (thickness > 1) thickness *= 0.75;

        const intRadius = Math.floor(radius);
        if (intRadius < 0) return;

        // Handle zero radius (single pixel)
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        data32[pos] = packedColor;
                    }
                }
            }
            return;
        }

        // Collect stroke pixels using Bresenham with angle filtering
        const strokePixels = new Set();
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (y >= x) {
            // 8 symmetric points
            const points = [
                [x, y], [-x, y], [x, -y], [-x, -y],
                [y, x], [-y, x], [y, -x], [-y, -x]
            ];

            for (const [px, py] of points) {
                if (ArcOps.isAngleInRange(px, py, startAngle, endAngle)) {
                    ArcOps.addThickArcPoint(strokePixels, adjCX, adjCY,
                        adjCX + px, adjCY + py, thickness, startAngle, endAngle, width, height);
                }
            }

            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }

        // Render collected pixels
        for (const pos of strokePixels) {
            if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                data32[pos] = packedColor;
            }
        }
    }

    /**
     * Stroke outer arc with alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeOuterAlpha(surface, cx, cy, radius, startAngle, endAngle, lineWidth, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // CrispSWCanvas center adjustment
        const adjCX = cx - 1;
        const adjCY = cy - 1;

        // Thickness adjustment
        let thickness = lineWidth;
        if (thickness > 1) thickness *= 0.75;

        const intRadius = Math.floor(radius);
        if (intRadius < 0) return;

        // Handle zero radius
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
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
                }
            }
            return;
        }

        // Collect stroke pixels
        const strokePixels = new Set();
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (y >= x) {
            const points = [
                [x, y], [-x, y], [x, -y], [-x, -y],
                [y, x], [-y, x], [y, -x], [-y, -x]
            ];

            for (const [px, py] of points) {
                if (ArcOps.isAngleInRange(px, py, startAngle, endAngle)) {
                    ArcOps.addThickArcPoint(strokePixels, adjCX, adjCY,
                        adjCX + px, adjCY + py, thickness, startAngle, endAngle, width, height);
                }
            }

            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }

        // Render with alpha blending
        for (const pos of strokePixels) {
            if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
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
        }
    }

    /**
     * Combined fill arc + stroke outer arc in a single coordinated operation
     * Draws fill first, then stroke on top
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} fillColor - Fill color (can be null/transparent)
     * @param {Color} strokeColor - Stroke color (can be null/transparent)
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAndStrokeOuter(surface, cx, cy, radius, startAngle, endAngle, lineWidth,
                               fillColor, strokeColor, globalAlpha, clipBuffer) {
        const hasFill = fillColor && fillColor.a > 0;
        const hasStroke = strokeColor && strokeColor.a > 0 && lineWidth > 0;

        // Draw fill first (if present)
        if (hasFill) {
            const fillIsOpaque = fillColor.a === 255 && globalAlpha >= 1.0;
            if (fillIsOpaque) {
                ArcOps.fillOpaque(surface, cx, cy, radius, startAngle, endAngle, fillColor, clipBuffer);
            } else {
                ArcOps.fillAlpha(surface, cx, cy, radius, startAngle, endAngle, fillColor, globalAlpha, clipBuffer);
            }
        }

        // Draw stroke on top (if present)
        if (hasStroke) {
            const strokeIsOpaque = strokeColor.a === 255 && globalAlpha >= 1.0;
            if (strokeIsOpaque) {
                ArcOps.strokeOuterOpaque(surface, cx, cy, radius, startAngle, endAngle, lineWidth, strokeColor, clipBuffer);
            } else {
                ArcOps.strokeOuterAlpha(surface, cx, cy, radius, startAngle, endAngle, lineWidth, strokeColor, globalAlpha, clipBuffer);
            }
        }
    }
}

