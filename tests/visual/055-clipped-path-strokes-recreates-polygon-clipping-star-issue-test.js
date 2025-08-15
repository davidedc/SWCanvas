// Test 55: Clipped path strokes (recreates Polygon Clipping star issue)
// This file will be concatenated into the main visual test suite

// Test 55: Clipped path strokes (recreates Polygon Clipping star issue)
registerVisualTest('clipped-path-strokes', {
    name: 'Clipped Path Strokes',
    width: 400,
    height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);