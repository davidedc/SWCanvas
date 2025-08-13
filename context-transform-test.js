#!/usr/bin/env node

// Test Context2D transform methods after fix
const SWCanvas = require('./dist/swcanvas.js');

function testContextTransforms() {
    console.log('=== Context2D Transform Test (After Fix) ===\n');
    
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    console.log('1. Initial transform:', ctx._transform);
    
    // Apply translate(60, 10)
    ctx.translate(60, 10);
    console.log('2. After translate(60, 10):', ctx._transform);
    
    // Apply scale(2, 2)
    ctx.scale(2, 2);
    console.log('3. After scale(2, 2):', ctx._transform);
    
    // Test point transformation
    const testPoint = {x: 10, y: 10};
    const result = ctx._transform.transformPoint(testPoint);
    console.log(`4. Point (10,10) transforms to: (${result.x}, ${result.y})`);
    
    console.log('\n=== Expected vs Actual ===');
    console.log('Expected matrix: a=2, b=0, c=0, d=2, e=60, f=10');
    console.log(`Actual matrix:   a=${ctx._transform.a}, b=${ctx._transform.b}, c=${ctx._transform.c}, d=${ctx._transform.d}, e=${ctx._transform.e}, f=${ctx._transform.f}`);
    
    console.log('Expected point: (80, 30)');
    console.log(`Actual point:   (${result.x}, ${result.y})`);
    
    const matches = ctx._transform.a === 2 && ctx._transform.b === 0 && 
                   ctx._transform.c === 0 && ctx._transform.d === 2 && 
                   ctx._transform.e === 60 && ctx._transform.f === 10 &&
                   result.x === 80 && result.y === 30;
    
    console.log(`\n✨ Transform fix ${matches ? '✅ SUCCESSFUL' : '❌ FAILED'}`);
}

testContextTransforms();