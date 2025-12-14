/**
 * Test: Filled Rectangle with Opaque Color
 *
 * Tests that fillRect with an opaque color works correctly.
 * Note: fillRect uses the rasterizer path, not direct shape API,
 * but should still be performant.
 */

registerDirectRenderingTest(
    'rect-fill-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use opaque fill color
        ctx.fillStyle = getRandomOpaqueColor();

        // Calculate rect parameters
        const rectWidth = 50 + Math.floor(SeededRandom.getRandom() * 100);
        const rectHeight = 50 + Math.floor(SeededRandom.getRandom() * 80);
        const x = Math.floor((canvasWidth - rectWidth) / 2);
        const y = Math.floor((canvasHeight - rectHeight) / 2);

        // Draw filled rect
        ctx.fillRect(x, y, rectWidth, rectHeight);

        return {
            logs: [`Rect at (${x}, ${y}) size ${rectWidth}x${rectHeight}`],
            checkData: {
                topY: y,
                bottomY: y + rectHeight - 1,
                leftX: x,
                rightX: x + rectWidth - 1
            }
        };
    },
    'rects',
    {
        extremes: true,
        totalUniqueColors: 2
    },
    {
        title: 'Filled Rectangle - Opaque Color',
        description: 'Tests fillRect with opaque color'
    }
);
