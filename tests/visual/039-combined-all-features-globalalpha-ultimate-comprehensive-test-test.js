// Test 39: Combined All Features + GlobalAlpha - Ultimate comprehensive test
// This file will be concatenated into the main visual test suite

// Test 39: Combined All Features + GlobalAlpha - Ultimate comprehensive test
registerVisualTest('combined-all-features', {
    name: 'All features + globalAlpha',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);