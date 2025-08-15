// Test 15: resetTransform functionality
// This file will be concatenated into the main visual test suite

// Test 15: resetTransform functionality
registerVisualTest('transform-resetTransform', {
    name: 'resetTransform functionality',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Apply complex transform
        ctx.translate(50, 30);
        ctx.rotate(Math.PI / 6);
        ctx.scale(1.5, 1.5);
        
        // Draw transformed red square
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 20, 20);
        
        // Reset transform and draw blue square at origin
        ctx.resetTransform();
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 80, 20, 20);
        
        // Apply new transform after reset
        ctx.translate(120, 50);
        ctx.scale(0.8, 0.8);
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, 25, 25);
    },
});