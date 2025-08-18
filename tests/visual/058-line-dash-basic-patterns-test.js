// Test 58: Basic Line Dash Patterns
// This file will be concatenated into the main visual test suite

// Test 58
registerVisualTest('line-dash-basic-patterns', {
    name: 'Line dash - basic patterns',
    width: 300, height: 200,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        
        // Test 1: Solid line (empty dash array)
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(280, 30);
        ctx.stroke();
        
        // Test 2: Simple dash pattern [5, 5] - equal dashes and gaps
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(280, 60);
        ctx.stroke();
        
        // Test 3: Long dash pattern [15, 5] - long dashes, short gaps
        ctx.setLineDash([15, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 90);
        ctx.lineTo(280, 90);
        ctx.stroke();
        
        // Test 4: Dot pattern [1, 3] - tiny dashes, larger gaps
        ctx.setLineDash([1, 3]);
        ctx.beginPath();
        ctx.moveTo(20, 120);
        ctx.lineTo(280, 120);
        ctx.stroke();
        
        // Test 5: Complex pattern [10, 5, 2, 5] - varied dash/gap lengths
        ctx.setLineDash([10, 5, 2, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 150);
        ctx.lineTo(280, 150);
        ctx.stroke();
        
        // Reset to solid for any additional drawing
        ctx.setLineDash([]);
    }
});