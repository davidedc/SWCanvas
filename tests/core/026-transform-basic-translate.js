// Test 026: Basic transform - translate operations
// This file will be concatenated into the main test suite

// Test 026
test('Basic transform - translate operations', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-basic-translate');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-basic-translate.bmp', 'basic translate test', SWCanvas);
            
            // Verify translated squares are in correct positions
            // Red square: fillRect(10,10,30,30) at origin -> (10,10) to (40,40)
            // Blue square: after translate(50,20), fillRect(10,10,30,30) -> (60,30) to (90,60)  
            // Green square: after translate(60,30), fillRect(10,10,30,30) -> (120,60) to (150,90)
            const redPixel = (25 * surface.stride) + (25 * 4);  // Center of red square
            const bluePixel = (45 * surface.stride) + (75 * 4); // Center of blue square  
            const greenPixel = (75 * surface.stride) + (135 * 4); // Center of green square
            
            if (surface.data[redPixel] < 200) throw new Error('Red square not found at origin');
            if (surface.data[bluePixel + 2] < 200) throw new Error('Blue square not found at translated position');
            if (surface.data[greenPixel + 1] < 100) throw new Error('Green square not found at final position'); // Green is 128, not 255
            return;
        }
    }
    
    // Fallback test without visual registry
    const surface = SWCanvas.Core.Surface(200, 150);
    const ctx = new SWCanvas.Core.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    ctx.translate(50, 50);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 20, 20);
    
    const pixelOffset = (60 * surface.stride) + (60 * 4);
    if (surface.data[pixelOffset] < 200) {
        throw new Error('Transform translate not working');
    }
});