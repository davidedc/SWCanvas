/**
 * Test: Circle: fully random
 *
 * Test with a single circle, all parameters fully randomized.
 * No crisp alignment - uses floating-point random values for position, radius, and stroke.
 */

registerHighLevelTest(
    'circle-fully-random',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const logs = [];

        // Get random center point (no alignment)
        const center = getRandomPoint(1, canvasWidth, canvasHeight);

        // Random radius (15-65px)
        const radius = 15 + SeededRandom.getRandom() * 50;

        // Random stroke width (1-11px)
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;

        // Get random colors (semitransparent)
        const strokeColor = getRandomColor('semitransparent');
        const fillColor = getRandomColor('semitransparent');

        // Draw filled and stroked circle using Direct API
        // Note: strokeCircle fast path only supports 1px strokes; variable widths use slow path
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.fillAndStrokeCircle(center.x, center.y, radius);

        logs.push(`FullyRandom Circle: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`);

        return { logs };
    },
    'circles',
    {
        noGapsInStrokeEdges: true
    },
    {
        title: 'Circle: fully random',
        description: 'Performance of a single fully random circle.'
    }
);
