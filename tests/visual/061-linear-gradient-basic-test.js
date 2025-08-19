// Test: Linear Gradient Basic Test
// This file will be concatenated into the main visual test suite

registerVisualTest('linear-gradient-basic', {
    name: 'Linear gradient - basic horizontal gradient',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create horizontal linear gradient
        const grad = ctx.createLinearGradient(20, 0, 180, 0);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.5, 'yellow');
        grad.addColorStop(1, 'blue');
        
        // Fill rectangle with gradient
        ctx.fillStyle = grad;
        ctx.fillRect(20, 30, 160, 80);
        
        // Add border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 30, 160, 80);
    }
});