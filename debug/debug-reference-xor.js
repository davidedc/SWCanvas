#!/usr/bin/env node
// Test the exact reference implementation XOR logic step by step
const SWCanvas = require('./dist/swcanvas.js');

console.log('=== Reference XOR Implementation Analysis ===\n');

// Reference XOR function: function(Dca, Da, Sca, Sa){return Sca * (1 - Da) + Dca * (1 - Sa);}
function referenceXOR(Dca, Da, Sca, Sa) {
    return Sca * (1 - Da) + Dca * (1 - Sa);
}

// Test the reference alpha formula: ao = f(dstA, dstA, srcA, srcA)
function referenceXORAlpha(dstA, srcA) {
    // Convert to 0-1 range
    const Da = dstA / 255;
    const Sa = srcA / 255;
    return referenceXOR(Da, Da, Sa, Sa);
}

// Test cases
function testCase(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA, desc) {
    console.log(`\n=== ${desc} ===`);
    console.log(`Source: R=${srcR}, G=${srcG}, B=${srcB}, A=${srcA}`);
    console.log(`Dest: R=${dstR}, G=${dstG}, B=${dstB}, A=${dstA}`);
    
    // Step 1: Calculate alpha using reference formula
    const alphaResult = referenceXORAlpha(dstA, srcA);
    const resultA = Math.round(255 * alphaResult);
    console.log(`Alpha calc: ${srcA/255} * (1 - ${dstA/255}) + ${dstA/255} * (1 - ${srcA/255}) = ${alphaResult}`);
    console.log(`Result alpha: ${resultA}`);
    
    if (resultA === 0) {
        console.log('Result: TRANSPARENT (alpha = 0)');
        return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    // Step 2: Calculate colors using reference formula (with premultiplied alpha)
    const srcRpremult = (srcR * srcA / 255) / 255;  // Premultiplied and normalized
    const srcGpremult = (srcG * srcA / 255) / 255;
    const srcBpremult = (srcB * srcA / 255) / 255;
    
    const dstRpremult = (dstR * dstA / 255) / 255;
    const dstGpremult = (dstG * dstA / 255) / 255;
    const dstBpremult = (dstB * dstA / 255) / 255;
    
    const Da = dstA / 255;
    const Sa = srcA / 255;
    
    const resultRpremult = referenceXOR(dstRpremult, Da, srcRpremult, Sa);
    const resultGpremult = referenceXOR(dstGpremult, Da, srcGpremult, Sa);
    const resultBpremult = referenceXOR(dstBpremult, Da, srcBpremult, Sa);
    
    // Convert back (divide by alpha to unpremultiply)
    const resultR = Math.round((resultRpremult / alphaResult) * 255);
    const resultG = Math.round((resultGpremult / alphaResult) * 255);
    const resultB = Math.round((resultBpremult / alphaResult) * 255);
    
    console.log(`Result colors: R=${resultR}, G=${resultG}, B=${resultB}, A=${resultA}`);
    
    // Compare with SWCanvas
    const swResult = SWCanvas.Core.CompositeOperations.blendPixel(
        'xor', srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA
    );
    console.log(`SWCanvas: R=${swResult.r}, G=${swResult.g}, B=${swResult.b}, A=${swResult.a}`);
    console.log(`Match: ${resultR === swResult.r && resultG === swResult.g && resultB === swResult.b && resultA === swResult.a ? 'YES' : 'NO'}`);
    
    return { r: resultR, g: resultG, b: resultB, a: resultA };
}

// Test the problematic cases
testCase(255, 0, 0, 255, 255, 255, 255, 255, 'Red over White (should show red?)');
testCase(255, 0, 0, 255, 0, 0, 255, 255, 'Red over Blue (should be transparent?)');
testCase(255, 0, 0, 255, 0, 0, 0, 0, 'Red over Transparent (should show red)');

console.log('\n=== CONCLUSION ===');
console.log('If the reference implementation also gives alpha=0 for Red over White,');
console.log('then the issue is NOT with the Porter-Duff math.');
console.log('The issue is that HTML5 Canvas XOR might not be using Porter-Duff at all!');
console.log('Or there\'s some additional logic beyond pure mathematical compositing.');