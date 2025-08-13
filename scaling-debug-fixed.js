#!/usr/bin/env node

// Fixed scaling debug with correct search ranges
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function debugScalingTestFixed() {
    console.log('=== Fixed SWCanvas Scaling Test Debug ===\n');
    
    // Run the actual scaling test
    const visualTest = VisualTestRegistry.getTest('transform-basic-scale');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Expected colors
    const RED = [255, 0, 0, 255];
    const BLUE = [0, 0, 255, 255];  
    const GREEN = [0, 128, 0, 255];
    
    console.log('=== RED SQUARE CHECK ===');
    console.log('Expected: (10,10) size 20x20, so center at (20,20)');
    checkPixel(surface, 20, 20, RED, 'Red square center');
    
    console.log('\n=== BLUE SQUARE CHECK (2x scale) ===');
    console.log('Expected transform: translate(60,10) + scale(2,2)');
    console.log('Expected position: fillRect(0,0,20,20) -> (120,20) to (160,60)');
    console.log('Expected center: (140, 40)');
    
    // Check expected center
    checkPixel(surface, 140, 40, BLUE, 'Blue square expected center');
    
    // Search in the correct area for blue pixels  
    console.log('\nSearching for blue pixels in expected area (115-165, 15-65):');
    let bluePixelsFound = [];
    for (let y = 15; y < 65; y += 2) {
        for (let x = 115; x < 165; x += 2) {
            const offset = (y * surface.stride) + (x * 4);
            const b = surface.data[offset + 2]; // Blue channel
            if (b > 200) {
                bluePixelsFound.push({x, y});
            }
        }
    }
    console.log(`Found ${bluePixelsFound.length} blue pixels in expected area`);
    if (bluePixelsFound.length > 0) {
        console.log('First few blue pixels:', bluePixelsFound.slice(0, 5));
        
        // Find bounding box of blue pixels
        const minX = Math.min(...bluePixelsFound.map(p => p.x));
        const maxX = Math.max(...bluePixelsFound.map(p => p.x));
        const minY = Math.min(...bluePixelsFound.map(p => p.y));
        const maxY = Math.max(...bluePixelsFound.map(p => p.y));
        console.log(`Blue square actual bounding box: (${minX},${minY}) to (${maxX},${maxY})`);
        console.log(`Blue square actual center: (${(minX+maxX)/2}, (${minY+maxY)/2)`);
    }
    
    console.log('\n=== GREEN SQUARE CHECK (0.5x scale) ===');
    console.log('Expected transform: translate(10,60) + scale(0.5,0.5)');
    console.log('Expected position: fillRect(0,0,40,40) -> (5,30) to (25,50)');  
    console.log('Expected center: (15, 40)');
    
    // Check expected center
    checkPixel(surface, 15, 40, GREEN, 'Green square expected center');
    
    // Search for green pixels in expected area
    console.log('\nSearching for green pixels in expected area (0-30, 25-55):');
    let greenPixelsFound = [];
    for (let y = 25; y < 55; y += 2) {
        for (let x = 0; x < 30; x += 2) {
            const offset = (y * surface.stride) + (x * 4);
            const g = surface.data[offset + 1]; // Green channel  
            if (g > 100) {
                greenPixelsFound.push({x, y});
            }
        }
    }
    console.log(`Found ${greenPixelsFound.length} green pixels in expected area`);
    if (greenPixelsFound.length > 0) {
        console.log('First few green pixels:', greenPixelsFound.slice(0, 5));
        
        // Find bounding box of green pixels
        const minX = Math.min(...greenPixelsFound.map(p => p.x));
        const maxX = Math.max(...greenPixelsFound.map(p => p.x));
        const minY = Math.min(...greenPixelsFound.map(p => p.y));
        const maxY = Math.max(...greenPixelsFound.map(p => p.y));
        console.log(`Green square actual bounding box: (${minX},${minY}) to (${maxX},${maxY})`);
        console.log(`Green square actual center: (${(minX+maxX)/2}, (${minY+maxY)/2)`);
    }
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

debugScalingTestFixed();