// Test: Stroke Joins
// This file will be concatenated into the main visual test suite

registerVisualTest('stroke-joins', {
    name: 'Stroke joins - miter, bevel, round',
    width: 300, height: 100,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 100);
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 8;
        
        // Miter join
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(20, 20);
        ctx.lineTo(50, 50);
        ctx.lineTo(80, 20);
        ctx.stroke();
        
        // Bevel join
        ctx.lineJoin = 'bevel';
        ctx.beginPath();
        ctx.moveTo(120, 20);
        ctx.lineTo(150, 50);
        ctx.lineTo(180, 20);
        ctx.stroke();
        
        // Round join
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(220, 20);
        ctx.lineTo(250, 50);
        ctx.lineTo(280, 20);
        ctx.stroke();
    }
});