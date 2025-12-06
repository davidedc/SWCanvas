/**
 * Test: Single 1px Stroked Circle (Crisp, Centered at Pixel)
 *
 * Tests crisp rendering of a 1px stroked circle centered at a pixel center.
 * Pixel center = *.5 coordinates (Math.floor(canvas/2) + 0.5)
 * With odd strokeWidth (1px), diameter must be EVEN for crisp rendering at pixel center.
 */

registerHighLevelTest(
    'circle-stroke-1px-crisp-pixel',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Pixel-aligned center (*.5 coordinates)
        const centerX = Math.floor(canvasWidth / 2) + 0.5;
        const centerY = Math.floor(canvasHeight / 2) + 0.5;

        // Random base diameter (20-149px spans S, M, L sizes)
        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust diameter for crisp 1px stroke at pixel center
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
                // Bounds formula for pixel-centered circle
                leftX: centerX - radius - 0.5,
                rightX: centerX + radius - 0.5,
                topY: centerY - radius - 0.5,
                bottomY: centerY + radius - 0.5
            }
        };
    },
    'circles',
    {
        extremes: { colorTolerance: 8 },  // Handle faint HTML5 Canvas overspill
        totalUniqueColors: 2              // White background + red stroke
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Pixel)',
        description: 'Tests crisp rendering of a 1px red stroked circle centered at a pixel center.'
    }
);
