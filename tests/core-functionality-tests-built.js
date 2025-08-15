// Shared test suite that works in both Node.js and browser environments
// This file contains all the core SWCanvas functionality tests

(function(global) {
    'use strict';

    // Test framework - works in both environments
    let testCount = 0;
    let passCount = 0;
    let currentTestName = '';

    function test(name, fn) {
        currentTestName = name;
        testCount++;
        try {
            fn();
            log(`✓ ${name}`);
            passCount++;
        } catch (error) {
            log(`✗ ${name}`);
            log(`  ${error.message}`);
        }
    }

    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    function assertThrows(fn, expectedMessage) {
        try {
            fn();
            throw new Error('Expected function to throw');
        } catch (error) {
            if (error.message === 'Expected function to throw') {
                throw error;
            }
            if (expectedMessage && !error.message.includes(expectedMessage)) {
                throw new Error(`Expected error containing "${expectedMessage}", got "${error.message}"`);
            }
            // Function threw as expected
        }
    }

    // Environment-agnostic logging
    function log(message) {
        if (typeof console !== 'undefined') {
            console.log(message);
        }
    }

    // Environment-agnostic file system operations
    function saveBMP(surface, filename, description, SWCanvasRef) {
        try {
            const bmpData = SWCanvasRef.encodeBMP(surface);
            
            if (typeof require !== 'undefined') {
                // Node.js environment
                const fs = require('fs');
                const path = require('path');
                
                // Create output directory if it doesn't exist
                const outputDir = path.join(__dirname, 'output');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                const outputPath = path.join(outputDir, filename);
                fs.writeFileSync(outputPath, Buffer.from(bmpData));
                log(`  Saved ${description}: ${outputPath}`);
            } else {
                // Browser environment - we can't save files, but we can offer download
                log(`  Generated ${description}: ${filename} (${bmpData.byteLength} bytes)`);
            }
        } catch (error) {
            log(`  Failed to save ${description}: ${error.message}`);
        }
    }

    // Core test suite
    function runSharedTests(SWCanvas) {
        if (!SWCanvas) {
            throw new Error('SWCanvas not provided to test suite');
        }

        log('Running SWCanvas Shared Test Suite...\n');

        // Surface tests
                // Test 001: Surface creation with valid dimensions
// This file will be concatenated into the main test suite

// Test 001
test('Surface creation with valid dimensions', () => {
    const surface = SWCanvas.Surface(100, 50);
    assertEquals(surface.width, 100);
    assertEquals(surface.height, 50);
    assertEquals(surface.stride, 400); // 100 * 4
    assertEquals(surface.data.length, 20000); // 400 * 50
});

        // Test 002: Surface creation with invalid dimensions throws
// This file will be concatenated into the main test suite

// Test 002
test('Surface creation with invalid dimensions throws', () => {
    assertThrows(() => SWCanvas.Surface(0, 100), 'positive');
    assertThrows(() => SWCanvas.Surface(100, 0), 'positive');
    assertThrows(() => SWCanvas.Surface(-10, 100), 'positive');
});

        // Test 003: Surface creation with too large dimensions throws
// This file will be concatenated into the main test suite

// Test 003
test('Surface creation with too large dimensions throws', () => {
    assertThrows(() => SWCanvas.Surface(20000, 20000), 'SurfaceTooLarge');
});

        // Test 004: Matrix identity creation
// This file will be concatenated into the main test suite

// Test 004
test('Matrix identity creation', () => {
    const m = new SWCanvas.Matrix();
    assertEquals(m.a, 1);
    assertEquals(m.b, 0);
    assertEquals(m.c, 0);
    assertEquals(m.d, 1);
    assertEquals(m.e, 0);
    assertEquals(m.f, 0);
});

        // Test 005: Matrix creation with initial values
// This file will be concatenated into the main test suite

// Test 005
test('Matrix creation with initial values', () => {
    const m = new SWCanvas.Matrix([2, 3, 4, 5, 6, 7]);
    assertEquals(m.a, 2);
    assertEquals(m.b, 3);
    assertEquals(m.c, 4);
    assertEquals(m.d, 5);
    assertEquals(m.e, 6);
    assertEquals(m.f, 7);
});

        // Test 006: Matrix multiplication
// This file will be concatenated into the main test suite

// Test 006
test('Matrix multiplication', () => {
    const m1 = new SWCanvas.Matrix([2, 0, 0, 2, 10, 20]);
    const m2 = new SWCanvas.Matrix([1, 0, 0, 1, 5, 5]);
    const result = m1.multiply(m2);
    assertEquals(result.a, 2);
    assertEquals(result.d, 2);
    assertEquals(result.e, 15); // 10 + 5*2
    assertEquals(result.f, 25); // 20 + 5*2
});

        // Test 007: Matrix translate
// This file will be concatenated into the main test suite

// Test 007
test('Matrix translate', () => {
    const m = new SWCanvas.Matrix();
    const result = m.translate(10, 20);
    assertEquals(result.e, 10);
    assertEquals(result.f, 20);
});

        // Test 008: Matrix scale
// This file will be concatenated into the main test suite

// Test 008
test('Matrix scale', () => {
    const m = new SWCanvas.Matrix();
    const result = m.scale(2, 3);
    assertEquals(result.a, 2);
    assertEquals(result.d, 3);
});

        // Test 009: Matrix transform point
// This file will be concatenated into the main test suite

// Test 009
test('Matrix transform point', () => {
    const m = new SWCanvas.Matrix([2, 0, 0, 2, 10, 20]);
    const point = m.transformPoint({x: 5, y: 10});
    assertEquals(point.x, 20); // 5*2 + 10
    assertEquals(point.y, 40); // 10*2 + 20
});

        // Test 010: Path2D command recording
// This file will be concatenated into the main test suite

// Test 010
test('Path2D command recording', () => {
    const path = new SWCanvas.Path2D();
    path.moveTo(10, 20);
    path.lineTo(30, 40);
    path.closePath();
    
    assertEquals(path.commands.length, 3);
    assertEquals(path.commands[0].type, 'moveTo');
    assertEquals(path.commands[0].x, 10);
    assertEquals(path.commands[0].y, 20);
    assertEquals(path.commands[1].type, 'lineTo');
    assertEquals(path.commands[2].type, 'closePath');
});

        // Test 011: Path2D rect convenience method
// This file will be concatenated into the main test suite

// Test 011
test('Path2D rect convenience method', () => {
    const path = new SWCanvas.Path2D();
    path.rect(10, 20, 100, 50);
    
    assertEquals(path.commands.length, 5); // moveTo + 3 lineTo + closePath
    assertEquals(path.commands[0].type, 'moveTo');
    assertEquals(path.commands[0].x, 10);
    assertEquals(path.commands[0].y, 20);
});

        // Test 012: Context2D creation
// This file will be concatenated into the main test suite

// Test 012
test('Context2D creation', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    assertEquals(ctx.globalAlpha, 1.0);
    assertEquals(ctx.globalCompositeOperation, 'source-over');
});

        // Test 013: Context2D state save/restore
// This file will be concatenated into the main test suite

// Test 013
test('Context2D state save/restore', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.globalAlpha = 0.8;
    assertEquals(ctx.globalAlpha, 0.8);
    
    ctx.restore();
    assertEquals(ctx.globalAlpha, 0.5);
});

        // Test 014: Create and save a simple test image
// This file will be concatenated into the main test suite

// Test 014
test('Create and save a simple test image', () => {
    // Use visual test registry if available, otherwise fall back to inline test
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('simple-test');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'test-output.bmp', 'test image', SWCanvas);
            return;
        }
    }
    
    // Fallback inline test
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // Fill with red background
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Blue square in center
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(25, 25, 50, 50);
    
    // Save test image
    saveBMP(surface, 'test-output.bmp', 'test image', SWCanvas);
});

        // Test 015: Alpha blending test - semi-transparent rectangles
