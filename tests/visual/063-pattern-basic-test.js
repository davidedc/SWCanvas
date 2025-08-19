// Test: Pattern Basic Test
// This file will be concatenated into the main visual test suite

registerVisualTest('pattern-basic', {
    name: 'Pattern - basic repeating pattern',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create a test image with checkerboard pattern
        const tileImage = createTestImage(16, 16, 'checkerboard', ctx);
        
        // Create pattern from test image
        const pattern = ctx.createPattern(tileImage, 'repeat');
        
        // Fill rectangle with pattern
        ctx.fillStyle = pattern;
        ctx.fillRect(20, 20, 160, 110);
        
        // Add border
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 160, 110);
    }
});