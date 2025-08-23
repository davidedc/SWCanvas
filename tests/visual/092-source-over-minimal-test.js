// Test: Source-over minimal test - classic blue square with red circle
// Demonstrates source-over (default) draws source over destination

registerVisualTest('source-over-minimal', {
    name: 'Source-over minimal - blue square then red circle with source-over',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply source-over composite operation (default)
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Red circle appears on top of blue square in overlap area
        // - Blue square remains blue where red doesn't overlap
        // - Red circle extends beyond the blue square
    }
});