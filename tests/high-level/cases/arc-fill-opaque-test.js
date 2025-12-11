/**
 * Test: Filled Arc with Opaque Color (Fast Path)
 *
 * Tests that fillArc with an opaque color uses the fast path
 * (32-bit packed writes, no path system).
 * Arc extends > 270 degrees with gap < 90 degrees within a single quadrant.
 */

registerHighLevelTest(
    'arc-fill-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use opaque fill color (required for fast path)
        const fillColor = getRandomOpaqueColor();

        // Calculate arc parameters
        const params = calculateArcTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 30,
            maxRadius: 80,
            hasStroke: false,
            randomPosition: false
        });

        const { centerX, centerY, radius, startAngle, endAngle, gapSizeDeg } = params;

        // Draw filled arc using direct shape API
        ctx.fillStyle = fillColor;
        ctx.fillArc(centerX, centerY, radius, startAngle, endAngle);

        // Return check data
        return {
            logs: [`Arc at (${centerX}, ${centerY}) radius ${radius} gap ${gapSizeDeg.toFixed(1)}° color ${fillColor}`],
            checkData: {
                topY: Math.floor(centerY - radius),
                bottomY: Math.floor(centerY + radius),
                leftX: Math.floor(centerX - radius),
                rightX: Math.floor(centerX + radius)
            }
        };
    },
    'arcs',
    {
        extremes: { colorTolerance: 8, tolerance: 0.03 },
        totalUniqueColors: 2, // background + fill
        // Fast path is expected - no allowSlowPath flag
    },
    {
        title: 'Filled Arc - Opaque Color (Fast Path)',
        description: 'Tests fillArc with opaque color uses fast 32-bit writes'
    }
);
