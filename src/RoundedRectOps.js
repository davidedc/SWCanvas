/**
 * RoundedRectOps - Static methods for optimized rounded rectangle rendering
 * Follows the PolygonFiller/RectOps/CircleOps/LineOps pattern.
 *
 * Direct rendering is available exclusively via dedicated Context2D methods:
 * fillRoundRect(), strokeRoundRect(), fillAndStrokeRoundRect()
 *
 * Path-based rounded rectangles (beginPath() + roundRect() + fill()/stroke()) use the
 * generic polygon pipeline for consistent, predictable behavior.
 */
class RoundedRectOps {
    /**
     * Direct rendering for 1px opaque stroke on axis-aligned rounded rectangle.
     * Uses direct pixel setting for corners via angle iteration and
     * horizontal/vertical line drawing for straight edges.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static stroke1pxOpaque(surface, x, y, width, height, radii, color, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        // Normalize radius
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        radius = Math.round(Math.min(radius, Math.min(width, height) / 2));

        // Fallback to RectOps for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            RectOps.stroke1pxOpaque(surface, x, y, width, height, color);
            return;
        }

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // For 1px stroke, calculate the stroke geometry
        // The stroke is centered on the path, so for integer coordinates
        // we need to handle both grid-centered and pixel-centered cases
        const posX = x;
        const posY = y;
        const posW = width;
        const posH = height;

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

        // Draw horizontal edges (top and bottom, excluding corners)
        const topY = Math.floor(posY);
        const bottomY = Math.floor(posY + posH - 0.5);

        for (let xx = Math.floor(posX + radius); xx < posX + posW - radius; xx++) {
            // Top edge
            setPixel(xx, topY);
            // Bottom edge
            setPixel(xx, bottomY);
        }

        // Draw vertical edges (left and right, excluding corners)
        const leftX = Math.floor(posX);
        const rightX = Math.floor(posX + posW - 0.5);

        for (let yy = Math.floor(posY + radius); yy < posY + posH - radius; yy++) {
            // Left edge
            setPixel(leftX, yy);
            // Right edge
            setPixel(rightX, yy);
        }

        // Draw corner arcs using angle iteration (Bresenham-style)
        // For a 1px stroke, we draw at radius - 0.5 to get proper pixel placement
        const drawCorner = (cx, cy, startAngle, endAngle) => {
            const sr = radius - 0.5;
            // Use 1 degree steps for smooth corners
            const angleStep = Math.PI / 180;
            for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
                const px = Math.floor(cx + sr * Math.cos(angle));
                const py = Math.floor(cy + sr * Math.sin(angle));
                setPixel(px, py);
            }
        };

        // Top-left corner (180° to 270°)
        drawCorner(posX + radius, posY + radius, Math.PI, Math.PI * 3 / 2);
        // Top-right corner (270° to 360°)
        drawCorner(posX + posW - radius, posY + radius, Math.PI * 3 / 2, Math.PI * 2);
        // Bottom-right corner (0° to 90°)
        drawCorner(posX + posW - radius, posY + posH - radius, 0, Math.PI / 2);
        // Bottom-left corner (90° to 180°)
        drawCorner(posX + radius, posY + posH - radius, Math.PI / 2, Math.PI);
    }

    /**
     * Direct rendering for 1px semi-transparent stroke on axis-aligned rounded rectangle.
     * Uses alpha blending for each pixel.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static stroke1pxAlpha(surface, x, y, width, height, radii, color, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Normalize radius
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        radius = Math.round(Math.min(radius, Math.min(width, height) / 2));

        // Fallback to RectOps for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            RectOps.stroke1pxAlpha(surface, x, y, width, height, color, globalAlpha);
            return;
        }

        const r = color.r;
        const g = color.g;
        const b = color.b;
        const incomingAlpha = (color.a / 255) * globalAlpha;
        const inverseIncomingAlpha = 1 - incomingAlpha;

        const posX = x;
        const posY = y;
        const posW = width;
        const posH = height;

        // Helper to blend pixel with optional clipping
        const blendPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;

            const pixelIndex = py * surfaceWidth + px;

            if (clipBuffer) {
                const byteIndex = pixelIndex >> 3;
                const bitIndex = pixelIndex & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) return;
            }

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
        };

        // Draw horizontal edges
        const topY = Math.floor(posY);
        const bottomY = Math.floor(posY + posH - 0.5);

        for (let xx = Math.floor(posX + radius); xx < posX + posW - radius; xx++) {
            blendPixel(xx, topY);
            blendPixel(xx, bottomY);
        }

        // Draw vertical edges
        const leftX = Math.floor(posX);
        const rightX = Math.floor(posX + posW - 0.5);

        for (let yy = Math.floor(posY + radius); yy < posY + posH - radius; yy++) {
            blendPixel(leftX, yy);
            blendPixel(rightX, yy);
        }

        // Draw corner arcs
        const drawCorner = (cx, cy, startAngle, endAngle) => {
            const sr = radius - 0.5;
            const angleStep = Math.PI / 180;
            for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
                const px = Math.floor(cx + sr * Math.cos(angle));
                const py = Math.floor(cy + sr * Math.sin(angle));
                blendPixel(px, py);
            }
        };

        drawCorner(posX + radius, posY + radius, Math.PI, Math.PI * 3 / 2);
        drawCorner(posX + posW - radius, posY + radius, Math.PI * 3 / 2, Math.PI * 2);
        drawCorner(posX + posW - radius, posY + posH - radius, 0, Math.PI / 2);
        drawCorner(posX + radius, posY + posH - radius, Math.PI / 2, Math.PI);
    }

    /**
     * Normalize radius for rounded rectangle, clamping to valid range.
     * @param {number|number[]} radii - Corner radius
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @returns {number} Normalized radius
     */
    static _normalizeRadius(radii, width, height) {
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        return Math.round(Math.min(radius, Math.min(width, height) / 2));
    }

