#!/usr/bin/env node

// Very simple debug to check what's happening
const SWCanvas = require('./dist/swcanvas.js');

function simpleDebug() {
    console.log('=== Simple Debug ===\n');
    
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Fill background white
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    
    console.log('After white background - checking a few pixels:');
    console.log(`Pixel (0,0): rgba(${surface.data[0]}, ${surface.data[1]}, ${surface.data[2]}, ${surface.data[3]})`);
    console.log(`Pixel (100,75): rgba(${surface.data[(75*800)+(100*4)]}, ${surface.data[(75*800)+(100*4)+1]}, ${surface.data[(75*800)+(100*4)+2]}, ${surface.data[(75*800)+(100*4)+3]})`);
    
    // Draw a small blue rectangle without any transforms
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(50, 50, 10, 10);
    
    console.log('\nAfter blue square - checking pixels in and around (50,50):');
    for (let y = 48; y <= 52; y++) {
        for (let x = 48; x <= 52; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const r = surface.data[offset];
            const g = surface.data[offset + 1]; 
            const b = surface.data[offset + 2];
            const a = surface.data[offset + 3];
            console.log(`Pixel (${x},${y}): rgba(${r}, ${g}, ${b}, ${a})`);
        }
    }
}

simpleDebug();