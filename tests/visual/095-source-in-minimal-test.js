// Test: Source-in minimal test - classic blue square with red circle
// Demonstrates source-in only shows source where destination exists

registerVisualTest('source-in-minimal', {
    name: 'Source-in minimal - blue square then red circle with source-in',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply source-in composite operation
        ctx.globalCompositeOperation = 'source-in';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Red circle appears only where it overlaps the blue square
        // - Blue square disappears entirely (replaced by red in overlap)
        // - Red circle parts outside blue square disappear
    }
});