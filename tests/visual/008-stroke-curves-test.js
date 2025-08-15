// Test 8: Stroke Curves
// This file will be concatenated into the main visual test suite

// Test 8: Stroke Curves  
registerVisualTest('stroke-curves', {
    name: 'Complex path stroke with curves',
    width: 150, height: 150,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 150, 150);
        
        // Draw a curved path
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.quadraticCurveTo(75, 20, 130, 50);
        ctx.quadraticCurveTo(100, 100, 50, 120);
        ctx.lineTo(20, 100);
        ctx.stroke();
    }
});