// Test 55: Stroke edge cases
// This file will be concatenated into the main visual test suite

// Test 55: Stroke edge cases
registerVisualTest('stroke-edge-cases', {
    name: 'Stroke Edge Cases',
    width: 500,
    height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 300);
        
        // Test 1: Zero-width stroke (SWCanvas renders faint line, HTML5Canvas may not render)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(150, 50);
        ctx.stroke();
        
        // Test 2: Very thin strokes
        const thinWidths = [0.01, 0.1, 0.2, 0.3, 0.4];
        for (let i = 0; i < thinWidths.length; i++) {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = thinWidths[i];
            ctx.beginPath();
            ctx.moveTo(50, 80 + i * 20);
            ctx.lineTo(150, 80 + i * 20);
            ctx.stroke();
        }
        
        // Test 3: Strokes with scale transform
        ctx.save();
        ctx.scale(0.5, 0.5);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(400, 100);
        ctx.lineTo(600, 100);
        ctx.stroke();
        ctx.restore();
        
        // Test 4: Strokes with clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(250, 50, 100, 80);
        ctx.clip();
        
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(200, 90);
        ctx.lineTo(400, 90);
        ctx.stroke();
        ctx.restore();
        
        // Test 5: Circles with very thin strokes
        const circleWidths = [0.1, 0.3, 0.5, 1.0, 2.0];
        for (let i = 0; i < circleWidths.length; i++) {
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = circleWidths[i];
            ctx.beginPath();
            ctx.arc(80 + i * 60, 200, 20, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Test 6: Single pixel positioned strokes
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.0;
        
        // Integer position
        ctx.beginPath();
        ctx.moveTo(50, 250);
        ctx.lineTo(100, 250);
        ctx.stroke();
        
        // Half-pixel position
        ctx.beginPath();
        ctx.moveTo(50.5, 260);
        ctx.lineTo(100.5, 260);
        ctx.stroke();
        
        // Quarter-pixel position
        ctx.beginPath();
        ctx.moveTo(50.25, 270);
        ctx.lineTo(100.25, 270);
        ctx.stroke();
    }
});