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
     */
    static strokeThickOpaque(surface, x, y, width, height, lineWidth, color) {
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;
        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        const halfStroke = lineWidth / 2;

        // Calculate stroke geometry (edge centers)
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.floor(x + width);
        const bottom = Math.floor(y + height);

        // Draw horizontal strokes (top and bottom edges with full thickness)
        for (let px = Math.floor(left - halfStroke); px < right + halfStroke; px++) {
            if (px < 0 || px >= surfaceWidth) continue;
            for (let t = Math.floor(-halfStroke); t < halfStroke; t++) {
                // Top edge
                const topY = top + t;
                if (topY >= 0 && topY < surfaceHeight) {
                    data32[topY * surfaceWidth + px] = packedColor;
                }
                // Bottom edge
                const bottomY = bottom + t;
                if (bottomY >= 0 && bottomY < surfaceHeight) {
                    data32[bottomY * surfaceWidth + px] = packedColor;
                }
            }
        }

        // Draw vertical strokes (left and right edges, excluding corners already drawn)
        for (let py = Math.floor(top + halfStroke); py < bottom - halfStroke; py++) {
            if (py < 0 || py >= surfaceHeight) continue;
            for (let t = Math.floor(-halfStroke); t < halfStroke; t++) {
                // Left edge
                const leftX = left + t;
                if (leftX >= 0 && leftX < surfaceWidth) {
                    data32[py * surfaceWidth + leftX] = packedColor;
                }
                // Right edge
                const rightX = right + t;
                if (rightX >= 0 && rightX < surfaceWidth) {
                    data32[py * surfaceWidth + rightX] = packedColor;
                }
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
     */
    static strokeThickAlpha(surface, x, y, width, height, lineWidth, color, globalAlpha) {
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

        // Draw horizontal strokes (top and bottom edges with full thickness)
        for (let px = Math.floor(left - halfStroke); px < right + halfStroke; px++) {
            for (let t = Math.floor(-halfStroke); t < halfStroke; t++) {
                // Top edge
                blendPixel(px, top + t);
                // Bottom edge
                blendPixel(px, bottom + t);
            }
        }

        // Draw vertical strokes (left and right edges, excluding corners already drawn)
        for (let py = Math.floor(top + halfStroke); py < bottom - halfStroke; py++) {
            for (let t = Math.floor(-halfStroke); t < halfStroke; t++) {
                // Left edge
                blendPixel(left + t, py);
                // Right edge
                blendPixel(right + t, py);
            }
        }
    }
}
