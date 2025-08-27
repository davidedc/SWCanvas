// Test: Shadow Basic Test
// Tests basic shadow functionality with simple rectangles and different shadow configurations.

registerVisualTest('shadow-basic-test', {
    name: 'Shadow Basic Test',
    width: 200, height: 200,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        // Test 1: Basic drop shadow - red rectangle
        ctx.shadowColor = 'rgba(100, 100, 100, 0.5)'; // Semi-transparent gray
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, 40, 30);
        
        // Test 2: Blue shadow - green rectangle  
        ctx.shadowColor = 'rgba(0, 0, 255, 0.39)'; // Blue shadow
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = -3;
        ctx.shadowOffsetY = 7;
        
        ctx.fillStyle = 'rgb(0, 200, 0)'; // Green
        ctx.fillRect(80, 30, 35, 35);
        
        // Test 3: No blur, just offset - yellow rectangle
        ctx.shadowColor = 'rgba(0, 0, 0, 0.31)'; // Black shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = -5;
        
        ctx.fillStyle = 'yellow';
        ctx.fillRect(140, 40, 30, 25);
        
        // Test 4: Large blur, small offset - purple rectangle
        ctx.shadowColor = 'rgba(255, 0, 255, 0.24)'; // Magenta shadow
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgb(128, 0, 128)'; // Purple
        ctx.fillRect(30, 100, 50, 20);
        
        // Test 5: No shadow - orange rectangle for comparison
        ctx.shadowColor = 'transparent'; // No shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = 'orange';
        ctx.fillRect(120, 110, 40, 30);
    }
});