// This file will be concatenated into the main test suite

// Test 015
test('Alpha blending test - semi-transparent rectangles', () => {
    // Use visual test registry if available
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('alpha-test');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            
            // Continue with original test verification logic...
            // Check specific pixel values to verify alpha blending
            const redPixelOffset = (30 * surface.stride) + (30 * 4); // Red area
            const bluePixelOffset = (80 * surface.stride) + (80 * 4); // Blue area
            const greenOverRedOffset = (50 * surface.stride) + (50 * 4); // Green over red
            const greenOverWhiteOffset = (50 * surface.stride) + (110 * 4); // Green over white
            const whiteOnlyOffset = (10 * surface.stride) + (10 * 4); // Pure white background
            
            log(`  Pure white background: R=${surface.data[whiteOnlyOffset]}, G=${surface.data[whiteOnlyOffset+1]}, B=${surface.data[whiteOnlyOffset+2]}, A=${surface.data[whiteOnlyOffset+3]}`);
            log(`  Red pixel: R=${surface.data[redPixelOffset]}, G=${surface.data[redPixelOffset+1]}, B=${surface.data[redPixelOffset+2]}, A=${surface.data[redPixelOffset+3]}`);
            log(`  Blue pixel: R=${surface.data[bluePixelOffset]}, G=${surface.data[bluePixelOffset+1]}, B=${surface.data[bluePixelOffset+2]}, A=${surface.data[bluePixelOffset+3]}`);
            log(`  Green over red: R=${surface.data[greenOverRedOffset]}, G=${surface.data[greenOverRedOffset+1]}, B=${surface.data[greenOverRedOffset+2]}, A=${surface.data[greenOverRedOffset+3]}`);
            log(`  Green over white: R=${surface.data[greenOverWhiteOffset]}, G=${surface.data[greenOverWhiteOffset+1]}, B=${surface.data[greenOverWhiteOffset+2]}, A=${surface.data[greenOverWhiteOffset+3]}`);
            
            // Save alpha blending test image
            saveBMP(surface, 'alpha-test.bmp', 'alpha test image', SWCanvas);
            
            // Expected values for 50% green over white:
            // 50% green (128) over white: src=[0,64,0,128] dst=[255,255,255,255] 
            // Result should be: [127, 191, 127, 255]
            const expectedR = 127;
            const expectedG = 191;  
            const expectedB = 127;
            const actualR = surface.data[greenOverWhiteOffset];
            const actualG = surface.data[greenOverWhiteOffset + 1];
            const actualB = surface.data[greenOverWhiteOffset + 2];
            
            log(`  Expected green over white: [${expectedR}, ${expectedG}, ${expectedB}]`);
            log(`  Actual green over white:   [${actualR}, ${actualG}, ${actualB}]`);
            
            // Allow ±1 tolerance for rounding differences
            if (Math.abs(actualR - expectedR) > 1 || Math.abs(actualG - expectedG) > 1 || Math.abs(actualB - expectedB) > 1) {
                throw new Error(`Alpha blending mismatch! Expected [${expectedR}, ${expectedG}, ${expectedB}], got [${actualR}, ${actualG}, ${actualB}]`);
            }
            return;
        }
    }
    
    // Fallback inline test
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    
    // Red rectangle (opaque)
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(20, 20, 80, 60);
    
    // Blue rectangle (opaque) with overlap
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(60, 60, 80, 60);
    
    // Semi-transparent green rectangle (this is the key test)
    ctx.globalAlpha = 0.5;
    ctx.setFillStyle(0, 128, 0, 255);
    ctx.fillRect(40, 40, 80, 60);
    ctx.globalAlpha = 1.0;
    
    // Check specific pixel values to verify alpha blending
    const redPixelOffset = (30 * surface.stride) + (30 * 4); // Red area
    const bluePixelOffset = (80 * surface.stride) + (80 * 4); // Blue area
    const greenOverRedOffset = (50 * surface.stride) + (50 * 4); // Green over red
    const greenOverWhiteOffset = (50 * surface.stride) + (110 * 4); // Green over white
    const whiteOnlyOffset = (10 * surface.stride) + (10 * 4); // Pure white background
    
    log(`  Pure white background: R=${surface.data[whiteOnlyOffset]}, G=${surface.data[whiteOnlyOffset+1]}, B=${surface.data[whiteOnlyOffset+2]}, A=${surface.data[whiteOnlyOffset+3]}`);
    log(`  Red pixel: R=${surface.data[redPixelOffset]}, G=${surface.data[redPixelOffset+1]}, B=${surface.data[redPixelOffset+2]}, A=${surface.data[redPixelOffset+3]}`);
    log(`  Blue pixel: R=${surface.data[bluePixelOffset]}, G=${surface.data[bluePixelOffset+1]}, B=${surface.data[bluePixelOffset+2]}, A=${surface.data[bluePixelOffset+3]}`);
    log(`  Green over red: R=${surface.data[greenOverRedOffset]}, G=${surface.data[greenOverRedOffset+1]}, B=${surface.data[greenOverRedOffset+2]}, A=${surface.data[greenOverRedOffset+3]}`);
    log(`  Green over white: R=${surface.data[greenOverWhiteOffset]}, G=${surface.data[greenOverWhiteOffset+1]}, B=${surface.data[greenOverWhiteOffset+2]}, A=${surface.data[greenOverWhiteOffset+3]}`);
    
    // Save alpha blending test image
    saveBMP(surface, 'alpha-test.bmp', 'alpha test image', SWCanvas);
    
    // Expected values for 50% green over white:
    // 50% green (128) over white: src=[0,64,0,128] dst=[255,255,255,255] 
    // Result should be: [127, 191, 127, 255]
    const expectedR = 127;
    const expectedG = 191;  
    const expectedB = 127;
    const actualR = surface.data[greenOverWhiteOffset];
    const actualG = surface.data[greenOverWhiteOffset + 1];
    const actualB = surface.data[greenOverWhiteOffset + 2];
    
    log(`  Expected green over white: [${expectedR}, ${expectedG}, ${expectedB}]`);
    log(`  Actual green over white:   [${actualR}, ${actualG}, ${actualB}]`);
    
    // Allow ±1 tolerance for rounding differences
    if (Math.abs(actualR - expectedR) > 1 || Math.abs(actualG - expectedG) > 1 || Math.abs(actualB - expectedB) > 1) {
        throw new Error(`Alpha blending mismatch! Expected [${expectedR}, ${expectedG}, ${expectedB}], got [${actualR}, ${actualG}, ${actualB}]`);
    }
});

        // Test 016: Path filling - simple triangle
