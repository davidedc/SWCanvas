// Test: fill-nested-holes - Paths with holes
// This file will be concatenated into the main visual test suite

registerVisualTest('fill-nested-holes', {
    name: 'Path filling with nested holes',
    width: 300, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Outer rectangle with hole using even-odd rule
        ctx.beginPath();
        ctx.fillStyle = 'red';
        // Outer rectangle
        ctx.rect(30, 30, 100, 80);
        // Inner hole (reverse winding for even-odd)
        ctx.rect(50, 50, 60, 40);
        ctx.fill('evenodd');
        
        // Nested squares with holes
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        // Outermost square
        ctx.rect(160, 20, 120, 120);
        // Middle hole
        ctx.rect(180, 40, 80, 80);
        // Inner filled square (creates hole in the hole)
        ctx.rect(200, 60, 40, 40);
        ctx.fill('evenodd');
        
        // Complex donut shape with inner hole
        ctx.beginPath();
        ctx.fillStyle = 'green';
        // Outer circle approximated by octagon
        const cx = 100, cy = 170, outerR = 35, innerR = 15;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = cx + Math.cos(angle) * outerR;
            const y = cy + Math.sin(angle) * outerR;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Inner hole (octagon)
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = cx + Math.cos(angle) * innerR;
            const y = cy + Math.sin(angle) * innerR;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill('evenodd');
    },
});