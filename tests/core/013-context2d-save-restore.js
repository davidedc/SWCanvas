// Test 013: Context2D state save/restore
// This file will be concatenated into the main test suite

// Test 013
test('Context2D state save/restore', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.globalAlpha = 0.8;
    assertEquals(ctx.globalAlpha, 0.8);
    
    ctx.restore();
    assertEquals(ctx.globalAlpha, 0.5);
});