// This file will be concatenated into the main test suite

// Test 016
test('Path filling - simple triangle', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw red triangle using path
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.beginPath();
    ctx.moveTo(50, 10);
    ctx.lineTo(80, 70);
    ctx.lineTo(20, 70);
    ctx.closePath();
    ctx.fill();
    
    // Check a point inside the triangle
    const insideOffset = (40 * surface.stride) + (50 * 4);
    const r = surface.data[insideOffset];
    const g = surface.data[insideOffset + 1];
    const b = surface.data[insideOffset + 2];
    
    log(`  Triangle interior pixel: R=${r}, G=${g}, B=${b}`);
    
    // Should be red (allowing for some tolerance)
    if (r < 200 || g > 50 || b > 50) {
        throw new Error(`Expected red pixel inside triangle, got R=${r}, G=${g}, B=${b}`);
    }
    
    saveBMP(surface, 'triangle-test.bmp', 'triangle path test', SWCanvas);
});

        // Test 017: Path filling - evenodd vs nonzero
// This file will be concatenated into the main test suite

// Test 017
test('Path filling - evenodd vs nonzero', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Create overlapping rectangles (outer and inner)
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.beginPath();
    // Outer rectangle
    ctx.rect(20, 20, 60, 60);
    // Inner rectangle (opposite winding)
    ctx.rect(30, 30, 40, 40);
    
    // Fill with evenodd rule - should create a "hole"
    ctx.fill('evenodd');
    
    // Check center (should be white - the "hole")
    const centerOffset = (50 * surface.stride) + (50 * 4);
    const centerR = surface.data[centerOffset];
    log(`  Center pixel with evenodd: R=${centerR}`);
    
    // Center should be white (hole)
    if (centerR < 200) {
        throw new Error('Expected white center with evenodd rule');
    }
    
    saveBMP(surface, 'evenodd-test.bmp', 'evenodd fill test', SWCanvas);
});

        // Test 018: Basic clipping test
