/**
 * Test: Single Randomly Positioned Circle Without Stroke (Crisp)
 *
 * Tests a single randomly positioned circle with no stroke, random fill, and crisp rendering.
 * The circle's radius and position are randomized within defined constraints.
 */

registerHighLevelTest(
    'circle-fill-only-random-pos',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use calculateCircleTestParameters with random positioning
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: false,  // No stroke
            randomPosition: true,  // Enable random positioning
            marginX: 10,
            marginY: 10
        });

        const { centerX, centerY, radius, finalDiameter, atPixel } = params;

        // Get random fill color
        const fillColor = getRandomColor('semitransparent');

        // Draw filled circle (no stroke) using Direct API for fast path
        ctx.fillStyle = fillColor;
        ctx.fillCircle(centerX, centerY, radius);

        return {
            logs: [`RandPos Circle (no stroke): center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}`],
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
        title: 'Single Randomly Positioned Circle Without Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with no stroke, random fill, and crisp center.'
    }
);
