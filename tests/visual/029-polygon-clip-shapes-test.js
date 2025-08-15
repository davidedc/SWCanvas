// Test 29: Polygon clip shapes
// This file will be concatenated into the main visual test suite

// Test 29: Polygon clip shapes
registerVisualTest('clip-polygon', {
    name: 'Polygon Clipping',
    width: 400,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Triangle clip region
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(120, 20);
        ctx.lineTo(85, 80);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(20, 10, 100, 80);
        ctx.fillStyle = 'red';
        ctx.fillRect(60, 30, 60, 60);
        ctx.restore();
        
        // Center: Diamond clip region
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(200, 20);
        ctx.lineTo(240, 50);
        ctx.lineTo(200, 80);
        ctx.lineTo(160, 50);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(140, 10, 120, 80);
        ctx.fillStyle = 'orange';
        ctx.fillRect(180, 40, 60, 40);
        ctx.restore();
        
        // Right: Star clip region
        // NOTE: Some browsers may show a thin outline around clip regions.
        // This is non-standard behavior - Chrome and SWCanvas correctly don't stroke clip paths.
        // The HTML5 Canvas spec does not require stroking of clip boundaries.
        ctx.save();
        ctx.beginPath();
        const cx = 340, cy = 50;
        // Outer star points
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * 30;
            const y = cy + Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // Inner points
            const innerAngle = angle + Math.PI / 5;
            const ix = cx + Math.cos(innerAngle) * 12;
            const iy = cy + Math.sin(innerAngle) * 12;
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(300, 10, 80, 80);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(320, 30, 40, 40);
        ctx.restore();
        
        // Bottom: Hexagon clip with multiple fills
        ctx.save();
        ctx.beginPath();
        const hx = 200, hy = 150;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = hx + Math.cos(angle) * 40;
            const y = hy + Math.sin(angle) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(140, 100, 120, 100);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(180, 130, 40, 40);
        ctx.fillStyle = 'lime';
        ctx.fillRect(160, 120, 80, 20);
        ctx.restore();
    },
});