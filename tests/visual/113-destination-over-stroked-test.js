// Test: Destination-over stroked test - classic blue square with red circle and green strokes
// Demonstrates destination-over draws source behind destination, with green strokes

registerVisualTest('destination-over-stroked', {
    name: 'Destination-over stroked - blue square + red circle with green strokes and destination-over',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply destination-over composite operation
        ctx.globalCompositeOperation = 'destination-over';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Blue square with green stroke remains on top in overlap area
        // - Red circle with green stroke appears behind blue square where they overlap
        // - Red circle with green stroke shows in areas where there's no blue square
    }
});