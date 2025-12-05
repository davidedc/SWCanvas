/**
 * Test: Filled Circle with Semi-Transparent Color (Slow Path Expected)
 *
 * Tests that fillCircle with semi-transparent color correctly falls back
 * to the path system for proper alpha blending.
 */

registerHighLevelTest(
    'circle-fill-semitransparent',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use SEMI-TRANSPARENT fill color (requires slow path for alpha blending)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = 60;

        ctx.fillCircle(centerX, centerY, radius);

        return {
            logs: [`Semi-transparent circle at (${centerX}, ${centerY}) radius ${radius}`],
            checkData: {
                topY: Math.floor(centerY - radius),
                bottomY: Math.floor(centerY + radius),
                leftX: Math.floor(centerX - radius),
                rightX: Math.floor(centerX + radius)
            }
        };
    },
    'circles',
    {
        extremes: { tolerance: 0.05 },
        totalUniqueColors: 2,  // Exactly 2 colors: white background + one blended red (no overdraw)
        // Semi-transparent colors now use fast path with Bresenham + alpha blending
    },
    {
        title: 'Filled Circle - Semi-Transparent (Fast Path)',
        description: 'Tests fillCircle with alpha uses fast Bresenham + alpha blending'
    }
);
