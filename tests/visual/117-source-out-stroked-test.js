// Test: Source-out stroked test - classic blue square with red circle and green strokes
// Demonstrates source-out shows source only where destination doesn't exist, with green strokes

registerVisualTest('source-out-stroked', {
    name: 'Source-out stroked - blue square + red circle with green strokes and source-out',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply source-out composite operation
        ctx.globalCompositeOperation = 'source-out';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Red circle with green stroke appears only where it doesn't overlap blue square
        // - Blue square disappears entirely
        // - Red circle parts overlapping blue square disappear, including green stroke
    }
});