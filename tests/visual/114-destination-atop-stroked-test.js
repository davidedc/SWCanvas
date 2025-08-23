// Test: Destination-atop stroked test - classic blue square with red circle and green strokes
// Demonstrates destination-atop only shows destination where source exists, with green strokes

registerVisualTest('destination-atop-stroked', {
    name: 'Destination-atop stroked - blue square + red circle with green strokes and destination-atop',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply destination-atop composite operation
        ctx.globalCompositeOperation = 'destination-atop';
        
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
        // - Red circle with green stroke fills the rest of its area
        // - Blue square parts outside red circle disappear
    }
});