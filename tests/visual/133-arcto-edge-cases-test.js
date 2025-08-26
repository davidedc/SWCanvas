// Test: arcTo edge cases
// This file will be concatenated into the main visual test suite

registerVisualTest('arcto-edge-cases', {
    name: 'arcTo edge cases - zero radius and collinear points',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Zero radius (should create sharp corners)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(120, 50);
        ctx.arcTo(150, 50, 150, 80, 0);  // Zero radius
        ctx.lineTo(150, 120);
        ctx.arcTo(150, 150, 120, 150, 0); // Zero radius
        ctx.lineTo(50, 150);
        ctx.arcTo(20, 150, 20, 120, 0);   // Zero radius
        ctx.lineTo(20, 80);
        ctx.arcTo(20, 50, 50, 50, 0);     // Zero radius
        ctx.closePath();
        ctx.stroke();
        
        // Test 2: Collinear points (horizontal line)
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(200, 80);
        ctx.arcTo(250, 80, 300, 80, 20); // All points on horizontal line
        ctx.lineTo(350, 80);
        ctx.stroke();
        
        // Test 3: Collinear points (vertical line)
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo(220, 100);
        ctx.arcTo(220, 130, 220, 160, 15); // All points on vertical line
        ctx.lineTo(220, 190);
        ctx.stroke();
        
        // Test 4: Very small angles (should still work)
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 200);
        ctx.lineTo(100, 205);  // Very small angle
        ctx.arcTo(150, 210, 200, 215, 10);
        ctx.lineTo(250, 220);
        ctx.stroke();
        
        // Test 5: Very large radius (should be clamped)
        ctx.strokeStyle = 'purple';
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(150, 250);
        ctx.arcTo(200, 250, 200, 280, 100); // Radius larger than available space
        ctx.lineTo(200, 290);
        ctx.stroke();
        
        // Test 6: Acute angle
        ctx.strokeStyle = 'brown';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, 200);
        ctx.lineTo(340, 220);
        ctx.arcTo(360, 230, 350, 260, 8); // Sharp acute angle
        ctx.lineTo(330, 280);
        ctx.stroke();
    }
});