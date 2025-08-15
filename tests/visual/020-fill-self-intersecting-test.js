// Test 20: fill-self-intersecting - Self-intersecting paths
// This file will be concatenated into the main visual test suite

// Test 20: fill-self-intersecting - Self-intersecting paths
registerVisualTest('fill-self-intersecting', {
    name: 'Self-intersecting path filling',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Self-intersecting bowtie shape
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(50, 50);
        ctx.lineTo(130, 50);
        ctx.lineTo(50, 100);
        ctx.lineTo(130, 100);
        ctx.closePath();
        ctx.fill();
        
        // Figure-8 like self-intersection
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.moveTo(180, 40);
        ctx.lineTo(220, 80);
        ctx.lineTo(260, 40);
        ctx.lineTo(220, 100);
        ctx.lineTo(260, 140);
        ctx.lineTo(220, 100);
        ctx.lineTo(180, 140);
        ctx.lineTo(220, 80);
        ctx.closePath();
        ctx.fill();
        
        // Complex self-intersecting star-like shape
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.moveTo(90, 140);
        ctx.lineTo(50, 180);
        ctx.lineTo(110, 160);
        ctx.lineTo(70, 190);
        ctx.lineTo(130, 170);
        ctx.lineTo(90, 200);
        ctx.lineTo(150, 180);
        ctx.lineTo(110, 210);
        ctx.closePath();
        ctx.fill();
    },
});