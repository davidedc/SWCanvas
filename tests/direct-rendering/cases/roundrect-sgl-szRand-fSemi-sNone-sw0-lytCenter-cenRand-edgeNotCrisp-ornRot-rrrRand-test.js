/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests semi-transparent fill on a single rotated rounded rectangle with random parameters.
 *              Uses SeededRandom for reproducibility. Directly calls RoundedRectOps.fillRotated
 *              to test the Edge Buffer Rasterization algorithm with alpha blending.
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws a rotated rounded rectangle via `RoundedRectOps.fillRotated()`.
 * | Count                  | single         | Only 1 instance drawn for focused visual inspection.
 * | SizeCategory           | random         | Width/height randomly generated (40-120px range, constrained to canvas).
 * | FillStyle              | semi           | Fill color is semi-transparent (alpha = 0.6) for testing alpha blending.
 * | StrokeStyle            | none           | Fill-only test; no stroke is applied.
 * | StrokeThickness        | 0              | No stroke.
 * | Layout                 | center         | Shape is roughly centered on canvas.
 * | CenteredAt             | random         | Center has small random offset from canvas center.
 * | EdgeAlignment          | not-crisp      | Rotation makes pixel-aligned edges irrelevant; edges are inherently not crisp.
 * | Orientation            | rotated        | Random rotation angle (0 to 2π).
 * | ArcAngleExtent         | N/A            | Not an arc test.
 * | RoundRectRadius        | random         | Radius randomly generated (5 to min(w,h)/2).
 * | ContextTranslation     | none           | Direct static method call bypasses Context2D transforms.
 * | ContextRotation        | none           | Rotation is passed directly to `fillRotated()`, not via `ctx.rotate()`.
 * | ContextScaling         | none           | No scaling applied.
 * | Clipped on shape       | none           | No clipping applied in this test.
 * | Clipped on shape count | n/a            | No clipping.
 * | Clipped on shape arrangement | n/a      | No clipping.
 * | Clipped on shape size  | n/a            | No clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * This test directly calls `RoundedRectOps.fillRotated()` (static method) rather than going through
 * Context2D, since Context2D integration for rotated rounded rectangles is not yet implemented.
 * Uses Edge Buffer Rasterization algorithm for optimal O(H + P + A) complexity.
 * Tests alpha blending path (_fillAlphaRotated).
 */

/**
 * @fileoverview Test definition for semi-transparent fill on a single rotated rounded rectangle with random parameters.
 */

