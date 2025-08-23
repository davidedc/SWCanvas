// Test: Destination-out stroked test - classic blue square with red circle and green strokes
// Demonstrates destination-out removes destination where source exists, with green strokes

registerVisualTest('destination-out-stroked', {
    name: 'Destination-out stroked - blue square + red circle with green strokes and destination-out',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply destination-out composite operation
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Blue square with green stroke appears only where red circle doesn't overlap
        // - Red circle disappears entirely (acts as eraser)
        // - Blue square parts overlapping red circle disappear, creating "hole"
    }
});