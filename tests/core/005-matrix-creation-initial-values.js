// Test 005: Matrix creation with initial values
// This file will be concatenated into the main test suite

// Test 005
test('Matrix creation with initial values', () => {
    const m = new SWCanvas.Core.Transform2D([2, 3, 4, 5, 6, 7]);
    assertEquals(m.a, 2);
    assertEquals(m.b, 3);
    assertEquals(m.c, 4);
    assertEquals(m.d, 5);
    assertEquals(m.e, 6);
    assertEquals(m.f, 7);
});