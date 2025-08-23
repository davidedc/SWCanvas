// Test: Source-over stroked test - classic blue square with red circle and green strokes
// Demonstrates source-over (default) draws source over destination, with green strokes

registerVisualTest('source-over-stroked', {
    name: 'Source-over stroked - blue square + red circle with green strokes and source-over',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply source-over composite operation (default)
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Red circle with green stroke appears on top of blue square in overlap area
        // - Blue square with green stroke remains visible where red doesn't overlap
        // - Red circle with green stroke extends beyond the blue square
    }
});