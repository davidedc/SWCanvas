// Test 37: Combined Transform + Fill + Rotate - Complex 6-point star version
// This file will be concatenated into the main visual test suite

// Test 37: Combined Transform + Fill + Rotate - Rotated complex polygons (rescued from original test 36)
registerVisualTest('combined-transform-fill-rotate-v2', {
    name: 'Rotated complex polygons (6-point star)',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Rotated star (top left)
        ctx.save();
        ctx.translate(100, 75);
        ctx.rotate(Math.PI / 4); // 45 degrees
        
        ctx.beginPath();
        // Create 6-pointed star
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const outerRadius = 30;
            const innerRadius = 15;
            
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;
            const innerAngle = angle + Math.PI / 6;
            const innerX = Math.cos(innerAngle) * innerRadius;
            const innerY = Math.sin(innerAngle) * innerRadius;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
        
        // Test 2: Rotated self-intersecting polygon (top right)
        ctx.save();
        ctx.translate(300, 75);
        ctx.rotate(-Math.PI / 6); // -30 degrees
        
        ctx.beginPath();
        // Figure-8 shape
        ctx.moveTo(-40, -20);
        ctx.quadraticCurveTo(0, -40, 40, -20);
        ctx.quadraticCurveTo(0, 0, -40, 20);
        ctx.quadraticCurveTo(0, 40, 40, 20);
        ctx.quadraticCurveTo(0, 0, -40, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'green';
        ctx.fill('evenodd');
        ctx.restore();
        
        // Test 3: Multiple rotated rectangles with different angles (bottom left)
        const colors = ['blue', 'orange', 'purple', 'brown'];
        const angles = [0, Math.PI/6, Math.PI/3, Math.PI/2];
        
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(100, 200);
            ctx.rotate(angles[i]);
            
            ctx.fillStyle = colors[i];
            ctx.fillRect(-30 + i*5, -10 + i*5, 60, 20);
            ctx.restore();
        }
        
        // Test 4: Rotated complex path with curves (bottom right)
        ctx.save();
        ctx.translate(300, 200);
        ctx.rotate(Math.PI / 8);
        ctx.scale(0.8, 1.2);
        
        ctx.beginPath();
        ctx.moveTo(-30, -25);
        ctx.bezierCurveTo(-20, -40, 20, -40, 30, -25);
        ctx.bezierCurveTo(40, -10, 40, 10, 30, 25);
        ctx.bezierCurveTo(20, 40, -20, 40, -30, 25);
        ctx.bezierCurveTo(-40, 10, -40, -10, -30, -25);
        ctx.closePath();
        
        ctx.fillStyle = 'magenta';
        ctx.fill();
        ctx.restore();
    }
});