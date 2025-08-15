// Test 35: Enhanced Clipping Intersection Test
// This file will be concatenated into the main visual test suite

// Test 35: Enhanced Clipping Intersection Test
registerVisualTest('clip-intersection-enhanced', {
    name: 'Enhanced Clipping Intersection Test',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);