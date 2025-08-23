// Test: Destination-in stroked test - classic blue square with red circle and green strokes
// Demonstrates destination-in only shows destination where source exists, with green strokes

registerVisualTest('destination-in-stroked', {
    name: 'Destination-in stroked - blue square + red circle with green strokes and destination-in',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply destination-in composite operation
        ctx.globalCompositeOperation = 'destination-in';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Blue square with green stroke appears only where red circle overlaps
        // - Red circle disappears entirely
        // - Blue square parts outside red circle disappear, including green stroke
    }
});