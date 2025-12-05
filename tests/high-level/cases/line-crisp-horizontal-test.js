/**
 * Test: Crisp Horizontal 1px Line with Pixel-Aligned Positioning
 *
 * Tests that 1px horizontal lines render crisply when positioned
 * between pixel rows (+ 0.5 offset technique).
 */

registerHighLevelTest(
    'line-crisp-horizontal-1px',
    function drawTest(ctx, iterationNumber, instances) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Crisp positioning: center Y between pixels (+ 0.5)
        // This ensures the 1px stroke fills exactly one pixel row
        const centerY = Math.floor(height / 2) + 0.5;

        // Random line length (spans S, M, L sizes: 20-149px)
        const lineLength = Math.floor(20 + SeededRandom.getRandom() * 130);
        const centerX = Math.floor(width / 2);
        const startX = Math.floor(centerX - lineLength / 2);
        const endX = startX + lineLength;

        // Randomly swap start/end for variety (tests both directions)
        let x1 = startX, x2 = endX;
        if (SeededRandom.getRandom() < 0.5) {
            [x1, x2] = [x2, x1];
        }

        // Draw 1px opaque red horizontal line
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.lineWidth = 1;
        ctx.strokeLine(x1, centerY, x2, centerY);

        // For crisp horizontal lines, the stroke should occupy exactly one pixel row
        const pixelY = Math.floor(centerY);
        return {
            logs: [`1px Red line from (${x1}, ${centerY}) to (${x2}, ${centerY}), length=${lineLength}px`],
            checkData: {
                topY: pixelY,
                bottomY: pixelY,
                leftX: Math.min(x1, x2),
                rightX: Math.max(x1, x2) - 1
            }
        };
    },
    'lines',
    {
        extremes: true,
        // Fast path expected for 1px opaque line
    },
    {
        title: 'Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Horizontal',
        description: 'Tests crisp rendering of horizontal 1px line centered between pixels'
    }
);
