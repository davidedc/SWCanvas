// Test: Combined Transform + Fill + Rotate - Rotated complex polygons
// This file will be concatenated into the main visual test suite

registerVisualTest('combined-transform-fill-rotate', {
    name: 'Rotated complex polygons',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test: Rotated star polygon (left side)
        ctx.save();
        ctx.translate(100, 80);
        ctx.rotate(Math.PI / 6); // 30 degrees
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerX = Math.cos(angle) * 40;
            const outerY = Math.sin(angle) * 40;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            
            // Inner points
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * 16;
            const innerY = Math.sin(innerAngle) * 16;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Test: Rotated complex hexagon with hole (center top)
        ctx.save();
        ctx.translate(300, 80);
        ctx.rotate(-Math.PI / 4); // -45 degrees
        
        // Outer hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 45;
            const y = Math.sin(angle) * 45;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Inner pentagon hole
        ctx.moveTo(25, 0);
        for (let i = 1; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 25;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'blue';
        ctx.fill('evenodd');
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Test: Multiple rotated triangles (bottom left)
        const triangleAngles = [0, Math.PI / 3, 2 * Math.PI / 3];
        triangleAngles.forEach((baseAngle, idx) => {
            ctx.save();
            ctx.translate(100, 200);
            ctx.rotate(baseAngle);
            
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-26, 15);
            ctx.lineTo(26, 15);
            ctx.closePath();
            
            const colors = ['green', 'orange', 'purple'];
            ctx.fillStyle = colors[idx];
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.restore();
        });
        
        // Test: Rotated spiral polygon (bottom right)
        ctx.save();
        ctx.translate(300, 200);
        ctx.rotate(Math.PI / 8);
        
        ctx.beginPath();
        let radius = 5;
        for (let angle = 0; angle < 4 * Math.PI; angle += 0.3) {
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            radius += 1.5;
        }
        
        // Close with straight line to create filled area
        ctx.lineTo(0, 0);
        ctx.closePath();
        
        ctx.fillStyle = 'teal';
        ctx.fill();
        ctx.strokeStyle = 'darkcyan';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
});