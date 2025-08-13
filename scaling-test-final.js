#!/usr/bin/env node

// Test scaling with fixed transforms
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

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

function testScalingAfterFix() {
    console.log('=== Scaling Test After Transform Fix ===\n');
    
    const visualTest = VisualTestRegistry.getTest('transform-basic-scale');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    const RED = [255, 0, 0, 255];
    const BLUE = [0, 0, 255, 255];  
    const GREEN = [0, 128, 0, 255];
    
    // Test sequence should now be:
    // 1. Red square at (10,10) size 20x20 -> center (20,20)
    // 2. Blue square: translate(60,10) + scale(2,2) + fillRect(0,0,20,20) 
    //    -> should be at (60,10) + (0,0)*2 to (60,10) + (20,20)*2 = (60,10) to (100,50)
    //    -> center at (80, 30)
    // 3. Green square: translate(10,60) + scale(0.5,0.5) + fillRect(0,0,40,40)
    //    -> should be at (10,60) + (0,0)*0.5 to (10,60) + (40,40)*0.5 = (10,60) to (30,80)  
    //    -> center at (20, 70)
    
    console.log('=== RED SQUARE TEST ===');
    checkPixel(surface, 20, 20, RED, 'Red square center (20,20)');
    
    console.log('\n=== BLUE SQUARE TEST ===');
    console.log('Expected: translate(60,10) + scale(2,2) -> center should be at (80,30)');
    checkPixel(surface, 80, 30, BLUE, 'Blue square expected center (80,30)');
    
    console.log('\n=== GREEN SQUARE TEST ==='); 
    console.log('Expected: translate(10,60) + scale(0.5,0.5) -> center should be at (20,70)');
    checkPixel(surface, 20, 70, GREEN, 'Green square expected center (20,70)');
    
    // If expected centers don't match, search for the actual positions
    console.log('\n=== SEARCHING FOR ACTUAL POSITIONS ===');
    
    console.log('Searching for blue pixels...');
    let bluePixels = [];
    for (let y = 0; y < surface.height; y += 3) {
        for (let x = 0; x < surface.width; x += 3) {
            const offset = (y * surface.stride) + (x * 4);
            if (surface.data[offset + 2] > 200) {
                bluePixels.push({x, y});
            }
        }
    }
    
    if (bluePixels.length > 0) {
        const minX = Math.min(...bluePixels.map(p => p.x));
        const maxX = Math.max(...bluePixels.map(p => p.x));
        const minY = Math.min(...bluePixels.map(p => p.y));
        const maxY = Math.max(...bluePixels.map(p => p.y));
        console.log(`Blue square found: (${minX},${minY}) to (${maxX},${maxY}), center: (${(minX+maxX)/2}, ${(minY+maxY)/2})`);
    }
    
    console.log('Searching for green pixels...');
    let greenPixels = [];
    for (let y = 0; y < surface.height; y += 3) {
        for (let x = 0; x < surface.width; x += 3) {
            const offset = (y * surface.stride) + (x * 4);
            if (surface.data[offset + 1] > 100) {
                greenPixels.push({x, y});
            }
        }
    }
    
    if (greenPixels.length > 0) {
        const minX = Math.min(...greenPixels.map(p => p.x));
        const maxX = Math.max(...greenPixels.map(p => p.x));
        const minY = Math.min(...greenPixels.map(p => p.y));
        const maxY = Math.max(...greenPixels.map(p => p.y));
        console.log(`Green square found: (${minX},${minY}) to (${maxX},${maxY}), center: (${(minX+maxX)/2}, ${(minY+maxY)/2})`);
    }
}

testScalingAfterFix();