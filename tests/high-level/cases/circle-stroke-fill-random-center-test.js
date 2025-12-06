/**
 * Test: Single Random Circle (Crisp, Random Center Type)
 *
 * Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.
 * The center type is randomly chosen to be either grid-aligned or pixel-aligned.
 */

registerHighLevelTest(
    'circle-stroke-fill-random-center-type',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use calculateCircleTestParameters for proper setup
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: false,  // Centered, not randomly positioned
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
            logs: [`Circle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, centerType=${atPixel ? 'pixel' : 'grid'}`],
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
        title: 'Single Random Circle (Crisp, Random Center Type)',
        description: 'Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.'
    }
);
