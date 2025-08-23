// Test: Destination-in minimal test - classic blue square with red circle
// Demonstrates destination-in only shows destination where source exists

registerVisualTest('destination-in-minimal', {
    name: 'Destination-in minimal - blue square then red circle with destination-in',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply destination-in composite operation
        ctx.globalCompositeOperation = 'destination-in';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Blue square appears only where red circle overlaps it
        // - Red circle disappears entirely (acts as mask for blue)
        // - Blue square parts outside red circle disappear
    }
});