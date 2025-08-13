#!/usr/bin/env node

// Simple rotation test to debug the issue
const SWCanvas = require('./dist/swcanvas.js');

function simpleRotationTest() {
    console.log('=== Simple Rotation Test ===\n');
    
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Fill background white
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    console.log('After white background - checking corners:');
    console.log(`(0,0): rgba(${surface.data[0]}, ${surface.data[1]}, ${surface.data[2]}, ${surface.data[3]})`);
    console.log(`(99,99): rgba(${surface.data[(99*400)+(99*4)]}, ${surface.data[(99*400)+(99*4)+1]}, ${surface.data[(99*400)+(99*4)+2]}, ${surface.data[(99*400)+(99*4)+3]})`);
    
    // Try a simple rotation
    ctx.translate(50, 50);
    ctx.rotate(Math.PI / 4); // 45 degrees
    ctx.setFillStyle(255, 0, 0, 255);
    
    console.log('\nTransform matrix before fillRect:', ctx._transform);
    
    // Draw a small square
    ctx.fillRect(-5, -5, 10, 10);
    
    console.log('\nAfter rotated red square - checking around center:');
    
    // Check pixels around the center
    for (let y = 45; y <= 55; y++) {
        for (let x = 45; x <= 55; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const r = surface.data[offset];
            const g = surface.data[offset + 1]; 
            const b = surface.data[offset + 2];
            const a = surface.data[offset + 3];
            if (r > 100 || g > 100 || b > 100) { // Non-white pixel
                console.log(`Non-white pixel (${x},${y}): rgba(${r}, ${g}, ${b}, ${a})`);
            }
        }
    }
    
    // Count total non-white pixels
    let coloredPixels = 0;
    for (let i = 0; i < surface.data.length; i += 4) {
        const r = surface.data[i];
        const g = surface.data[i + 1];
        const b = surface.data[i + 2];
        if (r !== 255 || g !== 255 || b !== 255) {
            coloredPixels++;
        }
    }
    console.log(`\nTotal non-white pixels: ${coloredPixels}`);
}

simpleRotationTest();