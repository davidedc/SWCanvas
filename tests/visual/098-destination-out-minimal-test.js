// Test: Destination-out minimal test - classic blue square with red circle
// Demonstrates destination-out shows destination only where source doesn't exist

registerVisualTest('destination-out-minimal', {
    name: 'Destination-out minimal - blue square then red circle with destination-out',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply destination-out composite operation
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Blue square appears only where red circle doesn't overlap it
        // - Red circle disappears entirely (acts as eraser)
        // - Overlap area becomes transparent (red cuts hole in blue)
    }
});