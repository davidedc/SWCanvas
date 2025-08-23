// Test: Source-out clipped stroked test - composite operations with clipping and strokes
// Tests interaction between clipping mask, composite operation masks, and stroked shapes

registerVisualTest('source-out-clipped-stroked', {
    name: 'Source-out clipped stroked - diagonal lines + rectangular clip + blue square + red circle with green strokes and source-out',
    width: 100, height: 100,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Step 1: Draw diagonal orange lines across entire canvas
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -100; i <= 200; i += 10) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 100, 100);
        }
        ctx.stroke();
        
        // Step 2: Clip canvas to rectangular path inset by 10px
        ctx.beginPath();
        ctx.rect(10, 10, 80, 80);
        ctx.clip();
        
        // Step 3: Draw orthogonal black diagonal lines (only visible in clipped area)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -100; i <= 200; i += 10) {
            ctx.moveTo(i, 100);
            ctx.lineTo(i + 100, 0);
        }
        ctx.stroke();
        
        // Step 4: Draw blue square as destination (55x55 at position 5,5) with 2px green stroke
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 55, 55);
        
        // Step 5: Apply source-out composite operation
        ctx.globalCompositeOperation = 'source-out';
        
        // Step 6: Draw red circle centered at (65,65) with radius 32 with 2px green stroke
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Expected result:
        // - Orange diagonal lines visible outside 10px inset area
        // - Black diagonal lines crosshatch pattern visible inside 10px inset area
        // - Red circle appears only where it doesn't overlap blue square (source-out behavior)
        // - Green stroke on circle appears only where it doesn't overlap blue square
        // - Blue square with green stroke remains unchanged
        // - All composite operation effects confined to clipped region
    }
});