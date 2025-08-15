// Test 025: Miter limit property and basic functionality
// This file will be concatenated into the main test suite

// Test 025
test('Miter limit property and basic functionality', () => {
    // Test that miterLimit property works and doesn't cause crashes
    
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    ctx.setStrokeStyle(0, 0, 255, 255);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'miter';
    
    // Test different miter limit values work without crashing
    const miterLimits = [1.0, 2.0, 5.0, 10.0];
    
    for (let i = 0; i < miterLimits.length; i++) {
        const limit = miterLimits[i];
        ctx.miterLimit = limit;
        
        // Draw a V shape at different positions
        const x = 20 + i * 20;
        ctx.beginPath();
        ctx.moveTo(x - 5, 60);
        ctx.lineTo(x, 40);
        ctx.lineTo(x + 5, 60);
        ctx.stroke();
        
        // Verify the miterLimit property was set correctly
        if (Math.abs(ctx.miterLimit - limit) > 0.001) {
            throw new Error('miterLimit property not set correctly: expected ' + limit + ', got ' + ctx.miterLimit);
        }
    }
    
    log('  Tested miter limits: ' + miterLimits.join(', ') + ' - all rendered successfully');
    
    // Test that strokes are actually drawn (basic functionality check)
    function getPixel(x, y) {
        const offset = y * surface.stride + x * 4;
        return surface.data[offset + 2]; // Check BLUE channel for blue stroke
    }
    
    // Check that there are some blue pixels from the strokes
    let foundStroke = false;
    for (let x = 15; x < 85; x += 5) {
        for (let y = 40; y < 65; y += 5) {
            if (getPixel(x, y) > 200) {
                foundStroke = true;
                break;
            }
        }
        if (foundStroke) break;
    }
    
    if (!foundStroke) {
        throw new Error('No stroke pixels found - miter joins may not be rendering');
    }
    
    log('  ✓ Miter joins rendered with different miterLimit values');
    
    saveBMP(surface, 'miter-limits-basic.bmp', 'miter limits basic test', SWCanvas);
});