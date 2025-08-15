// Test 34: Basic clipping regions  
// This file will be concatenated into the main visual test suite

// Test 34: Basic clipping regions  
registerVisualTest('clip-intersection', {
    name: 'Basic Clipping Regions',
    width: 400,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Single rectangular clip (simplified from intersection)
        ctx.save();
        // Direct rectangle clip representing the intersection area
        ctx.beginPath();
        ctx.rect(30, 50, 40, 40);
        ctx.clip();
        
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 120, 120);
        ctx.restore();
        
        // Center: Triangle clip region  
        ctx.save();
        // Triangle clip
        ctx.beginPath();
        ctx.moveTo(180, 90);
        ctx.lineTo(220, 90);
        ctx.lineTo(200, 50);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'blue';
        ctx.fillRect(160, 30, 80, 80);
        ctx.restore();
        
        // Right: Diamond clip region
        ctx.save();
        // Diamond clip
        ctx.beginPath();
        ctx.moveTo(330, 40);
        ctx.lineTo(360, 70);
        ctx.lineTo(330, 100);
        ctx.lineTo(300, 70);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(280, 20, 100, 100);
        ctx.restore();
        
        // Bottom left: Circle clip region
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 150, 35, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'orange';
        ctx.fillRect(40, 110, 80, 80);
        ctx.restore();
        
        // Bottom center: Another circle clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 150, 32, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(160, 110, 80, 80);
        ctx.restore();
        
        // Bottom right: Star clip region
        ctx.save();
        ctx.beginPath();
        const starCx = 330, starCy = 150;
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const outerX = starCx + Math.cos(angle) * 30;
            const outerY = starCy + Math.sin(angle) * 30;
            const innerAngle = angle + Math.PI / 5;
            const innerX = starCx + Math.cos(innerAngle) * 15;
            const innerY = starCy + Math.sin(innerAngle) * 15;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'magenta';
        ctx.fillRect(290, 110, 80, 80);
        ctx.restore();
    },
});