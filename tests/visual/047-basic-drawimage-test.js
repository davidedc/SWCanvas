// Test 47: Basic drawImage
// This file will be concatenated into the main visual test suite

// Test 47: Basic drawImage
registerVisualTest('drawimage-basic', {
    name: 'Basic drawImage positioning',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create test image compatible with both canvas types
        const testImage = createCompatibleImage(20, 20, 'checkerboard', ctx);
        
        // Draw at different positions
        ctx.drawImage(testImage, 10, 10);        // Basic position
        ctx.drawImage(testImage, 50, 10);        // Right
        ctx.drawImage(testImage, 10, 50);        // Below
        ctx.drawImage(testImage, 50, 50);        // Diagonal
    },
});