// Test 009: Matrix transform point
// This file will be concatenated into the main test suite

// Test 009
test('Matrix transform point', () => {
    const m = new SWCanvas.Core.Transform2D([2, 0, 0, 2, 10, 20]);
    const point = m.transformPoint({x: 5, y: 10});
    assertEquals(point.x, 20); // 5*2 + 10
    assertEquals(point.y, 40); // 10*2 + 20
});