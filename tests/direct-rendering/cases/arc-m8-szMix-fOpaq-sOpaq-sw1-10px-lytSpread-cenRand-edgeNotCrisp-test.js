/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 8 arcs with fill and stroke, spread layout, and non-crisp edges.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | arcs           | The test draws arcs using `ctx.fillOuterStrokeArc()`.
 * | Count                  | multiple (8)   | The test draws 8 arc instances using a loop.
 * | SizeCategory           | mixed          | The radius is randomized spanning multiple size categories.
 * | FillStyle              | opaque         | `getRandomOpaqueColor()` is called for the fill.
 * | StrokeStyle            | opaque         | `getRandomOpaqueColor()` is called for the stroke.
 * | StrokeThickness        | 1px-10px       | `strokeWidth` is randomized between 1 and 10.
 * | Layout                 | spread         | Arcs are positioned randomly across the canvas.
 * | CenteredAt             | random         | The final center coordinates are random floating-point values.
 * | EdgeAlignment          | not-crisp      | No crisp alignment adjustments are applied.
 * | Orientation            | N/A            | Arc orientation determined by angle parameters.
 * | ArcAngleExtent         | >270°          | Gap < 90° ensures all cardinal points included for extremes check.
 * | RoundRectRadius        | N/A            | Not applicable to arcs.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not use clipping.
 * | Clipped on shape count | n/a            | No clipping is used.
 * | Clipped on shape arrangement| n/a       | No clipping is used.
 * | Clipped on shape size  | n/a            | No clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - Uses SWCanvas direct API method `ctx.fillOuterStrokeArc()` for combined fill+stroke.
 * - Each arc is drawn with independently randomized parameters.
 * - Gap positioned randomly within a single quadrant for each arc.
 * - Non-crisp edges test sub-pixel rendering accuracy.
 *
 */

registerDirectRenderingTest(
    'arc-m8-szMix-fOpaq-sOpaq-sw1-10px-lytSpread-cenRand-edgeNotCrisp-test',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const numToDraw = 8;
        const logs = [];

        const marginX = 60;
        const marginY = 60;

        for (let i = 0; i < numToDraw; i++) {
            // Random center (not crisp-aligned)
            const centerX = marginX + SeededRandom.getRandom() * (canvasWidth - 2 * marginX);
            const centerY = marginY + SeededRandom.getRandom() * (canvasHeight - 2 * marginY);

            // Random radius and stroke width
            const radius = 15 + SeededRandom.getRandom() * 40;
            const strokeWidth = 1 + SeededRandom.getRandom() * 9;

            // Generate arc angles with gap constrained to single quadrant
            const { startAngle, endAngle, gapSizeDeg } = generateConstrainedArcAngles();

            // Get random opaque colors
            const fillColor = getRandomOpaqueColor();
            const strokeColor = getRandomOpaqueColor();

            // Draw filled and stroked arc (no crisp adjustment)
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.fillOuterStrokeArc(centerX, centerY, radius, startAngle, endAngle);

            logs.push(`Arc ${i + 1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, gap=${gapSizeDeg.toFixed(1)}°`);
        }

        return { logs };
    },
    'arcs',
    {
    },
    {
        title: 'Multiple Arcs (Not Crisp, Spread Layout)',
        description: 'Tests rendering of 8 arcs with fill and stroke, spread layout, and non-crisp edges.'
    }
);
