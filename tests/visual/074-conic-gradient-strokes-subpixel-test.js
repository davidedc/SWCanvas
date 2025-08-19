// Test: Conic Gradient Strokes with Sub-pixel Width
// This file will be concatenated into the main visual test suite

registerVisualTest('conic-gradient-strokes-subpixel', {
    name: 'Conic gradients applied to sub-pixel strokes - various shapes',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Create conic gradient for strokes (starting from top)
        const grad = ctx.createConicGradient(-Math.PI/2, 150, 100);
        grad.addColorStop(0, 'cyan');
        grad.addColorStop(0.2, 'blue');
        grad.addColorStop(0.4, 'purple');
        grad.addColorStop(0.6, 'red');
        grad.addColorStop(0.8, 'orange');
        grad.addColorStop(1, 'cyan');
        
        ctx.strokeStyle = grad;
        
        // Test: Rays emanating from center with sub-pixel strokes
        ctx.lineWidth = 0.3; // 30% opacity
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const startRadius = 20;
            const endRadius = 50;
            const startX = 80 + Math.cos(angle) * startRadius;
            const startY = 60 + Math.sin(angle) * startRadius;
            const endX = 80 + Math.cos(angle) * endRadius;
            const endY = 60 + Math.sin(angle) * endRadius;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // Test: Polygon with various joins and sub-pixel width
        ctx.lineWidth = 0.6; // 60% opacity
        
        // Hexagon with miter joins
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = 200 + Math.cos(angle) * 30;
            const y = 60 + Math.sin(angle) * 30;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Test: Wavy line with thin sub-pixel stroke
        ctx.lineWidth = 0.25; // 25% opacity
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(20, 120);
        for (let x = 20; x <= 280; x += 10) {
            const y = 120 + Math.sin((x - 20) * 0.05) * 20;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Test: Figure-eight pattern with sub-pixel width
        ctx.lineWidth = 0.4; // 40% opacity
        ctx.beginPath();
        ctx.moveTo(80, 160);
        ctx.bezierCurveTo(80, 140, 120, 140, 120, 160);
        ctx.bezierCurveTo(120, 180, 80, 180, 80, 160);
        ctx.bezierCurveTo(80, 140, 40, 140, 40, 160);
        ctx.bezierCurveTo(40, 180, 80, 180, 80, 160);
        ctx.stroke();
        
        // Test: Arc segments with different sub-pixel thicknesses
        const thicknesses = [0.15, 0.3, 0.45, 0.6]; // All sub-pixel
        thicknesses.forEach((thickness, i) => {
            ctx.lineWidth = thickness;
            ctx.beginPath();
            const startAngle = (i * Math.PI) / 6;
            const endAngle = startAngle + Math.PI / 3;
            ctx.arc(220, 160, 25 + i * 5, startAngle, endAngle);
            ctx.stroke();
        });
    }
});