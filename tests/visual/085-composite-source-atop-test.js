// Test: Composite Operation: source-atop - source drawn only where destination exists
// This test demonstrates the source-atop operation (already worked but now optimized)

registerVisualTest('composite-source-atop', {
    name: 'Composite Operation: source-atop - masking effect',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw purple oval as destination
        ctx.fillStyle = '#9966cc';
        ctx.save();
        ctx.translate(100, 100);
        ctx.scale(2, 1);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Switch to source-atop and draw orange rectangle
        // This should draw orange only where purple exists
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#ff9933';
        ctx.fillRect(60, 70, 80, 60);
        
        // Add labels for clarity
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        
        // Show a comparison: draw the same shapes with source-over
        ctx.fillStyle = '#9966cc';
        ctx.save();
        ctx.translate(250, 100);
        ctx.scale(2, 1);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff9933';
        ctx.fillRect(210, 70, 80, 60);
        
        ctx.fillStyle = 'black';
    }
});