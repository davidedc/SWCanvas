// Test 42: Pixel Analysis - Check exact pixel values at center
// This file will be concatenated into the main visual test suite

// Test 42: Pixel Analysis - Check exact pixel values at center
registerVisualTest('pixel-analysis', {
    name: 'Pixel Analysis Test',
    width: 200, height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.save();
        ctx.translate(100, 100);
        
        // First layer: Semi-transparent blue at alpha 0.4
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'blue'; // RGB(0, 0, 255)
        ctx.fillRect(-30, -30, 60, 60);
        
        // Second layer: Semi-transparent orange at alpha 0.6, overlapping
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'orange'; // RGB(255, 165, 0)
        ctx.fillRect(-20, -20, 40, 40);
        
        ctx.restore();
        
        // Pixel analysis for both canvas types
        if (canvas._coreSurface) {
            // SWCanvas pixel analysis
            const surface = canvas._coreSurface;
            const centerOffset = 100 * surface.stride + 100 * 4;
            const r = surface.data[centerOffset];
            const g = surface.data[centerOffset + 1];
            const b = surface.data[centerOffset + 2];
            const a = surface.data[centerOffset + 3];
            console.log(`SWCanvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
        } else {
            // HTML5Canvas pixel analysis
            const imageData = ctx.getImageData(100, 100, 1, 1);
            const r = imageData.data[0];
            const g = imageData.data[1];
            const b = imageData.data[2];
            const a = imageData.data[3];
            console.log(`HTML5Canvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
        }
    },
});