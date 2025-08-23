// Test: Destination-over minimal test - classic blue square with red circle
// Demonstrates destination-over draws source behind destination

registerVisualTest('destination-over-minimal', {
    name: 'Destination-over minimal - blue square then red circle with destination-over',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Apply destination-over composite operation
        ctx.globalCompositeOperation = 'destination-over';
        
        // Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Blue square remains on top in overlap area
        // - Red circle appears behind blue square where they overlap
        // - Red circle shows in areas where there's no blue square
    }
});