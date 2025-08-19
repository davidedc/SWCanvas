// Test: Radial Gradient Basic Test
// This file will be concatenated into the main visual test suite

registerVisualTest('radial-gradient-basic', {
    name: 'Radial gradient - basic circular gradient',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create radial gradient
        const grad = ctx.createRadialGradient(100, 75, 10, 100, 75, 60);
        grad.addColorStop(0, 'yellow');
        grad.addColorStop(0.7, 'orange');
        grad.addColorStop(1, 'red');
        
        // Fill circle with gradient
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(100, 75, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});