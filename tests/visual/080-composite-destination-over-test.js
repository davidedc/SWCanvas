// Test: destination-over Composite Operation
// Visual test of the destination-over composite operation

registerVisualTest('composite-destination-over', {
    name: 'Composite Operation: destination-over',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear to transparent background
        ctx.clearRect(0, 0, 300, 200);
        
        // Title indicator
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 120, 15);
        
        // Draw red circle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blue square with destination-over (should appear behind red circle)
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(120, 80, 60, 40);
        
        // Expected result: Blue square appears behind red circle
        // Red circle should be visible on top where they overlap
    }
});