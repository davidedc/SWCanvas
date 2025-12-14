/**
 * Test: Filled Circle with Opaque Color (Direct Rendering)
 *
 * Tests that fillCircle with an opaque color uses direct rendering
 * (32-bit packed writes, no path system).
 */

registerDirectRenderingTest(
    'circle-fill-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use opaque fill color (required for direct rendering)
        const fillColor = getRandomOpaqueColor();

        // Calculate circle parameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 30,
            maxRadius: 80,
            hasStroke: false,
            randomPosition: false
        });

        const { centerX, centerY, radius } = params;

        // Draw filled circle using direct shape API
        ctx.fillStyle = fillColor;
        ctx.fillCircle(centerX, centerY, radius);

        // Return check data
        return {
            logs: [`Circle at (${centerX}, ${centerY}) radius ${radius} color ${fillColor}`],
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
        extremes: { colorTolerance: 8, tolerance: 0.05 },
        totalUniqueColors: 2, // background + fill
        // Direct rendering is expected - no allowPathBasedRendering flag
    },
    {
        title: 'Filled Circle - Opaque Color (Direct Rendering)',
        description: 'Tests fillCircle with opaque color uses direct 32-bit writes'
    }
);
