// Test: arcTo API validation
// This file will be concatenated into the main core test suite

// Test 034
test('arcTo API parameter validation', () => {
    const surface = SWCanvas.Core.Surface(200, 200);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Test valid arcTo call - should not throw
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.arcTo(50, 10, 50, 50, 20);
    // Success if no error thrown
    
    // Test negative radius - should throw DOMException
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo(10, 10, 50, 50, -5);
    }, 'IndexSizeError');
    
    // Test non-number parameters - should throw TypeError
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo('10', 10, 50, 50, 5);
    }, 'TypeError');
    
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo(10, 10, 50, 50, 'radius');
    }, 'TypeError');
    
    // Test infinite values - should throw TypeError
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo(Infinity, 10, 50, 50, 5);
    }, 'TypeError');
    
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo(10, 10, 50, 50, Infinity);
    }, 'TypeError');
    
    // Test NaN values - should throw TypeError
    assertThrows(() => {
        const path = new SWCanvas.Core.SWPath2D();
        path.arcTo(NaN, 10, 50, 50, 5);
    }, 'TypeError');
});

// Test 034b
test('arcTo edge cases handling', () => {
    const path = new SWCanvas.Core.SWPath2D();
    
    // Test zero radius - should work (creates corner with lines)
    path.moveTo(10, 10);
    path.arcTo(50, 10, 50, 50, 0);
    
    // Test collinear points - should create line to first control point
    path.moveTo(10, 10);
    path.arcTo(30, 10, 50, 10, 5); // All points on horizontal line
    
    // Success if no errors thrown
});

// Test 034c 
test('arcTo path command recording', () => {
    const path = new SWCanvas.Core.SWPath2D();
    path.moveTo(10, 10);
    path.arcTo(50, 10, 50, 50, 20);
    
    // Verify command was recorded
    assertEquals(path.commands.length, 2);
    assertEquals(path.commands[0].type, 'moveTo');
    assertEquals(path.commands[1].type, 'arcTo');
    assertEquals(path.commands[1].x1, 50);
    assertEquals(path.commands[1].y1, 10);
    assertEquals(path.commands[1].x2, 50);
    assertEquals(path.commands[1].y2, 50);
    assertEquals(path.commands[1].radius, 20);
});

// Test 034d
test('arcTo HTML5 Canvas compatibility API', () => {
    const canvas = SWCanvas.createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    
    // Test method exists and works
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.arcTo(50, 10, 50, 50, 20);
    
    // Should not throw error
    ctx.stroke();
});