// Test: Linear Gradient Strokes with Sub-pixel Width
// This file will be concatenated into the main visual test suite

registerVisualTest('linear-gradient-strokes-subpixel', {
    name: 'Linear gradients applied to sub-pixel strokes - various shapes and styles',
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
        
        // Test: Simple line with different line caps and sub-pixel width
        ctx.lineWidth = 0.6; // 60% opacity
        
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
        
        // Test: Line joins with thin sub-pixel strokes
        ctx.lineWidth = 0.4; // 40% opacity
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
        
        // Test: Different sub-pixel stroke widths
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        const widths = [0.15, 0.3, 0.5, 0.75]; // All sub-pixel
        widths.forEach((width, i) => {
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(20 + i * 60, 110);
            ctx.lineTo(60 + i * 60, 130);
            ctx.stroke();
        });
        
        // Test: Curved paths with ultra-thin stroke
        ctx.lineWidth = 0.25; // 25% opacity
        ctx.beginPath();
        ctx.moveTo(20, 150);
        ctx.quadraticCurveTo(80, 120, 120, 150);
        ctx.bezierCurveTo(160, 180, 200, 120, 280, 150);
        ctx.stroke();
        
        // Test: Rectangle stroke with sub-pixel width
        ctx.lineWidth = 0.35; // 35% opacity
        ctx.strokeRect(20, 170, 80, 20);
        
        // Test: Circle stroke with very thin width
        ctx.lineWidth = 0.2; // 20% opacity
        ctx.beginPath();
        ctx.arc(180, 180, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
});