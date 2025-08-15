// Test 55: drawImage with alpha and blending
// This file will be concatenated into the main visual test suite

// Test 55: drawImage with alpha and blending
registerVisualTest('drawimage-alpha-blending', {
    name: 'drawImage with alpha and blending',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // Colored background
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create alpha gradient image compatible with both canvas types
        const alphaImage = createCompatibleImage(40, 40, 'alpha', ctx);
        
        // Draw with full alpha
        ctx.drawImage(alphaImage, 20, 20);
        
        // Draw with global alpha
        ctx.globalAlpha = 0.5;
        ctx.drawImage(alphaImage, 80, 20);
        ctx.globalAlpha = 1.0;
        
        // Draw overlapping for blending test
        const solidImage = createCompatibleImage(30, 30, 'checkerboard', ctx);
        ctx.drawImage(solidImage, 120, 50);
        ctx.drawImage(alphaImage, 130, 60);
    },
});