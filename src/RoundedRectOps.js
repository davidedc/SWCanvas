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
     * Uses Set-based deduplication to prevent overdraw at edge-arc junctions.
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

        // Use Set to collect unique pixel positions (prevents overdraw at edge-arc junctions)
        const strokePixels = new Set();

        // Helper to collect pixel into Set
        const collectPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;
            strokePixels.add(py * surfaceWidth + px);
        };

        // Collect horizontal edge pixels
        const topY = Math.floor(posY);
        const bottomY = Math.floor(posY + posH - 0.5);

        for (let xx = Math.floor(posX + radius); xx < posX + posW - radius; xx++) {
            collectPixel(xx, topY);
            collectPixel(xx, bottomY);
        }

        // Collect vertical edge pixels
        const leftX = Math.floor(posX);
        const rightX = Math.floor(posX + posW - 0.5);

        for (let yy = Math.floor(posY + radius); yy < posY + posH - radius; yy++) {
            collectPixel(leftX, yy);
            collectPixel(rightX, yy);
        }

        // Collect corner arc pixels
        const collectCorner = (cx, cy, startAngle, endAngle) => {
            const sr = radius - 0.5;
            const angleStep = Math.PI / 180;
            for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
                const px = Math.floor(cx + sr * Math.cos(angle));
                const py = Math.floor(cy + sr * Math.sin(angle));
                collectPixel(px, py);
            }
        };

        collectCorner(posX + radius, posY + radius, Math.PI, Math.PI * 3 / 2);
        collectCorner(posX + posW - radius, posY + radius, Math.PI * 3 / 2, Math.PI * 2);
        collectCorner(posX + posW - radius, posY + posH - radius, 0, Math.PI / 2);
        collectCorner(posX + radius, posY + posH - radius, Math.PI / 2, Math.PI);

        // Render all unique pixels once with alpha blending
        for (const pixelIndex of strokePixels) {
            if (clipBuffer) {
                const byteIndex = pixelIndex >> 3;
                const bitIndex = pixelIndex & 7;
                if (!(clipBuffer[byteIndex] & (1 << bitIndex))) continue;
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
        }
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
     * Direct rendering for filled rotated rounded rectangle.
     * Uses Edge Buffer Rasterization: generates perimeter into minX/maxX arrays,
     * then fills scanlines efficiently with data32.fill().
     *
     * Algorithm complexity: O(H + P + A) where H=height, P=perimeter, A=fill area.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillRotated(surface, centerX, centerY, width, height, radii, rotation, color, globalAlpha, clipBuffer = null) {
        // Normalize radius
        const radius = this._normalizeRadius(radii, width, height);

        // Fallback to RectOps.fillRotated for zero radius
        if (radius <= 0) {
            RectOps.fillRotated(surface, centerX, centerY, width, height, rotation, color, globalAlpha, clipBuffer);
            return;
        }

        const isOpaqueColor = color.a === 255 && globalAlpha >= 1.0;

        if (isOpaqueColor) {
            RoundedRectOps._fillOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, color, clipBuffer);
        } else if (color.a > 0) {
            RoundedRectOps._fillAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, color, globalAlpha, clipBuffer);
        }
    }

    /**
     * Internal: Opaque fill for rotated rounded rectangle using Edge Buffer Rasterization.
     *
     * Algorithm:
     * 1. Compute Y bounds from rotation angle (O(1))
     * 2. Allocate minX/maxX Int16Arrays sized to shape height
     * 3. Generate perimeter (edges + corner arcs), recording min/max X per row
     * 4. Fill scanlines using data32.fill() for each row
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Fill color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _fillOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, color, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        // Pre-compute rotation
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;
        const hh = height / 2;

        // Compute AABB height (exact formula for rotated rectangle)
        const boundingHeight = Math.abs(width * sin) + Math.abs(height * cos);

        // Clamp to canvas bounds BEFORE array allocation
        const yMin = Math.max(0, Math.floor(centerY - boundingHeight / 2));
        const yMax = Math.min(surfaceHeight - 1, Math.ceil(centerY + boundingHeight / 2));
        const spanCount = yMax - yMin + 1;

        if (spanCount <= 0) return;

        // Allocate span arrays (Int16Array for memory efficiency)
        const minX = new Int16Array(spanCount);
        const maxX = new Int16Array(spanCount);
        minX.fill(surfaceWidth);  // Sentinel: larger than any valid x
        maxX.fill(-1);            // Sentinel: smaller than any valid x

        // Record perimeter pixel into span arrays
        const recordPixel = (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < minX[row]) minX[row] = x;
            if (x > maxX[row]) maxX[row] = x;
        };

        // Helper to transform local coordinates to screen coordinates
        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Generate edge pixels using Bresenham
        const generateEdgePixels = (x0, y0, x1, y1) => {
            const ix0 = Math.floor(x0);
            const iy0 = Math.floor(y0);
            const ix1 = Math.floor(x1);
            const iy1 = Math.floor(y1);

            const dx = Math.abs(ix1 - ix0);
            const dy = Math.abs(iy1 - iy0);
            const sx = ix0 < ix1 ? 1 : -1;
            const sy = iy0 < iy1 ? 1 : -1;
            let err = dx - dy;

            let x = ix0, y = iy0;
            while (true) {
                recordPixel(x, y);
                if (x === ix1 && y === iy1) break;

                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
        };

        // Generate arc pixels using angle-based iteration
        const generateArcPixels = (cx, cy, r, startAngle, endAngle) => {
            // Step size: approximately 1 pixel per step
            const arcLength = r * Math.abs(endAngle - startAngle);
            const steps = Math.max(Math.ceil(arcLength), 8);
            const angleStep = (endAngle - startAngle) / steps;

            let lastPx = null, lastPy = null;

            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + i * angleStep;
                const px = Math.floor(cx + r * Math.cos(angle));
                const py = Math.floor(cy + r * Math.sin(angle));

                // Skip duplicate pixels
                if (px !== lastPx || py !== lastPy) {
                    recordPixel(px, py);
                    lastPx = px;
                    lastPy = py;
                }
            }
        };

        // Edge endpoints in local space (centered at origin)
        const edges = [
            { start: { x: -hw + radius, y: -hh }, end: { x: hw - radius, y: -hh } },      // Top
            { start: { x: hw, y: -hh + radius }, end: { x: hw, y: hh - radius } },        // Right
            { start: { x: hw - radius, y: hh }, end: { x: -hw + radius, y: hh } },        // Bottom
            { start: { x: -hw, y: hh - radius }, end: { x: -hw, y: -hh + radius } }       // Left
        ];

        // Generate edge perimeter pixels
        for (const edge of edges) {
            const start = transform(edge.start.x, edge.start.y);
            const end = transform(edge.end.x, edge.end.y);

            // Skip zero-length edges (radius = half width or height)
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            if (dx * dx + dy * dy < 0.25) continue;

            generateEdgePixels(start.x, start.y, end.x, end.y);
        }

        // Corner definitions (local center and angle range)
        const corners = [
            { cx: -hw + radius, cy: -hh + radius, startAngle: Math.PI, endAngle: Math.PI * 1.5 },         // Top-left
            { cx: hw - radius, cy: -hh + radius, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },      // Top-right
            { cx: hw - radius, cy: hh - radius, startAngle: 0, endAngle: Math.PI * 0.5 },                 // Bottom-right
            { cx: -hw + radius, cy: hh - radius, startAngle: Math.PI * 0.5, endAngle: Math.PI }           // Bottom-left
        ];

        // Generate corner arc perimeter pixels
        for (const corner of corners) {
            const screenCenter = transform(corner.cx, corner.cy);
            generateArcPixels(
                screenCenter.x, screenCenter.y,
                radius,
                corner.startAngle + rotation,
                corner.endAngle + rotation
            );
        }

        // Fill scanlines
        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        if (!clipBuffer) {
            // Fast path: no clipping
            for (let row = 0; row < spanCount; row++) {
                const left = minX[row];
                const right = maxX[row];
                if (left > right) continue;

                const y = yMin + row;
                const x0 = Math.max(0, left);
                const x1 = Math.min(surfaceWidth - 1, right);

                if (x0 <= x1) {
                    const offset = y * surfaceWidth;
                    data32.fill(packedColor, offset + x0, offset + x1 + 1);
                }
            }
        } else {
            // Slower path: per-pixel clipping
            for (let row = 0; row < spanCount; row++) {
                const left = minX[row];
                const right = maxX[row];
                if (left > right) continue;

                const y = yMin + row;
                const x0 = Math.max(0, left);
                const x1 = Math.min(surfaceWidth - 1, right);

                for (let x = x0; x <= x1; x++) {
                    const pos = y * surfaceWidth + x;
                    if (clipBuffer[pos >> 3] & (1 << (pos & 7))) {
                        data32[pos] = packedColor;
                    }
                }
            }
        }
    }

    /**
     * Internal: Alpha fill for rotated rounded rectangle using Edge Buffer Rasterization.
     *
     * Same algorithm as _fillOpaqueRotated but with alpha blending in the fill phase.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Fill color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _fillAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Pre-compute rotation
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;
        const hh = height / 2;

        // Compute AABB height
        const boundingHeight = Math.abs(width * sin) + Math.abs(height * cos);

        // Clamp to canvas bounds
        const yMin = Math.max(0, Math.floor(centerY - boundingHeight / 2));
        const yMax = Math.min(surfaceHeight - 1, Math.ceil(centerY + boundingHeight / 2));
        const spanCount = yMax - yMin + 1;

        if (spanCount <= 0) return;

        // Allocate span arrays
        const minX = new Int16Array(spanCount);
        const maxX = new Int16Array(spanCount);
        minX.fill(surfaceWidth);
        maxX.fill(-1);

        const recordPixel = (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < minX[row]) minX[row] = x;
            if (x > maxX[row]) maxX[row] = x;
        };

        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Generate edge pixels using Bresenham
        const generateEdgePixels = (x0, y0, x1, y1) => {
            const ix0 = Math.floor(x0);
            const iy0 = Math.floor(y0);
            const ix1 = Math.floor(x1);
            const iy1 = Math.floor(y1);

            const dx = Math.abs(ix1 - ix0);
            const dy = Math.abs(iy1 - iy0);
            const sx = ix0 < ix1 ? 1 : -1;
            const sy = iy0 < iy1 ? 1 : -1;
            let err = dx - dy;

            let x = ix0, y = iy0;
            while (true) {
                recordPixel(x, y);
                if (x === ix1 && y === iy1) break;

                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
        };

        // Generate arc pixels
        const generateArcPixels = (cx, cy, r, startAngle, endAngle) => {
            const arcLength = r * Math.abs(endAngle - startAngle);
            const steps = Math.max(Math.ceil(arcLength), 8);
            const angleStep = (endAngle - startAngle) / steps;

            let lastPx = null, lastPy = null;

            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + i * angleStep;
                const px = Math.floor(cx + r * Math.cos(angle));
                const py = Math.floor(cy + r * Math.sin(angle));

                if (px !== lastPx || py !== lastPy) {
                    recordPixel(px, py);
                    lastPx = px;
                    lastPy = py;
                }
            }
        };

        // Edge endpoints
        const edges = [
            { start: { x: -hw + radius, y: -hh }, end: { x: hw - radius, y: -hh } },
            { start: { x: hw, y: -hh + radius }, end: { x: hw, y: hh - radius } },
            { start: { x: hw - radius, y: hh }, end: { x: -hw + radius, y: hh } },
            { start: { x: -hw, y: hh - radius }, end: { x: -hw, y: -hh + radius } }
        ];

        for (const edge of edges) {
            const start = transform(edge.start.x, edge.start.y);
            const end = transform(edge.end.x, edge.end.y);
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            if (dx * dx + dy * dy < 0.25) continue;
            generateEdgePixels(start.x, start.y, end.x, end.y);
        }

        // Corner definitions
        const corners = [
            { cx: -hw + radius, cy: -hh + radius, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
            { cx: hw - radius, cy: -hh + radius, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
            { cx: hw - radius, cy: hh - radius, startAngle: 0, endAngle: Math.PI * 0.5 },
            { cx: -hw + radius, cy: hh - radius, startAngle: Math.PI * 0.5, endAngle: Math.PI }
        ];

        for (const corner of corners) {
            const screenCenter = transform(corner.cx, corner.cy);
            generateArcPixels(
                screenCenter.x, screenCenter.y,
                radius,
                corner.startAngle + rotation,
                corner.endAngle + rotation
            );
        }

        // Fill with alpha blending
        const r = color.r;
        const g = color.g;
        const b = color.b;
        const incomingAlpha = (color.a / 255) * globalAlpha;
        const inverseIncomingAlpha = 1 - incomingAlpha;

        for (let row = 0; row < spanCount; row++) {
            const left = minX[row];
            const right = maxX[row];
            if (left > right) continue;

            const y = yMin + row;
            const x0 = Math.max(0, left);
            const x1 = Math.min(surfaceWidth - 1, right);

            for (let x = x0; x <= x1; x++) {
                const pos = y * surfaceWidth + x;

                if (clipBuffer && !(clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                    continue;
                }

                const idx = pos * 4;
                const oldAlpha = data[idx + 3] / 255;
                const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
                const newAlpha = incomingAlpha + oldAlphaScaled;

                if (newAlpha > 0) {
                    const blendFactor = 1 / newAlpha;
                    data[idx] = (r * incomingAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                    data[idx + 1] = (g * incomingAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                    data[idx + 2] = (b * incomingAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                    data[idx + 3] = newAlpha * 255;
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
                RoundedRectOps._stroke1pxAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, color, globalAlpha, clipBuffer);
            }
            return;
        }

        // Handle thick strokes
        if (isSemiTransparentColor) {
            RoundedRectOps._strokeThickAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, lineWidth, color, globalAlpha, clipBuffer);
        } else if (isOpaqueColor) {
            RoundedRectOps._strokeThickOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, lineWidth, color, clipBuffer);
        }
    }

    /**
     * Direct rendering for filled and stroked rotated rounded rectangle.
     * Combines fill and stroke operations with epsilon contraction to prevent boundary speckles.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} fillColor - Fill color (null/undefined to skip fill)
     * @param {Color} strokeColor - Stroke color (null/undefined to skip stroke)
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static fillAndStrokeRotated(surface, centerX, centerY, width, height, radii, rotation, lineWidth, fillColor, strokeColor, globalAlpha, clipBuffer = null) {
        const FILL_EPSILON = 0.0001;

        // Fill first (with slight contraction to prevent speckles at fill/stroke boundary)
        if (fillColor && fillColor.a > 0) {
            RoundedRectOps.fillRotated(
                surface,
                centerX, centerY,
                width - FILL_EPSILON, height - FILL_EPSILON,
                radii,
                rotation,
                fillColor,
                globalAlpha,
                clipBuffer
            );
        }

        // Stroke on top
        if (strokeColor && strokeColor.a > 0 && lineWidth > 0) {
            RoundedRectOps.strokeRotated(
                surface,
                centerX, centerY,
                width, height,
                radii,
                rotation,
                lineWidth,
                strokeColor,
                globalAlpha,
                clipBuffer
            );
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
                // Angle-based iteration with exact endpoints (guaranteed junction alignment)
                ArcOps.stroke1pxOpaqueExactEndpoints(
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

    /**
     * Internal: 1px semi-transparent stroke for rotated rounded rectangle.
     * Uses hybrid approach: 4 straight edges + 4 corner arcs with Set deduplication
     * to prevent overdraw at edge-arc junctions (which would cause incorrect alpha blending).
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _stroke1pxAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Calculate effective alpha for blending
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Pre-compute rotation
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const hw = width / 2;   // half-width
        const hh = height / 2;  // half-height

        // Helper to transform local coordinates to screen coordinates
        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Use Set to collect unique pixel positions (prevents overdraw at junctions)
        const strokePixels = new Set();

        // Calculate 8 edge endpoints in local space, then transform to screen space
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

        // Collect edge pixels via Bresenham (inline to collect into Set)
        for (const edge of edgeEndpoints) {
            // Skip zero-length edges
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            const edgeLength = Math.sqrt(dx * dx + dy * dy);
            if (edgeLength < 0.5) continue;

            let x1i = Math.floor(edge.start.x);
            let y1i = Math.floor(edge.start.y);
            let x2i = Math.floor(edge.end.x);
            let y2i = Math.floor(edge.end.y);

            // Shorten horizontal/vertical lines by 1 pixel to match HTML5 Canvas
            if (x1i === x2i) {
                if (y2i > y1i) y2i--; else y1i--;
            }
            if (y1i === y2i) {
                if (x2i > x1i) x2i--; else x1i--;
            }

            let dxAbs = Math.abs(x2i - x1i);
            let dyAbs = Math.abs(y2i - y1i);
            const sx = x1i < x2i ? 1 : -1;
            const sy = y1i < y2i ? 1 : -1;
            let err = dxAbs - dyAbs;

            let x = x1i;
            let y = y1i;

            while (true) {
                if (x >= 0 && x < surfaceWidth && y >= 0 && y < surfaceHeight) {
                    strokePixels.add(y * surfaceWidth + x);
                }

                if (x === x2i && y === y2i) break;

                const e2 = 2 * err;
                if (e2 > -dyAbs) {
                    err -= dyAbs;
                    x += sx;
                }
                if (e2 < dxAbs) {
                    err += dxAbs;
                    y += sy;
                }
            }
        }

        // Calculate 4 corner arc centers and angles
        const corners = [
            { localCx: -hw + radius, localCy: -hh + radius, startAngle: Math.PI, endAngle: Math.PI * 1.5 },         // Top-left
            { localCx: hw - radius, localCy: -hh + radius, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },      // Top-right
            { localCx: hw - radius, localCy: hh - radius, startAngle: 0, endAngle: Math.PI * 0.5 },                 // Bottom-right
            { localCx: -hw + radius, localCy: hh - radius, startAngle: Math.PI * 0.5, endAngle: Math.PI }           // Bottom-left
        ];

        // Collect corner arc pixels using angle-based iteration (same as stroke1pxOpaqueExactEndpoints)
        for (const corner of corners) {
            const screenCenter = transform(corner.localCx, corner.localCy);
            const cx = screenCenter.x;
            const cy = screenCenter.y;
            const startAngle = corner.startAngle + rotation;
            const endAngle = corner.endAngle + rotation;

            // Angle-based iteration for arc pixels
            const arcLength = radius * Math.abs(endAngle - startAngle);
            const numSteps = Math.max(Math.ceil(arcLength * 2), 8);
            const angleStep = (endAngle - startAngle) / numSteps;

            // Incremental rotation (avoid Math.cos/sin in loop)
            const cosStep = Math.cos(angleStep);
            const sinStep = Math.sin(angleStep);

            // Start position relative to center
            let ax = radius * Math.cos(startAngle);
            let ay = radius * Math.sin(startAngle);

            for (let i = 0; i <= numSteps; i++) {
                // Force exact precision for the final point
                if (i === numSteps) {
                    ax = radius * Math.cos(endAngle);
                    ay = radius * Math.sin(endAngle);
                }

                const px = Math.floor(cx + ax);
                const py = Math.floor(cy + ay);

                if (px >= 0 && px < surfaceWidth && py >= 0 && py < surfaceHeight) {
                    strokePixels.add(py * surfaceWidth + px);
                }

                // Apply rotation for next iteration
                const nextX = ax * cosStep - ay * sinStep;
                ay = ax * sinStep + ay * cosStep;
                ax = nextX;
            }
        }

        // Render all collected unique pixels with alpha blending
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
     * Internal: Thick opaque stroke for rotated rounded rectangle.
     * Uses Dual Edge Buffer algorithm: generates outer and inner perimeters,
     * then fills the annulus between them per scanline.
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color (must be opaque)
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _strokeThickOpaqueRotated(surface, centerX, centerY, width, height, radius, rotation, lineWidth, color, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;
        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        const halfStroke = lineWidth / 2;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Outer dimensions (path expanded by halfStroke)
        const outerWidth = width + lineWidth;
        const outerHeight = height + lineWidth;
        const outerRadius = Math.min(radius + halfStroke, Math.min(outerWidth, outerHeight) / 2);
        const outerHW = outerWidth / 2;
        const outerHH = outerHeight / 2;

        // Inner dimensions (path contracted by halfStroke)
        const innerWidth = width - lineWidth;
        const innerHeight = height - lineWidth;
        const innerRadius = Math.max(0, radius - halfStroke);
        const innerHW = innerWidth / 2;
        const innerHH = innerHeight / 2;
        const hasInnerRect = innerWidth > 0 && innerHeight > 0;

        // Compute AABB height based on outer bounds
        const boundingHeight = Math.abs(outerWidth * sin) + Math.abs(outerHeight * cos);

        // Clamp to canvas bounds
        const yMin = Math.max(0, Math.floor(centerY - boundingHeight / 2));
        const yMax = Math.min(surfaceHeight - 1, Math.ceil(centerY + boundingHeight / 2));
        const spanCount = yMax - yMin + 1;

        if (spanCount <= 0) return;

        // Allocate span arrays for outer perimeter
        const outerMinX = new Int16Array(spanCount);
        const outerMaxX = new Int16Array(spanCount);
        outerMinX.fill(surfaceWidth);
        outerMaxX.fill(-1);

        // Allocate span arrays for inner perimeter (if inner rect exists)
        const innerMinX = hasInnerRect ? new Int16Array(spanCount) : null;
        const innerMaxX = hasInnerRect ? new Int16Array(spanCount) : null;
        if (hasInnerRect) {
            innerMinX.fill(surfaceWidth);
            innerMaxX.fill(-1);
        }

        // Helper to record pixel to outer perimeter
        const recordOuter = (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < outerMinX[row]) outerMinX[row] = x;
            if (x > outerMaxX[row]) outerMaxX[row] = x;
        };

        // Helper to record pixel to inner perimeter
        const recordInner = hasInnerRect ? (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < innerMinX[row]) innerMinX[row] = x;
            if (x > innerMaxX[row]) innerMaxX[row] = x;
        } : null;

        // Transform local to screen coordinates
        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Generate edge pixels using Bresenham
        const generateEdgePixels = (x0, y0, x1, y1, recorder) => {
            const ix0 = Math.floor(x0);
            const iy0 = Math.floor(y0);
            const ix1 = Math.floor(x1);
            const iy1 = Math.floor(y1);

            const dx = Math.abs(ix1 - ix0);
            const dy = Math.abs(iy1 - iy0);
            const sx = ix0 < ix1 ? 1 : -1;
            const sy = iy0 < iy1 ? 1 : -1;
            let err = dx - dy;

            let x = ix0, y = iy0;
            while (true) {
                recorder(x, y);
                if (x === ix1 && y === iy1) break;

                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
        };

        // Generate arc pixels
        const generateArcPixels = (cx, cy, r, startAngle, endAngle, recorder) => {
            if (r <= 0) return;
            const arcLength = r * Math.abs(endAngle - startAngle);
            const steps = Math.max(Math.ceil(arcLength), 8);
            const angleStep = (endAngle - startAngle) / steps;

            let lastPx = null, lastPy = null;

            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + i * angleStep;
                const px = Math.floor(cx + r * Math.cos(angle));
                const py = Math.floor(cy + r * Math.sin(angle));

                if (px !== lastPx || py !== lastPy) {
                    recorder(px, py);
                    lastPx = px;
                    lastPy = py;
                }
            }
        };

        // Generate perimeter for a rounded rect
        const generatePerimeter = (hw, hh, r, recorder) => {
            // Edge endpoints in local space
            const edges = [
                { start: { x: -hw + r, y: -hh }, end: { x: hw - r, y: -hh } },  // Top
                { start: { x: hw, y: -hh + r }, end: { x: hw, y: hh - r } },    // Right
                { start: { x: hw - r, y: hh }, end: { x: -hw + r, y: hh } },    // Bottom
                { start: { x: -hw, y: hh - r }, end: { x: -hw, y: -hh + r } }   // Left
            ];

            for (const edge of edges) {
                const start = transform(edge.start.x, edge.start.y);
                const end = transform(edge.end.x, edge.end.y);
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                if (dx * dx + dy * dy < 0.25) continue;
                generateEdgePixels(start.x, start.y, end.x, end.y, recorder);
            }

            // Corner definitions
            const corners = [
                { cx: -hw + r, cy: -hh + r, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
                { cx: hw - r, cy: -hh + r, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
                { cx: hw - r, cy: hh - r, startAngle: 0, endAngle: Math.PI * 0.5 },
                { cx: -hw + r, cy: hh - r, startAngle: Math.PI * 0.5, endAngle: Math.PI }
            ];

            for (const corner of corners) {
                const screenCenter = transform(corner.cx, corner.cy);
                generateArcPixels(
                    screenCenter.x, screenCenter.y,
                    r,
                    corner.startAngle + rotation,
                    corner.endAngle + rotation,
                    recorder
                );
            }
        };

        // Generate outer perimeter
        generatePerimeter(outerHW, outerHH, outerRadius, recordOuter);

        // Generate inner perimeter (if inner rect exists)
        if (hasInnerRect) {
            generatePerimeter(innerHW, innerHH, innerRadius, recordInner);
        }

        // Fill annulus per scanline
        for (let row = 0; row < spanCount; row++) {
            const outerLeft = outerMinX[row];
            const outerRight = outerMaxX[row];
            if (outerLeft > outerRight) continue;

            const y = yMin + row;

            if (hasInnerRect) {
                const innerLeft = innerMinX[row];
                const innerRight = innerMaxX[row];

                if (innerLeft <= innerRight) {
                    // Has inner hole: fill left span [outerLeft, innerLeft-1] and right span [innerRight+1, outerRight]
                    // Left span
                    const leftStart = Math.max(0, outerLeft);
                    const leftEnd = Math.min(surfaceWidth - 1, innerLeft - 1);
                    if (leftStart <= leftEnd) {
                        SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, leftStart, y, leftEnd - leftStart + 1, packedColor, clipBuffer);
                    }

                    // Right span
                    const rightStart = Math.max(0, innerRight + 1);
                    const rightEnd = Math.min(surfaceWidth - 1, outerRight);
                    if (rightStart <= rightEnd) {
                        SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, rightStart, y, rightEnd - rightStart + 1, packedColor, clipBuffer);
                    }
                } else {
                    // No inner hole on this row: fill entire outer span
                    const x0 = Math.max(0, outerLeft);
                    const x1 = Math.min(surfaceWidth - 1, outerRight);
                    if (x0 <= x1) {
                        SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, x0, y, x1 - x0 + 1, packedColor, clipBuffer);
                    }
                }
            } else {
                // No inner rect: fill entire outer span (solid fill)
                const x0 = Math.max(0, outerLeft);
                const x1 = Math.min(surfaceWidth - 1, outerRight);
                if (x0 <= x1) {
                    SpanOps.fillOpaque(data32, surfaceWidth, surfaceHeight, x0, y, x1 - x0 + 1, packedColor, clipBuffer);
                }
            }
        }
    }

    /**
     * Internal: Thick semi-transparent stroke for rotated rounded rectangle.
     * Uses same Dual Edge Buffer algorithm as opaque, but with alpha blending.
     * The algorithm is inherently overdraw-free (each pixel visited exactly once).
     *
     * @param {Surface} surface - Target surface
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius (already normalized)
     * @param {number} rotation - Rotation angle in radians
     * @param {number} lineWidth - Stroke width
     * @param {Color} color - Stroke color
     * @param {number} globalAlpha - Global alpha value
     * @param {Uint8Array|null} clipBuffer - Optional clip mask buffer
     */
    static _strokeThickAlphaRotated(surface, centerX, centerY, width, height, radius, rotation, lineWidth, color, globalAlpha, clipBuffer) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Calculate effective alpha for blending
        const effectiveAlpha = (color.a / 255) * globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const halfStroke = lineWidth / 2;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Outer dimensions (path expanded by halfStroke)
        const outerWidth = width + lineWidth;
        const outerHeight = height + lineWidth;
        const outerRadius = Math.min(radius + halfStroke, Math.min(outerWidth, outerHeight) / 2);
        const outerHW = outerWidth / 2;
        const outerHH = outerHeight / 2;

        // Inner dimensions (path contracted by halfStroke)
        const innerWidth = width - lineWidth;
        const innerHeight = height - lineWidth;
        const innerRadius = Math.max(0, radius - halfStroke);
        const innerHW = innerWidth / 2;
        const innerHH = innerHeight / 2;
        const hasInnerRect = innerWidth > 0 && innerHeight > 0;

        // Compute AABB height based on outer bounds
        const boundingHeight = Math.abs(outerWidth * sin) + Math.abs(outerHeight * cos);

        // Clamp to canvas bounds
        const yMin = Math.max(0, Math.floor(centerY - boundingHeight / 2));
        const yMax = Math.min(surfaceHeight - 1, Math.ceil(centerY + boundingHeight / 2));
        const spanCount = yMax - yMin + 1;

        if (spanCount <= 0) return;

        // Allocate span arrays for outer perimeter
        const outerMinX = new Int16Array(spanCount);
        const outerMaxX = new Int16Array(spanCount);
        outerMinX.fill(surfaceWidth);
        outerMaxX.fill(-1);

        // Allocate span arrays for inner perimeter (if inner rect exists)
        const innerMinX = hasInnerRect ? new Int16Array(spanCount) : null;
        const innerMaxX = hasInnerRect ? new Int16Array(spanCount) : null;
        if (hasInnerRect) {
            innerMinX.fill(surfaceWidth);
            innerMaxX.fill(-1);
        }

        // Helper to record pixel to outer perimeter
        const recordOuter = (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < outerMinX[row]) outerMinX[row] = x;
            if (x > outerMaxX[row]) outerMaxX[row] = x;
        };

        // Helper to record pixel to inner perimeter
        const recordInner = hasInnerRect ? (x, y) => {
            if (y < yMin || y > yMax) return;
            const row = y - yMin;
            if (x < innerMinX[row]) innerMinX[row] = x;
            if (x > innerMaxX[row]) innerMaxX[row] = x;
        } : null;

        // Transform local to screen coordinates
        const transform = (localX, localY) => ({
            x: centerX + localX * cos - localY * sin,
            y: centerY + localX * sin + localY * cos
        });

        // Generate edge pixels using Bresenham
        const generateEdgePixels = (x0, y0, x1, y1, recorder) => {
            const ix0 = Math.floor(x0);
            const iy0 = Math.floor(y0);
            const ix1 = Math.floor(x1);
            const iy1 = Math.floor(y1);

            const dx = Math.abs(ix1 - ix0);
            const dy = Math.abs(iy1 - iy0);
            const sx = ix0 < ix1 ? 1 : -1;
            const sy = iy0 < iy1 ? 1 : -1;
            let err = dx - dy;

            let x = ix0, y = iy0;
            while (true) {
                recorder(x, y);
                if (x === ix1 && y === iy1) break;

                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
        };

        // Generate arc pixels
        const generateArcPixels = (cx, cy, rad, startAngle, endAngle, recorder) => {
            if (rad <= 0) return;
            const arcLength = rad * Math.abs(endAngle - startAngle);
            const steps = Math.max(Math.ceil(arcLength), 8);
            const angleStep = (endAngle - startAngle) / steps;

            let lastPx = null, lastPy = null;

            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + i * angleStep;
                const px = Math.floor(cx + rad * Math.cos(angle));
                const py = Math.floor(cy + rad * Math.sin(angle));

                if (px !== lastPx || py !== lastPy) {
                    recorder(px, py);
                    lastPx = px;
                    lastPy = py;
                }
            }
        };

        // Generate perimeter for a rounded rect
        const generatePerimeter = (hw, hh, rad, recorder) => {
            // Edge endpoints in local space
            const edges = [
                { start: { x: -hw + rad, y: -hh }, end: { x: hw - rad, y: -hh } },  // Top
                { start: { x: hw, y: -hh + rad }, end: { x: hw, y: hh - rad } },    // Right
                { start: { x: hw - rad, y: hh }, end: { x: -hw + rad, y: hh } },    // Bottom
                { start: { x: -hw, y: hh - rad }, end: { x: -hw, y: -hh + rad } }   // Left
            ];

            for (const edge of edges) {
                const start = transform(edge.start.x, edge.start.y);
                const end = transform(edge.end.x, edge.end.y);
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                if (dx * dx + dy * dy < 0.25) continue;
                generateEdgePixels(start.x, start.y, end.x, end.y, recorder);
            }

            // Corner definitions
            const corners = [
                { cx: -hw + rad, cy: -hh + rad, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
                { cx: hw - rad, cy: -hh + rad, startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
                { cx: hw - rad, cy: hh - rad, startAngle: 0, endAngle: Math.PI * 0.5 },
                { cx: -hw + rad, cy: hh - rad, startAngle: Math.PI * 0.5, endAngle: Math.PI }
            ];

            for (const corner of corners) {
                const screenCenter = transform(corner.cx, corner.cy);
                generateArcPixels(
                    screenCenter.x, screenCenter.y,
                    rad,
                    corner.startAngle + rotation,
                    corner.endAngle + rotation,
                    recorder
                );
            }
        };

        // Generate outer perimeter
        generatePerimeter(outerHW, outerHH, outerRadius, recordOuter);

        // Generate inner perimeter (if inner rect exists)
        if (hasInnerRect) {
            generatePerimeter(innerHW, innerHH, innerRadius, recordInner);
        }

        // Fill annulus per scanline with alpha blending
        for (let row = 0; row < spanCount; row++) {
            const outerLeft = outerMinX[row];
            const outerRight = outerMaxX[row];
            if (outerLeft > outerRight) continue;

            const y = yMin + row;

            // Helper to blend a span with alpha
            const blendSpan = (xStart, xEnd) => {
                const x0 = Math.max(0, xStart);
                const x1 = Math.min(surfaceWidth - 1, xEnd);
                for (let x = x0; x <= x1; x++) {
                    const pos = y * surfaceWidth + x;

                    if (clipBuffer && !(clipBuffer[pos >> 3] & (1 << (pos & 7)))) {
                        continue;
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
            };

            if (hasInnerRect) {
                const innerLeft = innerMinX[row];
                const innerRight = innerMaxX[row];

                if (innerLeft <= innerRight) {
                    // Has inner hole: fill left span and right span
                    blendSpan(outerLeft, innerLeft - 1);
                    blendSpan(innerRight + 1, outerRight);
                } else {
                    // No inner hole on this row: fill entire outer span
                    blendSpan(outerLeft, outerRight);
                }
            } else {
                // No inner rect: fill entire outer span
                blendSpan(outerLeft, outerRight);
            }
        }
    }
}
