// Test 49: RGB to RGBA conversion
// This file will be concatenated into the main visual test suite

// Test 49: RGB to RGBA conversion
registerVisualTest('drawimage-rgb-conversion', {
    name: 'RGB to RGBA auto-conversion',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create RGB test image compatible with both canvas types
        const rgbImage = createCompatibleRGBImage(30, 30, ctx);
        
        // Draw RGB image - should auto-convert to RGBA
        ctx.drawImage(rgbImage, 20, 20);
        
        // Create RGBA test image for comparison
        const rgbaImage = createCompatibleImage(30, 30, 'border', ctx);
        ctx.drawImage(rgbaImage, 70, 20);
    },
});