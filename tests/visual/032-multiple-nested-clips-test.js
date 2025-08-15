// Test 32: Multiple nested clips
// This file will be concatenated into the main visual test suite

// Test 32: Multiple nested clips
registerVisualTest('clip-stack-nested', {
    name: 'Nested Clipping Stack',
    width: 400,
    height: 250,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Two nested rectangular clips
        ctx.save();
        // First clip: large rectangle
        ctx.beginPath();
        ctx.rect(20, 20, 120, 80);
        ctx.clip();
        
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, 160, 120);
        
        ctx.save();
        // Second clip: smaller rectangle inside first
        ctx.beginPath();
        ctx.rect(40, 40, 60, 40);
        ctx.clip();
        
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, 100, 80);
        ctx.restore();
        
        // After restore, only first clip applies
        ctx.fillStyle = 'green';
        ctx.fillRect(100, 50, 40, 30);
        ctx.restore();
        
        // Center: Circle then triangle clips
        ctx.save();
        // First clip: circle
        ctx.beginPath();
        ctx.arc(200, 60, 40, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'orange';
        ctx.fillRect(140, 20, 120, 80);
        
        ctx.save();
        // Second clip: triangle inside circle
        ctx.beginPath();
        ctx.moveTo(180, 30);
        ctx.lineTo(220, 30);
        ctx.lineTo(200, 70);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(160, 20, 80, 80);
        ctx.restore();
        
        // Back to circle clip only
        ctx.fillStyle = 'yellow';
        ctx.fillRect(185, 75, 30, 20);
        ctx.restore();
        
        // Right: Three nested clips
        ctx.save();
        // First clip: large rectangle
        ctx.beginPath();
        ctx.rect(280, 20, 100, 80);
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(260, 0, 140, 120);
        
        ctx.save();
        // Second clip: circle inside rectangle
        ctx.beginPath();
        ctx.arc(330, 60, 35, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'magenta';
        ctx.fillRect(300, 30, 60, 60);
        
        ctx.save();
        // Third clip: small rectangle inside circle
        ctx.beginPath();
        ctx.rect(315, 45, 30, 30);
        ctx.clip();
        
        ctx.fillStyle = 'lime';
        ctx.fillRect(310, 40, 40, 40);
        ctx.restore(); // Back to circle + rectangle
        
        ctx.fillStyle = 'navy';
        ctx.fillRect(305, 35, 50, 15);
        ctx.restore(); // Back to rectangle only
        
        ctx.fillStyle = 'maroon';
        ctx.fillRect(285, 85, 90, 10);
        ctx.restore(); // No clips
        
        // Bottom: Complex nested polygon clips
        ctx.save();
        // First clip: hexagon
        ctx.beginPath();
        const hx = 120, hy = 170;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = hx + Math.cos(angle) * 50;
            const y = hy + Math.sin(angle) * 50;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'lightcoral';
        ctx.fillRect(50, 110, 140, 120);
        
        ctx.save();
        // Second clip: diamond inside hexagon
        ctx.beginPath();
        ctx.moveTo(120, 140);
        ctx.lineTo(150, 170);
        ctx.lineTo(120, 200);
        ctx.lineTo(90, 170);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'darkblue';
        ctx.fillRect(70, 130, 100, 80);
        
        ctx.save();
        // Third clip: small circle in center
        ctx.beginPath();
        ctx.arc(120, 170, 15, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'gold';
        ctx.fillRect(100, 150, 40, 40);
        ctx.restore(); // Back to diamond + hexagon
        
        ctx.fillStyle = 'silver';
        ctx.fillRect(105, 155, 30, 10);
        ctx.restore(); // Back to hexagon only
        
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(140, 145, 25, 50);
        ctx.restore(); // No clips
        
        // Bottom right: Clip stack with transforms
        ctx.save();
        ctx.translate(280, 150);
        ctx.rotate(Math.PI / 6);
        
        // First clip: rotated rectangle
        ctx.beginPath();
        ctx.rect(-40, -30, 80, 60);
        ctx.clip();
        
        ctx.fillStyle = 'pink';
        ctx.fillRect(-60, -50, 120, 100);
        
        ctx.save();
        ctx.scale(0.7, 0.7);
        // Second clip: scaled circle
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'brown';
        ctx.fillRect(-40, -40, 80, 80);
        ctx.restore();
        
        ctx.fillStyle = 'indigo';
        ctx.fillRect(-15, -35, 30, 15);
        ctx.restore();
    },
});