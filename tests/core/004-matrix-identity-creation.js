// Test 004: Matrix identity creation
// This file will be concatenated into the main test suite

// Test 004
test('Matrix identity creation', () => {
    const m = new SWCanvas.Transform2D();
    assertEquals(m.a, 1);
    assertEquals(m.b, 0);
    assertEquals(m.c, 0);
    assertEquals(m.d, 1);
    assertEquals(m.e, 0);
    assertEquals(m.f, 0);
});