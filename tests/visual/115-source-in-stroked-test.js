// Test: Source-in stroked test - classic blue square with red circle and green strokes
// Demonstrates source-in only shows source where destination exists, with green strokes

registerVisualTest('source-in-stroked', {
    name: 'Source-in stroked - blue square + red circle with green strokes and source-in',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply source-in composite operation
        ctx.globalCompositeOperation = 'source-in';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Red circle with green stroke appears only where it overlaps the blue square
        // - Blue square disappears entirely (replaced by red in overlap)
        // - Red circle parts outside blue square disappear, including green stroke
    }
});