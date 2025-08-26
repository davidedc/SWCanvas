// Test: Miter limit test
// This file will be concatenated into the main test suite

test('Miter limit test', () => {
    const surface = SWCanvas.Core.Surface(200, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 100);
    
    ctx.setStrokeStyle(255, 0, 255, 255);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'miter';
    
    // Sharp angle with default miter limit (should create miter)
    ctx.miterLimit = 10;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(50, 50);
    ctx.lineTo(60, 20);
    ctx.stroke();
    
    // Very sharp angle with low miter limit (should fallback to bevel)
    ctx.miterLimit = 2;
    ctx.beginPath();
    ctx.moveTo(140, 20);
    ctx.lineTo(150, 50);
    ctx.lineTo(160, 20);
    ctx.stroke();
    
    savePNG(surface, 'stroke-miter-limit.basic.png', 'stroke miter limit test', SWCanvas);
});