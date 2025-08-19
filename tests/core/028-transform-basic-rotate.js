// Test: Basic transform - rotate operations
// This file will be concatenated into the main test suite

test('Basic transform - rotate operations', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-basic-rotate');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-basic-rotate.bmp', 'basic rotate test', SWCanvas);
            
            // Just verify rotation doesn't crash and produces pixels
            let pixelCount = 0;
            for (let i = 0; i < surface.data.length; i += 4) {
                if (surface.data[i] > 100 || surface.data[i+1] > 100 || surface.data[i+2] > 100) {
                    pixelCount++;
                }
            }
            
            if (pixelCount < 1000) throw new Error('Rotation test produced too few pixels');
            return;
        }
    }
    
    // Fallback test
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    ctx.translate(50, 50);
    ctx.rotate(Math.PI / 4);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(-10, -10, 20, 20);
    
    // Should see rotated red pixels
    const centerOffset = (50 * surface.stride) + (50 * 4);
    if (surface.data[centerOffset] < 100) {
        throw new Error('Transform rotate not working');
    }
});