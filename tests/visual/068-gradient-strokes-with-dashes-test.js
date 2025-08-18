// Test 68: Gradient Strokes with Line Dashes Test
// This file will be concatenated into the main visual test suite

registerVisualTest('gradient-strokes-dashes', {
    name: 'All gradient types with dashed strokes - patterns and combinations',
    width: 320, height: 280,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 320, 280);
        
        // Section 1: Linear gradient with dashes
        const linearGrad = ctx.createLinearGradient(0, 0, 300, 0);
        linearGrad.addColorStop(0, 'red');
        linearGrad.addColorStop(0.5, 'yellow');
        linearGrad.addColorStop(1, 'green');
        
        ctx.strokeStyle = linearGrad;
        ctx.lineWidth = 8;
        ctx.lineCap = 'butt';
        
        // Simple dash pattern
        ctx.setLineDash([15, 5]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(20, 30);
        ctx.lineTo(300, 30);
        ctx.stroke();
        
        // Complex dash pattern
        ctx.setLineDash([10, 5, 2, 5]);
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.lineTo(300, 50);
        ctx.stroke();
        
        // Dashed curve
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(20, 70);
        ctx.quadraticCurveTo(160, 40, 300, 70);
        ctx.stroke();
        
        // Section 2: Radial gradient with dashes
        const radialGrad = ctx.createRadialGradient(160, 130, 5, 160, 130, 80);
        radialGrad.addColorStop(0, 'white');
        radialGrad.addColorStop(0.3, 'cyan');
        radialGrad.addColorStop(0.7, 'blue');
        radialGrad.addColorStop(1, 'navy');
        
        ctx.strokeStyle = radialGrad;
        ctx.lineWidth = 6;
        
        // Dashed circle
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(80, 130, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Dashed spiral
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(160, 130);
        for (let i = 0; i < 120; i++) {
            const angle = i * 0.15;
            const radius = i * 0.25;
            const x = 160 + Math.cos(angle) * radius;
            const y = 130 + Math.sin(angle) * radius;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Dashed star
        ctx.setLineDash([5, 3]);
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        const centerX = 240, centerY = 130;
        const outerR = 30, innerR = 15;
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? outerR : innerR;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Section 3: Conic gradient with dashes
        const conicGrad = ctx.createConicGradient(0, 160, 220);
        conicGrad.addColorStop(0, 'magenta');
        conicGrad.addColorStop(0.25, 'red');
        conicGrad.addColorStop(0.5, 'orange');
        conicGrad.addColorStop(0.75, 'yellow');
        conicGrad.addColorStop(1, 'magenta');
        
        ctx.strokeStyle = conicGrad;
        
        // Dashed wavy line
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 3, 2, 3]);
        ctx.lineDashOffset = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(20, 200);
        for (let x = 20; x <= 300; x += 5) {
            const y = 200 + Math.sin((x - 20) * 0.03) * 15;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Dashed polygon with different dash offsets
        const sides = 6;
        const polygonR = 25;
        const dashOffsets = [0, 3, 6, 9];
        
        dashOffsets.forEach((offset, i) => {
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = offset;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const centerX = 80 + i * 60;
            const centerY = 250;
            
            for (let j = 0; j < sides + 1; j++) {
                const angle = (j * Math.PI * 2) / sides;
                const x = centerX + Math.cos(angle) * polygonR;
                const y = centerY + Math.sin(angle) * polygonR;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        });
        
        // Reset dash pattern for any subsequent drawing
        ctx.setLineDash([]);
    }
});