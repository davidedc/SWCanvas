#!/usr/bin/env node

// Debug rotation test
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function debugRotationTest() {
    console.log('=== Rotation Test Debug ===\n');
    
    const visualTest = VisualTestRegistry.getTest('transform-basic-rotate');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Check red square (no transform)
    console.log('=== RED SQUARE (No Transform) ===');
    checkPixel(surface, 32, 32, [255, 0, 0, 255], 'Red square center');
    
    // Check if blue square exists anywhere
    console.log('\n=== BLUE SQUARE SEARCH ===');
    let bluePixels = [];
    for (let y = 0; y < surface.height; y += 2) {
        for (let x = 0; x < surface.width; x += 2) {
            const offset = (y * surface.stride) + (x * 4);
            if (surface.data[offset + 2] > 200) { // Blue channel
                bluePixels.push({x, y});
            }
        }
    }
    
    console.log(`Found ${bluePixels.length} blue pixels`);
    if (bluePixels.length > 0) {
        const minX = Math.min(...bluePixels.map(p => p.x));
        const maxX = Math.max(...bluePixels.map(p => p.x));
        const minY = Math.min(...bluePixels.map(p => p.y));
        const maxY = Math.max(...bluePixels.map(p => p.y));
        console.log(`Blue pixels range: (${minX},${minY}) to (${maxX},${maxY})`);
        console.log('First few blue pixels:', bluePixels.slice(0, 5));
    }
    
    // Check if green square exists anywhere
    console.log('\n=== GREEN SQUARE SEARCH ===');
    let greenPixels = [];
    for (let y = 0; y < surface.height; y += 2) {
        for (let x = 0; x < surface.width; x += 2) {
            const offset = (y * surface.stride) + (x * 4);
            if (surface.data[offset + 1] > 100) { // Green channel
                greenPixels.push({x, y});
            }
        }
    }
    
    console.log(`Found ${greenPixels.length} green pixels`);
    if (greenPixels.length > 0) {
        const minX = Math.min(...greenPixels.map(p => p.x));
        const maxX = Math.max(...greenPixels.map(p => p.x));
        const minY = Math.min(...greenPixels.map(p => p.y));
        const maxY = Math.max(...greenPixels.map(p => p.y));
        console.log(`Green pixels range: (${minX},${minY}) to (${maxX},${maxY})`);
        console.log('First few green pixels:', greenPixels.slice(0, 5));
    }
    
    // Test transforms step by step
    console.log('\n=== TRANSFORM DEBUG ===');
    testRotationTransforms();
}

function testRotationTransforms() {
    console.log('Blue square transform sequence:');
    const ctx1 = new (require('./dist/swcanvas.js')).Context2D(require('./dist/swcanvas.js').Surface(200, 150));
    console.log('1. Initial:', ctx1._transform);
    
    ctx1.translate(100, 40);
    console.log('2. After translate(100, 40):', ctx1._transform);
    
    ctx1.rotate(Math.PI / 4);
    console.log('3. After rotate(45°):', ctx1._transform);
    
    // Calculate where the corners of fillRect(-12, -12, 25, 25) would end up
    const corners = [
        {x: -12, y: -12, name: 'topLeft'},
        {x: 13, y: -12, name: 'topRight'},
        {x: -12, y: 13, name: 'bottomLeft'},
        {x: 13, y: 13, name: 'bottomRight'}
    ];
    
    console.log('4. Corner transformations:');
    corners.forEach(corner => {
        const transformed = ctx1._transform.transformPoint(corner);
        console.log(`   ${corner.name} (${corner.x}, ${corner.y}) -> (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`);
    });
    
    console.log('\nGreen square transform sequence:');
    const ctx2 = new (require('./dist/swcanvas.js')).Context2D(require('./dist/swcanvas.js').Surface(200, 150));
    
    ctx2.translate(60, 100);
    console.log('1. After translate(60, 100):', ctx2._transform);
    
    ctx2.rotate(Math.PI / 2);
    console.log('2. After rotate(90°):', ctx2._transform);
    
    console.log('3. Corner transformations:');
    corners.forEach(corner => {
        const transformed = ctx2._transform.transformPoint(corner);
        console.log(`   ${corner.name} (${corner.x}, ${corner.y}) -> (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`);
    });
}

function checkPixel(surface, x, y, expectedColor, label) {
    if (x < 0 || x >= surface.width || y < 0 || y >= surface.height) {
        console.log(`${label}: Position (${x}, ${y}) is out of bounds`);
        return false;
    }
    
    const offset = (y * surface.stride) + (x * 4);
    const r = surface.data[offset];
    const g = surface.data[offset + 1];
    const b = surface.data[offset + 2];
    const a = surface.data[offset + 3];
    
    console.log(`${label}: Position (${x}, ${y}) = rgba(${r}, ${g}, ${b}, ${a})`);
    
    if (expectedColor) {
        const match = r === expectedColor[0] && g === expectedColor[1] && 
                      b === expectedColor[2] && a === expectedColor[3];
        console.log(`  Expected: rgba(${expectedColor[0]}, ${expectedColor[1]}, ${expectedColor[2]}, ${expectedColor[3]}) - ${match ? '✅ MATCH' : '❌ MISMATCH'}`);
        return match;
    }
    return true;
}

debugRotationTest();