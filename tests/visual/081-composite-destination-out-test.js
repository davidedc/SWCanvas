// Test: destination-out Composite Operation
// Visual test of the destination-out composite operation

registerVisualTest('composite-destination-out', {
    name: 'Composite Operation: destination-out',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background for visibility
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Title indicator
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 120, 15);
        
        // Draw red circle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blue square with destination-out (should erase red where blue overlaps)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(120, 80, 60, 40);
        
        // Expected result: Red circle with a rectangular hole cut out
        // Where blue square overlaps, red should be erased (transparent)
    }
});