// Test: xor Composite Operation
// Visual test of the xor composite operation

registerVisualTest('composite-xor', {
    name: 'Composite Operation: xor',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear to transparent background
        ctx.clearRect(0, 0, 300, 200);
        
        // Title indicator
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 80, 15);
        
        // Draw red circle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blue square with xor (both shapes visible except overlap)
        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(120, 80, 60, 40);
        
        // Expected result: Both red circle and blue square visible,
        // but overlap area should be transparent (cut out)
    }
});