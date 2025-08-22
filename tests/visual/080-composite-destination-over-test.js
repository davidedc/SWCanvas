// Test: destination-over Composite Operation
// Visual test of the destination-over composite operation

registerVisualTest('composite-destination-over', {
    name: 'Composite Operation: destination-over',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Gray background to distinguish transparent areas
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(0, 0, 300, 200);
        
        // Title indicator 
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 150, 15);
        
        // Left example: Basic destination-over behavior
        // Clear area to create transparency
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'black'; // color doesn't matter
        ctx.fillRect(40, 40, 100, 80);
        
        // Draw blue rectangle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#3366FF';
        ctx.fillRect(60, 50, 40, 40);
        
        // Draw red circle with destination-over (goes behind blue, fills transparent)
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(80, 70, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Right example: destination-over with semi-transparent shapes
        // Clear area for second demo
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'black';
        ctx.fillRect(170, 40, 120, 100);
        
        // Draw semi-transparent yellow rectangle (destination)
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(190, 60, 50, 30);
        
        // Draw semi-transparent purple circle with destination-over
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#9933FF';
        ctx.beginPath();
        ctx.arc(230, 90, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Expected result:
        // Left: Red circle visible behind blue rectangle and in transparent areas
        // Right: Purple circle behind yellow rectangle with alpha blending
    }
});