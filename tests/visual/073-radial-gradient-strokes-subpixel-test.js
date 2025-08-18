// Test 73: Radial Gradient Strokes with Sub-pixel Width
// This file will be concatenated into the main visual test suite

registerVisualTest('radial-gradient-strokes-subpixel', {
    name: 'Radial gradients applied to sub-pixel strokes - various shapes',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Create radial gradient for strokes
        const grad = ctx.createRadialGradient(150, 100, 10, 150, 100, 120);
        grad.addColorStop(0, 'yellow');
        grad.addColorStop(0.4, 'orange');
        grad.addColorStop(0.8, 'red');
        grad.addColorStop(1, 'darkred');
        
        ctx.strokeStyle = grad;
        
        // Test 1: Thin sub-pixel lines with different caps
        ctx.lineWidth = 0.5; // 50% opacity
        
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(100, 30);
        ctx.stroke();
        
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(120, 30);
        ctx.lineTo(200, 30);
        ctx.stroke();
        
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(220, 30);
        ctx.lineTo(280, 30);
        ctx.stroke();
        
        // Test 2: Star shape with ultra-thin sub-pixel stroke
        ctx.lineWidth = 0.3; // 30% opacity
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        
        ctx.beginPath();
        const centerX = 80, centerY = 80;
        const outerRadius = 25, innerRadius = 12;
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
        ctx.stroke();
        
        // Test 3: Concentric circles with varying sub-pixel widths
        ctx.lineCap = 'butt';
        const radii = [15, 25, 35];
        const widths = [0.2, 0.35, 0.5]; // Different sub-pixel widths
        radii.forEach((radius, i) => {
            ctx.lineWidth = widths[i];
            ctx.beginPath();
            ctx.arc(200, 80, radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Test 4: Spiral with very thin stroke
        ctx.lineWidth = 0.15; // 15% opacity - very thin
        ctx.beginPath();
        ctx.moveTo(80, 140);
        for (let i = 0; i < 100; i++) {
            const angle = i * 0.2;
            const radius = i * 0.3;
            const x = 80 + Math.cos(angle) * radius;
            const y = 140 + Math.sin(angle) * radius;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Test 5: Complex path with curves and sub-pixel stroke
        ctx.lineWidth = 0.4; // 40% opacity
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(180, 140);
        ctx.quadraticCurveTo(220, 120, 250, 140);
        ctx.quadraticCurveTo(270, 160, 250, 180);
        ctx.quadraticCurveTo(220, 200, 180, 180);
        ctx.quadraticCurveTo(160, 160, 180, 140);
        ctx.stroke();
    }
});