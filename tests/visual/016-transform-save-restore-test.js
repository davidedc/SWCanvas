// Test 16: Transform state save/restore
// This file will be concatenated into the main visual test suite

// Test 16: Transform state save/restore
registerVisualTest('transform-state-save-restore', {
    name: 'Transform with save/restore stack',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Initial transform
        ctx.translate(30, 30);
        ctx.scale(1.2, 1.2);
        
        // Draw red square with initial transform
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 20, 20);
        
        // Save state, apply additional transform
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.translate(40, 0);
        
        // Draw blue square with combined transforms
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 15, 15);
        
        // Restore to saved state, draw green square
        ctx.restore();
        ctx.translate(0, 40);
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, 18, 18);
    },
});