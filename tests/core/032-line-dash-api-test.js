// Test: Line dash API functionality
// This file will be concatenated into the main test suite

test('Line dash API - setLineDash, getLineDash, lineDashOffset', () => {
    const surface = SWCanvas.Core.Surface(100, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // Test initial state
    assertEquals(ctx.getLineDash().length, 0, 'Initial dash pattern should be empty');
    assertEquals(ctx.lineDashOffset, 0, 'Initial dash offset should be 0');
    
    // Test setLineDash with valid array
    ctx.setLineDash([5, 10]);
    const dash1 = ctx.getLineDash();
    assertEquals(dash1.length, 2, 'Dash pattern should have 2 elements');
    assertEquals(dash1[0], 5, 'First dash element should be 5');
    assertEquals(dash1[1], 10, 'Second dash element should be 10');
    
    // Test mutation protection - modifying returned array should not affect internal state
    dash1[0] = 999;
    const dash2 = ctx.getLineDash();
    assertEquals(dash2[0], 5, 'Internal dash pattern should not be affected by external mutation');
    
    // Test odd-length array duplication behavior
    ctx.setLineDash([5, 10, 15]);
    const dash3 = ctx.getLineDash();
    assertEquals(dash3.length, 3, 'getLineDash should return original pattern length');
    assertEquals(dash3[0], 5, 'First element should be 5');
    assertEquals(dash3[1], 10, 'Second element should be 10');
    assertEquals(dash3[2], 15, 'Third element should be 15');
    
    // Test empty array resets to solid line
    ctx.setLineDash([]);
    const dash4 = ctx.getLineDash();
    assertEquals(dash4.length, 0, 'Empty array should reset to solid line');
    
    // Test lineDashOffset property
    ctx.lineDashOffset = 25.5;
    assertEquals(ctx.lineDashOffset, 25.5, 'lineDashOffset should accept decimal values');
    
    ctx.lineDashOffset = -15;
    assertEquals(ctx.lineDashOffset, -15, 'lineDashOffset should accept negative values');
    
    // Test save/restore preserves dash state
    ctx.setLineDash([8, 4, 2, 4]);
    ctx.lineDashOffset = 12;
    ctx.save();
    
    ctx.setLineDash([1, 1]);
    ctx.lineDashOffset = 0;
    
    ctx.restore();
    const restoredDash = ctx.getLineDash();
    assertEquals(restoredDash.length, 4, 'Restored dash pattern should have 4 elements');
    assertEquals(restoredDash[0], 8, 'Restored first element should be 8');
    assertEquals(restoredDash[3], 4, 'Restored fourth element should be 4');
    assertEquals(ctx.lineDashOffset, 12, 'Restored dash offset should be 12');
    
    // Test error cases
    let errorThrown = false;
    try {
        ctx.setLineDash("invalid");
    } catch (e) {
        errorThrown = true;
        assertEquals(e.message.includes('array'), true, 'Should throw error for non-array input');
    }
    assertEquals(errorThrown, true, 'Should throw error for invalid input');
    
    errorThrown = false;
    try {
        ctx.setLineDash([5, "invalid"]);
    } catch (e) {
        errorThrown = true;
        assertEquals(e.message.includes('numbers'), true, 'Should throw error for non-number elements');
    }
    assertEquals(errorThrown, true, 'Should throw error for invalid elements');
    
    errorThrown = false;
    try {
        ctx.setLineDash([5, -2]);
    } catch (e) {
        errorThrown = true;
        assertEquals(e.message.includes('negative'), true, 'Should throw error for negative values');
    }
    assertEquals(errorThrown, true, 'Should throw error for negative values');
    
    // Test with zero values (should be allowed)
    ctx.setLineDash([5, 0, 3]);
    const dashWithZero = ctx.getLineDash();
    assertEquals(dashWithZero[1], 0, 'Zero values should be allowed in dash pattern');
    
    // Test lineDashOffset with invalid values (should be ignored silently)
    ctx.lineDashOffset = "invalid";
    assertEquals(ctx.lineDashOffset, 12, 'Invalid lineDashOffset should be ignored');
    
    ctx.lineDashOffset = NaN;
    assertEquals(ctx.lineDashOffset, 12, 'NaN lineDashOffset should be ignored');
    
    console.log('✓ Line dash API test passed - all setLineDash, getLineDash, and lineDashOffset behaviors work correctly');
});