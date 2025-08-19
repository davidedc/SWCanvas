// Test: Conic Gradient Basic Test
// This file will be concatenated into the main visual test suite

registerVisualTest('conic-gradient-basic', {
    name: 'Conic gradient - basic sweep gradient',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create conic gradient (sweep from top, clockwise)
        const grad = ctx.createConicGradient(-Math.PI/2, 100, 75);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.25, 'yellow');
        grad.addColorStop(0.5, 'green');
        grad.addColorStop(0.75, 'blue');
        grad.addColorStop(1, 'red');
        
        // Fill circle with conic gradient
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(100, 75, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Add border to show shape
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});