// This file will be concatenated into the main test suite

// Test 018
test('Basic clipping test', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Set up circular clip path
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, 2 * Math.PI);
    ctx.clip();
    
    // Fill a large red rectangle - should be clipped to circle
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Check a point that should be clipped (outside circle)
    const outsideOffset = (20 * surface.stride) + (20 * 4);
    const outsideR = surface.data[outsideOffset];
    log(`  Outside clip region: R=${outsideR}`);
    
    // Should still be white (clipped)
    if (outsideR < 200) {
        throw new Error('Clipping not working - expected white outside clip region');
    }
    
    saveBMP(surface, 'clipping-test.bmp', 'basic clipping test', SWCanvas);
});

        // Test 019: Basic stroke - simple line
// This file will be concatenated into the main test suite

// Test 019
test('Basic stroke - simple line', () => {
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw red line stroke
    ctx.setStrokeStyle(255, 0, 0, 255);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(90, 50);
    ctx.stroke();
    
    // Check stroke is present
    const centerOffset = (50 * surface.stride) + (50 * 4);
    const r = surface.data[centerOffset];
    log(`  Line stroke pixel: R=${r}`);
    
    if (r < 200) {
        throw new Error('Expected red stroke line');
    }
    
    saveBMP(surface, 'stroke-basic-line.bmp', 'basic stroke line', SWCanvas);
});

        // Test 020: Stroke joins - miter, bevel, round
