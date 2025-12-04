// Test: Matrix multiplication
// This file will be concatenated into the main test suite

test('Matrix multiplication', () => {
    const m1 = new SWCanvas.Core.Transform2D([2, 0, 0, 2, 10, 20]);
    const m2 = new SWCanvas.Core.Transform2D([1, 0, 0, 1, 5, 5]);
    const result = m1.multiply(m2);
    assertEquals(result.a, 2);
    assertEquals(result.d, 2);
    // Correct matrix multiplication: e = a*e' + c*f' + e = 2*5 + 0*5 + 10 = 20
    assertEquals(result.e, 20);
    // Correct matrix multiplication: f = b*e' + d*f' + f = 0*5 + 2*5 + 20 = 30
    assertEquals(result.f, 30);
});