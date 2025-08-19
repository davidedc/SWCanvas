// Test: drawImage scaling
// This file will be concatenated into the main visual test suite

registerVisualTest('drawimage-scaling', {
    name: 'drawImage with scaling',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create gradient test image compatible with both canvas types
        const testImage = createTestImage(10, 10, 'gradient', ctx);
        
        // Draw at original size
        ctx.drawImage(testImage, 10, 10);
        
        // Draw scaled up 2x
        ctx.drawImage(testImage, 30, 10, 20, 20);
        
        // Draw scaled up 3x
        ctx.drawImage(testImage, 60, 10, 30, 30);
        
        // Draw scaled down
        ctx.drawImage(testImage, 100, 10, 5, 5);
        
        // Draw with non-uniform scaling
        ctx.drawImage(testImage, 10, 50, 40, 10);
    },
});