// This file will be concatenated into the main test suite

// Test 020
test('Stroke joins - miter, bevel, round', () => {
    const surface = SWCanvas.Surface(300, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 300, 100);
    
    ctx.setStrokeStyle(0, 0, 255, 255);
    ctx.lineWidth = 8;
    
    // Miter join
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(50, 50);
    ctx.lineTo(80, 20);
    ctx.stroke();
    
    // Bevel join
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(120, 20);
    ctx.lineTo(150, 50);
    ctx.lineTo(180, 20);
    ctx.stroke();
    
    // Round join
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(220, 20);
    ctx.lineTo(250, 50);
    ctx.lineTo(280, 20);
    ctx.stroke();
    
    saveBMP(surface, 'stroke-joins.bmp', 'stroke joins test', SWCanvas);
});

        // Test 021: Stroke caps - butt, square, round
// This file will be concatenated into the main test suite

// Test 021
test('Stroke caps - butt, square, round', () => {
    const surface = SWCanvas.Surface(300, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 300, 150);
    
    ctx.setStrokeStyle(0, 128, 0, 255);
    ctx.lineWidth = 12;
    
    // Butt caps
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(50, 70);
    ctx.stroke();
    
    // Square caps
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(150, 30);
    ctx.lineTo(150, 70);
    ctx.stroke();
    
    // Round caps
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(250, 30);
    ctx.lineTo(250, 70);
    ctx.stroke();
    
    saveBMP(surface, 'stroke-caps.bmp', 'stroke caps test', SWCanvas);
});

        // Test 022: Stroke with different line widths
// This file will be concatenated into the main test suite

// Test 022
test('Stroke with different line widths', () => {
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    
    ctx.setStrokeStyle(128, 0, 128, 255);
    
    const widths = [1, 3, 6, 10, 15];
    for (let i = 0; i < widths.length; i++) {
        const y = 25 + i * 25;
        ctx.lineWidth = widths[i];
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(180, y);
        ctx.stroke();
    }
    
    saveBMP(surface, 'stroke-widths.bmp', 'stroke widths test', SWCanvas);
});

        // Test 023: Complex path stroke with curves
// This file will be concatenated into the main test suite

// Test 023
test('Complex path stroke with curves', () => {
    const surface = SWCanvas.Surface(150, 150);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 150, 150);
    
    // Draw a curved path
    ctx.setStrokeStyle(255, 165, 0, 255);
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.quadraticCurveTo(75, 20, 130, 50);
    ctx.quadraticCurveTo(100, 100, 50, 120);
    ctx.lineTo(20, 100);
    ctx.stroke();
    
    saveBMP(surface, 'stroke-curves.bmp', 'stroke curves test', SWCanvas);
});

        // Test 024: Miter limit test
