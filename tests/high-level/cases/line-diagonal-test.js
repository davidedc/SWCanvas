/**
 * Test: Diagonal Line Stroke 1px (Fast Path)
 *
 * Tests that diagonal strokeLine with 1px width uses fast Bresenham path.
 */

registerHighLevelTest(
    'line-diagonal-1px-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use opaque stroke color
        ctx.strokeStyle = 'rgb(0, 128, 255)';
        ctx.lineWidth = 1;

        // Diagonal line from top-left to bottom-right area
        const margin = 50;
        const startX = margin;
        const startY = margin;
        const endX = canvasWidth - margin;
        const endY = canvasHeight - margin;

        ctx.strokeLine(startX, startY, endX, endY);

        return {
            logs: [`Diagonal line from (${startX}, ${startY}) to (${endX}, ${endY})`],
            checkData: {
                topY: startY,
                bottomY: endY,
                leftX: startX,
                rightX: endX
            }
        };
    },
    'lines',
    {
        extremes: true,
        // Fast path expected for 1px diagonal line
    },
    {
        title: 'Diagonal Line 1px - Opaque Color (Fast Path)',
        description: 'Tests diagonal strokeLine uses fast Bresenham algorithm'
    }
);
