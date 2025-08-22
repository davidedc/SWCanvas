#!/usr/bin/env node
// Debug XOR coverage issue - why is blue-only area becoming transparent?
const SWCanvas = require('./dist/swcanvas.js');

console.log('=== XOR Coverage Debug ===\n');

// The issue: Blue-only areas (where only destination exists, no source) are becoming transparent
// But XOR should only affect pixels where SOURCE is drawn!

console.log('Key insight: XOR should be a LOCAL operation, not GLOBAL');
console.log('Local = only process pixels covered by the source');
console.log('Global = process all pixels on the canvas\n');

// Check if XOR is being treated as global
const fs = require('fs');
const rasterizerContent = fs.readFileSync('/Users/davidedellacasa/code/SWCanvas/src/Rasterizer.js', 'utf8');
const globalOpsMatch = rasterizerContent.match(/const globalOps = \[(.*?)\]/);

if (globalOpsMatch) {
    const globalOps = globalOpsMatch[1];
    console.log('Current global operations:', globalOps);
    
    if (globalOps.includes('xor')) {
        console.log('🚨 FOUND THE BUG: XOR is treated as GLOBAL operation!');
        console.log('But XOR should be LOCAL - it should only affect source-covered pixels');
        console.log('This explains why blue-only areas are being processed by XOR');
    } else {
        console.log('✓ XOR is correctly treated as LOCAL operation');
        console.log('The bug must be elsewhere...');
    }
} else {
    console.log('Could not find global operations list');
}

console.log('\n=== Expected XOR Behavior (LOCAL) ===');
console.log('1. Draw blue square → blue square exists');
console.log('2. XOR red circle → ONLY pixels covered by red circle are processed');
console.log('3. Blue pixels NOT covered by red circle should remain unchanged');
console.log('4. Blue pixels covered by red circle → XOR logic applies');

console.log('\n=== Current Behavior (if GLOBAL) ==='); 
console.log('1. Draw blue square → blue square exists');
console.log('2. XOR red circle → ALL pixels on canvas are processed');
console.log('3. Blue pixels NOT covered by red circle → still get XOR with transparent source');
console.log('4. This could make blue pixels transparent incorrectly');

// Test what happens when XOR processes blue pixel with transparent source
console.log('\n=== Testing XOR with Transparent Source ===');
const result = SWCanvas.Core.CompositeOperations.blendPixel(
    'xor',
    0, 0, 0, 0,        // Transparent source (no red circle here)
    0, 0, 255, 255     // Blue destination
);

console.log('Transparent source XOR Blue destination:');
console.log(`Result: R=${result.r}, G=${result.g}, B=${result.b}, A=${result.a}`);

if (result.a === 0) {
    console.log('🚨 BUG CONFIRMED: Transparent source makes blue destination disappear!');
    console.log('This should NOT happen. Transparent source should leave destination unchanged.');
} else if (result.b === 255) {
    console.log('✓ Correct: Transparent source leaves blue destination unchanged');
} else {
    console.log('? Unexpected result');
}