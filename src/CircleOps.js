/**
 * CircleOps - Static methods for optimized circle rendering
 * Follows PolygonFiller pattern with static methods.
 */
class CircleOps {
    /**
     * Check if path is a single full circle (0 to 2π arc)
     * Used for fast path detection in stroke()
     * @param {SWPath2D} pathToCheck - The path to analyze
     * @returns {object|null} Circle info {cx, cy, radius} or null if not a full circle
     */
    static isFullCirclePath(pathToCheck) {
        const commands = pathToCheck.commands;

        // Must be exactly 1 command (arc only, no moveTo after beginPath())
        if (commands.length !== 1) return null;

        // Must be an arc command
        if (commands[0].type !== 'arc') return null;

        const arc = commands[0];
        const startAngle = arc.startAngle;
        const endAngle = arc.endAngle;

        // Check if it's a full circle (2π difference)
        const angleDiff = Math.abs(endAngle - startAngle);
        const isFullCircle = Math.abs(angleDiff - 2 * Math.PI) < 1e-9;

        if (!isFullCircle) return null;

        return {
            cx: arc.x,
            cy: arc.y,
            radius: arc.radius
        };
    }

    /**
     * Generate horizontal extents for each scanline of a circle using Bresenham
     * @param {number} radius - Circle radius
     * @returns {number[]} Array where extents[y] = x extent at that y offset from center
     */
    static generateExtents(radius) {
        const extents = new Array(radius + 1);
        let x = radius;
        let y = 0;
        let err = 1 - radius;

        while (x >= y) {
            // Record the x extent at this y position
            extents[y] = x;
            if (x !== y) {
                extents[x] = y;  // Mirror for the other octant
            }

            y++;
            if (err < 0) {
                err += 2 * y + 1;
            } else {
                x--;
                err += 2 * (y - x) + 1;
            }
        }

        return extents;
    }

