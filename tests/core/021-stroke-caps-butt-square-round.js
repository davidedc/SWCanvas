// Test: Stroke caps - butt, square, round
// This file will be concatenated into the main test suite

test('Stroke caps - butt, square, round', () => {
    const surface = SWCanvas.Core.Surface(300, 150);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 300, 150);
    
    ctx.setStrokeStyle(0, 128, 0, 255);
    ctx.lineWidth = 12;
    
    // Butt caps
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(50, 70);
    ctx.stroke();
    
    // Square caps
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(150, 30);
    ctx.lineTo(150, 70);
    ctx.stroke();
    
    // Round caps
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(250, 30);
    ctx.lineTo(250, 70);
    ctx.stroke();
    
    savePNG(surface, 'stroke-caps.basic.png', 'stroke caps test', SWCanvas);
});