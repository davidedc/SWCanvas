// Test 25: fill-arcs-ellipses - Arc and ellipse filling
// This file will be concatenated into the main visual test suite

// Test 25: fill-arcs-ellipses - Arc and ellipse filling
registerVisualTest('fill-arcs-ellipses', {
    name: 'Arc and ellipse filling',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Full circle using arc
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(75, 75, 30, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Half circle (semicircle)
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.arc(180, 75, 25, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Quarter circle (pie slice)
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.moveTo(250, 75);
        ctx.arc(250, 75, 30, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        
        // Pac-Man like shape (3/4 circle)
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        ctx.moveTo(75, 150);
        ctx.arc(75, 150, 30, Math.PI / 4, 7 * Math.PI / 4);
        ctx.closePath();
        ctx.fill();
        
        // Crescent moon (overlapping circles)
        ctx.beginPath();
        ctx.fillStyle = 'lightblue';
        ctx.arc(180, 150, 25, 0, 2 * Math.PI);
        ctx.arc(190, 150, 20, 0, 2 * Math.PI);
        ctx.fill('evenodd');
    },
});