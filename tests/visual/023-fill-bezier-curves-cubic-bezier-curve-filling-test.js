// Test 23: fill-bezier-curves - Cubic bezier curve filling
// This file will be concatenated into the main visual test suite

// Test 23: fill-bezier-curves - Cubic bezier curve filling
registerVisualTest('fill-bezier-curves', {
    name: 'Cubic bezier curve filling',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Simple curved shape with bezier curves
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(50, 50);
        ctx.bezierCurveTo(50, 20, 100, 20, 100, 50);
        ctx.bezierCurveTo(130, 50, 130, 100, 100, 100);
        ctx.bezierCurveTo(100, 130, 50, 130, 50, 100);
        ctx.bezierCurveTo(20, 100, 20, 50, 50, 50);
        ctx.closePath();
        ctx.fill();
        
        // Heart-like shape using bezier curves
        ctx.beginPath();
        ctx.fillStyle = 'magenta';
        ctx.moveTo(200, 80);
        // Left side of heart
        ctx.bezierCurveTo(200, 60, 180, 50, 170, 60);
        ctx.bezierCurveTo(160, 70, 160, 85, 200, 120);
        // Right side of heart
        ctx.bezierCurveTo(240, 85, 240, 70, 230, 60);
        ctx.bezierCurveTo(220, 50, 200, 60, 200, 80);
        ctx.closePath();
        ctx.fill();
        
        // Complex curved path with multiple bezier segments
        ctx.beginPath();
        ctx.fillStyle = 'lightblue';
        ctx.moveTo(50, 160);
        ctx.bezierCurveTo(80, 140, 120, 140, 150, 160);
        ctx.bezierCurveTo(150, 180, 120, 200, 100, 180);
        ctx.bezierCurveTo(80, 200, 50, 180, 50, 160);
        ctx.closePath();
        ctx.fill();
        
        // Leaf-like shape
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.moveTo(220, 160);
        ctx.bezierCurveTo(240, 140, 260, 140, 270, 160);
        ctx.bezierCurveTo(270, 170, 260, 180, 250, 185);
        ctx.bezierCurveTo(240, 190, 230, 185, 220, 180);
        ctx.bezierCurveTo(210, 175, 210, 165, 220, 160);
        ctx.closePath();
        ctx.fill();
    },
});