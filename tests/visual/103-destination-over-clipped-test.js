// Test: Destination-over clipped test - verifies composite operations work correctly with clipping
// Tests interaction between clipping mask and composite operation masks

registerVisualTest('destination-over-clipped', {
    name: 'Destination-over clipped - diagonal lines + rectangular clip + blue square + red circle with destination-over',
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
        
        // Step 4a: Draw blue square as destination (55x55 at position 5,5)
        ctx.fillStyle = 'blue';
        ctx.fillRect(5, 5, 55, 55);
        
        // Step 4b: Apply destination-over composite operation
        ctx.globalCompositeOperation = 'destination-over';
        
        // Step 4c: Draw red circle centered at (65,65) with radius 32
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(65, 65, 32, 0, Math.PI * 2);
        ctx.fill();
        
        // Expected result:
        // - Orange diagonal lines visible outside 10px inset area
        // - Black diagonal lines crosshatch pattern visible inside 10px inset area
        // - Blue square and red circle composite only visible within clipped area
        // - Blue square remains on top in overlap area (destination-over behavior)
        // - All composite operation effects confined to clipped region
    }
});