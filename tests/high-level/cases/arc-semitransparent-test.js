/**
 * Test: Filled Arc with Semi-transparent Color
 *
 * Tests that fillArc works correctly with semi-transparent colors.
 * Arc extends > 270 degrees with gap < 90 degrees within a single quadrant.
 */

registerHighLevelTest(
    'arc-semitransparent',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Use semi-transparent fill color (visible mode ensures color is distinguishable from white)
        const fillColor = getRandomColor('semitransparent-visible');

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
        extremes: { colorTolerance: 36, tolerance: 0.03, skipOnIterations: [115, 179, 189, 204, 362, 395, 445, 484, 511, 513, 542, 595, 597, 635, 636, 750, 811, 821] },
        totalUniqueColors: 2, // background + fill (blended)
        allowPathBasedRendering: true // Semi-transparent may use path-based rendering
    },
    {
        title: 'Filled Arc - Semi-transparent Color',
        description: 'Tests fillArc with semi-transparent color rendering'
    }
);
