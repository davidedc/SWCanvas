// Test: Composite Operation: source-in - source visible only where destination exists
// This test demonstrates the source-in operation with global compositing improvements

registerVisualTest('composite-source-in', {
    name: 'Composite Operation: source-in - masking effect',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw cyan star as destination
        ctx.fillStyle = '#00cccc';
        ctx.beginPath();
        // Draw 5-point star
        const cx = 100, cy = 100, r1 = 35, r2 = 15;
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const r = i % 2 === 0 ? r1 : r2;
            const x = cx + r * Math.cos(angle - Math.PI / 2);
            const y = cy + r * Math.sin(angle - Math.PI / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Switch to source-in and draw red rectangle
        // This should show red only where cyan star exists
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(70, 80, 60, 40);
        
        // Add labels for clarity
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        
        // Show a comparison: draw the same shapes with source-over
        ctx.fillStyle = '#00cccc';
        ctx.beginPath();
        // Draw 5-point star
        const cx2 = 250, cy2 = 100;
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const r = i % 2 === 0 ? r1 : r2;
            const x = cx2 + r * Math.cos(angle - Math.PI / 2);
            const y = cy2 + r * Math.sin(angle - Math.PI / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(220, 80, 60, 40);
        
        ctx.fillStyle = 'black';
    }
});