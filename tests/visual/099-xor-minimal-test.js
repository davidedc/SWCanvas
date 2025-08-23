// Test: XOR minimal test - classic blue square with red circle
// Demonstrates XOR creates "bite" effect where shapes overlap

registerVisualTest('xor-minimal', {
    name: 'XOR minimal - blue square then red circle with xor',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply xor composite operation
        ctx.globalCompositeOperation = 'xor';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Blue square appears where red circle doesn't overlap
        // - Red circle appears where blue square doesn't exist
        // - Overlap area becomes transparent ("bite" effect)
    }
});