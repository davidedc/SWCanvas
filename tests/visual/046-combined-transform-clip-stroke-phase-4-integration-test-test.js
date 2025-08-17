// Test 46: Combined Transform + Clip + Stroke - Phase 4 Integration Test
// This file will be concatenated into the main visual test suite

// Test 46: Combined Transform + Clip + Stroke - Phase 4 Integration Test
registerVisualTest('combined-transform-clip-stroke', {
    name: 'Transform + Clip + Stroke',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(Math.PI / 8); // Small rotation
        
        // Create clipping region: circle
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, 2 * Math.PI);
        ctx.clip();
        
        // Now apply additional transform and stroke
        ctx.save();
        ctx.scale(1.5, 0.8);
        ctx.rotate(Math.PI / 6);
        
        // Draw stroked shapes that will be clipped
        ctx.beginPath();
        ctx.moveTo(-80, -40);
        ctx.lineTo(80, -40);
        ctx.lineTo(80, 40);
        ctx.lineTo(-80, 40);
        ctx.closePath();
        
        ctx.lineWidth = 12;
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = 'red';
        ctx.stroke();
        
        // Add diagonal lines
        ctx.beginPath();
        ctx.moveTo(-60, -60);
        ctx.lineTo(60, 60);
        ctx.moveTo(-60, 60);
        ctx.lineTo(60, -60);
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'blue';
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
    },
});

// ===== PHASE 5: IMAGE RENDERING TESTS =====