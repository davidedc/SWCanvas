const SWCanvas = require('./dist/swcanvas.js');

console.log('=== SPECIFIC PIXEL DEBUG: (60,25) ===');

// Test the exact scenario at pixel (60,25) which should be red circle over white background
const surface = SWCanvas.Core.Surface(150, 150);
const ctx = new SWCanvas.Core.Context2D(surface);

// White background  
ctx.setFillStyle(255, 255, 255, 255);
ctx.fillRect(0, 0, 150, 150);

console.log('Step 1: White background set');

// Check what's at (60,25) before adding blue square
let offset = 25 * surface.stride + 60 * 4;
let r = surface.data[offset], g = surface.data[offset + 1], b = surface.data[offset + 2], a = surface.data[offset + 3];
console.log(`(60,25) after white background: R=${r} G=${g} B=${b} A=${a}`);

// Add blue square at (30,30) size 60x60 -> covers (30,30) to (90,90)
ctx.setFillStyle(0, 0, 255, 255);  
ctx.fillRect(30, 30, 60, 60);

console.log('Step 2: Blue square added');

// Check what's at (60,25) after blue square (should still be white since y=25 < 30)
offset = 25 * surface.stride + 60 * 4;
r = surface.data[offset]; g = surface.data[offset + 1]; b = surface.data[offset + 2]; a = surface.data[offset + 3];
console.log(`(60,25) after blue square: R=${r} G=${g} B=${b} A=${a}`);

// Now set XOR and draw red circle - circle covers center (75,45) radius 25
// Point (60,25) distance from center: sqrt((60-75)^2 + (25-45)^2) = sqrt(225+400) = sqrt(625) = 25
// So (60,25) is exactly on the circle edge
ctx.globalCompositeOperation = 'xor';
ctx.setFillStyle(255, 0, 0, 255);
ctx.beginPath();
ctx.arc(75, 45, 25, 0, Math.PI * 2);
ctx.fill();

console.log('Step 3: Red circle with XOR added');

// Check final result at (60,25)
offset = 25 * surface.stride + 60 * 4;
r = surface.data[offset]; g = surface.data[offset + 1]; b = surface.data[offset + 2]; a = surface.data[offset + 3];
console.log(`(60,25) final result: R=${r} G=${g} B=${b} A=${a}`);

// Check distance calculation
const dx = 60 - 75;
const dy = 25 - 45; 
const distance = Math.sqrt(dx*dx + dy*dy);
console.log(`Distance from (60,25) to circle center (75,45): ${distance} (radius=25)`);
console.log(`Is (60,25) inside circle? ${distance <= 25}`);

// Also check a point that should definitely be inside
const testPoints = [
    [75, 45, 'circle center'],
    [75, 25, 'top of circle'],
    [75, 65, 'bottom of circle'], 
    [50, 45, 'left of circle'],
    [100, 45, 'right of circle'],
    [60, 25, 'our problem point']
];

console.log('\n=== CIRCLE COVERAGE ANALYSIS ===');
testPoints.forEach(([x, y, desc]) => {
    const dx = x - 75;
    const dy = y - 45;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const isInside = dist <= 25;
    
    const offset = y * surface.stride + x * 4;
    const r = surface.data[offset];
    const g = surface.data[offset + 1];
    const b = surface.data[offset + 2];
    const a = surface.data[offset + 3];
    
    console.log(`${desc} (${x},${y}): dist=${dist.toFixed(1)}, inside=${isInside}, color=RGB(${r},${g},${b}) A=${a}`);
});