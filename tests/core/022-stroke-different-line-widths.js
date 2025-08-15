// Test 022: Stroke with different line widths
// This file will be concatenated into the main test suite

// Test 022
test('Stroke with different line widths', () => {
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    
    ctx.setStrokeStyle(128, 0, 128, 255);
    
    const widths = [1, 3, 6, 10, 15];
    for (let i = 0; i < widths.length; i++) {
        const y = 25 + i * 25;
        ctx.lineWidth = widths[i];
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(180, y);
        ctx.stroke();
    }
    
    saveBMP(surface, 'stroke-widths.bmp', 'stroke widths test', SWCanvas);
});