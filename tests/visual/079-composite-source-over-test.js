// Test: source-over Composite Operation
// Visual test of the source-over composite operation (default behavior)

registerVisualTest('composite-source-over', {
    name: 'Composite Operation: source-over (default)',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear to transparent background
        ctx.clearRect(0, 0, 300, 200);
        
        // Title indicator
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 100, 15);
        
        // Draw red circle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blue square with source-over (should appear on top)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(120, 80, 60, 40);
        
        // Expected result: Blue square appears on top of red circle
        // Overlap area should be blue
    }
});