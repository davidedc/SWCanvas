// Test 38: Combined Transform + Clip + Fill - Critical stencil buffer test
// This file will be concatenated into the main visual test suite

// Test 38: Combined Transform + Clip + Fill - Critical stencil buffer test
registerVisualTest('combined-transform-clip-fill', {
    name: 'Transform + Clip + Fill',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);