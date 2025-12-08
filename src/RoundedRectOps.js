/**
 * RoundedRectOps - Static methods for optimized rounded rectangle rendering
 * Follows the PolygonFiller/RectOps/CircleOps/LineOps pattern.
 *
 * Fast path for 1px opaque strokes ported from CrispSWCanvas's SWRendererRoundedRect.
 */
class RoundedRectOps {
    /**
     * Fast path for 1px opaque stroke on axis-aligned rounded rectangle.
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
     * Fast path for 1px semi-transparent stroke on axis-aligned rounded rectangle.
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
}
