#!/usr/bin/env node

// Test orange color consistency
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function testOrangeColorConsistency() {
    console.log('=== Orange Color Consistency Test ===\n');
    
    // Test the "Multiple transforms combined" test
    const visualTest = VisualTestRegistry.getTest('transform-combined-operations');
    const surface = visualTest.drawSWCanvas(SWCanvas);
    
    console.log(`Surface dimensions: ${surface.width}x${surface.height}\n`);
    
    // Find orange pixels and check their exact RGB values
    let orangePixels = [];
    
    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const r = surface.data[offset];
            const g = surface.data[offset + 1];
            const b = surface.data[offset + 2];
            const a = surface.data[offset + 3];
            
            // Check if this looks like orange (high red, medium green, low blue)
            if (r > 200 && g > 100 && g < 200 && b < 50) {
                orangePixels.push({x, y, r, g, b, a});
            }
        }
    }
    
    console.log(`Found ${orangePixels.length} orange pixels`);
    
    if (orangePixels.length > 0) {
        // Get the first orange pixel to check exact color values
        const firstOrange = orangePixels[0];
        console.log(`First orange pixel: rgba(${firstOrange.r}, ${firstOrange.g}, ${firstOrange.b}, ${firstOrange.a})`);
        
        // Check if it matches CSS orange: rgb(255, 165, 0)
        const expectedR = 255, expectedG = 165, expectedB = 0;
        const matchesCSS = firstOrange.r === expectedR && 
                          firstOrange.g === expectedG && 
                          firstOrange.b === expectedB;
        
        console.log(`Expected CSS orange: rgba(${expectedR}, ${expectedG}, ${expectedB}, 255)`);
        console.log(`Color match: ${matchesCSS ? '✅ PERFECT MATCH' : '❌ MISMATCH'}`);
        
        // Count how many pixels match the exact expected color
        let exactMatches = orangePixels.filter(p => 
            p.r === expectedR && p.g === expectedG && p.b === expectedB
        ).length;
        
        console.log(`Exact CSS orange matches: ${exactMatches}/${orangePixels.length} pixels`);
        
        return matchesCSS;
    } else {
        console.log('❌ No orange pixels found');
        return false;
    }
}

function testSimpleOrangeColor() {
    console.log('\n=== Simple Orange Color Test ===\n');
    
    // Test orange color directly
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // CSS Orange rectangle
    ctx.setFillStyle(255, 165, 0, 255);
    ctx.fillRect(25, 25, 50, 50);
    
    // Check the center pixel
    const centerOffset = (50 * surface.stride) + (50 * 4);
    const r = surface.data[centerOffset];
    const g = surface.data[centerOffset + 1];
    const b = surface.data[centerOffset + 2];
    const a = surface.data[centerOffset + 3];
    
    console.log(`Center pixel: rgba(${r}, ${g}, ${b}, ${a})`);
    console.log(`Expected:     rgba(255, 165, 0, 255)`);
    
    const matches = r === 255 && g === 165 && b === 0 && a === 255;
    console.log(`Direct test: ${matches ? '✅ PERFECT MATCH' : '❌ MISMATCH'}`);
    
    return matches;
}

const complexTestPassed = testOrangeColorConsistency();
const simpleTestPassed = testSimpleOrangeColor();

console.log(`\n🎨 Orange Color Fix: ${complexTestPassed && simpleTestPassed ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);