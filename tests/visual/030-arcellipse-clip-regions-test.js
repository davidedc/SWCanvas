// Test: Arc/ellipse clip regions
// This file will be concatenated into the main visual test suite

registerVisualTest('clip-curved', {
    name: 'Curved Clipping',
    width: 400,
    height: 250,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Circle clip region
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 60, 40, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(20, 20, 120, 80);
        ctx.fillStyle = 'red';
        ctx.fillRect(50, 40, 60, 40);
        ctx.restore();
        
        // Center: Ellipse clip region
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 60, 40, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(130, 20, 140, 80);
        ctx.fillStyle = 'orange';
        ctx.fillRect(170, 45, 60, 30);
        ctx.restore();
        
        // Right: Arc clip region (partial circle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(340, 60, 35, 0, Math.PI);
        ctx.lineTo(305, 60);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(280, 20, 120, 80);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(320, 30, 40, 60);
        ctx.restore();
        
        // Bottom left: Rotated ellipse
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 180, 30, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(40, 140, 120, 80);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(80, 160, 40, 40);
        ctx.restore();
        
        // Bottom right: Complex arc path
        ctx.save();
        ctx.beginPath();
        ctx.arc(300, 180, 30, 0, Math.PI / 2);
        ctx.arc(350, 180, 30, Math.PI / 2, Math.PI);
        ctx.arc(350, 210, 30, Math.PI, 3 * Math.PI / 2);
        ctx.arc(300, 210, 30, 3 * Math.PI / 2, 0);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'lime';
        ctx.fillRect(250, 140, 130, 90);
        ctx.fillStyle = 'navy';
        ctx.fillRect(280, 170, 70, 30);
        ctx.restore();
    },
});