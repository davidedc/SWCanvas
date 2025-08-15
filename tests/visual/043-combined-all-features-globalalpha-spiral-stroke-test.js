// Test 43: Combined All Features + GlobalAlpha - Spiral stroke version
// This file will be concatenated into the main visual test suite

// Test 43: Combined All Features + GlobalAlpha - Ultimate comprehensive test (rescued from original test 39)
registerVisualTest('combined-all-features-v2', {
    name: 'All features + globalAlpha (spiral stroke)',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Rotated clip with semi-transparent fill (top left)
        ctx.save();
        ctx.translate(100, 75);
        ctx.rotate(Math.PI / 6);
        ctx.globalAlpha = 0.7;
        
        // Diamond clip
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(25, 0);
        ctx.lineTo(0, 25);
        ctx.lineTo(-25, 0);
        ctx.closePath();
        ctx.clip();
        
        // Complex filled path with transparency
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
        
        // Test 2: Scaled stroke with clip and alpha (top right)
        ctx.save();
        ctx.translate(300, 75);
        ctx.scale(1.2, 0.8);
        ctx.globalAlpha = 0.6;
        
        // Circular clip
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.clip();
        
        // Stroked spiral path
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let t = 0; t < 4 * Math.PI; t += 0.2) {
            const r = t * 3;
            const x = Math.cos(t) * r;
            const y = Math.sin(t) * r;
            ctx.lineTo(x, y);
        }
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'green';
        ctx.stroke();
        ctx.restore();
        
        // Test 3: Multiple nested clips with varying alpha (bottom left)
        ctx.save();
        ctx.translate(100, 200);
        
        // First clip: rotated rectangle
        ctx.save();
        ctx.rotate(-Math.PI / 8);
        ctx.rect(-30, -20, 60, 40);
        ctx.clip();
        ctx.restore();
        
        // Second clip: scaled ellipse
        ctx.save();
        ctx.scale(0.8, 1.3);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.clip();
        ctx.restore();
        
        // Layer 1: Semi-transparent background
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'blue';
        ctx.fillRect(-40, -40, 80, 80);
        
        // Layer 2: More transparent overlay
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.quadraticCurveTo(0, -30, 15, -20);
        ctx.quadraticCurveTo(25, 0, 15, 20);
        ctx.quadraticCurveTo(0, 30, -15, 20);
        ctx.quadraticCurveTo(-25, 0, -15, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
        
        // Test 4: Ultimate complexity - all features combined (bottom right)
        ctx.save();
        ctx.translate(300, 200);
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
    }
});