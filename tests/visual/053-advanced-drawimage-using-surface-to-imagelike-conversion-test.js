// Test: Advanced drawImage using surface-to-ImageLike conversion
// This file will be concatenated into the main visual test suite

registerVisualTest('drawimage-surface-conversion', {
    name: 'drawImage using surface-to-ImageLike conversion',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create source image using pattern system compatible with both canvas types
        const sourceImage = createTestImage(40, 40, 'overlapping-squares', ctx);
        
        // Draw the source image at different positions and scales
        ctx.drawImage(sourceImage, 20, 20);           // Original size
        ctx.drawImage(sourceImage, 80, 20, 20, 20);   // Scaled down
        ctx.drawImage(sourceImage, 120, 20, 60, 60);  // Scaled up
    },
});