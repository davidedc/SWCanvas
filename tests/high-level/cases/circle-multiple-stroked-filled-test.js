/**
 * Test: Multiple Precise Random Circles (Stroked & Filled)
 *
 * Tests rendering of 12 circles with precise pixel alignment, varied strokes and fills,
 * and random positions. Each circle has randomized radius, position, stroke color/thickness,
 * and fill color.
 */

registerHighLevelTest(
    'circle-multiple-stroked-filled',
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
                hasStroke: true,
                minStrokeWidth: 1,
                maxStrokeWidth: 4,
                randomPosition: true,
                marginX: 60,
                marginY: 60
            });

            const { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;

            // Get random colors (mixed for stroke, semitransparent for fill)
            const strokeColor = getRandomColor('mixed');
            const fillColor = getRandomColor('semitransparent');

            // Draw filled and stroked circle using Direct API
            // Note: strokeCircle fast path only supports 1px strokes; variable widths use slow path
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.fillAndStrokeCircle(centerX, centerY, radius);

            logs.push(`Circle ${i + 1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`);
        }

        return { logs };
    },
    'circles',
    {
        // Visual comparison only - all stroke widths use fast path
    },
    {
        title: 'Multiple Precise Random Circles (Stroked & Filled)',
        description: 'Tests rendering of 12 circles with precise pixel alignment, varied strokes and fills, and random positions.'
    }
);
