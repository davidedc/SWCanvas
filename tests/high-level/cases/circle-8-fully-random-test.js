/**
 * Test: Circle: 8 fully random
 *
 * Test with 8 circles, all parameters fully randomized.
 * No crisp alignment - uses floating-point random values for position, radius, and stroke.
 */

registerHighLevelTest(
    'circle-8-fully-random',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const numToDraw = 8;
        const logs = [];

        for (let i = 0; i < numToDraw; i++) {
            // Get random center point (no alignment)
            const center = getRandomPoint(1, canvasWidth, canvasHeight);

            // Random radius (15-65px)
            const radius = 15 + SeededRandom.getRandom() * 50;

            // Random stroke width (1-11px)
            const strokeWidth = SeededRandom.getRandom() * 10 + 1;

            // Get random colors (mixed for stroke, semitransparent for fill)
            const strokeColor = getRandomColor('mixed');
            const fillColor = getRandomColor('semitransparent');

            // Draw filled and stroked circle using Direct API
            // Note: strokeCircle fast path only supports 1px strokes; variable widths use slow path
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.fillAndStrokeCircle(center.x, center.y, radius);

            logs.push(`Circle ${i + 1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`);
        }

        return { logs };
    },
    'circles',
    {
        // Visual comparison only - all stroke widths use fast path
    },
    {
        title: 'Circle: 8 fully random',
        description: 'Performance of 8 fully random circles.'
    }
);
