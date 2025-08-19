// Test: fill-mixed-paths - Linear + curve combinations
// This file will be concatenated into the main visual test suite

registerVisualTest('fill-mixed-paths', {
    name: 'Mixed linear and curve paths',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Shape mixing lines and curves
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(50, 50);
        ctx.lineTo(100, 40);
        ctx.quadraticCurveTo(120, 60, 100, 80);
        ctx.lineTo(80, 90);
        ctx.bezierCurveTo(60, 100, 40, 90, 30, 70);
        ctx.arc(50, 50, 20, Math.PI, 3 * Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        
        // House with curved roof
        ctx.beginPath();
        ctx.fillStyle = 'lightblue';
        ctx.moveTo(150, 120);
        ctx.lineTo(150, 80);
        ctx.quadraticCurveTo(175, 60, 200, 80);
        ctx.lineTo(200, 120);
        ctx.closePath();
        ctx.fill();
        
        // Flower-like shape
        ctx.beginPath();
        ctx.fillStyle = 'magenta';
        ctx.moveTo(250, 80);
        // Petal 1
        ctx.quadraticCurveTo(270, 60, 280, 80);
        ctx.lineTo(260, 90);
        // Petal 2  
        ctx.quadraticCurveTo(280, 100, 260, 120);
        ctx.lineTo(250, 100);
        // Petal 3
        ctx.quadraticCurveTo(230, 120, 220, 100);
        ctx.lineTo(240, 90);
        // Petal 4
        ctx.quadraticCurveTo(220, 80, 240, 60);
        ctx.closePath();
        ctx.fill();
        
        // Wave with straight segments
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.moveTo(30, 160);
        ctx.lineTo(60, 160);
        ctx.quadraticCurveTo(75, 140, 90, 160);
        ctx.lineTo(120, 160);
        ctx.quadraticCurveTo(135, 180, 150, 160);
        ctx.lineTo(180, 160);
        ctx.lineTo(180, 180);
        ctx.lineTo(30, 180);
        ctx.closePath();
        ctx.fill();
    },
});