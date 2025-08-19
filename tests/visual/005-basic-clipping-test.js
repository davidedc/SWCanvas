// Test: Basic Clipping
// This file will be concatenated into the main visual test suite

registerVisualTest('clipping-test', {
    name: 'Basic clipping test',
    width: 100, height: 100,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        // Set up circular clip path
        ctx.beginPath();
        ctx.arc(50, 50, 30, 0, 2 * Math.PI);
        ctx.clip();
        
        // Fill a large red rectangle - should be clipped to circle
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
    }
});