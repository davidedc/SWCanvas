// Test 19: fill-concave-polygons - Star shapes and L-shapes
// This file will be concatenated into the main visual test suite

// Test 19: fill-concave-polygons - Star shapes and L-shapes
registerVisualTest('fill-concave-polygons', {
    name: 'Concave polygon filling (star and L-shape)',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw a 5-pointed star (concave polygon)
        ctx.beginPath();
        ctx.fillStyle = 'red';
        const centerX = 75, centerY = 75;
        const outerRadius = 40, innerRadius = 16;
        
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw an L-shape (concave polygon)
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.moveTo(160, 40);
        ctx.lineTo(220, 40);
        ctx.lineTo(220, 70);
        ctx.lineTo(190, 70);
        ctx.lineTo(190, 120);
        ctx.lineTo(160, 120);
        ctx.closePath();
        ctx.fill();
        
        // Draw a more complex concave shape (arrow-like)
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.moveTo(50, 140);
        ctx.lineTo(90, 140);
        ctx.lineTo(90, 130);
        ctx.lineTo(110, 150);
        ctx.lineTo(90, 170);
        ctx.lineTo(90, 160);
        ctx.lineTo(50, 160);
        ctx.closePath();
        ctx.fill();
    },
});