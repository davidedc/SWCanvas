/**
 * RectOps - Static methods for optimized rectangle rendering
 * Follows PolygonFiller pattern with static methods.
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
     */
    static stroke1pxOpaque(surface, x, y, width, height, color) {
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

        // Draw top edge (horizontal): pixels from left to right (inclusive)
        if (top >= 0 && top < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                data32[top * surfaceWidth + px] = packedColor;
            }
        }

        // Draw bottom edge (horizontal): pixels from left to right (inclusive)
        if (bottom >= 0 && bottom < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                data32[bottom * surfaceWidth + px] = packedColor;
            }
        }

        // Draw left edge (vertical): skip corners (already drawn)
        if (left >= 0 && left < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                data32[py * surfaceWidth + left] = packedColor;
            }
        }

        // Draw right edge (vertical): skip corners (already drawn)
        if (right >= 0 && right < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                data32[py * surfaceWidth + right] = packedColor;
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
     */
    static stroke1pxAlpha(surface, x, y, width, height, color, globalAlpha) {
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

        // Helper function to blend a pixel
        const blendPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;
            const idx = (py * surfaceWidth + px) * 4;
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
     * Ported from CrispSwCanvas's SWRendererRect.drawAxisAlignedRect() method
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
        // Keep as floats - don't floor early! CrispSWCanvas keeps strokePos.x/y as floats
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
     * Ported from CrispSwCanvas's SWRendererRect.drawAxisAlignedRect() method
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
        // Keep as floats - don't floor early! CrispSWCanvas keeps strokePos.x/y as floats
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

        // Draw vertical strokes (left and right edges, excluding corners already drawn)
        for (let py = Math.floor(top + halfStroke); py < bottom - halfStroke; py++) {
            for (let t = -halfStroke; t < halfStroke; t++) {
                // Left edge
                blendPixel(Math.floor(left + t), py);
                // Right edge
                blendPixel(Math.floor(right + t), py);
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
     * Rotated rectangle fill using edge-function algorithm
     * Ported from CrispSWCanvas's SWRendererRect.fillRotatedRect()
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
     * Rotated rectangle stroke using LineOps for edges.
     * Uses extend/shorten strategy for proper miter joins at corners.
     * Ported from CrispSWCanvas's SWRendererRect.drawRotatedRect()
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
