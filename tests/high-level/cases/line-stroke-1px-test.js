/**
 * Test: Line Stroke 1px (Fast Path)
 *
 * Tests that strokeLine with 1px line width and opaque color uses the fast path
 * (Bresenham algorithm, no path system).
 */

registerHighLevelTest(
    'line-stroke-1px-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use opaque stroke color (required for fast path)
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.lineWidth = 1;

        // Calculate line parameters - horizontal line centered
        const centerX = canvasWidth / 2;
        const centerY = Math.floor(canvasHeight / 2); // Integer Y coordinate
        const lineLength = 50 + Math.floor(SeededRandom.getRandom() * 100);
        const startX = Math.floor(centerX - lineLength / 2);
        const endX = startX + lineLength;

        // Draw line using direct shape API
        ctx.strokeLine(startX, centerY, endX, centerY);

        return {
            logs: [`Line from (${startX}, ${centerY}) to (${endX}, ${centerY})`],
            checkData: {
                topY: centerY,
                bottomY: centerY,
                leftX: startX,
                rightX: endX
            }
        };
    },
    'lines',
    {
        extremes: true,
        // Fast path expected for 1px opaque line
    },
    {
        title: 'Line Stroke 1px - Opaque Color (Fast Path)',
        description: 'Tests strokeLine with 1px line uses fast Bresenham algorithm'
    }
);
