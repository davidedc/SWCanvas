// Test 39: Combined Transform + Clip + Fill - Critical stencil buffer test
// This file will be concatenated into the main visual test suite

// Test 39: Combined Transform + Clip + Fill - Critical stencil buffer test
registerVisualTest('combined-transform-clip-fill', {
    name: 'Transform + Clip + Fill',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Transform + Circular Clip + Complex Fill (top left)
        ctx.save();
        ctx.translate(100, 80);
        ctx.rotate(Math.PI / 6);
        ctx.scale(1.2, 0.8);
        
        // Create circular clip region
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, 2 * Math.PI);
        ctx.clip();
        
        // Draw complex intersecting rectangles
        ctx.fillStyle = 'red';
        ctx.fillRect(-60, -30, 40, 60);
        ctx.fillStyle = 'blue';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-20, -30, 40, 60);
        ctx.fillStyle = 'green';
        ctx.fillRect(20, -30, 40, 60);
        ctx.restore();
        
        // Test 2: Nested Transform + Multiple Clips (top right)
        ctx.save();
        ctx.translate(300, 80);
        ctx.scale(0.9, 1.1);
        
        // First clip - diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(40, 0);
        ctx.lineTo(0, 40);
        ctx.lineTo(-40, 0);
        ctx.closePath();
        ctx.clip();
        
        ctx.save();
        ctx.rotate(Math.PI / 4);
        
        // Second clip - rectangle
        ctx.beginPath();
        ctx.rect(-25, -25, 50, 50);
        ctx.clip();
        
        // Fill with pattern
        ctx.fillStyle = 'purple';
        ctx.fillRect(-60, -60, 120, 120);
        
        ctx.fillStyle = 'yellow';
        ctx.globalAlpha = 0.6;
        for (let i = -3; i <= 3; i++) {
            ctx.fillRect(i * 15 - 2, -60, 4, 120);
            ctx.fillRect(-60, i * 15 - 2, 120, 4);
        }
        ctx.restore();
        ctx.restore();
        
        // Test 3: Critical stencil buffer test with overlapping transforms (bottom left)
        ctx.save();
        ctx.translate(100, 200);
        
        // Create star-shaped clip
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = (i % 2 === 0) ? 35 : 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        // Multiple transformed fills that stress stencil buffer
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 3);
            ctx.scale(1 + i * 0.1, 1 + i * 0.1);
            
            const colors = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta'];
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-20, -5, 40, 10);
            ctx.restore();
        }
        ctx.restore();
        
        // Test 4: Complex nested save/restore with clipping (bottom right)
        ctx.save();
        ctx.translate(300, 200);
        ctx.scale(1.3, 0.7);
        
        // Level 1 clip
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(-60, -60, 120, 120);
        
        ctx.save();
        ctx.rotate(Math.PI / 8);
        
        // Level 2 clip
        ctx.beginPath();
        ctx.rect(-30, -20, 60, 40);
        ctx.clip();
        ctx.fillStyle = 'orange';
        ctx.fillRect(-60, -60, 120, 120);
        
        ctx.save();
        ctx.scale(0.8, 1.2);
        
        // Level 3 clip - use arc instead of ellipse for compatibility
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = 'darkred';
        ctx.fillRect(-60, -60, 120, 120);
        
        ctx.restore(); // Back to level 2
        ctx.restore(); // Back to level 1
        ctx.restore(); // Back to base
    }
});