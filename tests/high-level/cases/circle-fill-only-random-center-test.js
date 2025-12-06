/**
 * Test: Single Circle Without Stroke (Crisp, Random Center Type)
 *
 * Tests rendering of a single circle with no stroke, only fill.
 * The center type is randomly chosen to be either grid-aligned or pixel-aligned.
 */

registerHighLevelTest(
    'circle-fill-only-random-center-type',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use calculateCircleTestParameters for proper setup
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: false,  // No stroke
            randomPosition: false  // Centered, not randomly positioned
        });

        const { centerX, centerY, radius, finalDiameter, atPixel } = params;

        // Get random fill color
        const fillColor = getRandomColor('semitransparent');

        // Draw filled circle (no stroke) using Direct API for fast path
        ctx.fillStyle = fillColor;
        ctx.fillCircle(centerX, centerY, radius);

        return {
            logs: [`Circle (no stroke): center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, centerType=${atPixel ? 'pixel' : 'grid'}`],
            checkData: {
                leftX: Math.floor(centerX - radius),
                rightX: Math.floor(centerX + radius - 1),
                topY: Math.floor(centerY - radius),
                bottomY: Math.floor(centerY + radius - 1)
            }
        };
    },
    'circles',
    {
        extremes: { colorTolerance: 8, tolerance: 0.02 },
        noGapsInFillEdges: true,
        totalUniqueColors: 2,
        speckles: true
    },
    {
        title: 'Single Circle Without Stroke (Crisp, Random Center Type)',
        description: 'Tests rendering of a single circle with no stroke, only fill, random params, and crisp center (grid or pixel).'
    }
);
