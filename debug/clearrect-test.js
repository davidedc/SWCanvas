const SWCanvas = require('../dist/swcanvas.js');

console.log('=== CLEAR RECT TEST ===');

// Create SWCanvas
const canvas = SWCanvas.createCanvas(200, 150);
const ctx = canvas.getContext('2d');

console.log('Initial surface state:');
const surface = canvas._coreSurface;
let hasNonTransparent = false;
for (let i = 0; i < surface.data.length; i += 4) {
    if (surface.data[i] !== 0 || surface.data[i+1] !== 0 || surface.data[i+2] !== 0 || surface.data[i+3] !== 0) {
        hasNonTransparent = true;
        console.log(`Non-transparent pixel at offset ${i}: RGBA(${surface.data[i]}, ${surface.data[i+1]}, ${surface.data[i+2]}, ${surface.data[i+3]})`);
        break;
    }
}
if (!hasNonTransparent) {
    console.log('✓ Surface is initially transparent');
}

// Step 1: Fill with gray background
console.log('\nStep 1: Fill with gray background');
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, 200, 150);

// Check a pixel in the background
const bgPixel = ctx.getImageData(100, 100, 1, 1).data;
console.log(`Background pixel: RGBA(${bgPixel[0]}, ${bgPixel[1]}, ${bgPixel[2]}, ${bgPixel[3]})`);

// Step 2: Clear a rectangle
console.log('\nStep 2: Clear rectangle (50, 50, 100, 50)');
ctx.clearRect(50, 50, 100, 50);

// Check pixels inside and outside the cleared area
const clearedPixel = ctx.getImageData(100, 75, 1, 1).data;
const outsidePixel = ctx.getImageData(25, 25, 1, 1).data;

console.log(`Cleared area pixel: RGBA(${clearedPixel[0]}, ${clearedPixel[1]}, ${clearedPixel[2]}, ${clearedPixel[3]})`);
console.log(`Outside area pixel: RGBA(${outsidePixel[0]}, ${outsidePixel[1]}, ${outsidePixel[2]}, ${outsidePixel[3]})`);

// Expected: cleared area should be (0,0,0,0), outside should be gray
const isCleared = clearedPixel[0] === 0 && clearedPixel[1] === 0 && clearedPixel[2] === 0 && clearedPixel[3] === 0;
console.log(isCleared ? '✓ clearRect working correctly' : '✗ clearRect NOT working - should be transparent');