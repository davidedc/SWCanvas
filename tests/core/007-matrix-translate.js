// Test 007: Matrix translate
// This file will be concatenated into the main test suite

// Test 007
test('Matrix translate', () => {
    const m = new SWCanvas.Matrix();
    const result = m.translate(10, 20);
    assertEquals(result.e, 10);
    assertEquals(result.f, 20);
});