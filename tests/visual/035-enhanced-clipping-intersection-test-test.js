// Test 35: Enhanced Clipping Intersection Test
// This file will be concatenated into the main visual test suite

// Test 35: Enhanced Clipping Intersection Test
registerVisualTest('clip-intersection-enhanced', {
    name: 'Enhanced Clipping Intersection Test',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Basic rectangular clip intersection (left side)
        ctx.save();
        ctx.beginPath();
        ctx.rect(50, 50, 120, 80);
        ctx.clip();
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(100, 80, 120, 80);
        ctx.clip(); // This creates an intersection
        
        // Fill should only appear in the intersection
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 400, 300);
        ctx.restore();
        ctx.restore();
        
        // Test 2: Circular and rectangular clip intersection (right side)
        ctx.save();
        ctx.beginPath();
        ctx.arc(300, 90, 60, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(250, 50, 100, 80);
        ctx.clip();
        
        // Fill should only appear in circle-rectangle intersection
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 400, 300);
        ctx.restore();
        ctx.restore();
        
        // Test 3: Multiple nested intersections (bottom)
        ctx.save();
        ctx.beginPath();
        ctx.rect(50, 180, 150, 100);
        ctx.clip();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 230, 50, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(100, 200, 80, 60);
        ctx.clip();
        
        // Triple intersection
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, 400, 300);
        ctx.restore();
        ctx.restore();
        ctx.restore();
        
        // Test 4: Complex polygon intersection (bottom right)
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = 300 + Math.cos(angle) * 40;
            const y = 230 + Math.sin(angle) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(270, 200, 60, 60);
        ctx.clip();
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(0, 0, 400, 300);
        ctx.restore();
        ctx.restore();
    }
});