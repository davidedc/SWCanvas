// Test: Basic Translation
// This file will be concatenated into the main visual test suite

registerVisualTest('transform-basic-translate', {
    name: 'Basic translation operations',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Red square at origin
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 30, 30);
        
        // Translate and draw blue square
        ctx.translate(50, 20);
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 10, 30, 30);
        
        // Translate again and draw green square
        ctx.translate(60, 30);
        ctx.fillStyle = 'green';
        ctx.fillRect(10, 10, 30, 30);
    },
});