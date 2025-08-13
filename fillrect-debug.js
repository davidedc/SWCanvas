#!/usr/bin/env node

// Debug fillRect transform application
const SWCanvas = require('./dist/swcanvas.js');

function debugFillRectTransform() {
    console.log('=== FillRect Transform Debug ===\n');
    
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Fill background white
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    
    // Apply the problematic transform sequence
    ctx.translate(60, 10);
    ctx.scale(2, 2);
    
    console.log('Transform matrix before fillRect:', ctx._transform);
    
    // Let's manually calculate what the rasterizer should do
    const transform = ctx._transform;
    console.log('\nManual corner transformation for fillRect(0, 0, 20, 20):');
    
    const corners = [
        {x: 0, y: 0, name: 'topLeft'},
        {x: 20, y: 0, name: 'topRight'}, 
        {x: 0, y: 20, name: 'bottomLeft'},
        {x: 20, y: 20, name: 'bottomRight'}
    ];
    
    corners.forEach(corner => {
        const transformed = transform.transformPoint(corner);
        console.log(`${corner.name} (${corner.x}, ${corner.y}) -> (${transformed.x}, ${transformed.y})`);
    });
    
    // Calculate bounding box
    const transformedCorners = corners.map(c => transform.transformPoint(c));
    const minX = Math.max(0, Math.floor(Math.min(...transformedCorners.map(p => p.x))));
    const maxX = Math.min(199, Math.ceil(Math.max(...transformedCorners.map(p => p.x))));
    const minY = Math.max(0, Math.floor(Math.min(...transformedCorners.map(p => p.y))));
    const maxY = Math.min(149, Math.ceil(Math.max(...transformedCorners.map(p => p.y))));
    
    console.log(`\nCalculated bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
    console.log(`Width: ${maxX - minX + 1}, Height: ${maxY - minY + 1}`);
    
    // Now actually draw the rectangle
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(0, 0, 20, 20);
    
    // Check if we have blue pixels in the expected area
    console.log('\nActual blue pixel detection in bounding box:');
    let blueCount = 0;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const blue = surface.data[offset + 2];
            if (blue > 200) {
                blueCount++;
                if (blueCount <= 5) { // Show first 5 blue pixels
                    console.log(`  Blue pixel at (${x}, ${y})`);
                }
            }
        }
    }
    console.log(`Total blue pixels in bounding box: ${blueCount}`);
    
    // Check entire image for blue pixels
    console.log('\nFull image blue pixel scan:');
    let totalBlue = 0;
    let firstBlue = null;
    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = (y * surface.stride) + (x * 4);
            const blue = surface.data[offset + 2];
            if (blue > 200) {
                totalBlue++;
                if (!firstBlue) {
                    firstBlue = {x, y};
                }
            }
        }
    }
    console.log(`Total blue pixels in entire image: ${totalBlue}`);
    if (firstBlue) {
        console.log(`First blue pixel found at: (${firstBlue.x}, ${firstBlue.y})`);
    }
}

debugFillRectTransform();