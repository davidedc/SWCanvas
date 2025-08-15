// Test 38: Combined Transform + Fill + Scale - Scaled paths with fill rules
// This file will be concatenated into the main visual test suite

// Test 38: Combined Transform + Fill + Scale - Scaled paths with fill rules
registerVisualTest('combined-transform-fill-scale', {
    name: 'Scaled paths with fill rules',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Scaled self-intersecting path with nonzero fill rule (left top)
        ctx.save();
        ctx.translate(100, 70);
        ctx.scale(1.5, 1.0);
        
        ctx.beginPath();
        ctx.moveTo(-40, -30);
        ctx.lineTo(40, -30);
        ctx.lineTo(-40, 30);
        ctx.lineTo(40, 30);
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill(); // nonzero (default)
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Test 2: Same scaled path with evenodd fill rule (right top)
        ctx.save();
        ctx.translate(300, 70);
        ctx.scale(1.5, 1.0);
        
        ctx.beginPath();
        ctx.moveTo(-40, -30);
        ctx.lineTo(40, -30);
        ctx.lineTo(-40, 30);
        ctx.lineTo(40, 30);
        ctx.closePath();
        
        ctx.fillStyle = 'blue';
        ctx.fill('evenodd');
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Test 3: Scaled complex star with nonzero (bottom left)
        ctx.save();
        ctx.translate(100, 180);
        ctx.scale(0.8, 1.2);
        
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
            const angle = (i * 2 * Math.PI) / 7;
            const outerX = Math.cos(angle) * 40;
            const outerY = Math.sin(angle) * 40;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            
            // Connect to next outer point through center area
            const nextAngle = ((i + 1) * 2 * Math.PI) / 7;
            const nextOuterX = Math.cos(nextAngle) * 40;
            const nextOuterY = Math.sin(nextAngle) * 40;
            ctx.lineTo(nextOuterX * 0.3, nextOuterY * 0.3);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'green';
        ctx.fill(); // nonzero
        ctx.strokeStyle = 'darkgreen';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        
        // Test 4: Same scaled star with evenodd (bottom right)
        ctx.save();
        ctx.translate(300, 180);
        ctx.scale(0.8, 1.2);
        
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
            const angle = (i * 2 * Math.PI) / 7;
            const outerX = Math.cos(angle) * 40;
            const outerY = Math.sin(angle) * 40;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            
            const nextAngle = ((i + 1) * 2 * Math.PI) / 7;
            const nextOuterX = Math.cos(nextAngle) * 40;
            const nextOuterY = Math.sin(nextAngle) * 40;
            ctx.lineTo(nextOuterX * 0.3, nextOuterY * 0.3);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'purple';
        ctx.fill('evenodd');
        ctx.strokeStyle = 'indigo';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        
        // Test 5: Highly scaled path with nested shapes (center bottom)
        ctx.save();
        ctx.translate(200, 240);
        ctx.scale(2.0, 0.5);
        
        // Outer rectangle
        ctx.beginPath();
        ctx.rect(-30, -20, 60, 40);
        
        // Inner overlapping rectangles creating complex intersections
        ctx.rect(-20, -15, 15, 30);
        ctx.rect(-5, -15, 15, 30);
        ctx.rect(10, -15, 15, 30);
        
        ctx.fillStyle = 'orange';
        ctx.fill('evenodd');
        ctx.strokeStyle = 'darkorange';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
});