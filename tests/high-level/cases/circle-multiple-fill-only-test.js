/**
 * Test: Multiple Precise Fill-Only Circles (Random Params & Pos)
 *
 * Tests rendering of 12 circles with no strokes, only fills, precise alignment,
 * and random parameters/positions.
 */

registerHighLevelTest(
    'circle-multiple-fill-only',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const numToDraw = 12;
        const logs = [];

        for (let i = 0; i < numToDraw; i++) {
            // Use calculateCircleTestParameters for each circle
            const params = calculateCircleTestParameters({
                canvasWidth,
                canvasHeight,
                minRadius: 8,
                maxRadius: 42,
                hasStroke: false,  // No stroke
                randomPosition: true,
                marginX: 60,
                marginY: 60
            });

            const { centerX, centerY, radius, finalDiameter, atPixel } = params;

            // Get random fill color (mixed - opaque or semitransparent)
            const fillColor = getRandomColor('mixed');

            // Draw filled circle (no stroke) using Direct API for fast path
            ctx.fillStyle = fillColor;
            ctx.fillCircle(centerX, centerY, radius);

            logs.push(`Circle ${i + 1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}`);
        }

        return { logs };
    },
    'circles',
    {
        // Visual comparison only - no specific checks
    },
    {
        title: 'Multiple Precise Fill-Only Circles (Random Params & Pos)',
        description: 'Tests rendering of 12 circles with no strokes, only fills, precise alignment, and random parameters/positions.'
    }
);
