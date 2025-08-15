// Test 43: Debug Star Path Generation - Isolated star path test
// This file will be concatenated into the main visual test suite

// Test 43: Debug Star Path Generation - Isolated star path test
registerVisualTest('debug-star-path', {
    name: 'Debug Star Path Generation',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        // No transforms - just the raw star
        
        // Draw star path for debugging
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerRadius = 40;
            const innerRadius = 20;
            
            // Debug logging only for SWCanvas to avoid console spam
            if (canvas._coreSurface) {
                console.log(`Star point ${i}: angle=${angle}`);
            }
            
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * innerRadius;
            const innerY = Math.sin(innerAngle) * innerRadius;
            
            if (canvas._coreSurface) {
                console.log(`  Outer: (${outerX.toFixed(2)}, ${outerY.toFixed(2)})`);
                console.log(`  Inner: (${innerX.toFixed(2)}, ${innerY.toFixed(2)})`);
            }
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    },
});