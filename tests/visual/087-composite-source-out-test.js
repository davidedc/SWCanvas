// Test: Composite Operation: source-out - source visible only where destination doesn't exist
// This test demonstrates the source-out operation with global compositing improvements

registerVisualTest('composite-source-out', {
    name: 'Composite Operation: source-out - inverse masking',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw yellow hexagon as destination
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        const cx = 100, cy = 100, r = 30;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Switch to source-out and draw magenta circle
        // This should show magenta only where yellow hexagon doesn't exist
        ctx.globalCompositeOperation = 'source-out';
        ctx.fillStyle = '#ff00cc';
        ctx.beginPath();
        ctx.arc(100, 100, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Add labels for clarity
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        
        // Show a comparison: draw the same shapes with source-over
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        const cx2 = 250, cy2 = 100;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cx2 + r * Math.cos(angle);
            const y = cy2 + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff00cc';
        ctx.beginPath();
        ctx.arc(250, 100, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
    }
});