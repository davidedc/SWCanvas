// Test 43: Debug Alpha Blending Issue - Multiple nested clips with varying alpha
// This file will be concatenated into the main visual test suite

// Test 43: Debug Alpha Blending Issue - Multiple nested clips with varying alpha
registerVisualTest('debug-alpha-blending', {
    name: 'Debug Alpha Blending Issue',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        
        // First clip: rotated rectangle
        ctx.save();
        ctx.rotate(-Math.PI / 8);
        ctx.rect(-30, -20, 60, 40);
        ctx.clip();
        ctx.restore();
        
        // Second clip: scaled ellipse
        ctx.save();
        ctx.scale(0.8, 1.3);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.clip();
        ctx.restore();
        
        // Layer 1: Semi-transparent background
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'blue';
        ctx.fillRect(-40, -40, 80, 80);
        
        // Layer 2: More transparent overlay
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.quadraticCurveTo(0, -30, 15, -20);
        ctx.quadraticCurveTo(25, 0, 15, 20);
        ctx.quadraticCurveTo(0, 30, -15, 20);
        ctx.quadraticCurveTo(-25, 0, -15, -20);
        ctx.closePath();
        
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.restore();
        
        // Pixel analysis for debugging (works with both canvas types)
        if (canvas._coreSurface) {
            // SWCanvas pixel analysis
            const surface = canvas._coreSurface;
            const layer1Offset = 100 * surface.stride + 100 * 4;
            const r1 = surface.data[layer1Offset];
            const g1 = surface.data[layer1Offset + 1];
            const b1 = surface.data[layer1Offset + 2];
            const a1 = surface.data[layer1Offset + 3];
            console.log(`After blue layer: R=${r1}, G=${g1}, B=${b1}, A=${a1}`);
            
            const orangeOffset = 100 * surface.stride + 90 * 4;
            const r = surface.data[orangeOffset];
            const g = surface.data[orangeOffset + 1];
            const b = surface.data[orangeOffset + 2];
            const a = surface.data[orangeOffset + 3];
            console.log(`SWCanvas orange area: R=${r}, G=${g}, B=${b}, A=${a}`);
        } else {
            // HTML5 Canvas pixel analysis
            const imageData = ctx.getImageData(100, 100, 1, 1);
            const r = imageData.data[0];
            const g = imageData.data[1];
            const b = imageData.data[2];
            const a = imageData.data[3];
            console.log(`HTML5Canvas clipped center: R=${r}, G=${g}, B=${b}, A=${a}`);
        }
    },
});