const SWCanvas = require('../dist/swcanvas.js');

console.log('=== GRAY BACKGROUND TEST ===');

// Create SWCanvas
const canvas = SWCanvas.createCanvas(300, 200);
const ctx = canvas.getContext('2d');

console.log('Step 1: Initial state');
let pixel = ctx.getImageData(100, 100, 1, 1).data;
console.log(`Initial pixel (100,100): RGBA(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`);

console.log('\nStep 2: Fill with gray background');
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, 300, 200);

// Check various pixels
const testPoints = [
    [25, 25, "Top-left"],
    [100, 100, "Center"], 
    [75, 175, "Bottom area"],
    [250, 150, "Bottom-right"]
];

for (const [x, y, desc] of testPoints) {
    pixel = ctx.getImageData(x, y, 1, 1).data;
    console.log(`${desc} (${x},${y}): RGBA(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`);
}

// Expected: all should be RGBA(240, 240, 240, 255)
console.log('\nExpected: all pixels should be RGBA(240, 240, 240, 255)');

console.log('\nStep 3: Clear rectangle (50, 50, 200, 100)');
ctx.clearRect(50, 50, 200, 100);

// Check the same points again
console.log('\nAfter clearRect:');
for (const [x, y, desc] of testPoints) {
    pixel = ctx.getImageData(x, y, 1, 1).data;
    const insideClearRect = (x >= 50 && x < 250 && y >= 50 && y < 150);
    const expected = insideClearRect ? "RGBA(0,0,0,0)" : "RGBA(240,240,240,255)";
    console.log(`${desc} (${x},${y}): RGBA(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}) - Expected: ${expected}`);
}