// Test 22: fill-multiple-subpaths - Multiple subpath handling
// This file will be concatenated into the main visual test suite

// Test 22: fill-multiple-subpaths - Multiple subpath handling
registerVisualTest('fill-multiple-subpaths', {
    name: 'Multiple subpath handling',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Multiple disconnected subpaths in one fill call
        ctx.beginPath();
        ctx.fillStyle = 'red';
        
        // First subpath - triangle
        ctx.moveTo(40, 40);
        ctx.lineTo(80, 40);
        ctx.lineTo(60, 70);
        ctx.closePath();
        
        // Second subpath - rectangle (not connected)
        ctx.moveTo(100, 30);
        ctx.lineTo(140, 30);
        ctx.lineTo(140, 80);
        ctx.lineTo(100, 80);
        ctx.closePath();
        
        // Third subpath - pentagon
        ctx.moveTo(170, 40);
        ctx.lineTo(190, 30);
        ctx.lineTo(210, 50);
        ctx.lineTo(200, 80);
        ctx.lineTo(160, 80);
        ctx.closePath();
        
        ctx.fill();
        
        // Multiple subpaths with different fill rules
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        
        // Outer shape
        ctx.moveTo(50, 120);
        ctx.lineTo(130, 120);
        ctx.lineTo(130, 180);
        ctx.lineTo(50, 180);
        ctx.closePath();
        
        // Inner hole (same winding - will create hole with evenodd)
        ctx.moveTo(70, 140);
        ctx.lineTo(110, 140);
        ctx.lineTo(110, 160);
        ctx.lineTo(70, 160);
        ctx.closePath();
        
        // Small separate rectangle
        ctx.moveTo(160, 130);
        ctx.lineTo(180, 130);
        ctx.lineTo(180, 150);
        ctx.lineTo(160, 150);
        ctx.closePath();
        
        ctx.fill('evenodd');
        
        // Mixed open and closed subpaths (only closed ones should fill)
        ctx.beginPath();
        ctx.fillStyle = 'green';
        
        // Open subpath (should not fill)
        ctx.moveTo(200, 120);
        ctx.lineTo(220, 130);
        ctx.lineTo(240, 120);
        
        // Closed subpath (should fill)
        ctx.moveTo(210, 150);
        ctx.lineTo(250, 150);
        ctx.lineTo(230, 180);
        ctx.closePath();
        
        ctx.fill();
    },
});