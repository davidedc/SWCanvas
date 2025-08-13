#!/usr/bin/env node

// Debug transform matrices step by step
const SWCanvas = require('./dist/swcanvas.js');

function debugTransformSteps() {
    console.log('=== Transform Matrix Debug ===\n');
    
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Test the transforms manually
    console.log('Initial transform:', ctx._transform);
    
    console.log('\n1. After translate(60, 10):');
    ctx.translate(60, 10);
    console.log('Transform matrix:', ctx._transform);
    
    console.log('\n2. After scale(2, 2):');
    ctx.scale(2, 2);
    console.log('Transform matrix:', ctx._transform);
    
    // Test point transformation
    const testPoints = [
        {x: 0, y: 0, desc: 'Origin (0,0)'},
        {x: 20, y: 20, desc: 'fillRect bottom-right (20,20)'},
        {x: 10, y: 10, desc: 'fillRect center (10,10)'}
    ];
    
    console.log('\n3. Point transformations with current matrix:');
    testPoints.forEach(point => {
        const transformed = ctx._transform.transformPoint(point);
        console.log(`${point.desc}: (${point.x}, ${point.y}) -> (${transformed.x}, ${transformed.y})`);
    });
    
    console.log('\n4. After resetTransform():');
    ctx.resetTransform();
    console.log('Transform matrix:', ctx._transform);
    
    console.log('\n5. After translate(10, 60):');
    ctx.translate(10, 60);
    console.log('Transform matrix:', ctx._transform);
    
    console.log('\n6. After scale(0.5, 0.5):');
    ctx.scale(0.5, 0.5);
    console.log('Transform matrix:', ctx._transform);
    
    console.log('\n7. Point transformations for green square:');
    testPoints.forEach(point => {
        const transformed = ctx._transform.transformPoint(point);
        console.log(`${point.desc}: (${point.x}, ${point.y}) -> (${transformed.x}, ${transformed.y})`);
    });
}

function testMatrixDirectly() {
    console.log('\n\n=== Direct Matrix Tests ===\n');
    
    // Test Matrix class directly
    const identity = new SWCanvas.Matrix();
    console.log('Identity matrix:', identity);
    
    const translated = identity.translate(60, 10);
    console.log('After translate(60, 10):', translated);
    
    const scaled = translated.scale(2, 2);
    console.log('After scale(2, 2):', scaled);
    
    // Test point with this matrix
    const testPoint = {x: 10, y: 10};
    const result = scaled.transformPoint(testPoint);
    console.log(`Point (10, 10) transformed to: (${result.x}, ${result.y})`);
    console.log('Expected: (60 + 10*2, 10 + 10*2) = (80, 30)');
}

debugTransformSteps();
testMatrixDirectly();