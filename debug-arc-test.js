// Debug test for arc semicircle issue
// Load SWCanvas
const SWCanvas = require('./dist/swcanvas.js');

console.log('Testing semicircle arc...');
console.log('SWCanvas loaded:', typeof SWCanvas);

// Create surface
const surface = SWCanvas.Surface(200, 100);
const ctx = new SWCanvas.Context2D(surface);

// White background
ctx.setFillStyle(255, 255, 255, 255);
ctx.fillRect(0, 0, 200, 100);

// Simple semicircle test
ctx.beginPath();
ctx.setFillStyle(0, 255, 0, 255); // Green
console.log('Before arc: current path commands =', ctx._currentPath.commands.length);
ctx.arc(100, 50, 30, 0, Math.PI);
console.log('After arc: current path commands =', ctx._currentPath.commands);
ctx.closePath();
console.log('After closePath: current path commands =', ctx._currentPath.commands);
ctx.fill();

// Save to file
SWCanvas.encodeBMP(surface, './debug-semicircle.bmp');
console.log('Saved debug-semicircle.bmp');

// Let's also check what the path flattener produces
console.log('\n--- Path Flattening Debug ---');

// We need to access the internal flattenPath function - let's eval the dist file to get access to it
const fs = require('fs');
const distCode = fs.readFileSync('./dist/swcanvas.js', 'utf8');
eval(distCode.replace('})();', '// Expose flattenPath\nglobal.flattenPath = flattenPath;\n})();'));

const flattenedPolygons = flattenPath(ctx._currentPath);
console.log('Number of polygons:', flattenedPolygons.length);
flattenedPolygons.forEach((poly, i) => {
    console.log(`Polygon ${i}: ${poly.length} points`);
    poly.forEach((pt, j) => {
        console.log(`  Point ${j}: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
    });
});