    /**
     * Direct rendering for opaque fill on axis-aligned rounded rectangle.
     * Uses scanline algorithm with 32-bit packed writes.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius
     * @param {Color} color - Fill color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillOpaque(surface, x, y, width, height, radii, color, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps for zero radius
        if (radius <= 0) {
            RectOps.fillOpaque(surface, x, y, width, height, color);
            return;
        }

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Calculate integer bounds
        const rectX = Math.floor(x);
        const rectY = Math.floor(y);
        const rectW = Math.floor(width);
        const rectH = Math.floor(height);

        // For each scanline
        for (let py = rectY; py < rectY + rectH; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            let leftX = rectX;
            let rightX = rectX + rectW - 1;

            // Adjust for rounded corners
            if (py < rectY + radius) {
                // Top corners - calculate x extent based on circle equation
                const cornerCenterY = rectY + radius;
                const dy = cornerCenterY - py - 0.5;
                const dySquared = dy * dy;
                const radiusSquared = radius * radius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + radius - dx);
                    rightX = Math.floor(rectX + rectW - radius + dx - 1);
                } else {
                    continue; // Outside the rounded area
                }
            } else if (py >= rectY + rectH - radius) {
                // Bottom corners
                const cornerCenterY = rectY + rectH - radius;
                const dy = py - cornerCenterY + 0.5;
                const dySquared = dy * dy;
                const radiusSquared = radius * radius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + radius - dx);
                    rightX = Math.floor(rectX + rectW - radius + dx - 1);
                } else {
                    continue; // Outside the rounded area
                }
            }

            // Clamp to surface bounds
            leftX = Math.max(0, leftX);
            rightX = Math.min(surfaceWidth - 1, rightX);

            if (leftX > rightX) continue;

            // Fill scanline
            const spanLength = rightX - leftX + 1;
            SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, leftX, py, spanLength, packedColor, clipBuffer);
        }
    }

    /**
     * Direct rendering for semi-transparent fill on axis-aligned rounded rectangle.
     * Uses scanline algorithm with alpha blending.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillAlpha(surface, x, y, width, height, radii, color, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps for zero radius
        if (radius <= 0) {
            RectOps.fillAlpha(surface, x, y, width, height, color, globalAlpha);
            return;
        }

        const r = color.r;
        const g = color.g;
        const b = color.b;
        const incomingAlpha = (color.a / 255) * globalAlpha;
        const inverseIncomingAlpha = 1 - incomingAlpha;

        // Calculate integer bounds
        const rectX = Math.floor(x);
        const rectY = Math.floor(y);
        const rectW = Math.floor(width);
        const rectH = Math.floor(height);

        // For each scanline
        for (let py = rectY; py < rectY + rectH; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            let leftX = rectX;
            let rightX = rectX + rectW - 1;

            // Adjust for rounded corners (same logic as fillOpaque)
            if (py < rectY + radius) {
                const cornerCenterY = rectY + radius;
                const dy = cornerCenterY - py - 0.5;
                const dySquared = dy * dy;
                const radiusSquared = radius * radius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + radius - dx);
                    rightX = Math.floor(rectX + rectW - radius + dx - 1);
                } else {
                    continue;
                }
            } else if (py >= rectY + rectH - radius) {
                const cornerCenterY = rectY + rectH - radius;
                const dy = py - cornerCenterY + 0.5;
                const dySquared = dy * dy;
                const radiusSquared = radius * radius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + radius - dx);
                    rightX = Math.floor(rectX + rectW - radius + dx - 1);
                } else {
                    continue;
                }
            }

            // Clamp to surface bounds
            leftX = Math.max(0, leftX);
            rightX = Math.min(surfaceWidth - 1, rightX);

            if (leftX > rightX) continue;

            // Fill scanline with alpha blending
            const spanLength = rightX - leftX + 1;
            SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, leftX, py, spanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
        }
    }

    /**
     * Direct rendering for thick opaque stroke on axis-aligned rounded rectangle.
     * Uses scanline algorithm to fill the stroke region between inner and outer bounds.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static strokeThickOpaque(surface, x, y, width, height, radii, lineWidth, color, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            RectOps.strokeThickOpaque(surface, x, y, width, height, lineWidth, color, clipBuffer);
            return;
        }

        const halfStroke = lineWidth / 2;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Calculate outer and inner bounds
        const outerX = Math.floor(x - halfStroke);
        const outerY = Math.floor(y - halfStroke);
        const outerW = Math.ceil(width + lineWidth);
        const outerH = Math.ceil(height + lineWidth);
        const outerRadius = radius + halfStroke;

        const innerX = Math.floor(x + halfStroke);
        const innerY = Math.floor(y + halfStroke);
        const innerW = Math.floor(width - lineWidth);
        const innerH = Math.floor(height - lineWidth);
        const innerRadius = Math.max(0, radius - halfStroke);

        // Helper to calculate x extent for rounded corner at a given y
        const getXExtent = (py, rectX, rectW, rectY, rectH, r) => {
            if (r <= 0) {
                return { leftX: rectX, rightX: rectX + rectW - 1 };
            }

            let leftX = rectX;
            let rightX = rectX + rectW - 1;

            if (py < rectY + r) {
                const cornerCenterY = rectY + r;
                const dy = cornerCenterY - py - 0.5;
                const dySquared = dy * dy;
                const radiusSquared = r * r;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + r - dx);
                    rightX = Math.floor(rectX + rectW - r + dx - 1);
                } else {
                    return { leftX: -1, rightX: -1 }; // Outside
                }
            } else if (py >= rectY + rectH - r) {
                const cornerCenterY = rectY + rectH - r;
                const dy = py - cornerCenterY + 0.5;
                const dySquared = dy * dy;
                const radiusSquared = r * r;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + r - dx);
                    rightX = Math.floor(rectX + rectW - r + dx - 1);
                } else {
                    return { leftX: -1, rightX: -1 }; // Outside
                }
            }

            return { leftX, rightX };
        };

        // For each scanline in the outer bounds
        for (let py = outerY; py < outerY + outerH; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            // Get outer extent
            const outer = getXExtent(py, outerX, outerW, outerY, outerH, outerRadius);
            if (outer.leftX < 0) continue; // Outside outer bounds

            // Clamp outer to surface
            const outerLeft = Math.max(0, outer.leftX);
            const outerRight = Math.min(surfaceWidth - 1, outer.rightX);
            if (outerLeft > outerRight) continue;

            // Check if we're in the inner region (hollow part)
            if (innerW > 0 && innerH > 0 && py >= innerY && py < innerY + innerH) {
                const inner = getXExtent(py, innerX, innerW, innerY, innerH, innerRadius);

                if (inner.leftX >= 0 && inner.rightX >= inner.leftX) {
                    // Draw left and right stroke spans around the inner region
                    const innerLeft = Math.max(0, inner.leftX);
                    const innerRight = Math.min(surfaceWidth - 1, inner.rightX);

                    // Left span: from outerLeft to just before innerLeft
                    if (outerLeft < innerLeft) {
                        const leftSpanLength = innerLeft - outerLeft;
                        SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, outerLeft, py, leftSpanLength, packedColor, clipBuffer);
                    }

                    // Right span: from just after innerRight to outerRight
                    if (innerRight < outerRight) {
                        const rightSpanStart = innerRight + 1;
                        const rightSpanLength = outerRight - innerRight;
                        SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, rightSpanStart, py, rightSpanLength, packedColor, clipBuffer);
                    }
                } else {
                    // Inner region invalid at this Y, fill entire outer span
                    const spanLength = outerRight - outerLeft + 1;
                    SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, outerLeft, py, spanLength, packedColor, clipBuffer);
                }
            } else {
                // Not in inner region, fill entire outer span
                const spanLength = outerRight - outerLeft + 1;
                SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, outerLeft, py, spanLength, packedColor, clipBuffer);
            }
        }
    }

    /**
     * Direct rendering for thick semi-transparent stroke on axis-aligned rounded rectangle.
     * Uses scanline algorithm with alpha blending.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static strokeThickAlpha(surface, x, y, width, height, radii, lineWidth, color, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            RectOps.strokeThickAlpha(surface, x, y, width, height, lineWidth, color, globalAlpha, clipBuffer);
            return;
        }

        const halfStroke = lineWidth / 2;

        const r = color.r;
        const g = color.g;
        const b = color.b;
        const incomingAlpha = (color.a / 255) * globalAlpha;
        const inverseIncomingAlpha = 1 - incomingAlpha;

        // Calculate outer and inner bounds
        const outerX = Math.floor(x - halfStroke);
        const outerY = Math.floor(y - halfStroke);
        const outerW = Math.ceil(width + lineWidth);
        const outerH = Math.ceil(height + lineWidth);
        const outerRadius = radius + halfStroke;

        const innerX = Math.floor(x + halfStroke);
        const innerY = Math.floor(y + halfStroke);
        const innerW = Math.floor(width - lineWidth);
        const innerH = Math.floor(height - lineWidth);
        const innerRadius = Math.max(0, radius - halfStroke);

        // Helper to calculate x extent (same as strokeThickOpaque)
        const getXExtent = (py, rectX, rectW, rectY, rectH, rad) => {
            if (rad <= 0) {
                return { leftX: rectX, rightX: rectX + rectW - 1 };
            }

            let leftX = rectX;
            let rightX = rectX + rectW - 1;

            if (py < rectY + rad) {
                const cornerCenterY = rectY + rad;
                const dy = cornerCenterY - py - 0.5;
                const dySquared = dy * dy;
                const radiusSquared = rad * rad;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + rad - dx);
                    rightX = Math.floor(rectX + rectW - rad + dx - 1);
                } else {
                    return { leftX: -1, rightX: -1 };
                }
            } else if (py >= rectY + rectH - rad) {
                const cornerCenterY = rectY + rectH - rad;
                const dy = py - cornerCenterY + 0.5;
                const dySquared = dy * dy;
                const radiusSquared = rad * rad;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + rad - dx);
                    rightX = Math.floor(rectX + rectW - rad + dx - 1);
                } else {
                    return { leftX: -1, rightX: -1 };
                }
            }

            return { leftX, rightX };
        };

        // For each scanline in the outer bounds
        for (let py = outerY; py < outerY + outerH; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            const outer = getXExtent(py, outerX, outerW, outerY, outerH, outerRadius);
            if (outer.leftX < 0) continue;

            const outerLeft = Math.max(0, outer.leftX);
            const outerRight = Math.min(surfaceWidth - 1, outer.rightX);
            if (outerLeft > outerRight) continue;

            if (innerW > 0 && innerH > 0 && py >= innerY && py < innerY + innerH) {
                const inner = getXExtent(py, innerX, innerW, innerY, innerH, innerRadius);

                if (inner.leftX >= 0 && inner.rightX >= inner.leftX) {
                    const innerLeft = Math.max(0, inner.leftX);
                    const innerRight = Math.min(surfaceWidth - 1, inner.rightX);

                    if (outerLeft < innerLeft) {
                        const leftSpanLength = innerLeft - outerLeft;
                        SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, outerLeft, py, leftSpanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                    }

                    if (innerRight < outerRight) {
                        const rightSpanStart = innerRight + 1;
                        const rightSpanLength = outerRight - innerRight;
                        SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, rightSpanStart, py, rightSpanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                    }
                } else {
                    const spanLength = outerRight - outerLeft + 1;
                    SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, outerLeft, py, spanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                }
            } else {
                const spanLength = outerRight - outerLeft + 1;
                SpanOps.fillAlpha(data, surfaceWidth, surfaceHeight, outerLeft, py, spanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
            }
        }
    }

    /**
     * Unified fill and stroke rendering for rounded rectangles.
     * Draws both in a single coordinated pass to prevent fill/stroke gaps (speckles).
     * Fill is rendered first with epsilon contraction, then stroke is rendered on top.
     *
     * Key insight: All corner arcs (fill, outer stroke, inner stroke) must use the SAME
     * corner center point, just with different radii. This ensures pixel-perfect alignment.
     *
     * @param {Surface} surface - Target surface
     * @param {number} x - Top-left X coordinate
     * @param {number} y - Top-left Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius
     * @param {number} lineWidth - Stroke width
     * @param {Color|null} fillColor - Fill color (null to skip fill)
     * @param {Color|null} strokeColor - Stroke color (null to skip stroke)
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillAndStroke(surface, x, y, width, height, radii, lineWidth, fillColor, strokeColor, globalAlpha, clipBuffer = null) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;
        const data32 = surface.data32;

        // Check what we need to draw
        const hasFill = fillColor && fillColor.a > 0;
        const hasStroke = strokeColor && strokeColor.a > 0;

        if (!hasFill && !hasStroke) return;

        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to separate methods for zero radius
        if (radius <= 0) {
            if (hasFill) {
                if (fillColor.a === 255 && globalAlpha >= 1.0) {
                    RectOps.fillOpaque(surface, x, y, width, height, fillColor);
                } else {
                    RectOps.fillAlpha(surface, x, y, width, height, fillColor, globalAlpha);
                }
            }
            if (hasStroke) {
                if (strokeColor.a === 255 && globalAlpha >= 1.0) {
                    RectOps.strokeThickOpaque(surface, x, y, width, height, lineWidth, strokeColor, clipBuffer);
                } else {
                    RectOps.strokeThickAlpha(surface, x, y, width, height, lineWidth, strokeColor, globalAlpha, clipBuffer);
                }
            }
            return;
        }

        const halfStroke = lineWidth / 2;

        // Epsilon contraction for fill boundaries (same as CircleOps)
        const FILL_EPSILON = 0.0001;

        // Use PATH coordinates as reference for fill
        const pathX = Math.floor(x);
        const pathY = Math.floor(y);
        const pathW = Math.floor(width);
        const pathH = Math.floor(height);
        const pathRadius = radius;

        // Radii for different boundaries
        const fillRadius = pathRadius;  // Fill extends to path boundary
        const outerRadius = pathRadius + halfStroke;  // Stroke outer edge
        const innerRadius = Math.max(0, pathRadius - halfStroke);  // Stroke inner edge

        // Calculate scan bounds - use original coordinates (not floored pathX/pathY)
        const scanMinY = Math.floor(y - halfStroke);
        const scanMaxY = Math.ceil(y + height + halfStroke);
        const scanMinX = Math.floor(x - halfStroke);
        const scanMaxX = Math.ceil(x + width + halfStroke);

        // Determine rendering modes
        const fillIsOpaque = hasFill && fillColor.a === 255 && globalAlpha >= 1.0;
        const fillEffectiveAlpha = hasFill ? (fillColor.a / 255) * globalAlpha : 0;
        const fillInvAlpha = 1 - fillEffectiveAlpha;

        const strokeIsOpaque = hasStroke && strokeColor.a === 255 && globalAlpha >= 1.0;
        const strokeEffectiveAlpha = hasStroke ? (strokeColor.a / 255) * globalAlpha : 0;
        const strokeInvAlpha = 1 - strokeEffectiveAlpha;

        // Packed colors for opaque rendering
        const fillPacked = fillIsOpaque ? Surface.packColor(fillColor.r, fillColor.g, fillColor.b, 255) : 0;
        const strokePacked = strokeIsOpaque ? Surface.packColor(strokeColor.r, strokeColor.g, strokeColor.b, 255) : 0;

        // Helper to calculate X extent for a given radius at scanline py
        // Calculates corner centers locally from the passed rectangle bounds
        const getXExtent = (py, rectX, rectW, rectY, rectH, cornerRadius, epsilon = 0) => {
            if (py < rectY || py >= rectY + rectH) {
                return { leftX: -1, rightX: -1 };
            }

            let leftX = rectX;
            let rightX = rectX + rectW - 1;

            // Check if in top corner region (based on THIS rect's corner zone)
            if (py < rectY + cornerRadius) {
                // Top corners - calculate corner center from THIS rect's bounds
                const cornerCenterY = rectY + cornerRadius;
                const dy = cornerCenterY - py - 0.5;
                const dySquared = dy * dy;
                const radiusSquared = cornerRadius * cornerRadius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + cornerRadius - dx + epsilon);
                    rightX = Math.floor(rectX + rectW - cornerRadius + dx - 1 - epsilon);
                } else {
                    return { leftX: -1, rightX: -1 };
                }
            } else if (py >= rectY + rectH - cornerRadius) {
                // Bottom corners - calculate corner center from THIS rect's bounds
                const cornerCenterY = rectY + rectH - cornerRadius;
                const dy = py - cornerCenterY + 0.5;
                const dySquared = dy * dy;
                const radiusSquared = cornerRadius * cornerRadius;

                if (dySquared < radiusSquared) {
                    const dx = Math.sqrt(radiusSquared - dySquared);
                    leftX = Math.ceil(rectX + cornerRadius - dx + epsilon);
                    rightX = Math.floor(rectX + rectW - cornerRadius + dx - 1 - epsilon);
                } else {
                    return { leftX: -1, rightX: -1 };
                }
            }

            return { leftX, rightX };
        };

        // Helper to render fill span
        const renderFillSpan = (startX, endX, py) => {
            if (startX > endX) return;
            startX = Math.max(0, startX);
            endX = Math.min(surfaceWidth - 1, endX);
            if (startX > endX) return;

            if (fillIsOpaque) {
                for (let px = startX; px <= endX; px++) {
                    const pos = py * surfaceWidth + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        data32[pos] = fillPacked;
                    }
                }
            } else {
                const fr = fillColor.r, fg = fillColor.g, fb = fillColor.b;
                for (let px = startX; px <= endX; px++) {
                    const pos = py * surfaceWidth + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * fillInvAlpha;
                        const newAlpha = fillEffectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (fr * fillEffectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (fg * fillEffectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (fb * fillEffectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }
            }
        };

        // Helper to render stroke span
        const renderStrokeSpan = (startX, endX, py) => {
            if (startX > endX) return;
            startX = Math.max(0, startX);
            endX = Math.min(surfaceWidth - 1, endX);
            if (startX > endX) return;

            if (strokeIsOpaque) {
                for (let px = startX; px <= endX; px++) {
                    const pos = py * surfaceWidth + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        data32[pos] = strokePacked;
                    }
                }
            } else {
                const sr = strokeColor.r, sg = strokeColor.g, sb = strokeColor.b;
                for (let px = startX; px <= endX; px++) {
                    const pos = py * surfaceWidth + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * strokeInvAlpha;
                        const newAlpha = strokeEffectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (sr * strokeEffectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (sg * strokeEffectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (sb * strokeEffectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }
            }
        };

        // Calculate stroke bounds - use original coordinates (like strokeThickOpaque)
        // This avoids double-flooring which causes 1px shift when x/y have .5 fractional parts
        const outerRectX = Math.floor(x - halfStroke);
        const outerRectY = Math.floor(y - halfStroke);
        const outerRectW = Math.ceil(width + lineWidth);
        const outerRectH = Math.ceil(height + lineWidth);

        const innerRectX = Math.floor(x + halfStroke);
        const innerRectY = Math.floor(y + halfStroke);
        const innerRectW = Math.floor(width - lineWidth);
        const innerRectH = Math.floor(height - lineWidth);

        // Process each scanline in the scan bounds
        for (let py = scanMinY; py < scanMaxY; py++) {
            if (py < 0 || py >= surfaceHeight) continue;

            // Get outer stroke extent - uses pre-calculated bounds from original coordinates
            const outerExtent = hasStroke ? getXExtent(py, outerRectX, outerRectW, outerRectY, outerRectH, outerRadius, 0) : { leftX: -1, rightX: -1 };

            // Get inner stroke extent - uses pre-calculated bounds from original coordinates
            const innerExtent = (hasStroke && innerRectH > 0) ? getXExtent(py, innerRectX, innerRectW, innerRectY, innerRectH, innerRadius, 0) : { leftX: -1, rightX: -1 };

            // Determine fill extent based on stroke transparency
            let fillExtent = { leftX: -1, rightX: -1 };
            if (hasFill) {
                if (hasStroke) {
                    // Check if stroke is semi-transparent (needs overlap blending)
                    const strokeIsSemiTransparent = strokeEffectiveAlpha < 1.0;

                    if (strokeIsSemiTransparent) {
                        // Semi-transparent stroke: fill uses PATH extent for proper overlap blending
                        // Stroke will render on top and blend in the overlap region
                        fillExtent = getXExtent(py, pathX, pathW, pathY, pathH, fillRadius, FILL_EPSILON);
                        // Clamp fill to outer boundary to prevent speckles at the edge
                        if (fillExtent.leftX >= 0 && outerExtent.leftX >= 0) {
                            fillExtent.leftX = Math.max(fillExtent.leftX, outerExtent.leftX);
                            fillExtent.rightX = Math.min(fillExtent.rightX, outerExtent.rightX);
                        }
                    } else {
                        // Opaque stroke: fill uses inner extent (no overlap needed, prevents speckles)
                        if (innerExtent.leftX >= 0 && innerExtent.rightX >= innerExtent.leftX) {
                            fillExtent.leftX = innerExtent.leftX;
                            fillExtent.rightX = innerExtent.rightX;
                        }
                        // No inner region on this scanline - no fill (stroke covers everything)
                    }
                } else {
                    // Fill-only: use standard fill extent calculation
                    fillExtent = getXExtent(py, pathX, pathW, pathY, pathH, fillRadius, FILL_EPSILON);
                }
            }

            // STEP 1: Render fill first (with epsilon contraction, clamped to stroke boundary)
            if (hasFill && fillExtent.leftX >= 0 && fillExtent.leftX <= fillExtent.rightX) {
                renderFillSpan(fillExtent.leftX, fillExtent.rightX, py);
            }

            // STEP 2: Render stroke on top (covers any micro-gaps at boundary)
            if (hasStroke && outerExtent.leftX >= 0) {
                const outerLeft = Math.max(0, outerExtent.leftX);
                const outerRight = Math.min(surfaceWidth - 1, outerExtent.rightX);

                if (outerLeft <= outerRight) {
                    if (innerExtent.leftX >= 0 && innerExtent.rightX >= innerExtent.leftX) {
                        // Has inner region - draw left and right stroke segments
                        const innerLeft = Math.max(0, innerExtent.leftX);
                        const innerRight = Math.min(surfaceWidth - 1, innerExtent.rightX);

                        // Left stroke segment
                        if (outerLeft < innerLeft) {
                            renderStrokeSpan(outerLeft, innerLeft - 1, py);
                        }

                        // Right stroke segment
                        if (innerRight < outerRight) {
                            renderStrokeSpan(innerRight + 1, outerRight, py);
                        }
                    } else {
                        // No inner region - fill entire stroke span
                        renderStrokeSpan(outerLeft, outerRight, py);
                    }
                }
            }
        }
    }

    /**
     * Direct rendering for stroked rotated rounded rectangle.
     * Dispatches to appropriate sub-method based on lineWidth and opacity.
     *
     * Uses center-based coordinates (like RectOps.strokeRotated) since rotation
     * naturally occurs around the center point.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static strokeRotated(surface, centerX, centerY, width, height, radii, rotation, lineWidth, color, globalAlpha, clipBuffer = null) {
        // Normalize radius
        let radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps.strokeRotated for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            RectOps.strokeRotated(surface, centerX, centerY, width, height, rotation, lineWidth, color, globalAlpha, clipBuffer);
            return;
        }

        const isOpaqueColor = color.a === 255 && globalAlpha >= 1.0;
        const isSemiTransparentColor = !isOpaqueColor && color.a > 0;

        // Handle 1px strokes
        if (lineWidth <= 1) {
            if (isOpaqueColor) {
                RoundedRectOps._stroke1pxOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, color, clipBuffer);
            } else if (isSemiTransparentColor) {
                // TODO: Implement _stroke1pxAlphaRotated
                // For now, this case is not supported - caller should fall back to path-based rendering
            }
            return;
        }

        // Handle thick strokes
        if (isSemiTransparentColor) {
            // TODO: Implement _strokeThickAlphaRotated
            // For now, this case is not supported - caller should fall back to path-based rendering
        } else if (isOpaqueColor) {
            // TODO: Implement _strokeThickOpaqueRotated
            // For now, this case is not supported - caller should fall back to path-based rendering
        }
    }

    /**
     * Internal: 1px opaque stroke for rotated rounded rectangle.
     * Uses hybrid approach: 4 straight edges via LineOps + 4 corner arcs via ArcOps.
     *
     * Since the stroke is opaque, overdraw at edge-arc junctions doesn't affect the result.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _stroke1pxOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, color, clipBuffer) {
        // Pre-compute rotation
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;   // half-width
        const hh = height / 2;  // half-height

        // Helper to transform local coordinates to screen coordinates
        // Local coords are centered at origin, screen coords are centered at (centerX, centerY)
        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Calculate 8 edge endpoints in local space, then transform to screen space
        // Local coordinates (centered at origin):
        // - Top edge: (-hw+radius, -hh) to (hw-radius, -hh)
        // - Right edge: (hw, -hh+radius) to (hw, hh-radius)
        // - Bottom edge: (hw-radius, hh) to (-hw+radius, hh)
        // - Left edge: (-hw, hh-radius) to (-hw, -hh+radius)

        const edgeEndpoints = [
            // Top edge
            { start: transform(-hw + radius, -hh), end: transform(hw - radius, -hh) },
            // Right edge
            { start: transform(hw, -hh + radius), end: transform(hw, hh - radius) },
            // Bottom edge
            { start: transform(hw - radius, hh), end: transform(-hw + radius, hh) },
            // Left edge
            { start: transform(-hw, hh - radius), end: transform(-hw, -hh + radius) }
        ];

        // Draw 4 straight edges via LineOps.strokeDirect
        for (const edge of edgeEndpoints) {
            // Skip zero-length edges (occurs when radius = half width or half height)
            // This prevents extra pixels at arc junction points
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            const edgeLength = Math.sqrt(dx * dx + dy * dy);
            if (edgeLength < 0.5) continue;

            LineOps.strokeDirect(
                surface,
                edge.start.x, edge.start.y,
                edge.end.x, edge.end.y,
                1,              // lineWidth
                color,
                1.0,            // globalAlpha (already opaque)
                clipBuffer,
                true,           // isOpaqueColor
                false           // isSemiTransparentColor
            );
        }

        // Calculate 4 corner arc centers in local space, then transform to screen space
        // Local corner centers and their angle ranges:
        // - Top-left: (-hw+radius, -hh+radius), angles: π to 3π/2
        // - Top-right: (hw-radius, -hh+radius), angles: 3π/2 to 2π
        // - Bottom-right: (hw-radius, hh-radius), angles: 0 to π/2
        // - Bottom-left: (-hw+radius, hh-radius), angles: π/2 to π

        const corners = [
            { localCx: -hw + radius, localCy: -hh + radius, startAngle: Math.PI, endAngle: Math.PI * 1.5 },         // Top-left
            { localCx: hw - radius, localCy: -hh + radius, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },      // Top-right
            { localCx: hw - radius, localCy: hh - radius, startAngle: 0, endAngle: Math.PI * 0.5 },                 // Bottom-right
            { localCx: -hw + radius, localCy: hh - radius, startAngle: Math.PI * 0.5, endAngle: Math.PI }           // Bottom-left
        ];

        // Draw 4 corner arcs
        // Arc angles shift by rotation when the shape is rotated
        // Always use angle-based iteration for rotated rounded rects to ensure junction alignment with the sides (or other corner if the side ends up being zero-length).
        // Bresenham has angular coverage gaps at any radius, which cause discontinuities.
        const useSmallRadiusMethod = true;

        for (const corner of corners) {
            const screenCenter = transform(corner.localCx, corner.localCy);

            if (useSmallRadiusMethod) {
                // Angle-based iteration for small radii (guaranteed junction alignment)
                ArcOps.stroke1pxOpaqueSmallRadius(
                    surface,
                    screenCenter.x, screenCenter.y,
                    radius,
                    corner.startAngle + rotation,
                    corner.endAngle + rotation,
                    color,
                    clipBuffer
                );
            } else {
                // Bresenham for larger radii (more efficient)
                ArcOps.stroke1pxOpaque(
                    surface,
                    screenCenter.x, screenCenter.y,
                    radius,
                    corner.startAngle + rotation,
                    corner.endAngle + rotation,
                    color,
                    clipBuffer
                );
            }
        }
    }
}
