/**
 * Test: Single Randomly Positioned Circle with Stroke (Crisp)
 *
 * Tests a single circle with fully randomized parameters for position, size, fill, and stroke.
 * The final rendering is adjusted to ensure the circle's edges are crisp (pixel-aligned).
 */

registerHighLevelTest(
    'circle-stroke-fill-random-pos',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use calculateCircleTestParameters with random positioning
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: true,  // Enable random positioning
            marginX: 10,
            marginY: 10
        });

        const { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;

        // Get random colors
        const strokeColor = getRandomColor('semitransparent');
        const fillColor = getRandomColor('semitransparent');

        // Draw filled and stroked circle using Direct API
        // Note: strokeCircle fast path only supports 1px strokes; variable widths use slow path
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.fillCircle(centerX, centerY, radius);
        ctx.strokeCircle(centerX, centerY, radius);

        return {
            logs: [`RandPos Circle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`],
            checkData: {
                effectiveRadius: radius + strokeWidth / 2,
                leftX: Math.floor(centerX - radius - strokeWidth / 2),
                rightX: Math.floor(centerX + radius + strokeWidth / 2 - 1),
                topY: Math.floor(centerY - radius - strokeWidth / 2),
                bottomY: Math.floor(centerY + radius + strokeWidth / 2 - 1)
            }
        };
    },
    'circles',
    {
        extremes: { colorTolerance: 8, tolerance: 0.02 },
        noGapsInStrokeEdges: true,
        totalUniqueColors: 4,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle with Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with random params, crisp stroke/fill.'
    }
);
