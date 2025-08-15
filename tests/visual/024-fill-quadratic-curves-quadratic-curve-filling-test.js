// Test 24: fill-quadratic-curves - Quadratic curve filling
// This file will be concatenated into the main visual test suite

// Test 24: fill-quadratic-curves - Quadratic curve filling
registerVisualTest('fill-quadratic-curves', {
    name: 'Quadratic curve filling',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Simple curved shape with quadratic curves
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(50, 80);
        ctx.quadraticCurveTo(75, 40, 100, 80);
        ctx.quadraticCurveTo(100, 120, 50, 120);
        ctx.quadraticCurveTo(25, 100, 50, 80);
        ctx.closePath();
        ctx.fill();
        
        // Petal-like shapes
        ctx.beginPath();
        ctx.fillStyle = 'magenta';
        ctx.moveTo(150, 60);
        ctx.quadraticCurveTo(180, 30, 210, 60);
        ctx.quadraticCurveTo(180, 90, 150, 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(180, 80);
        ctx.quadraticCurveTo(210, 50, 240, 80);
        ctx.quadraticCurveTo(210, 110, 180, 80);
        ctx.closePath();
        ctx.fill();
        
        // Wave-like shape
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.moveTo(30, 150);
        ctx.quadraticCurveTo(60, 130, 90, 150);
        ctx.quadraticCurveTo(120, 170, 150, 150);
        ctx.quadraticCurveTo(120, 180, 90, 170);
        ctx.quadraticCurveTo(60, 180, 30, 160);
        ctx.closePath();
        ctx.fill();
    },
});