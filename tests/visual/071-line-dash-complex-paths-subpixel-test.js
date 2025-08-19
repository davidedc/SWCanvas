// Test: Line Dash with Complex Paths and Sub-pixel Strokes
// This file will be concatenated into the main visual test suite

// Test 71
registerVisualTest('line-dash-complex-paths-subpixel', {
    name: 'Line dash - complex paths and shapes with sub-pixel strokes',
    width: 350, height: 300,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 350, 300);
        
        // Test: Dashed rectangle with sub-pixel stroke
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.4; // 40% opacity
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.rect(20, 20, 80, 60);
        ctx.stroke();
        
        // Test: Dashed circle with thinner sub-pixel stroke
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 0.25; // 25% opacity
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.arc(180, 50, 35, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Test: Dashed triangle with odd-length pattern and sub-pixel stroke
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 0.6; // 60% opacity
        ctx.setLineDash([12, 8, 4]); // Odd length - should duplicate to [12,8,4,12,8,4]
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(280, 20);
        ctx.lineTo(330, 80);
        ctx.lineTo(230, 80);
        ctx.closePath();
        ctx.stroke();
        
        // Test: Dashed bezier curve with very thin stroke
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 0.15; // 15% opacity
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(20, 120);
        ctx.bezierCurveTo(50, 90, 80, 150, 110, 120);
        ctx.stroke();
        
        // Test: Dashed quadratic curve with sub-pixel width
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 0.35; // 35% opacity
        ctx.setLineDash([6, 3]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(130, 120);
        ctx.quadraticCurveTo(165, 90, 200, 120);
        ctx.stroke();
        
        // Test: Complex path with multiple segments, transforms, and sub-pixel stroke
        ctx.save();
        ctx.translate(250, 150);
        ctx.rotate(Math.PI / 6);
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 0.5; // 50% opacity
        ctx.setLineDash([15, 5, 5, 5]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(-30, -20);
        ctx.lineTo(30, -20);
        ctx.lineTo(40, 0);
        ctx.lineTo(30, 20);
        ctx.lineTo(-30, 20);
        ctx.lineTo(-40, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        
        // Test: Star shape with ultra-thin dashed outline
        ctx.strokeStyle = 'darkgreen';
        ctx.lineWidth = 0.2; // 20% opacity
        ctx.setLineDash([4, 2]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        const cx = 60, cy = 220, outerRadius = 35, innerRadius = 15;
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const innerAngle = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
            
            const outerX = cx + outerRadius * Math.cos(outerAngle);
            const outerY = cy + outerRadius * Math.sin(outerAngle);
            const innerX = cx + innerRadius * Math.cos(innerAngle);
            const innerY = cy + innerRadius * Math.sin(innerAngle);
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Test: Arc with sub-pixel dashed stroke
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 0.45; // 45% opacity
        ctx.setLineDash([12, 6]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.arc(180, 220, 40, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        
        // Reset dash patterns
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
});