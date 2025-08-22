// Test: Source-atop minimal test - classic blue square with red circle
// Demonstrates that source-atop only draws where destination exists

registerVisualTest('source-atop-minimal', {
    name: 'Source-atop minimal - blue square then red circle with source-atop',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (30x30 at position 30,30)
        ctx.fillStyle = 'blue';
        ctx.fillRect(30, 30, 30, 30);
        
        // Apply source-atop composite operation
        ctx.globalCompositeOperation = 'source-atop';
        
        // Draw red circle centered at square's bottom-right corner (60,60)
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(60, 60, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Red appears only where it overlaps the blue square
        // - Outside the blue square, red should not appear
        // - Blue square remains blue where red doesn't overlap
    }
});