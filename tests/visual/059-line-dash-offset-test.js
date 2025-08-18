// Test 59: Line Dash Offset
// This file will be concatenated into the main visual test suite

// Test 59
registerVisualTest('line-dash-offset', {
    name: 'Line dash - offset behavior',
    width: 300, height: 250,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 250);
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 4;
        
        // Use consistent dash pattern [20, 10] for all tests
        ctx.setLineDash([20, 10]);
        
        // Test 1: No offset (lineDashOffset = 0)
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(50, 40);
        ctx.lineTo(250, 40);
        ctx.stroke();
        
        // Test 2: Small offset (lineDashOffset = 5)
        ctx.lineDashOffset = 5;
        ctx.beginPath();
        ctx.moveTo(50, 70);
        ctx.lineTo(250, 70);
        ctx.stroke();
        
        // Test 3: Half pattern offset (lineDashOffset = 15)
        ctx.lineDashOffset = 15;
        ctx.beginPath();
        ctx.moveTo(50, 100);
        ctx.lineTo(250, 100);
        ctx.stroke();
        
        // Test 4: Full dash length offset (lineDashOffset = 20)
        ctx.lineDashOffset = 20;
        ctx.beginPath();
        ctx.moveTo(50, 130);
        ctx.lineTo(250, 130);
        ctx.stroke();
        
        // Test 5: Greater than pattern length (lineDashOffset = 35, wraps around)
        ctx.lineDashOffset = 35;
        ctx.beginPath();
        ctx.moveTo(50, 160);
        ctx.lineTo(250, 160);
        ctx.stroke();
        
        // Test 6: Negative offset (lineDashOffset = -10)
        ctx.lineDashOffset = -10;
        ctx.beginPath();
        ctx.moveTo(50, 190);
        ctx.lineTo(250, 190);
        ctx.stroke();
        
        // Pattern reference at bottom
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(50, 225);
        ctx.lineTo(250, 225);
        ctx.stroke();
        
        // Reset dash pattern
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
});