// Test 27: fill-rule-complex - Complex even-odd vs nonzero comparisons
// This file will be concatenated into the main visual test suite

// Test 27: fill-rule-complex - Complex even-odd vs nonzero comparisons
registerVisualTest('fill-rule-complex', {
    name: 'Complex fill rule comparisons (even-odd vs nonzero)',
    width: 400, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 200);
        
        // Left side: nonzero fill rule
        ctx.beginPath();
        ctx.fillStyle = 'red';
        
        // Outer rectangle
        ctx.rect(20, 20, 160, 80);
        // Inner rectangle (same winding direction)
        ctx.rect(60, 40, 80, 40);
        
        // Fill with nonzero rule (default)
        ctx.fill('nonzero');
        
        // Right side: evenodd fill rule
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        
        // Same shapes, different fill rule
        ctx.rect(220, 20, 160, 80);
        ctx.rect(260, 40, 80, 40);
        
        // Fill with evenodd rule
        ctx.fill('evenodd');
        
        // Complex overlapping shapes - nonzero
        ctx.beginPath();
        ctx.fillStyle = 'green';
        
        // Star with overlapping triangles
        const cx = 100, cy = 150;
        // Outer points
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * 30;
            const y = cy + Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Inner pentagon (reverse winding)
        for (let i = 4; i >= 0; i--) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * 12;
            const y = cy + Math.sin(angle) * 12;
            if (i === 4) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fill('nonzero');
        
        // Same complex shape - evenodd
        ctx.beginPath();
        ctx.fillStyle = 'magenta';
        
        const cx2 = 300, cy2 = 150;
        // Outer points
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx2 + Math.cos(angle) * 30;
            const y = cy2 + Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Inner pentagon (same winding as outer)
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx2 + Math.cos(angle) * 12;
            const y = cy2 + Math.sin(angle) * 12;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fill('evenodd');
    }
});