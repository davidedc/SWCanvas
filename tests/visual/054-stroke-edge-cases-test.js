// Test 54: Stroke edge cases
// This file will be concatenated into the main visual test suite

// Test 54: Stroke edge cases
registerVisualTest('stroke-edge-cases', {
    name: 'Stroke Edge Cases',
    width: 500,
    height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 300);