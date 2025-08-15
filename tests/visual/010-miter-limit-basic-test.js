// Test 10: Miter Limit Basic Functionality
// This file will be concatenated into the main visual test suite

// Test 10: Miter Limit Basic Functionality
registerVisualTest('miter-limits-basic', {
    name: 'Miter limit property and basic functionality',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'miter';
        
        // Test different miter limit values
        const miterLimits = [1.0, 2.0, 5.0, 10.0];
        
        for (let i = 0; i < miterLimits.length; i++) {
            const limit = miterLimits[i];
            ctx.miterLimit = limit;
            
            // Draw a V shape at different positions
            const x = 20 + i * 20;
            ctx.beginPath();
            ctx.moveTo(x - 5, 60);
            ctx.lineTo(x, 40);
            ctx.lineTo(x + 5, 60);
            ctx.stroke();
        }
    },
});