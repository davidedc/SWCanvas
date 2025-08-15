// Test 011: Path2D rect convenience method
// This file will be concatenated into the main test suite

// Test 011
test('Path2D rect convenience method', () => {
    const path = new SWCanvas.Path2D();
    path.rect(10, 20, 100, 50);
    
    assertEquals(path.commands.length, 5); // moveTo + 3 lineTo + closePath
    assertEquals(path.commands[0].type, 'moveTo');
    assertEquals(path.commands[0].x, 10);
    assertEquals(path.commands[0].y, 20);
});