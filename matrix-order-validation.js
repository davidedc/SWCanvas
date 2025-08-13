#!/usr/bin/env node

// Validate matrix order test shows correct different positions
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function validateMatrixOrderTest() {
    console.log('=== Matrix Order Test Validation ===\n');
    
    const visualTest = VisualTestRegistry.getTest('transform-matrix-order');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Find red pixels (translate→scale)
    let redPixels = [];
    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const r = surface.data[offset];
            const g = surface.data[offset + 1];
            const b = surface.data[offset + 2];
            
            if (r > 200 && g < 50 && b < 50) {
                redPixels.push({x, y});
            }
        }
    }
    
    // Find blue pixels (scale→translate)
    let bluePixels = [];
    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const r = surface.data[offset];
            const g = surface.data[offset + 1];
            const b = surface.data[offset + 2];
            
            if (r < 50 && g < 50 && b > 200) {
                bluePixels.push({x, y});
            }
        }
    }
    
    console.log(`Red pixels found: ${redPixels.length}`);
    console.log(`Blue pixels found: ${bluePixels.length}`);
    
    if (redPixels.length > 0 && bluePixels.length > 0) {
        // Calculate centers of each square
        const redCenterX = Math.round(redPixels.reduce((sum, p) => sum + p.x, 0) / redPixels.length);
        const redCenterY = Math.round(redPixels.reduce((sum, p) => sum + p.y, 0) / redPixels.length);
        
        const blueCenterX = Math.round(bluePixels.reduce((sum, p) => sum + p.x, 0) / bluePixels.length);
        const blueCenterY = Math.round(bluePixels.reduce((sum, p) => sum + p.y, 0) / bluePixels.length);
        
        console.log(`\nRed square center (translate→scale): (${redCenterX}, ${redCenterY})`);
        console.log(`Blue square center (scale→translate): (${blueCenterX}, ${blueCenterY})`);
        
        // Expected positions based on our transforms:
        // Red: translate(30,30) then scale(2,2) → rect at (30,30) scaled to 40x40 → center ~(50,50)
        // Blue: scale(2,2) then translate(30,30) → rect at (60,60) scaled to 40x40 → center ~(80,80)
        
        console.log(`Expected red center: ~(50, 50)`);
        console.log(`Expected blue center: ~(80, 80)`);
        
        const distance = Math.sqrt((redCenterX - blueCenterX) ** 2 + (redCenterY - blueCenterY) ** 2);
        console.log(`Distance between centers: ${distance.toFixed(1)} pixels`);
        
        // Check if they're in different positions
        const significantlyDifferent = distance > 20; // Should be well separated
        
        console.log(`\n✨ Matrix order test: ${significantlyDifferent ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Transform order dependency: ${significantlyDifferent ? '✅ DEMONSTRATED' : '❌ NOT CLEAR'}`);
        
        // Additional validation: check if positions are roughly where we expect
        const redInExpectedArea = Math.abs(redCenterX - 50) < 15 && Math.abs(redCenterY - 50) < 15;
        const blueInExpectedArea = Math.abs(blueCenterX - 80) < 15 && Math.abs(blueCenterY - 80) < 15;
        
        console.log(`Red square positioning: ${redInExpectedArea ? '✅ CORRECT AREA' : '⚠️ UNEXPECTED POSITION'}`);
        console.log(`Blue square positioning: ${blueInExpectedArea ? '✅ CORRECT AREA' : '⚠️ UNEXPECTED POSITION'}`);
        
        return significantlyDifferent;
    } else {
        console.log('❌ Could not find both colored squares');
        return false;
    }
}

function testTransformMath() {
    console.log('\n=== Transform Math Verification ===\n');
    
    // Manual calculation to verify expected positions
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Test 1: translate(30,30) then scale(2,2)
    ctx.translate(30, 30);
    ctx.scale(2, 2);
    console.log('Translate→Scale matrix:', ctx._transform);
    
    const point1 = ctx._transform.transformPoint({x: 10, y: 10}); // Center of 20x20 rect
    console.log('Point (10,10) with T→S transforms to:', point1);
    
    // Reset for test 2
    ctx.resetTransform();
    
    // Test 2: scale(2,2) then translate(30,30) 
    ctx.scale(2, 2);
    ctx.translate(30, 30);
    console.log('Scale→Translate matrix:', ctx._transform);
    
    const point2 = ctx._transform.transformPoint({x: 10, y: 10}); // Center of 20x20 rect
    console.log('Point (10,10) with S→T transforms to:', point2);
    
    const diff = Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
    console.log(`Distance between transformed points: ${diff.toFixed(1)} pixels`);
    console.log(`Math confirms different results: ${diff > 10 ? '✅ YES' : '❌ NO'}`);
}

const visualTestPassed = validateMatrixOrderTest();
testTransformMath();

console.log(`\n🧮 Phase 1 Final Test: ${visualTestPassed ? '✅ COMPLETE' : '❌ NEEDS WORK'}`);