/**
 * Draws a single rotated rounded rectangle with semi-transparent fill and random parameters.
 * Tests the RoundedRectOps.fillRotated direct rendering method with alpha blending.
 *
 * @param {CanvasRenderingContext2D | SWCanvasContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 1 rectangle is drawn.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;

    let logs = [];
    let checkData = null;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Detect if this is SWCanvas (has surface) or native HTML5 Canvas
    const surface = ctx.surface || ctx.canvas?._coreSurface;
    const isSWCanvas = surface && typeof SWCanvas !== 'undefined';

    // For SWCanvas: use direct rendering
    // For HTML5 Canvas: use path-based approach (browser only, requires roundRect)
    let Color, RoundedRectOps;
    if (isSWCanvas) {
        Color = SWCanvas.Core.Color;
        RoundedRectOps = SWCanvas.Core.RoundedRectOps;

        // Verify fillRotated method exists
        if (typeof RoundedRectOps.fillRotated !== 'function') {
            logs.push('ERROR: RoundedRectOps.fillRotated method not found');
            return { logs, checkData: { error: 'method not found' } };
        }
    } else if (typeof ctx.roundRect !== 'function') {
        // Neither SWCanvas nor HTML5 Canvas with roundRect support
        logs.push('Skipping test: requires SWCanvas or HTML5 Canvas with roundRect support');
        return { logs, checkData: { skipped: true } };
    }

    // Generate random parameters
    const width = 40 + Math.floor(SeededRandom.getRandom() * 100);
    const height = 40 + Math.floor(SeededRandom.getRandom() * 80);
    const maxRadius = Math.min(width, height) / 2;
    const radius = 5 + Math.floor(SeededRandom.getRandom() * (maxRadius - 5)); // 5 to maxRadius
    const rotation = SeededRandom.getRandom() * Math.PI * 2;  // 0 to 2π

    // Center roughly in canvas with small random offset (±30px)
    const cx = canvasWidth / 2 + (SeededRandom.getRandom() - 0.5) * 60;
    const cy = canvasHeight / 2 + (SeededRandom.getRandom() - 0.5) * 60;

    // Semi-transparent green color for visual clarity
    const fillColor = { r: 0, g: 180, b: 0 };
    const fillAlpha = 0.6;

    if (isPerformanceRun) {
        // For performance runs, draw many shapes with varying parameters
        for (let i = 0; i < instances; i++) {
            const w = 40 + Math.floor(SeededRandom.getRandom() * 80);
            const h = 40 + Math.floor(SeededRandom.getRandom() * 60);
            const r = 5 + Math.floor(SeededRandom.getRandom() * (Math.min(w, h) / 2 - 5));
            const angle = SeededRandom.getRandom() * Math.PI * 2;
            const offsetX = SeededRandom.getRandom() * canvasWidth;
            const offsetY = SeededRandom.getRandom() * canvasHeight;
            const alpha = 0.3 + SeededRandom.getRandom() * 0.5;

            if (isSWCanvas) {
                const color = new Color(
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    Math.floor(SeededRandom.getRandom() * 200) + 55,
                    255
                );
                RoundedRectOps.fillRotated(
                    surface,
                    offsetX, offsetY,
                    w, h, r,
                    angle,
                    color,
                    alpha,          // globalAlpha for semi-transparency
                    null            // clipBuffer
                );
            } else {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(offsetX, offsetY);
                ctx.rotate(angle);
                ctx.fillStyle = `rgb(${Math.floor(SeededRandom.getRandom() * 200) + 55}, ${Math.floor(SeededRandom.getRandom() * 200) + 55}, ${Math.floor(SeededRandom.getRandom() * 200) + 55})`;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, r);
                ctx.fill();
                ctx.restore();
            }
        }
        return null;
    }

    // Visual test: draw single shape with random parameters
    const angleDeg = Math.round(rotation * 180 / Math.PI);

    if (isSWCanvas) {
        // SWCanvas: Direct rendering via RoundedRectOps.fillRotated
        const color = new Color(fillColor.r, fillColor.g, fillColor.b, 255);
        RoundedRectOps.fillRotated(
            surface,
            cx, cy,
            width, height, radius,
            rotation,
            color,
            fillAlpha,      // globalAlpha for semi-transparency
            null            // clipBuffer
        );
    } else {
        // HTML5 Canvas: Path-based approach with transforms
        ctx.save();
        ctx.globalAlpha = fillAlpha;
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.fillStyle = `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`;
        ctx.beginPath();
        // roundRect uses top-left corner, so offset by half width/height
        ctx.roundRect(-width / 2, -height / 2, width, height, radius);
        ctx.fill();
        ctx.restore();
    }

    logs.push(`Shape: center=(${cx.toFixed(1)},${cy.toFixed(1)}), size=${width}x${height}, r=${radius}, angle=${angleDeg}°`);
    logs.push(`Color: rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillAlpha})`);

    // Calculate rough bounds for extremes check
    const hw = width / 2;
    const hh = height / 2;
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

// Register the test
registerDirectRenderingTest(
    'roundrect-sgl-szRand-fSemi-sNone-sw0-lytCenter-cenRand-edgeNotCrisp-ornRot-rrrRand',
    drawTest,
    'rounded-rects',
    {
        extremes: false  // Rotated shapes have complex bounds, skip strict extremes check
    },
    {
        title: 'Single Rotated Rounded Rectangle - Semi-Transparent Fill (Random)',
        description: 'Tests direct rendering of semi-transparent fill on a single rotated rounded rectangle with random size, radius, and rotation using Edge Buffer Rasterization with alpha blending.',
        displayName: 'Perf: Single Rotated RRect Alpha Fill (Random)'
    }
);
