// Test 4: Even-Odd Path
// This file will be concatenated into the main visual test suite

// Test 4: Even-Odd Path  
registerVisualTest('evenodd-test', {
    name: 'Path filling - evenodd vs nonzero',
    width: 100, height: 100,
    // Unified drawing function
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 100, 100);
        
        // Create overlapping rectangles (outer and inner)
        ctx.fillStyle = 'red';
        ctx.beginPath();
        // Outer rectangle
        ctx.rect(20, 20, 60, 60);
        // Inner rectangle (opposite winding)
        ctx.rect(30, 30, 40, 40);
        
        // Fill with evenodd rule - should create a "hole"
        ctx.fill('evenodd');
    }
});