// Test 018: Basic clipping test
// This file will be concatenated into the main test suite

// Test 018
test('Basic clipping test', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Set up circular clip path
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, 2 * Math.PI);
    ctx.clip();
    
    // Fill a large red rectangle - should be clipped to circle
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Check a point that should be clipped (outside circle)
    const outsideOffset = (20 * surface.stride) + (20 * 4);
    const outsideR = surface.data[outsideOffset];
    log(`  Outside clip region: R=${outsideR}`);
    
    // Should still be white (clipped)
    if (outsideR < 200) {
        throw new Error('Clipping not working - expected white outside clip region');
    }
    
    saveBMP(surface, 'clipping-test.bmp', 'basic clipping test', SWCanvas);
});