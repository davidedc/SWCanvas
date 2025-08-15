// Test 019: Basic stroke - simple line
// This file will be concatenated into the main test suite

// Test 019
test('Basic stroke - simple line', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw red line stroke
    ctx.setStrokeStyle(255, 0, 0, 255);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(90, 50);
    ctx.stroke();
    
    // Check stroke is present
    const centerOffset = (50 * surface.stride) + (50 * 4);
    const r = surface.data[centerOffset];
    log(`  Line stroke pixel: R=${r}`);
    
    if (r < 200) {
        throw new Error('Expected red stroke line');
    }
    
    saveBMP(surface, 'stroke-basic-line.bmp', 'basic stroke line', SWCanvas);
});