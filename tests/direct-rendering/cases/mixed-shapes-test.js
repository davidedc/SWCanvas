/**
 * Test: Mixed Shapes Scene (Direct Rendering)
 *
 * Tests a scene with multiple shapes using opaque colors.
 * All fillCircle calls should use direct rendering.
 */

registerDirectRenderingTest(
    'mixed-shapes-opaque',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Draw multiple shapes with opaque colors
        const shapes = [];

        // Circles in corners
        const cornerRadius = 30;
        const corners = [
            { x: 60, y: 60 },
            { x: canvasWidth - 60, y: 60 },
            { x: 60, y: canvasHeight - 60 },
            { x: canvasWidth - 60, y: canvasHeight - 60 }
        ];

        for (let i = 0; i < corners.length; i++) {
            ctx.fillStyle = getRandomOpaqueColor();
            ctx.fillCircle(corners[i].x, corners[i].y, cornerRadius);
            shapes.push({
                type: 'circle',
                x: corners[i].x,
                y: corners[i].y,
                radius: cornerRadius
            });
        }

        // Center circle
        const centerRadius = 50;
        ctx.fillStyle = getRandomOpaqueColor();
        ctx.fillCircle(canvasWidth / 2, canvasHeight / 2, centerRadius);
        shapes.push({
            type: 'circle',
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            radius: centerRadius
        });

        // Calculate bounds
        let topY = canvasHeight, bottomY = 0, leftX = canvasWidth, rightX = 0;
        for (const s of shapes) {
            if (s.type === 'circle') {
                topY = Math.min(topY, Math.floor(s.y - s.radius));
                bottomY = Math.max(bottomY, Math.floor(s.y + s.radius));
                leftX = Math.min(leftX, Math.floor(s.x - s.radius));
                rightX = Math.max(rightX, Math.floor(s.x + s.radius));
            }
        }

        return {
            logs: [`Drew ${shapes.length} shapes`],
            checkData: { topY, bottomY, leftX, rightX }
        };
    },
    'scene',
    {
        extremes: { tolerance: 0.05 },
        // All shapes use opaque colors - direct rendering expected
    },
    {
        title: 'Mixed Shapes Scene - Opaque Colors (Direct Rendering)',
        description: 'Tests scene with multiple shapes uses direct rendering'
    }
);
