// Test: ellipse-basic - Basic ellipse functionality
// This file will be concatenated into the main visual test suite

registerVisualTest('ellipse-basic', {
    name: 'Basic ellipse functionality',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Full ellipse (horizontal)
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.ellipse(100, 75, 60, 30, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Full ellipse (vertical)
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.ellipse(300, 75, 30, 60, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Rotated ellipse (45 degrees)
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.ellipse(100, 180, 50, 25, Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Half ellipse (semicircle-like)
        ctx.beginPath();
        ctx.fillStyle = 'orange';
        ctx.ellipse(300, 180, 40, 20, 0, 0, Math.PI);
        ctx.fill();
        
        // Ellipse arc (quarter ellipse)
        ctx.beginPath();
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;
        ctx.ellipse(200, 150, 30, 50, Math.PI / 6, 0, Math.PI / 2);
        ctx.stroke();
        
        // Circle using ellipse (equal radii)
        ctx.beginPath();
        ctx.fillStyle = 'cyan';
        ctx.ellipse(200, 240, 25, 25, 0, 0, 2 * Math.PI);
        ctx.fill();
    },
});