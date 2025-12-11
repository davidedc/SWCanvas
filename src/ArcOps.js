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
     * Uses CircleOps.generateExtents() for correct pixel coverage with angle filtering
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

        // Use CircleOps.generateExtents for correct Bresenham-based pixel coverage
        const extentData = CircleOps.generateExtents(radius);
        if (!extentData) return;
        const { extents, intRadius, xOffset, yOffset } = extentData;

        // CircleOps center adjustment
        const adjCenterX = Math.floor(cx - 0.5);
        const adjCenterY = Math.floor(cy - 0.5);

        // Process each scanline using Bresenham extents
        for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
            const max_rel_x = extents[rel_y];

            // Calculate absolute coordinates (same as CircleOps)
            const abs_x_min = adjCenterX - max_rel_x - xOffset + 1;
            const abs_x_max = adjCenterX + max_rel_x;
            const abs_y_bottom = adjCenterY + rel_y;
            const abs_y_top = adjCenterY - rel_y - yOffset + 1;

            // Process bottom half
            if (abs_y_bottom >= 0 && abs_y_bottom < height) {
                for (let x = Math.max(0, abs_x_min); x <= Math.min(width - 1, abs_x_max); x++) {
                    const dx = x - adjCenterX;
                    const dy = rel_y;
                    // Angle filter for arc
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = abs_y_bottom * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }

            // Process top half (skip overdraw conditions - same as CircleOps)
            const drawTop = rel_y > 0 && !(rel_y === 1 && yOffset === 0);
            if (drawTop && abs_y_top >= 0 && abs_y_top < height) {
                for (let x = Math.max(0, abs_x_min); x <= Math.min(width - 1, abs_x_max); x++) {
                    const dx = x - adjCenterX;
                    const dy = -rel_y;
                    // Angle filter for arc
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = abs_y_top * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }
        }
    }

    /**
     * Fill an arc (pie slice) with alpha blending
     * Uses CircleOps.generateExtents() for correct pixel coverage with angle filtering
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

        // Use CircleOps.generateExtents for correct Bresenham-based pixel coverage
        const extentData = CircleOps.generateExtents(radius);
        if (!extentData) return;
        const { extents, intRadius, xOffset, yOffset } = extentData;

        // CircleOps center adjustment
        const adjCenterX = Math.floor(cx - 0.5);
        const adjCenterY = Math.floor(cy - 0.5);

        // Helper function to blend a pixel
        const blendPixel = (pos) => {
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

        // Process each scanline using Bresenham extents
        for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
            const max_rel_x = extents[rel_y];

            // Calculate absolute coordinates (same as CircleOps)
            const abs_x_min = adjCenterX - max_rel_x - xOffset + 1;
            const abs_x_max = adjCenterX + max_rel_x;
            const abs_y_bottom = adjCenterY + rel_y;
            const abs_y_top = adjCenterY - rel_y - yOffset + 1;

            // Process bottom half
            if (abs_y_bottom >= 0 && abs_y_bottom < height) {
                for (let x = Math.max(0, abs_x_min); x <= Math.min(width - 1, abs_x_max); x++) {
                    const dx = x - adjCenterX;
                    const dy = rel_y;
                    // Angle filter for arc
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = abs_y_bottom * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            blendPixel(pos);
                        }
                    }
                }
            }

            // Process top half (skip overdraw conditions - same as CircleOps)
            const drawTop = rel_y > 0 && !(rel_y === 1 && yOffset === 0);
            if (drawTop && abs_y_top >= 0 && abs_y_top < height) {
                for (let x = Math.max(0, abs_x_min); x <= Math.min(width - 1, abs_x_max); x++) {
                    const dx = x - adjCenterX;
                    const dy = -rel_y;
                    // Angle filter for arc
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = abs_y_top * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            blendPixel(pos);
                        }
                    }
                }
            }
        }
    }

    /**
     * Optimized 1px opaque arc stroke using Bresenham + direct writes
     * No Set, no thickness expansion - just angle-filtered Bresenham points
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static stroke1pxOpaque(surface, cx, cy, radius, startAngle, endAngle, color, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Use same center calculation as CircleOps.stroke1pxOpaque()
        const adjCX = Math.floor(cx);
        const adjCY = Math.floor(cy);

        // Calculate offsets for fractional radii (same as CircleOps)
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        const intRadius = Math.floor(radius);
        if (intRadius < 0) return;

        // Handle zero radius (single pixel)
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        data32[pos] = packedColor;
                    }
                }
            }
            return;
        }

        // Bresenham circle algorithm with angle filtering
        let bx = 0;
        let by = intRadius;
        let d = 3 - 2 * intRadius;

        while (by >= bx) {
            // 8 symmetric points with offset corrections (same pattern as CircleOps)
            const points = [
                [bx, by],                                    // bottom-right: no offset
                [by, bx],                                    // bottom-right: no offset
                [by, -bx - yOffset],                         // top-right: yOffset
                [bx, -by - yOffset],                         // top-right: yOffset
                [-bx - xOffset, -by - yOffset],              // top-left: both offsets
                [-by - xOffset, -bx - yOffset],              // top-left: both offsets
                [-by - xOffset, bx],                         // bottom-left: xOffset
                [-bx - xOffset, by]                          // bottom-left: xOffset
            ];

            for (const [px, py] of points) {
                // Only render if within angle range
                if (ArcOps.isAngleInRange(px, py, startAngle, endAngle)) {
                    const screenX = adjCX + px;
                    const screenY = adjCY + py;

                    if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
                        const pos = screenY * width + screenX;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }

            bx++;
            if (d > 0) {
                by--;
                d = d + 4 * (bx - by) + 10;
            } else {
                d = d + 4 * bx + 6;
            }
        }
    }

    /**
     * Optimized 1px semi-transparent arc stroke using Bresenham + Set
     * Uses Set to prevent overdraw for correct alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static stroke1pxAlpha(surface, cx, cy, radius, startAngle, endAngle, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Use same center calculation as CircleOps.stroke1pxAlpha()
        const adjCX = Math.floor(cx);
        const adjCY = Math.floor(cy);

        // Calculate offsets for fractional radii (same as CircleOps)
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        const intRadius = Math.floor(radius);
        if (intRadius < 0) return;

        // Handle zero radius (single pixel)
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
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

        // Collect unique pixels using Set (needed for alpha to prevent overdraw)
        const strokePixels = new Set();

        // Bresenham circle algorithm with angle filtering
        let bx = 0;
        let by = intRadius;
        let d = 3 - 2 * intRadius;

        while (by >= bx) {
            // 8 symmetric points with offset corrections (same pattern as CircleOps)
            const points = [
                [bx, by],                                    // bottom-right: no offset
                [by, bx],                                    // bottom-right: no offset
                [by, -bx - yOffset],                         // top-right: yOffset
                [bx, -by - yOffset],                         // top-right: yOffset
                [-bx - xOffset, -by - yOffset],              // top-left: both offsets
                [-by - xOffset, -bx - yOffset],              // top-left: both offsets
                [-by - xOffset, bx],                         // bottom-left: xOffset
                [-bx - xOffset, by]                          // bottom-left: xOffset
            ];

            for (const [px, py] of points) {
                if (ArcOps.isAngleInRange(px, py, startAngle, endAngle)) {
                    const screenX = adjCX + px;
                    const screenY = adjCY + py;

                    if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
                        strokePixels.add(screenY * width + screenX);
                    }
                }
            }

            bx++;
            if (d > 0) {
                by--;
                d = d + 4 * (bx - by) + 10;
            } else {
                d = d + 4 * bx + 6;
            }
        }

        // Render collected pixels with alpha blending
        for (const pos of strokePixels) {
            if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
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
     * Stroke outer arc with opaque color using scanline-based annulus algorithm
     * Produces smooth curved strokes by using inner/outer radius boundaries
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

        // Use floating-point center like CircleOps.fillAndStroke() for correct boundaries
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        // Handle zero/tiny radius (single pixel)
        if (radius < 1) {
            const px = Math.round(cx);
            const py = Math.round(cy);
            if (px >= 0 && px < width && py >= 0 && py < height) {
                const pos = py * width + px;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                    data32[pos] = packedColor;
                }
            }
            return;
        }

        // Annulus boundaries - stroke width distributed around the arc path
        const innerRadius = Math.max(0, radius - lineWidth / 2);
        const outerRadius = radius + lineWidth / 2;

        // Bounds
        const minY = Math.max(0, Math.floor(cY - outerRadius));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius * innerRadius;

        // Scanline iteration
        for (let y = minY; y <= maxY; y++) {
            const dy = y - cY;
            const dySquared = dy * dy;

            // Skip if outside outer circle
            if (dySquared > outerRadiusSquared) continue;

            // Outer circle X bounds for this scanline
            const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
            const outerLeftX = Math.max(0, Math.ceil(cX - outerXDist));
            const outerRightX = Math.min(width - 1, Math.floor(cX + outerXDist));

            // Inner circle X bounds (the "hole" in the annulus)
            let innerLeftX = outerRightX + 1; // Default: no inner hole on this scanline
            let innerRightX = outerLeftX - 1;
            if (innerRadius > 0 && dySquared < innerRadiusSquared) {
                const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                innerLeftX = Math.floor(cX - innerXDist);
                innerRightX = Math.ceil(cX + innerXDist);
            }

            // Process left annulus segment (from outer left to inner left)
            const leftEnd = Math.min(innerLeftX, outerRightX);
            for (let x = outerLeftX; x <= leftEnd; x++) {
                const dx = x - cX;
                // Check if pixel is within arc angle range
                if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                    const pos = y * width + x;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        data32[pos] = packedColor;
                    }
                }
            }

            // Process right annulus segment (from inner right to outer right)
            if (innerRadius > 0 && dySquared < innerRadiusSquared) {
                const rightStart = Math.max(innerRightX, outerLeftX);
                for (let x = rightStart; x <= outerRightX; x++) {
                    const dx = x - cX;
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }
        }
    }

    /**
     * Stroke outer arc with alpha blending using scanline-based annulus algorithm
     * Produces smooth curved strokes by using inner/outer radius boundaries
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

        // Use floating-point center like CircleOps.fillAndStroke() for correct boundaries
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        // Handle zero/tiny radius (single pixel)
        if (radius < 1) {
            const px = Math.round(cx);
            const py = Math.round(cy);
            if (px >= 0 && px < width && py >= 0 && py < height) {
                const pos = py * width + px;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
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
            return;
        }

        // Annulus boundaries - stroke width distributed around the arc path
        const innerRadius = Math.max(0, radius - lineWidth / 2);
        const outerRadius = radius + lineWidth / 2;

        // Bounds
        const minY = Math.max(0, Math.floor(cY - outerRadius));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius * innerRadius;

        // Helper function to blend a pixel
        const blendPixel = (pos) => {
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

        // Scanline iteration
        for (let y = minY; y <= maxY; y++) {
            const dy = y - cY;
            const dySquared = dy * dy;

            // Skip if outside outer circle
            if (dySquared > outerRadiusSquared) continue;

            // Outer circle X bounds for this scanline
            const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
            const outerLeftX = Math.max(0, Math.ceil(cX - outerXDist));
            const outerRightX = Math.min(width - 1, Math.floor(cX + outerXDist));

            // Inner circle X bounds (the "hole" in the annulus)
            let innerLeftX = outerRightX + 1; // Default: no inner hole on this scanline
            let innerRightX = outerLeftX - 1;
            if (innerRadius > 0 && dySquared < innerRadiusSquared) {
                const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                innerLeftX = Math.floor(cX - innerXDist);
                innerRightX = Math.ceil(cX + innerXDist);
            }

            // Process left annulus segment (from outer left to inner left)
            const leftEnd = Math.min(innerLeftX, outerRightX);
            for (let x = outerLeftX; x <= leftEnd; x++) {
                const dx = x - cX;
                // Check if pixel is within arc angle range
                if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                    const pos = y * width + x;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        blendPixel(pos);
                    }
                }
            }

            // Process right annulus segment (from inner right to outer right)
            if (innerRadius > 0 && dySquared < innerRadiusSquared) {
                const rightStart = Math.max(innerRightX, outerLeftX);
                for (let x = rightStart; x <= outerRightX; x++) {
                    const dx = x - cX;
                    if (ArcOps.isAngleInRange(dx, dy, startAngle, endAngle)) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                            blendPixel(pos);
                        }
                    }
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

