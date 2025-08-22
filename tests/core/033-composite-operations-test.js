// Test: Composite Operations Test - globalCompositeOperation support
// Tests the new composite operations beyond source-over

// Test 33A: Basic composite operations validation
test('Composite operations - basic validation', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Test default value
    assertEquals(ctx.globalCompositeOperation, 'source-over');
    
    // Test setting valid operations
    const supportedOps = [
        'source-over', 'destination-over', 'source-atop', 'destination-atop',
        'source-in', 'destination-in', 'source-out', 'destination-out', 
        'xor', 'copy'
    ];
    
    for (const op of supportedOps) {
        ctx.globalCompositeOperation = op;
        assertEquals(ctx.globalCompositeOperation, op);
    }
});

// Test 33B: destination-out operation 
test('Composite operations - destination-out erases destination', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Draw red background
    ctx.setFillStyle(255, 0, 0, 255); // Red
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw blue circle with destination-out (should erase red where blue overlaps)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.setFillStyle(0, 0, 255, 255); // Blue
    ctx.fillRect(25, 25, 50, 50);
    
    // Check that center is now transparent (erased)
    const centerPixel = surface.getPixel(50, 50);
    assertEquals(centerPixel.a, 0); // Should be transparent
    
    // Check that corner still has red
    const cornerPixel = surface.getPixel(10, 10);
    assertEquals(cornerPixel.r, 255);
    assertEquals(cornerPixel.g, 0);
    assertEquals(cornerPixel.b, 0);
    assertEquals(cornerPixel.a, 255);
});

// Test 33C: xor operation
test('Composite operations - xor clears overlapping areas', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Draw red square
    ctx.setFillStyle(255, 0, 0, 255); // Red
    ctx.fillRect(20, 20, 40, 40);
    
    // Draw blue square with xor (overlapping area should be cleared)
    ctx.globalCompositeOperation = 'xor';
    ctx.setFillStyle(0, 0, 255, 255); // Blue
    ctx.fillRect(40, 40, 40, 40);
    
    // Check red-only area (should be red)
    const redPixel = surface.getPixel(30, 30);
    assertEquals(redPixel.r, 255);
    assertEquals(redPixel.a, 255);
    
    // Check blue-only area (should be blue)
    const bluePixel = surface.getPixel(70, 70);
    assertEquals(bluePixel.b, 255);
    assertEquals(bluePixel.a, 255);
    
    // Check overlapping area (should be transparent)
    const overlapPixel = surface.getPixel(50, 50);
    assertEquals(overlapPixel.a, 0); // Should be transparent
});

// Test 33D: source-atop operation
test('Composite operations - source-atop draws only where destination exists', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Draw red circle as destination
    ctx.setFillStyle(255, 0, 0, 255); // Red
    ctx.fillRect(30, 30, 40, 40);
    
    // Draw blue with source-atop (should only appear where red exists)
    ctx.globalCompositeOperation = 'source-atop';
    ctx.setFillStyle(0, 0, 255, 255); // Blue
    ctx.fillRect(20, 20, 40, 40); // Partially overlapping
    
    // Check area where both shapes overlap (should be blue)
    const overlapPixel = surface.getPixel(40, 40);
    assertEquals(overlapPixel.b, 255); // Blue on top
    
    // Check area where only blue would be (outside red) - should be transparent
    const blueOnlyPixel = surface.getPixel(25, 25);
    assertEquals(blueOnlyPixel.a, 0); // Should be transparent
    
    // Check area where only red exists (should still be red)
    const redOnlyPixel = surface.getPixel(60, 60);
    assertEquals(redOnlyPixel.r, 255);
    assertEquals(redOnlyPixel.a, 255);
});

// Test 33E: destination-atop operation
test('Composite operations - destination-atop keeps destination where source exists', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Draw red square as destination  
    ctx.setFillStyle(255, 0, 0, 255); // Red
    ctx.fillRect(30, 30, 40, 40);
    
    // Draw blue with destination-atop
    ctx.globalCompositeOperation = 'destination-atop';
    ctx.setFillStyle(0, 0, 255, 255); // Blue (defines where red should remain)
    ctx.fillRect(20, 20, 40, 40); // Partially overlapping
    
    // Check overlapping area (should show red, kept by blue mask)
    const overlapPixel = surface.getPixel(40, 40);
    assertEquals(overlapPixel.r, 255); // Red kept
    assertEquals(overlapPixel.a, 255);
    
    // Check area where only blue would be (should be blue) 
    const blueOnlyPixel = surface.getPixel(25, 25);
    assertEquals(blueOnlyPixel.b, 255);
    assertEquals(blueOnlyPixel.a, 255);
    
    // destination-atop should erase destination outside source region
    // With global compositing implementation, this now works correctly
    const redOnlyPixel = surface.getPixel(60, 60);
    assertEquals(redOnlyPixel.a, 0); // Red erased (now transparent) - correct behavior
});

// Test 33F: HTML5 Canvas-compatible API composite operations
test('Composite operations - HTML5 Canvas API compatibility', () => {
    const canvas = SWCanvas.createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    
    // Test default
    assertEquals(ctx.globalCompositeOperation, 'source-over');
    
    // Test setting and getting
    ctx.globalCompositeOperation = 'xor';
    assertEquals(ctx.globalCompositeOperation, 'xor');
    
    // Test that operations work through HTML5 API
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, 40, 40);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'blue';
    ctx.fillRect(30, 30, 40, 40);
    
    // Check that composite operation was applied
    const surface = canvas._coreSurface;
    const centerPixel = surface.getPixel(40, 40);
    assertEquals(centerPixel.a, 0); // Should be erased by destination-out
});