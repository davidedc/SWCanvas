// Test: Shadow Stroke Test
// Tests shadow functionality with strokes and different stroke properties.

registerVisualTest('shadow-stroke-test', {
    name: 'Shadow Stroke Test',
    width: 200, height: 200,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        // Test 1: Basic stroke shadow - simple line
        ctx.shadowColor = 'rgba(0, 0, 0, 0.39)'; // Semi-transparent black
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(80, 30);
        ctx.stroke();
        
        // Test 2: Circle with shadow
        ctx.shadowColor = 'rgba(0, 100, 200, 0.31)'; // Blue shadow
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = -2;
        ctx.shadowOffsetY = 4;
        
        ctx.strokeStyle = 'rgb(0, 150, 0)'; // Green stroke
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(140, 50, 25, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Test 3: Rectangle stroke with large blur
        ctx.shadowColor = 'rgba(150, 0, 150, 0.24)'; // Purple shadow
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = -3;
        
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(30, 100, 50, 30);
        ctx.stroke();
        
        // Test 4: Path with multiple segments
        ctx.shadowColor = 'rgba(100, 50, 0, 0.35)'; // Brown shadow
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 6;
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(120, 120);
        ctx.lineTo(140, 100);
        ctx.lineTo(160, 120);
        ctx.lineTo(180, 100);
        ctx.stroke();
        
        // Test 5: Thin stroke with shadow (sub-pixel test)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.47)'; // Black shadow
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 2;
        
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 0.5; // Sub-pixel width
        ctx.beginPath();
        ctx.moveTo(20, 170);
        ctx.lineTo(180, 170);
        ctx.stroke();
    }
});