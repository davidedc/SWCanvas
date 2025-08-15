// Test 029: setTransform vs transform behavior
// This file will be concatenated into the main test suite

// Test 029
test('setTransform vs transform behavior', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-setTransform-vs-transform');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-setTransform-vs-transform.bmp', 'setTransform vs transform test', SWCanvas);
            return;
        }
    }
    
    // Fallback test showing difference between transform and setTransform
    const surface = SWCanvas.Core.Surface(200, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 100);
    
    // transform is accumulative
    ctx.transform(1, 0, 0, 1, 10, 10);
    ctx.transform(2, 0, 0, 2, 0, 0);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 10, 10);
    
    // setTransform is absolute
    ctx.setTransform(1, 0, 0, 1, 100, 10);
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(0, 0, 10, 10);
    
    // Should see different positioned squares
    const redArea = (20 * surface.stride) + (20 * 4);
    const blueArea = (20 * surface.stride) + (100 * 4);
    
    if (surface.data[redArea] < 200) throw new Error('Accumulative transform not working');
    if (surface.data[blueArea + 2] < 200) throw new Error('Absolute setTransform not working');
});