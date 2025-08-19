// Test: Combined Transform + Fill + Scale - Scaled paths with fill rules
// This file will be concatenated into the main visual test suite

registerVisualTest('combined-transform-fill-scale-v2', {
    name: 'Scaled paths with fill rules (asymmetric)',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test: Asymmetrically scaled star with nonzero fill rule (top left)
        ctx.save();
        ctx.translate(100, 75);
        ctx.scale(1.5, 0.8); // Wide and short
        
        ctx.beginPath();
        // Create 5-pointed star
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerRadius = 25;
            const innerRadius = 12;
            
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * innerRadius;
            const innerY = Math.sin(innerAngle) * innerRadius;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill('nonzero');
        ctx.restore();
        
        // Test: Scaled self-intersecting shape with evenodd rule (top right)
        ctx.save();
        ctx.translate(300, 75);
        ctx.scale(0.7, 1.8); // Tall and narrow
        
        ctx.beginPath();
        // Bow-tie / hourglass shape
        ctx.moveTo(-30, -20);
        ctx.lineTo(30, 20);
        ctx.lineTo(-30, 20);
        ctx.lineTo(30, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'green';
        ctx.fill('evenodd');
        ctx.restore();
        
        // Test: Multiple scaled concentric shapes (bottom left)
        const scales = [1.0, 0.75, 0.5, 0.25];
        const colors = ['blue', 'orange', 'purple', 'yellow'];
        
        ctx.save();
        ctx.translate(100, 200);
        
        for (let i = 0; i < scales.length; i++) {
            ctx.save();
            ctx.scale(scales[i], scales[i]);
            
            ctx.beginPath();
            // Hexagon
            for (let j = 0; j < 6; j++) {
                const angle = (j * Math.PI) / 3;
                const x = Math.cos(angle) * 30;
                const y = Math.sin(angle) * 30;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        
        // Test: Extremely scaled bezier curves (bottom right)
        ctx.save();
        ctx.translate(300, 200);
        ctx.scale(2.5, 0.4); // Very wide and very short
        
        ctx.beginPath();
        ctx.moveTo(-20, -15);
        ctx.bezierCurveTo(-15, -30, 15, -30, 20, -15);
        ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
        ctx.bezierCurveTo(15, 30, -15, 30, -20, 15);
        ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
        ctx.closePath();
        
        ctx.fillStyle = 'magenta';
        ctx.fill();
        ctx.restore();
    }
});