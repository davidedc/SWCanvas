#!/usr/bin/env node

// Debug scaling test by checking pixel positions
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

function debugScalingTest() {
    console.log('=== SWCanvas Scaling Test Debug ===\n');
    
    // Run the SWCanvas scaling test
    const visualTest = VisualTestRegistry.getTest('transform-basic-scale');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Expected colors
    const RED = [255, 0, 0, 255];
    const BLUE = [0, 0, 255, 255];  
    const GREEN = [0, 128, 0, 255];
    const WHITE = [255, 255, 255, 255];
    
    // Check expected positions
    console.log('Expected positions:');
    checkPixel(surface, 20, 20, RED, 'Red square center (20, 20)');
    checkPixel(surface, 80, 30, BLUE, 'Blue square center (80, 30) - translate(60,10) + scale(2x) center');
    checkPixel(surface, 20, 70, GREEN, 'Green square center (20, 70) - translate(10,60) + scale(0.5x) center');
    
    console.log('\nActual blue square search (looking for blue pixels):');
    let bluePixelsFound = [];
    for (let y = 5; y < 60; y += 5) {
        for (let x = 50; x < 120; x += 5) {
            const offset = (y * surface.stride) + (x * 4);
            const b = surface.data[offset + 2]; // Blue channel
            if (b > 200) {
                bluePixelsFound.push({x, y, b});
            }
        }
    }
    
    console.log(`Found ${bluePixelsFound.length} blue pixel locations:`);
    bluePixelsFound.slice(0, 10).forEach(pixel => {
        console.log(`  Blue pixel at (${pixel.x}, ${pixel.y}) - blue value: ${pixel.b}`);
    });
    
    console.log('\nActual green square search (looking for green pixels):');
    let greenPixelsFound = [];
    for (let y = 50; y < 90; y += 5) {
        for (let x = 5; x < 40; x += 5) {
            const offset = (y * surface.stride) + (x * 4);
            const g = surface.data[offset + 1]; // Green channel
            if (g > 100) {
                greenPixelsFound.push({x, y, g});
            }
        }
    }
    
    console.log(`Found ${greenPixelsFound.length} green pixel locations:`);
    greenPixelsFound.slice(0, 10).forEach(pixel => {
        console.log(`  Green pixel at (${pixel.x}, ${pixel.y}) - green value: ${pixel.g}`);
    });
}

debugScalingTest();