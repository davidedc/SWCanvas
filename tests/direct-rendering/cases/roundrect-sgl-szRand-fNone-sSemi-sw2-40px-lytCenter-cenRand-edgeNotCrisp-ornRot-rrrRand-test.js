/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests 5px semi-transparent stroke on a single rotated rounded rectangle.
 *              Uses SeededRandom for reproducibility. Directly calls RoundedRectOps.strokeRotated
 *              to test the Dual Edge Buffer algorithm with alpha blending.
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws a rotated rounded rectangle via `RoundedRectOps.strokeRotated()`.
 * | Count                  | single         | Only 1 instance drawn for focused visual inspection.
 * | SizeCategory           | random         | Width/height randomly generated (60-140px range).
 * | FillStyle              | none           | Stroke-only test; no fill is applied.
 * | StrokeStyle            | semi           | Stroke color is semi-transparent (alpha = 0.6).
 * | StrokeThickness        | 2-40px         | Tests thick stroke with Dual Edge Buffer + alpha blending (random width).
 * | Layout                 | center         | Shape is roughly centered on canvas.
 * | CenteredAt             | random         | Center has small random offset from canvas center.
 * | EdgeAlignment          | not-crisp      | Rotation makes pixel-aligned edges irrelevant.
 * | Orientation            | rotated        | Random rotation angle (0 to 2π).
 * | RoundRectRadius        | random         | Radius randomly generated (8 to min(w,h)/2).
 */

function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;

    let logs = [];
    let checkData = null;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const surface = ctx.surface || ctx.canvas?._coreSurface;
    const isSWCanvas = surface && typeof SWCanvas !== 'undefined';

    let Color, RoundedRectOps;
    if (isSWCanvas) {
        Color = SWCanvas.Core.Color;
        RoundedRectOps = SWCanvas.Core.RoundedRectOps;

        if (typeof RoundedRectOps.strokeRotated !== 'function') {
            logs.push('ERROR: RoundedRectOps.strokeRotated method not found');
            return { logs, checkData: { error: 'method not found' } };
        }
    } else if (typeof ctx.roundRect !== 'function') {
        logs.push('Skipping test: requires SWCanvas or HTML5 Canvas with roundRect support');
        return { logs, checkData: { skipped: true } };
    }

    // Generate random parameters
    const width = 60 + Math.floor(SeededRandom.getRandom() * 80);
    const height = 60 + Math.floor(SeededRandom.getRandom() * 60);
    const maxRadius = Math.min(width, height) / 2;
    const radius = 8 + Math.floor(SeededRandom.getRandom() * (maxRadius - 8));
    const rotation = SeededRandom.getRandom() * Math.PI * 2;
    const lineWidth = 2 + Math.floor(SeededRandom.getRandom() * 39);  // Random 2-40px

    const cx = canvasWidth / 2 + (SeededRandom.getRandom() - 0.5) * 40;
    const cy = canvasHeight / 2 + (SeededRandom.getRandom() - 0.5) * 40;

    const strokeColor = { r: 255, g: 0, b: 128 };
    const strokeAlpha = 0.6;

    if (isPerformanceRun) {
        for (let i = 0; i < instances; i++) {
            const w = 60 + Math.floor(SeededRandom.getRandom() * 60);
            const h = 60 + Math.floor(SeededRandom.getRandom() * 50);
            const r = 8 + Math.floor(SeededRandom.getRandom() * (Math.min(w, h) / 2 - 8));
            const angle = SeededRandom.getRandom() * Math.PI * 2;
            const offsetX = SeededRandom.getRandom() * canvasWidth;
            const offsetY = SeededRandom.getRandom() * canvasHeight;
            const lw = 3 + Math.floor(SeededRandom.getRandom() * 8);
            const alpha = 0.3 + SeededRandom.getRandom() * 0.5;

            if (isSWCanvas) {
                const color = new Color(
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    255
                );
                RoundedRectOps.strokeRotated(surface, offsetX, offsetY, w, h, r, angle, lw, color, alpha, null);
            } else {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(offsetX, offsetY);
                ctx.rotate(angle);
                ctx.strokeStyle = `rgb(${Math.floor(SeededRandom.getRandom() * 200) + 55}, ${Math.floor(SeededRandom.getRandom() * 200) + 55}, ${Math.floor(SeededRandom.getRandom() * 200) + 55})`;
                ctx.lineWidth = lw;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, r);
                ctx.stroke();
                ctx.restore();
            }
        }
        return null;
    }

    const angleDeg = Math.round(rotation * 180 / Math.PI);

    if (isSWCanvas) {
        const color = new Color(strokeColor.r, strokeColor.g, strokeColor.b, 255);
        RoundedRectOps.strokeRotated(surface, cx, cy, width, height, radius, rotation, lineWidth, color, strokeAlpha, null);
    } else {
        ctx.save();
        ctx.globalAlpha = strokeAlpha;
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.strokeStyle = `rgb(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, radius);
        ctx.stroke();
        ctx.restore();
    }

    logs.push(`Shape: center=(${cx.toFixed(1)},${cy.toFixed(1)}), size=${width}x${height}, r=${radius}, angle=${angleDeg}°`);
    logs.push(`Stroke: rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeAlpha}), lineWidth=${lineWidth}`);

    const hw = width / 2 + lineWidth;
    const hh = height / 2 + lineWidth;
    const diag = Math.sqrt(hw * hw + hh * hh);

    checkData = {
        shapeCount: 1,
        expectedMinX: Math.floor(cx - diag),
        expectedMaxX: Math.ceil(cx + diag),
        expectedMinY: Math.floor(cy - diag),
        expectedMaxY: Math.ceil(cy + diag)
    };

    return { logs, checkData };
}

registerDirectRenderingTest(
    'roundrect-sgl-szRand-fNone-sSemi-sw2-40px-lytCenter-cenRand-edgeNotCrisp-ornRot-rrrRand',
    drawTest,
    'rounded-rects',
    {
        extremes: false,
        totalUniqueColors: 2  // Background + single semi-transparent stroke color (no overdraw)
    },
    {
        title: 'Single Rotated Rounded Rectangle - 2-40px Semi-Transparent Stroke (Random)',
        description: 'Tests direct rendering of random 2-40px semi-transparent stroke on a single rotated rounded rectangle using Dual Edge Buffer with alpha blending.',
        displayName: 'Perf: Single Rotated RRect 2-40px Alpha Stroke (Random)'
    }
);
