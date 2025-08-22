// Test: Composite Operation: copy - source replaces destination completely  
// This test demonstrates the copy operation with global compositing improvements

registerVisualTest('composite-copy', {
    name: 'Composite Operation: copy - complete replacement',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw teal background rectangle as destination
        ctx.fillStyle = '#008080';
        ctx.fillRect(40, 40, 120, 120);
        
        // Switch to copy and draw pink diamond
        // This should completely replace the teal with pink where the diamond is
        // and erase teal where diamond doesn't exist (within the drawing region)
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = '#ff69b4';
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-25, -25, 50, 50);
        ctx.restore();
        
        // Add labels for clarity
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        
        // Show a comparison: draw the same shapes with source-over
        ctx.fillStyle = '#008080';
        ctx.fillRect(190, 40, 120, 120);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff69b4';
        ctx.save();
        ctx.translate(250, 100);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-25, -25, 50, 50);
        ctx.restore();
        
        ctx.fillStyle = 'black';
        
        // Additional test: copy with transparency
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(128, 0, 128, 0.7)';
        ctx.fillRect(10, 160, 40, 30);
        
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.fillRect(20, 170, 20, 10);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
    }
});