// Test: Complex path stroke with curves
// This file will be concatenated into the main test suite

test('Complex path stroke with curves', () => {
    const surface = SWCanvas.Core.Surface(150, 150);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 150, 150);
    
    // Draw a curved path
    ctx.setStrokeStyle(255, 165, 0, 255);
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.quadraticCurveTo(75, 20, 130, 50);
    ctx.quadraticCurveTo(100, 100, 50, 120);
    ctx.lineTo(20, 100);
    ctx.stroke();
    
    saveBMP(surface, 'stroke-curves.bmp', 'stroke curves test', SWCanvas);
});