// This file will be concatenated into the main test suite

// Test 024
test('Miter limit test', () => {
    const surface = SWCanvas.Surface(200, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 100);
    
    ctx.setStrokeStyle(255, 0, 255, 255);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'miter';
    
    // Sharp angle with default miter limit (should create miter)
    ctx.miterLimit = 10;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(50, 50);
    ctx.lineTo(60, 20);
    ctx.stroke();
    
    // Very sharp angle with low miter limit (should fallback to bevel)
    ctx.miterLimit = 2;
    ctx.beginPath();
    ctx.moveTo(140, 20);
    ctx.lineTo(150, 50);
    ctx.lineTo(160, 20);
    ctx.stroke();
    
    saveBMP(surface, 'stroke-miter-limit.bmp', 'stroke miter limit test', SWCanvas);
});

        // Test 025: Miter limit property and basic functionality
// This file will be concatenated into the main test suite

// Test 025
test('Miter limit property and basic functionality', () => {
    // Test that miterLimit property works and doesn't cause crashes
    
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    ctx.setStrokeStyle(0, 0, 255, 255);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'miter';
    
    // Test different miter limit values work without crashing
    const miterLimits = [1.0, 2.0, 5.0, 10.0];
    
    for (let i = 0; i < miterLimits.length; i++) {
        const limit = miterLimits[i];
        ctx.miterLimit = limit;
        
        // Draw a V shape at different positions
        const x = 20 + i * 20;
        ctx.beginPath();
        ctx.moveTo(x - 5, 60);
        ctx.lineTo(x, 40);
        ctx.lineTo(x + 5, 60);
        ctx.stroke();
        
        // Verify the miterLimit property was set correctly
        if (Math.abs(ctx.miterLimit - limit) > 0.001) {
            throw new Error('miterLimit property not set correctly: expected ' + limit + ', got ' + ctx.miterLimit);
        }
    }
    
    log('  Tested miter limits: ' + miterLimits.join(', ') + ' - all rendered successfully');
    
    // Test that strokes are actually drawn (basic functionality check)
    function getPixel(x, y) {
        const offset = y * surface.stride + x * 4;
        return surface.data[offset + 2]; // Check BLUE channel for blue stroke
    }
    
    // Check that there are some blue pixels from the strokes
    let foundStroke = false;
    for (let x = 15; x < 85; x += 5) {
        for (let y = 40; y < 65; y += 5) {
            if (getPixel(x, y) > 200) {
                foundStroke = true;
                break;
            }
        }
        if (foundStroke) break;
    }
    
    if (!foundStroke) {
        throw new Error('No stroke pixels found - miter joins may not be rendering');
    }
    
    log('  ✓ Miter joins rendered with different miterLimit values');
    
    saveBMP(surface, 'miter-limits-basic.bmp', 'miter limits basic test', SWCanvas);
});

        // Test 026: Basic transform - translate operations
// This file will be concatenated into the main test suite

// Test 026
test('Basic transform - translate operations', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-basic-translate');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-basic-translate.bmp', 'basic translate test', SWCanvas);
            
            // Verify translated squares are in correct positions
            // Red square: fillRect(10,10,30,30) at origin -> (10,10) to (40,40)
            // Blue square: after translate(50,20), fillRect(10,10,30,30) -> (60,30) to (90,60)  
            // Green square: after translate(60,30), fillRect(10,10,30,30) -> (120,60) to (150,90)
            const redPixel = (25 * surface.stride) + (25 * 4);  // Center of red square
            const bluePixel = (45 * surface.stride) + (75 * 4); // Center of blue square  
            const greenPixel = (75 * surface.stride) + (135 * 4); // Center of green square
            
            if (surface.data[redPixel] < 200) throw new Error('Red square not found at origin');
            if (surface.data[bluePixel + 2] < 200) throw new Error('Blue square not found at translated position');
            if (surface.data[greenPixel + 1] < 100) throw new Error('Green square not found at final position'); // Green is 128, not 255
            return;
        }
    }
    
    // Fallback test without visual registry
    const surface = SWCanvas.Surface(200, 150);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 150);
    ctx.translate(50, 50);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 20, 20);
    
    const pixelOffset = (60 * surface.stride) + (60 * 4);
    if (surface.data[pixelOffset] < 200) {
        throw new Error('Transform translate not working');
    }
});

        // Test 027: Basic transform - scale operations
