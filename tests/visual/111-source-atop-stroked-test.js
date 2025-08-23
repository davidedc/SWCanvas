// Test: Source-atop stroked test - classic blue square with red circle and green strokes
// Demonstrates that source-atop only draws where destination exists, with green strokes

registerVisualTest('source-atop-stroked', {
    name: 'Source-atop stroked - blue square + red circle with green strokes and source-atop',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply source-atop composite operation
        ctx.globalCompositeOperation = 'source-atop';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Red appears only where it overlaps the blue square (with green stroke)
        // - Green stroke on circle appears only where it overlaps destination
        // - Outside the blue square, red and its green stroke should not appear
        // - Blue square remains blue where red doesn't overlap, with green stroke visible
    }
});