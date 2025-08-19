// Test: Simple Rectangle Test
// This file will be concatenated into the main visual test suite

registerVisualTest('simple-test', {
    name: 'Create and save a simple test image',
    width: 100, height: 100,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Fill with red background
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        
        // Blue square in center
        ctx.fillStyle = 'blue';
        ctx.fillRect(25, 25, 50, 50);
    }
});