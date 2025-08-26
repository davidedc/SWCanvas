// Test: Path filling - evenodd vs nonzero
// This file will be concatenated into the main test suite

test('Path filling - evenodd vs nonzero', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Create overlapping rectangles (outer and inner)
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.beginPath();
    // Outer rectangle
    ctx.rect(20, 20, 60, 60);
    // Inner rectangle (opposite winding)
    ctx.rect(30, 30, 40, 40);
    
    // Fill with evenodd rule - should create a "hole"
    ctx.fill('evenodd');
    
    // Check center (should be white - the "hole")
    const centerOffset = (50 * surface.stride) + (50 * 4);
    const centerR = surface.data[centerOffset];
    log(`  Center pixel with evenodd: R=${centerR}`);
    
    // Center should be white (hole)
    if (centerR < 200) {
        throw new Error('Expected white center with evenodd rule');
    }
    
    savePNG(surface, 'evenodd-test.basic.png', 'evenodd fill test', SWCanvas);
});