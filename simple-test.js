const SWCanvas = require('./index');

console.log('Starting simple test...');

const surface = SWCanvas.Surface(100, 100);
const ctx = new SWCanvas.Context2D(surface);

console.log('Created context, now calling fill...');

ctx.beginPath();
ctx.rect(10, 10, 20, 20);
ctx.fill();

console.log('Test complete');