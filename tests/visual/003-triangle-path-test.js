// Test 3: Triangle Path
// This file will be concatenated into the main visual test suite

// Test 3: Triangle Path
registerVisualTest('triangle-test', {
    name: 'Path filling - simple triangle',
    width: 100, height: 100,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        // Draw red triangle using path
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(50, 10);
        ctx.lineTo(80, 70);
        ctx.lineTo(20, 70);
        ctx.closePath();
        ctx.fill();
    }
});