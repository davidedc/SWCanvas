// Test: Alpha Blending Test
// This file will be concatenated into the main visual test suite

registerVisualTest('alpha-test', {
    name: 'Alpha blending test - semi-transparent rectangles',
    width: 200, height: 150,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Red rectangle (opaque)
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, 80, 60);
        
        // Blue rectangle (opaque) with overlap
        ctx.fillStyle = 'blue';
        ctx.fillRect(60, 60, 80, 60);
        
        // Semi-transparent green rectangle
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'green';
        ctx.fillRect(40, 40, 80, 60);
        ctx.globalAlpha = 1.0;
    }
});