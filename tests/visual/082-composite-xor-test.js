// Test: xor Composite Operation
// Visual test of the xor composite operation

registerVisualTest('composite-xor', {
    name: 'Composite Operation: xor',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Light gray background for visibility
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 300, 200);
        
        // Title indicator
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 80, 15);
        
        // Clear an area to demonstrate XOR on transparent background
        ctx.clearRect(50, 50, 200, 100);
        
        // Draw red circle on transparent area
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(120, 100, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blue square with xor
        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(140, 80, 50, 40);
        
        // Second example: XOR over opaque background to show cancellation
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'yellow';
        ctx.fillRect(50, 160, 40, 30);
        
        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = 'purple';
        ctx.fillRect(70, 170, 40, 30);
        
        // Expected result: Red circle and blue square visible with transparent overlap (top),
        // yellow/purple cancellation creates holes (bottom)
    }
});