// Test 49: Combined Transform + Stroke + Scale - Phase 4 Integration Test
// This file will be concatenated into the main visual test suite

// Test 49: Combined Transform + Stroke + Scale - Phase 4 Integration Test
registerVisualTest('combined-transform-stroke-scale', {
    name: 'Scaled Stroke Behavior',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        // Test different scaling effects on strokes
        const scales = [[2, 1], [1, 2], [0.5, 2], [1.5, 1.5]];
        const colors = ['red', 'blue', 'green', 'purple'];
        
        for (let i = 0; i < scales.length; i++) {
            ctx.save();
            ctx.translate(50 + (i % 2) * 100, 50 + Math.floor(i / 2) * 100);
            ctx.scale(scales[i][0], scales[i][1]);
            
            // Circle that will be scaled
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            
            ctx.lineWidth = 6;
            ctx.lineJoin = 'miter';
            ctx.globalAlpha = 0.7;
            
            ctx.strokeStyle = colors[i];
            ctx.stroke();
            
            // Add a cross inside to show scaling effects
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(20, 0);
            ctx.moveTo(0, -20);
            ctx.lineTo(0, 20);
            
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    },
});