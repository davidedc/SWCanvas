// Test: Matrix multiplication
// This file will be concatenated into the main test suite

test('Matrix multiplication', () => {
    const m1 = new SWCanvas.Core.Transform2D([2, 0, 0, 2, 10, 20]);
    const m2 = new SWCanvas.Core.Transform2D([1, 0, 0, 1, 5, 5]);
    const result = m1.multiply(m2);
    assertEquals(result.a, 2);
    assertEquals(result.d, 2);
    assertEquals(result.e, 15); // 10 + 5*2
    assertEquals(result.f, 25); // 20 + 5*2
});