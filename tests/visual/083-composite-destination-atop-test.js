// Test: Composite Operation: destination-atop - destination visible only where source exists
// This test demonstrates the global compositing fix for destination-atop

registerVisualTest('composite-destination-atop', {
    name: 'Composite Operation: destination-atop - global effect',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Draw blue rectangle as destination
        ctx.fillStyle = '#0066ff';
        ctx.fillRect(50, 50, 100, 100);
        
        // Switch to destination-atop and draw red circle
        // This should keep the blue only where the red circle overlaps
        // and erase blue outside the circle (the key global effect)
        ctx.globalCompositeOperation = 'destination-atop';
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(120, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Add label rectangles for clarity (using rectangles instead of text)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.fillRect(10, 15, 5, 5); // Marker for destination-atop test
        
        // Show a comparison: draw the same shapes with source-over
        ctx.fillStyle = '#0066ff';
        ctx.fillRect(200, 50, 100, 100);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(270, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.fillRect(210, 165, 5, 5); // Marker for source-over comparison
    }
});