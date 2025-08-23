// Test: Copy stroked test - classic blue square with red circle and green strokes
// Demonstrates copy replaces entire canvas with source, with green strokes

registerVisualTest('copy-stroked', {
    name: 'Copy stroked - blue square + red circle with green strokes and copy',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Apply copy composite operation
        ctx.globalCompositeOperation = 'copy';
        
        // Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Only red circle with green stroke appears
        // - Blue square with green stroke disappears entirely (replaced by transparent)
        // - Canvas becomes transparent everywhere except red circle with green stroke
    }
});