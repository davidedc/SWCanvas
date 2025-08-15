// Test 31: Self-intersecting clip paths
// This file will be concatenated into the main visual test suite

// Test 31: Self-intersecting clip paths
registerVisualTest('clip-self-intersecting', {
    name: 'Self-Intersecting Clipping',
    width: 400,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Figure-8 clip path
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 50, 30, 0, 2 * Math.PI);
        ctx.arc(110, 50, 30, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(20, 20, 120, 60);
        ctx.fillStyle = 'red';
        ctx.fillRect(60, 35, 60, 30);
        ctx.restore();
        
        // Center: Self-intersecting star
        ctx.save();
        ctx.beginPath();
        const cx = 200, cy = 50;
        // Create self-intersecting star
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * 40;
            const y = cy + Math.sin(angle) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(140, 10, 120, 80);
        ctx.fillStyle = 'orange';
        ctx.fillRect(180, 30, 40, 40);
        ctx.restore();
        
        // Right: Bow-tie/hourglass shape
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(290, 20);
        ctx.lineTo(350, 80);
        ctx.lineTo(370, 20);
        ctx.lineTo(330, 50);
        ctx.lineTo(370, 80);
        ctx.lineTo(290, 80);
        ctx.lineTo(310, 20);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(270, 10, 120, 80);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(300, 35, 60, 30);
        ctx.restore();
        
        // Bottom: Complex self-intersecting polygon
        ctx.save();
        ctx.beginPath();
        const points = [
            [50, 130], [120, 160], [80, 120], [150, 150], [90, 180],
            [130, 110], [60, 170], [140, 140], [70, 110], [110, 190]
        ];
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(30, 100, 140, 100);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(70, 130, 60, 40);
        ctx.restore();
        
        // Bottom right: Spiral-like intersecting path
        ctx.save();
        ctx.beginPath();
        const spiralCx = 300, spiralCy = 150;
        for (let t = 0; t < 4 * Math.PI; t += 0.5) {
            const r = 5 + t * 3;
            const x = spiralCx + r * Math.cos(t);
            const y = spiralCy + r * Math.sin(t);
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        // Connect back to create intersections
        ctx.lineTo(spiralCx + 20, spiralCy - 20);
        ctx.lineTo(spiralCx - 30, spiralCy + 30);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'lime';
        ctx.fillRect(220, 110, 160, 80);
        ctx.fillStyle = 'navy';
        ctx.fillRect(270, 130, 60, 40);
        ctx.restore();
    },
});