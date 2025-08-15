// Test 6: Basic Stroke
// This file will be concatenated into the main visual test suite

// Test 6: Basic Stroke
registerVisualTest('stroke-basic-line', {
    name: 'Basic stroke - simple line',
    width: 100, height: 100,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        // Draw red line stroke
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(10, 50);
        ctx.lineTo(90, 50);
        ctx.stroke();
    }
});