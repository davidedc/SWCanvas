#!/usr/bin/env node

// Validate the rotation test is working correctly
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function validateRotationTest() {
    console.log('=== Rotation Test Validation ===\n');
    
    const visualTest = VisualTestRegistry.getTest('transform-basic-rotate');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Check red square (no transform) - should be at (20,20) to (45,45)
    console.log('=== RED SQUARE VALIDATION ===');
    checkArea(surface, 20, 20, 45, 45, [255, 0, 0, 255], 'Red square area');
    
    // Check blue square area - rotated 45° around (100, 40)
    // Expected area calculated from transform debug: around (82-118, 23-58)
    console.log('\n=== BLUE SQUARE VALIDATION ===');
    console.log('Expected: rotated 45° around (100, 40)');
    checkArea(surface, 95, 35, 105, 45, [0, 0, 255, 255], 'Blue square center area');
    
    // Check green square area - rotated 90° around (60, 100)  
    // Expected area calculated from transform debug: around (47-72, 88-113)
    console.log('\n=== GREEN SQUARE VALIDATION ===');
    console.log('Expected: rotated 90° around (60, 100)');
    checkArea(surface, 55, 95, 65, 105, [0, 128, 0, 255], 'Green square center area');
    
    // Count colored pixels by type
    let redPixels = 0, bluePixels = 0, greenPixels = 0, whitePixels = 0;
    
    for (let i = 0; i < surface.data.length; i += 4) {
        const r = surface.data[i];
        const g = surface.data[i + 1];
        const b = surface.data[i + 2];
        const a = surface.data[i + 3];
        
        if (r > 200 && g < 50 && b < 50) {
            redPixels++;
        } else if (r < 50 && g < 200 && b > 200) {
            bluePixels++;
        } else if (r < 50 && g > 100 && g < 150 && b < 50) {
            greenPixels++;
        } else if (r > 240 && g > 240 && b > 240) {
            whitePixels++;
        }
    }
    
    console.log('\n=== PIXEL COUNT SUMMARY ===');
    console.log(`Red pixels: ${redPixels}`);
    console.log(`Blue pixels: ${bluePixels}`);
    console.log(`Green pixels: ${greenPixels}`);
    console.log(`White pixels: ${whitePixels}`);
    console.log(`Total pixels: ${surface.width * surface.height}`);
    
    const expectedTotal = redPixels + bluePixels + greenPixels + whitePixels;
    const totalPixels = surface.width * surface.height;
    
    console.log(`\n✨ Rotation test ${expectedTotal === totalPixels ? '✅ SUCCESSFUL' : '❌ ISSUES DETECTED'}`);
    console.log(`All squares visible: ${redPixels > 0 && bluePixels > 0 && greenPixels > 0 ? '✅ YES' : '❌ NO'}`);
}

function checkArea(surface, x1, y1, x2, y2, expectedColor, label) {
    let matchingPixels = 0;
    let totalPixels = 0;
    
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            if (x >= 0 && x < surface.width && y >= 0 && y < surface.height) {
                const offset = (y * surface.stride) + (x * 4);
                const r = surface.data[offset];
                const g = surface.data[offset + 1];
                const b = surface.data[offset + 2];
                const a = surface.data[offset + 3];
                
                totalPixels++;
                if (r === expectedColor[0] && g === expectedColor[1] && 
                    b === expectedColor[2] && a === expectedColor[3]) {
                    matchingPixels++;
                }
            }
        }
    }
    
    const matchPercent = Math.round((matchingPixels / totalPixels) * 100);
    console.log(`${label}: ${matchingPixels}/${totalPixels} pixels match (${matchPercent}%)`);
    
    if (matchingPixels > 0) {
        console.log(`  ✅ Color found in expected area`);
    } else {
        console.log(`  ❌ Color not found in expected area`);
    }
}

validateRotationTest();