// Test: Source-out minimal test - classic blue square with red circle
// Demonstrates source-out shows source only where destination doesn't exist

registerVisualTest('source-out-minimal', {
    name: 'Source-out minimal - blue square then red circle with source-out',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply source-out composite operation
        ctx.globalCompositeOperation = 'source-out';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Red circle appears only where it doesn't overlap blue square
        // - Blue square disappears entirely
        // - Overlap area becomes transparent (red punches hole)
    }
});