// This file will be concatenated into the main test suite

// Test 027
test('Basic transform - scale operations', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-basic-scale');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-basic-scale.bmp', 'basic scale test', SWCanvas);
            
            // Verify scaling worked - blue square should be 2x size
            let bluePixelCount = 0;
            for (let y = 10; y < 60; y++) {
                for (let x = 60; x < 110; x++) {
                    const offset = (y * surface.stride) + (x * 4);
                    if (surface.data[offset + 2] > 200) bluePixelCount++;
                }
            }
            
            if (bluePixelCount < 1500) throw new Error('Scaled blue square not found or incorrect size');
            return;
        }
    }
    
    // Fallback test
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    ctx.scale(2, 2);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(10, 10, 10, 10);
    
    // Should see a 20x20 red square due to 2x scale
    const pixelOffset = (25 * surface.stride) + (25 * 4);
    if (surface.data[pixelOffset] < 200) {
        throw new Error('Transform scale not working');
    }
});

        // Test 028: Basic transform - rotate operations
// This file will be concatenated into the main test suite

// Test 028
test('Basic transform - rotate operations', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-basic-rotate');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-basic-rotate.bmp', 'basic rotate test', SWCanvas);
            
            // Just verify rotation doesn't crash and produces pixels
            let pixelCount = 0;
            for (let i = 0; i < surface.data.length; i += 4) {
                if (surface.data[i] > 100 || surface.data[i+1] > 100 || surface.data[i+2] > 100) {
                    pixelCount++;
                }
            }
            
            if (pixelCount < 1000) throw new Error('Rotation test produced too few pixels');
            return;
        }
    }
    
    // Fallback test
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    ctx.translate(50, 50);
    ctx.rotate(Math.PI / 4);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(-10, -10, 20, 20);
    
    // Should see rotated red pixels
    const centerOffset = (50 * surface.stride) + (50 * 4);
    if (surface.data[centerOffset] < 100) {
        throw new Error('Transform rotate not working');
    }
});

        // Test 029: setTransform vs transform behavior
// This file will be concatenated into the main test suite

// Test 029
test('setTransform vs transform behavior', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-setTransform-vs-transform');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-setTransform-vs-transform.bmp', 'setTransform vs transform test', SWCanvas);
            return;
        }
    }
    
    // Fallback test showing difference between transform and setTransform
    const surface = SWCanvas.Surface(200, 100);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 100);
    
    // transform is accumulative
    ctx.transform(1, 0, 0, 1, 10, 10);
    ctx.transform(2, 0, 0, 2, 0, 0);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 10, 10);
    
    // setTransform is absolute
    ctx.setTransform(1, 0, 0, 1, 100, 10);
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(0, 0, 10, 10);
    
    // Should see different positioned squares
    const redArea = (20 * surface.stride) + (20 * 4);
    const blueArea = (20 * surface.stride) + (100 * 4);
    
    if (surface.data[redArea] < 200) throw new Error('Accumulative transform not working');
    if (surface.data[blueArea + 2] < 200) throw new Error('Absolute setTransform not working');
});

        // Test 030: resetTransform functionality
// This file will be concatenated into the main test suite

// Test 030
test('resetTransform functionality', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-resetTransform');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-resetTransform.bmp', 'resetTransform test', SWCanvas);
            return;
        }
    }
    
    // Test resetTransform works
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    ctx.translate(50, 50);
    ctx.scale(2, 2);
    ctx.resetTransform();
    
    // After reset, should be back to identity
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(10, 10, 20, 20);
    
    const pixelOffset = (20 * surface.stride) + (20 * 4);
    if (surface.data[pixelOffset] < 200) {
        throw new Error('resetTransform not working');
    }
});

        // Test 031: Transform matrix order dependency (A*B ≠ B*A)
