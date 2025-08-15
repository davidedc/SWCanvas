// Test 001: Surface creation with valid dimensions
// This file will be concatenated into the main test suite

// Test 001
test('Surface creation with valid dimensions', () => {
    const surface = SWCanvas.Surface(100, 50);
    assertEquals(surface.width, 100);
    assertEquals(surface.height, 50);
    assertEquals(surface.stride, 400); // 100 * 4
    assertEquals(surface.data.length, 20000); // 400 * 50
});