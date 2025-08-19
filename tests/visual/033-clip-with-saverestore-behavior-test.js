// Test: Clip with save/restore behavior
// This file will be concatenated into the main visual test suite

registerVisualTest('clip-save-restore', {
    name: 'Clipping Save/Restore',
    width: 400,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Left: Basic save/restore with clip
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(10, 10, 80, 80);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(20, 20, 60, 60);
        ctx.clip();
        
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        ctx.restore();
        
        // Should not be clipped after restore
        ctx.fillStyle = 'blue';
        ctx.fillRect(30, 85, 40, 15);
        
        // Center: Multiple save/restore levels
        ctx.save();
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(120, 10, 80, 80);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(130, 20, 60, 40);
        ctx.clip();
        
        ctx.fillStyle = 'green';
        ctx.fillRect(110, 10, 100, 80);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(140, 30, 40, 20);
        ctx.clip();
        
        ctx.fillStyle = 'yellow';
        ctx.fillRect(120, 20, 80, 60);
        ctx.restore(); // Back to first clip
        
        ctx.fillStyle = 'orange';
        ctx.fillRect(135, 65, 30, 15);
        ctx.restore(); // Back to no clips
        
        ctx.fillStyle = 'purple';
        ctx.fillRect(125, 85, 70, 10);
        ctx.restore(); // Back to original state
        
        // Right: Clip with transform save/restore
        ctx.save();
        ctx.translate(280, 50);
        ctx.rotate(Math.PI / 4);
        
        ctx.beginPath();
        ctx.rect(-30, -30, 60, 60);
        ctx.clip();
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(-50, -50, 100, 100);
        
        ctx.save();
        ctx.scale(0.5, 0.5);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(-40, -40, 80, 80);
        ctx.restore(); // Back to rotated/translated but same clip
        
        ctx.fillStyle = 'lime';
        ctx.fillRect(-10, -40, 20, 80);
        ctx.restore(); // Back to original transform and no clip
        
        ctx.fillStyle = 'navy';
        ctx.fillRect(250, 85, 60, 10);
        
        // Bottom: Complex save/restore with multiple clips and fills
        ctx.save();
        // First level
        ctx.beginPath();
        ctx.arc(80, 150, 40, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'pink';
        ctx.fillRect(20, 110, 120, 80);
        
        ctx.save();
        // Second level - diamond clip
        ctx.beginPath();
        ctx.moveTo(80, 120);
        ctx.lineTo(110, 150);
        ctx.lineTo(80, 180);
        ctx.lineTo(50, 150);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = 'brown';
        ctx.fillRect(40, 130, 80, 40);
        
        // Modify state without save
        ctx.fillStyle = 'gold';
        ctx.fillRect(70, 140, 20, 20);
        
        ctx.restore(); // Back to circle clip only
        
        ctx.fillStyle = 'silver';
        ctx.fillRect(60, 125, 40, 10);
        
        ctx.save();
        // Third level - small rectangle
        ctx.beginPath();
        ctx.rect(65, 160, 30, 15);
        ctx.clip();
        
        ctx.fillStyle = 'maroon';
        ctx.fillRect(50, 150, 60, 30);
        ctx.restore(); // Back to circle clip
        
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(90, 135, 25, 30);
        ctx.restore(); // Back to no clips
        
        // Should render without any clipping
        ctx.fillStyle = 'black';
        ctx.fillRect(30, 185, 100, 10);
        
        // Bottom right: Save/restore with stroke and fill
        ctx.save();
        ctx.beginPath();
        ctx.rect(220, 120, 80, 60);
        ctx.clip();
        
        ctx.fillStyle = 'lightcoral';
        ctx.fillRect(200, 100, 120, 100);
        
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 3;
        ctx.strokeRect(210, 110, 100, 80);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(260, 150, 25, 0, 2 * Math.PI);
        ctx.clip();
        
        ctx.fillStyle = 'yellow';
        ctx.fillRect(235, 125, 50, 50);
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(245, 135, 30, 30);
        ctx.restore();
        
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 4;
        ctx.strokeRect(225, 125, 70, 15);
        ctx.restore();
    },
});