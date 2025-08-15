// Test 44: Combined Transform + Stroke + Rotate - Phase 4 Integration Test
// This file will be concatenated into the main visual test suite

// Test 44: Combined Transform + Stroke + Rotate - Phase 4 Integration Test
registerVisualTest('combined-transform-stroke-rotate', {
    name: 'Rotated Stroke Joins',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(Math.PI / 6); // 30 degrees
        ctx.scale(1.2, 0.8); // Non-uniform scaling
        
        // Complex path with sharp corners to test stroke joins
        ctx.beginPath();
        ctx.moveTo(-60, -40);
        ctx.lineTo(20, -40);
        ctx.lineTo(40, -20);
        ctx.lineTo(40, 20);
        ctx.lineTo(20, 40);
        ctx.lineTo(-20, 40);
        ctx.lineTo(-40, 20);
        ctx.lineTo(-40, -20);
        ctx.closePath();
        
        // Test different stroke properties
        ctx.lineWidth = 8;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 4;
        ctx.globalAlpha = 0.8;
        
        ctx.strokeStyle = 'blue';
        ctx.stroke();
        
        // Add smaller rotated shape inside
        ctx.save();
        ctx.rotate(Math.PI / 4); // Additional 45 degrees
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(15, -15);
        ctx.lineTo(15, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'orange';
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
    },
});