// Test 69: Basic Line Dash Patterns with Sub-pixel Strokes
// This file will be concatenated into the main visual test suite

// Test 69
registerVisualTest('line-dash-basic-patterns-subpixel', {
    name: 'Line dash - basic patterns with sub-pixel strokes',
    width: 300, height: 200,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.5; // Sub-pixel width (50% opacity)
        
        // Test 1: Solid sub-pixel line (empty dash array)
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(280, 30);
        ctx.stroke();
        
        // Test 2: Simple dash pattern [5, 5] with sub-pixel width
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(280, 60);
        ctx.stroke();
        
        // Test 3: Long dash pattern [15, 5] with sub-pixel width
        ctx.setLineDash([15, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 90);
        ctx.lineTo(280, 90);
        ctx.stroke();
        
        // Test 4: Change to even thinner stroke
        ctx.lineWidth = 0.25; // 25% opacity
        ctx.strokeStyle = 'blue';
        
        // Dot pattern [1, 3] - tiny dashes, larger gaps
        ctx.setLineDash([1, 3]);
        ctx.beginPath();
        ctx.moveTo(20, 120);
        ctx.lineTo(280, 120);
        ctx.stroke();
        
        // Test 5: Ultra-thin stroke
        ctx.lineWidth = 0.1; // 10% opacity  
        ctx.strokeStyle = 'green';
        
        // Complex pattern [10, 5, 2, 5] - varied dash/gap lengths
        ctx.setLineDash([10, 5, 2, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 150);
        ctx.lineTo(280, 150);
        ctx.stroke();
        
        // Reset to solid for any additional drawing
        ctx.setLineDash([]);
    }
});