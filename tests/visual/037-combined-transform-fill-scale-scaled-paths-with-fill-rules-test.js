// Test 37: Combined Transform + Fill + Scale - Scaled paths with fill rules
// This file will be concatenated into the main visual test suite

// Test 37: Combined Transform + Fill + Scale - Scaled paths with fill rules
registerVisualTest('combined-transform-fill-scale', {
    name: 'Scaled paths with fill rules',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);