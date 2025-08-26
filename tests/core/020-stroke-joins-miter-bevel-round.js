// Test: Stroke joins - miter, bevel, round
// This file will be concatenated into the main test suite

test('Stroke joins - miter, bevel, round', () => {
    const surface = SWCanvas.Core.Surface(300, 100);
    const ctx = new SWCanvas.Core.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 300, 100);
    
    ctx.setStrokeStyle(0, 0, 255, 255);
    ctx.lineWidth = 8;
    
    // Miter join
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(50, 50);
    ctx.lineTo(80, 20);
    ctx.stroke();
    
    // Bevel join
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(120, 20);
    ctx.lineTo(150, 50);
    ctx.lineTo(180, 20);
    ctx.stroke();
    
    // Round join
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(220, 20);
    ctx.lineTo(250, 50);
    ctx.lineTo(280, 20);
    ctx.stroke();
    
    savePNG(surface, 'stroke-joins.basic.png', 'stroke joins test', SWCanvas);
});