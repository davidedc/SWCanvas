// Test 18: Transform matrix order dependency (A*B ≠ B*A)
// This file will be concatenated into the main visual test suite

// Test 18: Transform matrix order dependency (A*B ≠ B*A)
registerVisualTest('transform-matrix-order', {
    name: 'Transform order dependency (A*B ≠ B*A)',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Square 1: Translate(40,40) THEN Scale(2,2) - Red
        ctx.save();
        ctx.translate(40, 40);
        ctx.scale(2, 2);
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 15, 15);
        ctx.restore();
        
        // Square 2: Scale(2,2) THEN Translate(60,60) - Blue  
        ctx.save();
        ctx.scale(2, 2);
        ctx.translate(60, 60);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 15, 15);
        ctx.restore();
    },
});