    /**
     * Optimized circle fill with alpha blending using Bresenham scanlines
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Circle radius
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static fillAlphaBlend(surface, cx, cy, radius, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        // Calculate effective alpha (color alpha * global alpha)
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;

        const invAlpha = 1 - effectiveAlpha;
        const r = color.r;
        const g = color.g;
        const b = color.b;

        // Detect if center is at grid intersection (integer) or pixel center (half-integer)
        const isGridCenteredX = Number.isInteger(cx);
        const isGridCenteredY = Number.isInteger(cy);
        const intRadius = Math.floor(radius);

        // Generate horizontal extents using Bresenham
        const extents = CircleOps.generateExtents(intRadius);

        // Fill scanlines using top/bottom symmetry
        for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
            const xExtent = extents[rel_y];
            if (xExtent === undefined) continue;

            // Calculate span parameters based on center type
            const leftX = isGridCenteredX ? cx - xExtent : Math.floor(cx) - xExtent;
            const spanWidth = isGridCenteredX ? xExtent * 2 : xExtent * 2 + 1;

            if (isGridCenteredY) {
                // Grid-centered circles have even diameter - skip cap row at rel_y=intRadius
                if (rel_y >= intRadius) continue;

                // Grid-centered Y: bottom at cy+rel_y, top at cy-rel_y-1
                const bottomY = cy + rel_y;
                const topY = cy - rel_y - 1;

                if (bottomY >= 0 && bottomY < height) {
                    SpanOps.fillAlpha(data, width, height, leftX, bottomY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
                if (topY >= 0 && topY < height) {
                    SpanOps.fillAlpha(data, width, height, leftX, topY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            } else {
                // Pixel-centered Y: bottom at floor(cy)+rel_y, top at floor(cy)-rel_y
                const floorCy = Math.floor(cy);
                const bottomY = floorCy + rel_y;
                const topY = floorCy - rel_y;

                if (bottomY >= 0 && bottomY < height) {
                    SpanOps.fillAlpha(data, width, height, leftX, bottomY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
                // Skip top span at rel_y=0 to prevent overdraw at center pixel
                if (rel_y > 0 && topY >= 0 && topY < height) {
                    SpanOps.fillAlpha(data, width, height, leftX, topY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            }
        }
    }

    /**
     * Optimized 1px opaque circle stroke using Bresenham's algorithm
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Circle radius
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static stroke1pxOpaque(surface, cx, cy, radius, color, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Center calculation using floor (like CrispSwCanvas)
        const cX = Math.floor(cx);
        const cY = Math.floor(cy);
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

        // Determine offsets for .5 radius case
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        // Bresenham circle algorithm
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (x <= y) {
            // Calculate 8 symmetric points with offsets for top/left halves
            const p1x = cX + x, p1y = cY + y;                    // bottom-right
            const p2x = cX + y, p2y = cY + x;                    // bottom-right
            const p3x = cX + y, p3y = cY - x - yOffset;          // top-right
            const p4x = cX + x, p4y = cY - y - yOffset;          // top-right
            const p5x = cX - x - xOffset, p5y = cY - y - yOffset; // top-left
            const p6x = cX - y - xOffset, p6y = cY - x - yOffset; // top-left
            const p7x = cX - y - xOffset, p7y = cY + x;          // bottom-left
            const p8x = cX - x - xOffset, p8y = cY + y;          // bottom-left

            // Plot points with bounds checking
            if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) {
                const pos = p1y * width + p1x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (x !== y && p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) {
                const pos = p2y * width + p2x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) {
                const pos = p3y * width + p3x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) {
                const pos = p4y * width + p4x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) {
                const pos = p5y * width + p5x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (x !== y && p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) {
                const pos = p6y * width + p6x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) {
                const pos = p7y * width + p7x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) {
                const pos = p8y * width + p8x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }

            // Update Bresenham state
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        }
    }

    /**
     * Optimized 1px semi-transparent circle stroke using Bresenham's algorithm
     * Uses Set to prevent overdraw for semi-transparent colors
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Circle radius
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static stroke1pxAlpha(surface, cx, cy, radius, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        // Calculate effective alpha
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Center calculation
        const cX = Math.floor(cx);
        const cY = Math.floor(cy);
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

        // Determine offsets for .5 radius case
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        // Use Set to collect unique pixel positions (prevents overdraw)
        const uniquePixels = new Set();

        // Bresenham circle algorithm
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (x <= y) {
            // Calculate 8 symmetric points
            const points = [
                [cX + x, cY + y],
                [cX + y, cY + x],
                [cX + y, cY - x - yOffset],
                [cX + x, cY - y - yOffset],
                [cX - x - xOffset, cY - y - yOffset],
                [cX - y - xOffset, cY - x - yOffset],
                [cX - y - xOffset, cY + x],
                [cX - x - xOffset, cY + y]
            ];

            for (const [px, py] of points) {
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    uniquePixels.add(py * width + px);
                }
            }

            // Update Bresenham state
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        }

        // Render unique pixels with alpha blending
        for (const pos of uniquePixels) {
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
     * Optimized thick stroke circle using scanline-based annulus rendering
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Circle radius
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeThick(surface, cx, cy, radius, lineWidth, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;

        // Calculate inner and outer radii for the stroke annulus
        const innerRadius = radius - lineWidth / 2;
        const outerRadius = radius + lineWidth / 2;

        // Use exact centers for Canvas coordinate alignment (same as CrispSwCanvas)
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        // Calculate bounds with safety margin
        const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius + 1));
        const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
        const maxX = Math.min(width - 1, Math.ceil(cX + outerRadius + 1));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius > 0 ? innerRadius * innerRadius : 0;

        // Determine if opaque or needs alpha blending
        const isOpaque = color.a === 255 && globalAlpha >= 1.0;

        if (isOpaque) {
            const packedColor = Surface.packColor(color.r, color.g, color.b, 255);
            const data32 = surface.data32;

            // Process each scanline
            for (let y = minY; y <= maxY; y++) {
                const dy = y - cY;
                const dySquared = dy * dy;

                // Skip if outside outer circle
                if (dySquared > outerRadiusSquared) continue;

                // Calculate outer circle X intersections
                const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
                const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
                const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));

                // Case: No inner circle intersection (draw full span)
                if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
                    for (let x = outerLeftX; x <= outerRightX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }
                } else {
                    // Case: Intersects both circles - draw left and right segments
                    const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                    const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
                    const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));

                    // Left segment
                    for (let x = outerLeftX; x <= innerLeftX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }

                    // Right segment
                    for (let x = innerRightX; x <= outerRightX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }
        } else {
            // Semi-transparent: use alpha blending path
            CircleOps.strokeThickAlpha(surface, cx, cy, radius, lineWidth, color, globalAlpha, clipBuffer);
        }
    }

    /**
     * Thick stroke circle with alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} radius - Circle radius
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Context global alpha
     * @param {Uint8Array|null} clipBuffer - Clip mask buffer
     */
    static strokeThickAlpha(surface, cx, cy, radius, lineWidth, color, globalAlpha, clipBuffer) {
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const innerRadius = radius - lineWidth / 2;
        const outerRadius = radius + lineWidth / 2;
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius + 1));
        const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
        const maxX = Math.min(width - 1, Math.ceil(cX + outerRadius + 1));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius > 0 ? innerRadius * innerRadius : 0;

        for (let y = minY; y <= maxY; y++) {
            const dy = y - cY;
            const dySquared = dy * dy;

            if (dySquared > outerRadiusSquared) continue;

            const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
            const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
            const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));

            if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
                for (let x = outerLeftX; x <= outerRightX; x++) {
                    const pos = y * width + x;
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
            } else {
                const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
                const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));

                // Left segment
                for (let x = outerLeftX; x <= innerLeftX; x++) {
                    const pos = y * width + x;
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

                // Right segment
                for (let x = innerRightX; x <= outerRightX; x++) {
                    const pos = y * width + x;
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
}
