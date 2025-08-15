// Test 39: Combined All Features + GlobalAlpha - Ultimate comprehensive test
// This file will be concatenated into the main visual test suite

// Test 39: Combined All Features + GlobalAlpha - Ultimate comprehensive test
registerVisualTest('combined-all-features', {
    name: 'All features + globalAlpha',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // ULTIMATE COMPREHENSIVE TEST: All features combined
        // This test exercises transforms, clipping, fill rules, strokes, and global alpha
        
        // Test 1: Transformed + Clipped + Alpha Blended Complex Shapes (top left)
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.translate(100, 70);
        ctx.rotate(Math.PI / 12);
        ctx.scale(1.2, 0.9);
        
        // Complex star clip region
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const outerR = 35, innerR = 18;
            
            const outerX = Math.cos(angle) * outerR;
            const outerY = Math.sin(angle) * outerR;
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            
            const innerAngle = angle + Math.PI / 6;
            const innerX = Math.cos(innerAngle) * innerR;
            const innerY = Math.sin(innerAngle) * innerR;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.clip();
        
        // Multiple overlapping shapes with different alphas
        ctx.fillStyle = 'red';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(-30, -25, 35, 50);
        
        ctx.fillStyle = 'blue';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-5, -25, 35, 50);
        
        ctx.fillStyle = 'green';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(15, -25, 35, 50);
        ctx.restore();
        
        // Test 2: Advanced path with evenodd fill + stroke + alpha (top right)
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(300, 70);
        ctx.rotate(-Math.PI / 8);
        
        // Create complex self-intersecting path
        ctx.beginPath();
        const points = [
            [-40, -30], [40, -15], [-25, 20], [30, -35], [-35, 35], 
            [45, 10], [-15, -40], [20, 30], [-45, -10], [35, -20]
        ];
        
        points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        
        ctx.fillStyle = 'purple';
        ctx.globalAlpha = 0.6;
        ctx.fill('evenodd');
        
        ctx.strokeStyle = 'darkmagenta';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.restore();
        
        // Test 3: Nested clipping + transforms + gradual alpha changes (bottom left)
        ctx.save();
        ctx.translate(100, 200);
        ctx.scale(0.8, 1.1);
        
        // Outer clip - hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 40;
            const y = Math.sin(angle) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        // Inner transformation and clipping
        ctx.save();
        ctx.rotate(Math.PI / 6);
        
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.clip();
        
        // Concentric circles with varying alpha
        for (let i = 5; i >= 1; i--) {
            const radius = i * 4;
            const alpha = Math.min(0.2 + (i * 0.15), 1.0); // Ensure alpha <= 1.0
            
            // Convert HSL to RGB to avoid color parsing issues with globalAlpha
            const hue = i * 60;
            const colors = ['#d64545', '#d6a745', '#a7d645', '#45d645', '#45d6a7'];
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colors[i - 1];
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
        ctx.restore();
        
        // Test 4: Ultimate complexity - all features combined (bottom right)
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.translate(300, 200);
        ctx.rotate(Math.PI / 10);
        ctx.scale(1.1, 0.9);
        
        // Multi-level nested clipping and transformations
        for (let level = 0; level < 3; level++) {
            ctx.save();
            ctx.rotate((level * Math.PI) / 4);
            ctx.scale(1 - level * 0.15, 1 - level * 0.15);
            
            // Create clip region based on level
            ctx.beginPath();
            if (level === 0) {
                ctx.rect(-35, -25, 70, 50);
            } else if (level === 1) {
                ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            } else {
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * 20;
                    const y = Math.sin(angle) * 20;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            }
            ctx.clip();
            
            // Draw with different features per level
            const colors = ['cyan', 'yellow', 'magenta'];
            ctx.fillStyle = colors[level];
            ctx.globalAlpha = 0.4 + level * 0.2;
            
            if (level === 0) {
                // Pattern fill
                for (let i = -4; i <= 4; i++) {
                    ctx.fillRect(i * 8 - 1, -40, 2, 80);
                }
            } else if (level === 1) {
                // Radial pattern
                for (let r = 5; r <= 25; r += 5) {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, 2 * Math.PI);
                    ctx.fill();
                }
            } else {
                // Complex intersecting shapes
                ctx.beginPath();
                ctx.moveTo(-15, -10);
                ctx.lineTo(15, -10);
                ctx.lineTo(0, 15);
                ctx.closePath();
                ctx.fill('evenodd');
                
                ctx.strokeStyle = 'darkred';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.8;
                ctx.stroke();
            }
            
            ctx.restore();
        }
        ctx.restore();
        
        // Reset global alpha
        ctx.globalAlpha = 1.0;
    }
});