// Test: Matrix translate
// This file will be concatenated into the main test suite

test('Matrix translate', () => {
    const m = new SWCanvas.Core.Transform2D();
    const result = m.translate(10, 20);
    assertEquals(result.e, 10);
    assertEquals(result.f, 20);
});