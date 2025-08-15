// Test 014: Create and save a simple test image
// This file will be concatenated into the main test suite

// Test 014
test('Create and save a simple test image', () => {
    // Use visual test registry if available, otherwise fall back to inline test
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('simple-test');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'test-output.bmp', 'test image', SWCanvas);
            return;
        }
    }
    
    // Fallback inline test
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Fill with red background
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Blue square in center
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(25, 25, 50, 50);
    
    // Save test image
    saveBMP(surface, 'test-output.bmp', 'test image', SWCanvas);
});