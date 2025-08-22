#!/usr/bin/env node
// Debug coordinate coverage to understand which areas should be what
const SWCanvas = require('./dist/swcanvas.js');

console.log('=== Coordinate Coverage Analysis ===\n');

// Blue square: (50, 40) size 60x60 → covers x: 50-110, y: 40-100
// Red circle: center (100, 70) radius 35

console.log('Blue square: (50, 40) size 60x60');
console.log('  Covers: x = 50 to 110, y = 40 to 100');

console.log('\nRed circle: center (100, 70) radius 35');
console.log('  Covers: x = 65 to 135, y = 35 to 105');

function isInBlueSquare(x, y) {
    return x >= 50 && x <= 110 && y >= 40 && y <= 100;
}

function isInRedCircle(x, y) {
    const dx = x - 100;
    const dy = y - 70;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= 35;
}

function analyzePoint(x, y, label) {
    const inBlue = isInBlueSquare(x, y);
    const inRed = isInRedCircle(x, y);
    
    let expected;
    if (inBlue && inRed) {
        expected = 'TRANSPARENT (overlap)';
    } else if (inBlue && !inRed) {
        expected = 'BLUE (blue only)';
    } else if (!inBlue && inRed) {
        expected = 'RED (red only)';
    } else {
        expected = 'WHITE (background)';
    }
    
    console.log(`${label} (${x},${y}): Blue=${inBlue}, Red=${inRed} → Expected: ${expected}`);
}

console.log('\n=== Point Analysis ===');
analyzePoint(40, 70, 'Left background');     // Should be outside both
analyzePoint(60, 70, 'Blue only area');      // Inside blue, outside red  
analyzePoint(70, 70, 'Previous test point'); // Need to check if this is overlap
analyzePoint(85, 70, 'Overlap area');        // Inside both
analyzePoint(120, 70, 'Red only area');      // Outside blue, inside red
analyzePoint(150, 70, 'Right background');   // Outside both

console.log('\n=== Testing Corrected Blue-Only Point ===');
// Test point (60, 70) which should be blue-only
const canvas = SWCanvas.createCanvas(200, 150);
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 200, 150);

ctx.fillStyle = 'blue';
ctx.fillRect(50, 40, 60, 60);

ctx.globalCompositeOperation = 'xor';
ctx.fillStyle = 'red';
ctx.beginPath();
ctx.arc(100, 70, 35, 0, Math.PI * 2);
ctx.fill();

function checkPixel(x, y, label) {
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b, a] = imageData.data;
    console.log(`${label} (${x},${y}): R=${r}, G=${g}, B=${b}, A=${a}`);
    return {r, g, b, a};
}

console.log('\nActual results:');
checkPixel(60, 70, 'True blue-only area');
checkPixel(85, 70, 'True overlap area');
checkPixel(120, 70, 'True red-only area');