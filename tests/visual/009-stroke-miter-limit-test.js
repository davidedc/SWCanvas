// Test 9: Stroke Miter Limit (Original Test)
// This file will be concatenated into the main visual test suite

// Test 9: Stroke Miter Limit (Original Test)
registerVisualTest('stroke-miter-limit', {
    name: 'Miter limit test',
    width: 200, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 100);
        
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'miter';
        
        // Sharp angle with default miter limit (should create miter)
        ctx.miterLimit = 10;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(50, 50);
        ctx.lineTo(60, 20);
        ctx.stroke();
        
        // Very sharp angle with low miter limit (should fallback to bevel)
        ctx.miterLimit = 2;
        ctx.beginPath();
        ctx.moveTo(140, 20);
        ctx.lineTo(150, 50);
        ctx.lineTo(160, 20);
        ctx.stroke();
    },
});