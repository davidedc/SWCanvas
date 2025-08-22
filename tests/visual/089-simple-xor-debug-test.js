// Test: Simple XOR Debug Test - Blue Square + Red Circle
// This test creates a simple XOR case to debug the purple rectangle issue

registerVisualTest('simple-xor-debug', {
    name: 'Simple XOR Debug Test - Blue Square + Red Circle',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Draw blue square as destination
        ctx.fillStyle = 'blue';
        ctx.fillRect(50, 40, 60, 60);
        
        // Switch to XOR and draw red circle
        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(100, 70, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Blue square only areas: should be blue
        // - Red circle only areas: should be red  
        // - Overlap areas: should be transparent (white background shows through)
        // - Background: should remain white
    }
});