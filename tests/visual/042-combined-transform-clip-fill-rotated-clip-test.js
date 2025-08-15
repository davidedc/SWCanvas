// Test 42: Combined Transform + Clip + Fill - Rotated clip version
// This file will be concatenated into the main visual test suite

// Test 42: Combined Transform + Clip + Fill - Critical stencil buffer test (rescued from original test 38)
registerVisualTest('combined-transform-clip-fill-v2', {
    name: 'Transform + Clip + Fill (rotated clip)',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Rotated clip with translated fill (top left)
        ctx.save();
        ctx.translate(100, 75);
        
        // Rotated circular clip
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.clip();
        ctx.restore();
        
        // Translated fill
        ctx.translate(10, 10);
        ctx.fillStyle = 'red';
        ctx.fillRect(-30, -30, 60, 60);
        ctx.restore();
        
        // Test 2: Scaled clip with scaled fill (top right)
        ctx.save();
        ctx.translate(300, 75);
        ctx.scale(1.5, 0.8);
        
        // Star clip shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerRadius = 20;
            const innerRadius = 10;
            
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
        ctx.clip();
        
        // Fill with complex path
        ctx.beginPath();
        ctx.moveTo(-25, -20);
        ctx.quadraticCurveTo(0, -35, 25, -20);
        ctx.quadraticCurveTo(35, 0, 25, 20);
        ctx.quadraticCurveTo(0, 35, -25, 20);
        ctx.quadraticCurveTo(-35, 0, -25, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.restore();
        
        // Test 3: Multiple clip intersections with transforms (bottom left)
        ctx.save();
        ctx.translate(100, 200);
        
        // First clip: rotated rectangle
        ctx.save();
        ctx.rotate(Math.PI / 6);
        ctx.rect(-25, -15, 50, 30);
        ctx.clip();
        ctx.restore();
        
        // Second clip: scaled circle (intersection)
        ctx.save();
        ctx.scale(1.2, 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.clip();
        ctx.restore();
        
        // Fill should only appear in intersection
        ctx.fillStyle = 'blue';
        ctx.fillRect(-40, -40, 80, 80);
        ctx.restore();
        
        // Test 4: Complex nested transforms with clips (bottom right)
        ctx.save();
        ctx.translate(300, 200);
        ctx.rotate(-Math.PI / 8);
        ctx.scale(0.9, 1.1);
        
        // Outer clip: diamond
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(30, 0);
        ctx.lineTo(0, 30);
        ctx.lineTo(-30, 0);
        ctx.closePath();
        ctx.clip();
        
        ctx.save();
        ctx.translate(5, -5);
        ctx.rotate(Math.PI / 4);
        ctx.scale(1.2, 0.8);
        
        // Inner clip: triangle
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(15, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.clip();
        
        // Complex fill path
        ctx.beginPath();
        ctx.moveTo(-20, -20);
        ctx.bezierCurveTo(-10, -30, 10, -30, 20, -20);
        ctx.bezierCurveTo(30, -10, 30, 10, 20, 20);
        ctx.bezierCurveTo(10, 30, -10, 30, -20, 20);
        ctx.bezierCurveTo(-30, 10, -30, -10, -20, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'purple';
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }
});