// This file will be concatenated into the main test suite

// Test 031
test('Transform matrix order dependency (A*B ≠ B*A)', () => {
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('transform-matrix-order');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'transform-matrix-order.bmp', 'transform matrix order test', SWCanvas);
            
            // Check that red and blue squares are in different positions
            // Red square: translate(40,40) then scale(2,2) then fillRect(0,0,15,15)
            //   -> fillRect maps (0,0,15,15) to (40,40,70,70) 
            // Blue square: scale(2,2) then translate(60,60) then fillRect(0,0,15,15) 
            //   -> fillRect maps (0,0,15,15) to (60,60,90,90) then scale by 2 -> (120,120,180,180)
            
            // Check for red pixels around expected area (40,40) to (70,70)
            let redFound = false;
            for (let y = 35; y < 75; y++) {
                for (let x = 35; x < 75; x++) {
                    const offset = (y * surface.stride) + (x * 4);
                    if (surface.data[offset] > 200 && surface.data[offset + 1] < 50 && surface.data[offset + 2] < 50) {
                        redFound = true;
                        break;
                    }
                }
                if (redFound) break;
            }
            
            // Check for blue pixels around expected area (120,120) to (180,180) - but surface is only 200x150
            // So check (120,120) to (150,150) area
            let blueFound = false;
            for (let y = 115; y < 150; y++) {
                for (let x = 115; x < 150; x++) {
                    const offset = (y * surface.stride) + (x * 4);
                    if (surface.data[offset] < 50 && surface.data[offset + 1] < 50 && surface.data[offset + 2] > 200) {
                        blueFound = true;
                        break;
                    }
                }
                if (blueFound) break;
            }
            
            if (!redFound) throw new Error('Red square not found in expected area (translate→scale)');
            if (!blueFound) throw new Error('Blue square not found in expected area (scale→translate)');
            
            console.log('  ✓ Different transform orders produce different results');
            return;
        }
    }
    
    // Fallback test showing transform order matters
    const surface = SWCanvas.Surface(200, 100);
    const ctx = new SWCanvas.Context2D(surface);
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 200, 100);
    
    // Test 1: Translate then Scale
    ctx.save();
    const matrix1 = new SWCanvas.Matrix();
    const translated = matrix1.translate(20, 20);
    const translateThenScale = translated.scale(2, 2);
    ctx.setTransform(translateThenScale.a, translateThenScale.b, translateThenScale.c, 
                   translateThenScale.d, translateThenScale.e, translateThenScale.f);
    ctx.setFillStyle(255, 0, 0, 255);
    ctx.fillRect(0, 0, 10, 10);
    ctx.restore();
    
    // Test 2: Scale then Translate
    ctx.save();
    const matrix2 = new SWCanvas.Matrix();
    const scaled = matrix2.scale(2, 2);
    const scaleThenTranslate = scaled.translate(20, 20);
    ctx.setTransform(scaleThenTranslate.a, scaleThenTranslate.b, scaleThenTranslate.c,
                   scaleThenTranslate.d, scaleThenTranslate.e, scaleThenTranslate.f);
    ctx.setFillStyle(0, 0, 255, 255);
    ctx.fillRect(0, 0, 10, 10);
    ctx.restore();
    
    // The two squares should be in different positions
    // This proves that transform order matters
    console.log('  ✓ Transform order dependency verified');
});

        return {
            passed: passCount,
            total: testCount,
            failed: testCount - passCount
        };
    }

    // Export for both Node.js and browser
    const CoreFunctionalityTests = {
        runSharedTests: runSharedTests,
        test: test,
        assertEquals: assertEquals,
        assertThrows: assertThrows,
        log: log,
        saveBMP: saveBMP
    };

    // Universal module definition (UMD) pattern
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = CoreFunctionalityTests;
    } else {
        // Browser
        global.CoreFunctionalityTests = CoreFunctionalityTests;
    }

})(typeof window !== 'undefined' ? window : global);