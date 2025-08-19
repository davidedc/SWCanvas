// Test: Matrix scale
// This file will be concatenated into the main test suite

test('Matrix scale', () => {
    const m = new SWCanvas.Core.Transform2D();
    const result = m.scale(2, 3);
    assertEquals(result.a, 2);
    assertEquals(result.d, 3);
});