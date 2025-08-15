// Test 36: Combined Transform + Fill + Rotate - Rotated complex polygons
// This file will be concatenated into the main visual test suite

// Test 36: Combined Transform + Fill + Rotate - Rotated complex polygons
registerVisualTest('combined-transform-fill-rotate', {
    name: 'Rotated complex polygons',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);