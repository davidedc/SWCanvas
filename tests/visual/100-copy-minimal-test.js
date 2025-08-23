// Test: Copy minimal test - classic blue square with red circle
// Demonstrates copy replaces entire canvas with source

registerVisualTest('copy-minimal', {
    name: 'Copy minimal - blue square then red circle with copy',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply copy composite operation
        ctx.globalCompositeOperation = 'copy';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Only red circle appears
        // - Blue square disappears entirely (replaced by transparent)
        // - Canvas becomes transparent everywhere except red circle
    }
});