// Test 65: Linear Gradient Strokes Test
// This file will be concatenated into the main visual test suite

registerVisualTest('linear-gradient-strokes', {
    name: 'Linear gradients applied to strokes - various shapes and styles',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Create linear gradient for strokes
        const grad = ctx.createLinearGradient(0, 0, 300, 0);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.5, 'yellow');
        grad.addColorStop(1, 'blue');
        
        ctx.strokeStyle = grad;
        
        // Test 1: Simple line with different line caps
        ctx.lineWidth = 8;
        
        // Butt cap
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(120, 30);
        ctx.stroke();
        
        // Round cap
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(140, 30);
        ctx.lineTo(240, 30);
        ctx.stroke();
        
        // Square cap
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(250, 30);
        ctx.lineTo(280, 30);
        ctx.stroke();
        
        // Test 2: Line joins with thick strokes
        ctx.lineWidth = 12;
        ctx.lineCap = 'butt';
        
        // Miter join
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(60, 80);
        ctx.lineTo(100, 60);
        ctx.stroke();
        
        // Round join
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(120, 60);
        ctx.lineTo(160, 80);
        ctx.lineTo(200, 60);
        ctx.stroke();
        
        // Bevel join
        ctx.lineJoin = 'bevel';
        ctx.beginPath();
        ctx.moveTo(220, 60);
        ctx.lineTo(260, 80);
        ctx.lineTo(280, 60);
        ctx.stroke();
        
        // Test 3: Different stroke widths
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        const widths = [2, 4, 8, 12];
        widths.forEach((width, i) => {
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(20 + i * 60, 110);
            ctx.lineTo(60 + i * 60, 130);
            ctx.stroke();
        });
        
        // Test 4: Curved paths
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(20, 150);
        ctx.quadraticCurveTo(80, 120, 120, 150);
        ctx.bezierCurveTo(160, 180, 200, 120, 280, 150);
        ctx.stroke();
        
        // Test 5: Rectangle stroke
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 170, 80, 20);
        
        // Test 6: Circle stroke  
        ctx.beginPath();
        ctx.arc(180, 180, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
});