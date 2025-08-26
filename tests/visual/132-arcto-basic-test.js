// Test: arcTo basic functionality
// This file will be concatenated into the main visual test suite

registerVisualTest('arcto-basic', {
    name: 'arcTo basic rounded corners',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Basic rounded rectangle using arcTo
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 80);
        ctx.lineTo(120, 80);       // Top edge
        ctx.arcTo(150, 80, 150, 110, 20);  // Top-right corner
        ctx.lineTo(150, 140);      // Right edge  
        ctx.arcTo(150, 170, 120, 170, 20); // Bottom-right corner
        ctx.lineTo(50, 170);       // Bottom edge
        ctx.arcTo(20, 170, 20, 140, 20);   // Bottom-left corner
        ctx.lineTo(20, 110);       // Left edge
        ctx.arcTo(20, 80, 50, 80, 20);     // Top-left corner
        ctx.closePath();
        ctx.stroke();
        
        // Test 2: Different radius sizes
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(200, 50);
        ctx.lineTo(270, 50);
        ctx.arcTo(300, 50, 300, 80, 5);   // Small radius
        ctx.lineTo(300, 120);
        ctx.arcTo(300, 150, 270, 150, 40); // Large radius
        ctx.lineTo(200, 150);
        ctx.arcTo(170, 150, 170, 120, 15); // Medium radius
        ctx.lineTo(170, 80);
        ctx.arcTo(170, 50, 200, 50, 25);   // Medium radius
        ctx.closePath();
        ctx.stroke();
        
        // Test 3: arcTo with fill
        ctx.fillStyle = 'lightgreen';
        ctx.strokeStyle = 'darkgreen';
        ctx.beginPath();
        ctx.moveTo(50, 200);
        ctx.lineTo(100, 200);
        ctx.arcTo(130, 200, 130, 230, 15);
        ctx.lineTo(130, 250);
        ctx.arcTo(130, 280, 100, 280, 15);
        ctx.lineTo(50, 280);
        ctx.arcTo(20, 280, 20, 250, 15);
        ctx.lineTo(20, 230);
        ctx.arcTo(20, 200, 50, 200, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Test 4: Sharp angles
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(250, 200);
        ctx.lineTo(320, 220);
        ctx.arcTo(350, 230, 340, 260, 10); // Sharp angle
        ctx.lineTo(300, 280);
        ctx.arcTo(280, 290, 250, 270, 15);
        ctx.lineTo(230, 240);
        ctx.arcTo(225, 210, 250, 200, 12);
        ctx.stroke();
    }
});