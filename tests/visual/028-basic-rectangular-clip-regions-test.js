// Test 28: Basic rectangular clip regions
// This file will be concatenated into the main visual test suite

// Test 28: Basic rectangular clip regions
registerVisualTest('clip-rectangular', {
    name: 'Basic Rectangular Clipping',
    width: 400,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // No need for clearRect with SWCanvas as it starts clean
        
        // Left side: No clipping
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(10, 10, 80, 60);
        ctx.fillStyle = 'red';
        ctx.fillRect(30, 30, 80, 60);
        
        // Right side: With rectangular clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(150, 20, 60, 40);
        ctx.clip();
        
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(130, 10, 80, 60);
        ctx.fillStyle = 'red';
        ctx.fillRect(150, 30, 80, 60);
        ctx.restore();
        
        // Bottom: Multiple overlapping rectangles with clip
        ctx.save();
        ctx.beginPath();
        ctx.rect(50, 120, 100, 50);
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(20, 100, 60, 80);
        ctx.fillStyle = 'orange';
        ctx.fillRect(80, 110, 60, 80);
        ctx.fillStyle = 'purple';
        ctx.fillRect(40, 140, 60, 50);
        ctx.restore();
    },
});