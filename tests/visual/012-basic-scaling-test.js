// Test 12: Basic Scaling
// This file will be concatenated into the main visual test suite

// Test 12: Basic Scaling
registerVisualTest('transform-basic-scale', {
    name: 'Basic scaling operations',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Original size red square
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 20, 20);
        
        // Scale 2x and draw blue square
        ctx.translate(60, 10);
        ctx.scale(2, 2);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 20, 20);
        
        // Reset, scale 0.5x and draw green square
        ctx.resetTransform();
        ctx.translate(10, 60);
        ctx.scale(0.5, 0.5);
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, 40, 40);
    },
});