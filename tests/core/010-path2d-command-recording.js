// Test 010: Path2D command recording
// This file will be concatenated into the main test suite

// Test 010
test('Path2D command recording', () => {
    const path = new SWCanvas.Core.Path2D();
    path.moveTo(10, 20);
    path.lineTo(30, 40);
    path.closePath();
    
    assertEquals(path.commands.length, 3);
    assertEquals(path.commands[0].type, 'moveTo');
    assertEquals(path.commands[0].x, 10);
    assertEquals(path.commands[0].y, 20);
    assertEquals(path.commands[1].type, 'lineTo');
    assertEquals(path.commands[2].type, 'closePath');
});