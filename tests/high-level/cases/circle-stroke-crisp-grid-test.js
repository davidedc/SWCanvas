/**
 * Test: Single 1px Stroked Circle (Crisp, Centered at Grid)
 *
 * Tests crisp rendering of a 1px stroked circle centered at a grid crossing.
 * Grid center = integer coordinates (Math.floor(canvas/2))
 * With odd strokeWidth (1px), diameter must be ODD for crisp rendering.
 */

registerHighLevelTest(
    'circle-stroke-1px-crisp-grid',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Grid-aligned center (integer coordinates)
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        // Random base diameter (20-149px spans S, M, L sizes)
        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust diameter for crisp 1px stroke at grid center
        const adjusted = adjustDimensionsForCrispStrokeRendering(
            baseDiameter, baseDiameter, 1, { x: centerX, y: centerY }
        );
        const finalDiameter = adjusted.width;
        const radius = finalDiameter / 2;

        // Draw 1px stroked circle (no fill)
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        return {
            logs: [`Stroked circle: center=(${centerX},${centerY}), diameter=${finalDiameter}, radius=${radius}`],
            checkData: {
                // Bounds formula for grid-centered circle
                leftX: centerX - radius - 0.5,
                rightX: centerX + radius - 0.5,
                topY: centerY - radius - 0.5,
                bottomY: centerY + radius - 0.5
            }
        };
    },
    'circles',
    {
        extremes: { colorTolerance: 8 },  // Handle faint HTML5 Canvas overspill (255,254,254 vs 255,255,255)
        totalUniqueColors: 2              // White background + red stroke
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Grid)',
        description: 'Tests crisp rendering of a 1px red stroked circle centered at a grid crossing.'
    }
);
