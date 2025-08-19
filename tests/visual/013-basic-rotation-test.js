// Test: Basic Rotation
// This file will be concatenated into the main visual test suite

registerVisualTest('transform-basic-rotate', {
    name: 'Basic rotation operations',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Original red square
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, 25, 25);
        
        // Rotate 45 degrees and draw blue square
        ctx.translate(100, 40);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'blue';
        ctx.fillRect(-12, -12, 25, 25);
        
        // Reset, rotate 90 degrees and draw green square
        ctx.resetTransform();
        ctx.translate(60, 100);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = 'green';
        ctx.fillRect(-12, -12, 25, 25);
    },
});