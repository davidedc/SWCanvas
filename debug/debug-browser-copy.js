const SWCanvas = require('./dist/swcanvas.js');

console.log('=== BROWSER COPY OPERATION DEBUG ===');

// Create the exact copy test scenario for browser comparison
const canvas = SWCanvas.createCanvas(300, 200);
const ctx = canvas.getContext('2d');

// Recreate the copy test exactly
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 300, 200);

// Purple base rectangle (rgba(128, 0, 128, 0.7))
ctx.fillStyle = 'rgba(128, 0, 128, 0.7)';
ctx.fillRect(10, 160, 40, 30);

// Apply copy with orange
ctx.globalCompositeOperation = 'copy';
ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
ctx.fillRect(20, 170, 20, 10);

// Check the result pixel
const imageData = ctx.getImageData(30, 175, 1, 1);
const r = imageData.data[0];
const g = imageData.data[1]; 
const b = imageData.data[2];
const a = imageData.data[3];

console.log(`SWCanvas result: R=${r} G=${g} B=${b} A=${a}`);

// What should this look like when rendered in browser?
// Browser will composite the semi-transparent result over white background
const alpha = a / 255;
const browserR = Math.round(r * alpha + 255 * (1 - alpha));
const browserG = Math.round(g * alpha + 255 * (1 - alpha));
const browserB = Math.round(b * alpha + 255 * (1 - alpha));

console.log(`Browser rendering: R=${browserR} G=${browserG} B=${browserB}`);
console.log('Expected orangy-yellow: R=255 G=210 B=128 (approx)');

// Let's also test what HTML5 Canvas would do
console.log('\n=== HTML5 CANVAS COMPARISON ===');

// Create a Node.js simulation of what HTML5 Canvas should do
// rgba(255, 165, 0, 0.5) with copy operation should replace the purple completely
// and then be rendered as semi-transparent orange over white

// Manual calculation of expected final color
const srcR = 255, srcG = 165, srcB = 0, srcA = 0.5;
const bgR = 255, bgG = 255, bgB = 255; // white background

const finalR = Math.round(srcR * srcA + bgR * (1 - srcA));
const finalG = Math.round(srcG * srcA + bgG * (1 - srcA));
const finalB = Math.round(srcB * srcA + bgB * (1 - srcA));

console.log(`HTML5 Canvas expected final: R=${finalR} G=${finalG} B=${finalB}`);
console.log(`This is: ${finalR === 255 ? 'bright' : 'muted'} orange/yellow`);

// Check if our implementation matches
const matches = (browserR === finalR && browserG === finalG && browserB === finalB);
console.log(`\nSWCanvas matches HTML5 Canvas: ${matches}`);
if (!matches) {
    console.log(`Difference: R${browserR-finalR} G${browserG-finalG} B${browserB-finalB}`);
}