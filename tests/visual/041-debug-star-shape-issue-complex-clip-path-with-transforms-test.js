// Test 41: Debug Star Shape Issue - Complex clip path with transforms
// This file will be concatenated into the main visual test suite

// Test 41: Debug Star Shape Issue - Complex clip path with transforms
registerVisualTest('debug-star-shape', {
    name: 'Debug Star Shape Issue',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(Math.PI / 12);
        ctx.scale(1.1, 0.9);
        ctx.globalAlpha = 0.8;
        
        // Complex clip shape: star with hole
        ctx.beginPath();
        // Outer star
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
        ctx.clip();
        
        // Fill with complex path
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.globalAlpha = 0.9; // Alpha on alpha
        
        ctx.beginPath();
        ctx.moveTo(-20, -15);
        ctx.bezierCurveTo(-10, -25, 10, -25, 20, -15);
        ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
        ctx.bezierCurveTo(10, 25, -10, 25, -20, 15);
        ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
        ctx.closePath();
        
        ctx.fillStyle = 'purple';
        ctx.fill();
        
        // Add stroked outline on top
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'magenta';
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    },
});