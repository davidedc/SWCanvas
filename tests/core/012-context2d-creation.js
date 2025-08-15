// Test 012: Context2D creation
// This file will be concatenated into the main test suite

// Test 012
test('Context2D creation', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    assertEquals(ctx.globalAlpha, 1.0);
    assertEquals(ctx.globalCompositeOperation, 'source-over');
});