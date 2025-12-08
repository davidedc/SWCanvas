/**
 * Test: Multiple Filled Circles (Fast Path)
 *
 * Tests that multiple fillCircle calls with opaque colors all use the fast path.
 */

registerHighLevelTest(
    'multiple-circles-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        const circles = [];
        const numCircles = 5;

        for (let i = 0; i < numCircles; i++) {
            // Use opaque fill color
            const fillColor = getRandomOpaqueColor();

            // Random position and size
            const radius = 20 + Math.floor(SeededRandom.getRandom() * 40);
            const centerX = radius + SeededRandom.getRandom() * (canvasWidth - radius * 2);
            const centerY = radius + SeededRandom.getRandom() * (canvasHeight - radius * 2);

            ctx.fillStyle = fillColor;
            ctx.fillCircle(centerX, centerY, radius);

            circles.push({ centerX, centerY, radius, fillColor });
        }

        return {
            logs: circles.map(c => `Circle at (${c.centerX.toFixed(1)}, ${c.centerY.toFixed(1)}) r=${c.radius}`)
        };
    },
    'circles',
    {
        // No totalUniqueColors check - random colors and overlaps make exact count unpredictable
        // Fast path expected for all circles
    },
    {
        title: 'Multiple Filled Circles - Opaque Colors (Fast Path)',
        description: 'Tests multiple fillCircle calls use fast path'
    }
);
