// Test 49: drawImage with transforms
// This file will be concatenated into the main visual test suite

// Test 49: drawImage with transforms
registerVisualTest('drawimage-transforms', {
    name: 'drawImage with transforms',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        // Create compatible test image for both canvas types
        const testImage = createTestImage(20, 20, 'checkerboard', ctx);
        
        // Original
        ctx.drawImage(testImage, 10, 10);
        
        // Translated
        ctx.save();
        ctx.translate(50, 50);
        ctx.drawImage(testImage, 0, 0);
        ctx.restore();
        
        // Scaled  
        ctx.save();
        ctx.translate(100, 100);
        ctx.scale(1.5, 1.5);
        ctx.drawImage(testImage, 0, 0);
        ctx.restore();
        
        // Rotated
        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(Math.PI / 4);
        ctx.drawImage(testImage, -10, -10);
        ctx.restore();
    },
});