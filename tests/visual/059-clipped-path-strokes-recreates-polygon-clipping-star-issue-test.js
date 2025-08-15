// Test 59: Clipped path strokes (recreates Polygon Clipping star issue)
// This file will be concatenated into the main visual test suite

// Test 59: Clipped path strokes (recreates Polygon Clipping star issue)
registerVisualTest('clipped-path-strokes', {
    name: 'Clipped Path Strokes',
    width: 400,
    height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Star without clipping (left side)
        const cx1 = 100, cy1 = 80;
        ctx.save();
        ctx.beginPath();
        // Create star path (same as in Polygon Clipping test)
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx1 + Math.cos(angle) * 30;
            const y = cy1 + Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // Inner points
            const innerAngle = angle + Math.PI / 5;
            const ix = cx1 + Math.cos(innerAngle) * 12;
            const iy = cy1 + Math.sin(innerAngle) * 12;
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        
        // Fill the star
        ctx.fillStyle = 'lightblue';
        ctx.fill();
        
        // Stroke the star with different widths
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
        
        // Test 2: Star with clipping (right side) - same as Polygon Clipping
        // NOTE: If you see a thin stroke around the star in some browsers but not in SWCanvas,
        // this is expected. Some browsers incorrectly auto-stroke clip paths, but this is
        // non-standard behavior. Chrome and SWCanvas correctly follow the spec.
        const cx2 = 300, cy2 = 80;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx2 + Math.cos(angle) * 30;
            const y = cy2 + Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = angle + Math.PI / 5;
            const ix = cx2 + Math.cos(innerAngle) * 12;
            const iy = cy2 + Math.sin(innerAngle) * 12;
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.clip(); // Use as clipping region
        
        // Fill rectangles (like in original test)
        ctx.fillStyle = 'purple';
        ctx.fillRect(260, 40, 80, 80);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(280, 60, 40, 40);
        ctx.restore();
        
        // Test 3: Compare stroke widths
        const strokeWidths = [0.25, 0.5, 1.0, 2.0];
        for (let j = 0; j < strokeWidths.length; j++) {
            const cx = 50 + j * 80;
            const cy = 200;
            
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 25;
                const y = cy + Math.sin(angle) * 25;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const ix = cx + Math.cos(innerAngle) * 10;
                const iy = cy + Math.sin(innerAngle) * 10;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            
            // Fill
            ctx.fillStyle = 'lightgray';
            ctx.fill();
            
            // Stroke with different widths
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = strokeWidths[j];
            ctx.stroke();
            ctx.restore();
        }
    }
});