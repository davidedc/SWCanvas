#!/usr/bin/env node

// Test matrix multiplication order
const SWCanvas = require('./dist/swcanvas.js');

function testMatrixOrder() {
    console.log('=== Matrix Order Test ===\n');
    
    // Test our Matrix class directly
    console.log('SWCanvas Matrix operations:');
    
    // Start with identity
    let transform = new SWCanvas.Matrix();
    console.log('1. Identity:', transform);
    
    // Apply translate(60, 10)
    const translateMatrix = new SWCanvas.Matrix().translate(60, 10);
    console.log('2. Translate matrix:', translateMatrix);
    
    transform = transform.multiply(translateMatrix);
    console.log('3. After multiply(translate):', transform);
    
    // Apply scale(2, 2)
    const scaleMatrix = new SWCanvas.Matrix().scale(2, 2);
    console.log('4. Scale matrix:', scaleMatrix);
    
    transform = transform.multiply(scaleMatrix);
    console.log('5. After multiply(scale):', transform);
    
    // Test point transformation
    const testPoint = {x: 10, y: 10};
    const result = transform.transformPoint(testPoint);
    console.log(`6. Point (10,10) transforms to: (${result.x}, ${result.y})`);
    
    console.log('\n=== Expected HTML5 Canvas Result ===');
    console.log('HTML5 Canvas should give: a=2, b=0, c=0, d=2, e=60, f=10');
    console.log('Point (10,10) should be at: (80, 30)');
    
    console.log('\n=== Testing Reverse Order ===');
    // Try the opposite order to see if that matches HTML5
    let reverseTransform = new SWCanvas.Matrix();
    reverseTransform = scaleMatrix.multiply(reverseTransform.multiply(translateMatrix));
    console.log('Scale * (Identity * Translate):', reverseTransform);
    
    const reverseResult = reverseTransform.transformPoint(testPoint);
    console.log(`Point (10,10) with reverse order: (${reverseResult.x}, ${reverseResult.y})`);
}

function testMatrixMultiplicationDirection() {
    console.log('\n\n=== Matrix Multiplication Direction Test ===\n');
    
    // Create specific test matrices
    const A = new SWCanvas.Matrix([1, 0, 0, 1, 60, 10]); // translate(60, 10)
    const B = new SWCanvas.Matrix([2, 0, 0, 2, 0, 0]);   // scale(2, 2)
    
    console.log('Matrix A (translate):', A);
    console.log('Matrix B (scale):', B);
    
    const AB = A.multiply(B);
    console.log('A * B (translate then scale):', AB);
    
    const BA = B.multiply(A);
    console.log('B * A (scale then translate):', BA);
    
    // Test which one matches HTML5 expected result
    console.log('\nExpected HTML5 result: a=2, b=0, c=0, d=2, e=60, f=10');
    
    // Transform test point with both
    const testPoint = {x: 10, y: 10};
    const resultAB = AB.transformPoint(testPoint);
    const resultBA = BA.transformPoint(testPoint);
    
    console.log(`A*B transforms (10,10) to: (${resultAB.x}, ${resultAB.y})`);
    console.log(`B*A transforms (10,10) to: (${resultBA.x}, ${resultBA.y})`);
    console.log('HTML5 expected: (80, 30)');
}

testMatrixOrder();
testMatrixMultiplicationDirection();