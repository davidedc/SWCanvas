const SWCanvas = require('./dist/swcanvas.js');

console.log('=== COORDINATE OVERLAP ANALYSIS ===');

// Test coordinates from minimal XOR test:
// Blue square: (30,30) size 60x60 → covers (30,30) to (90,90)
// Red circle: center (75,45) radius 25 → covers roughly (50,20) to (100,70)

console.log('Blue square bounds: (30,30) to (90,90)');
console.log('Red circle bounds: (50,20) to (100,70) [approx for radius 25]');

// Calculate overlap region
const blueLeft = 30, blueTop = 30, blueRight = 90, blueBottom = 90;
const circleLeft = 50, circleTop = 20, circleRight = 100, circleBottom = 70;

const overlapLeft = Math.max(blueLeft, circleLeft);
const overlapTop = Math.max(blueTop, circleTop);  
const overlapRight = Math.min(blueRight, circleRight);
const overlapBottom = Math.min(blueBottom, circleBottom);

console.log(`Expected overlap region: (${overlapLeft},${overlapTop}) to (${overlapRight},${overlapBottom})`);

if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
    const overlapWidth = overlapRight - overlapLeft;
    const overlapHeight = overlapBottom - overlapTop;
    console.log(`✓ OVERLAP EXISTS: ${overlapWidth}x${overlapHeight} pixels`);
} else {
    console.log('✗ NO OVERLAP!');
}

// Test specific points to see what's actually rendered
const surface = SWCanvas.Core.Surface(150, 150);
const ctx = new SWCanvas.Core.Context2D(surface);

// White background
ctx.setFillStyle(255, 255, 255, 255);
ctx.fillRect(0, 0, 150, 150);

// Blue square
ctx.setFillStyle(0, 0, 255, 255);
ctx.fillRect(30, 30, 60, 60);

console.log('\n=== BEFORE XOR ===');

// Check key points before XOR
const checkPoints = [
    [50, 30, 'Left edge of expected overlap'],
    [75, 45, 'Circle center (should be over blue)'],
    [70, 40, 'Center of expected overlap'],
    [85, 50, 'Right edge of expected overlap']
];

checkPoints.forEach(([x, y, desc]) => {
    const offset = y * surface.stride + x * 4;
    const r = surface.data[offset];
    const g = surface.data[offset + 1];
    const b = surface.data[offset + 2];
    const a = surface.data[offset + 3];
    
    let colorDesc = (r === 255 && g === 255 && b === 255) ? 'WHITE' : 
                   (r === 0 && g === 0 && b === 255) ? 'BLUE' : 
                   `RGB(${r},${g},${b})`;
    
    console.log(`Before XOR (${x},${y}) - ${desc}: ${colorDesc}`);
});

// Now apply XOR
ctx.globalCompositeOperation = 'xor';
ctx.setFillStyle(255, 0, 0, 255);
ctx.beginPath();
ctx.arc(75, 45, 25, 0, Math.PI * 2);
ctx.fill();

console.log('\n=== AFTER XOR ===');

checkPoints.forEach(([x, y, desc]) => {
    const offset = y * surface.stride + x * 4;
    const r = surface.data[offset];
    const g = surface.data[offset + 1];
    const b = surface.data[offset + 2];
    const a = surface.data[offset + 3];
    
    let colorDesc = (r === 255 && g === 255 && b === 255) ? 'WHITE' : 
                   (r === 0 && g === 0 && b === 255) ? 'BLUE' : 
                   (r === 255 && g === 0 && b === 0) ? 'RED' :
                   `RGB(${r},${g},${b})`;
    
    console.log(`After XOR (${x},${y}) - ${desc}: ${colorDesc} (A=${a})`);
});

// Test if the circle path actually covers the expected points
console.log('\n=== CIRCLE COVERAGE TEST ===');
const circleCenter = [75, 45];
const radius = 25;

checkPoints.forEach(([x, y, desc]) => {
    const dx = x - circleCenter[0];
    const dy = y - circleCenter[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isInCircle = distance <= radius;
    
    console.log(`Point (${x},${y}): distance=${distance.toFixed(1)}, radius=${radius}, inside=${isInCircle}`);
});