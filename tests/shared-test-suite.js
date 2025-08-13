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
        test('Surface creation with valid dimensions', () => {
            const surface = SWCanvas.Surface(100, 50);
            assertEquals(surface.width, 100);
            assertEquals(surface.height, 50);
            assertEquals(surface.stride, 400); // 100 * 4
            assertEquals(surface.data.length, 20000); // 400 * 50
        });

        test('Surface creation with invalid dimensions throws', () => {
            assertThrows(() => SWCanvas.Surface(0, 100), 'positive');
            assertThrows(() => SWCanvas.Surface(100, 0), 'positive');
            assertThrows(() => SWCanvas.Surface(-10, 100), 'positive');
        });

        test('Surface creation with too large dimensions throws', () => {
            assertThrows(() => SWCanvas.Surface(20000, 20000), 'SurfaceTooLarge');
        });

        // Matrix tests
        test('Matrix identity creation', () => {
            const m = new SWCanvas.Matrix();
            assertEquals(m.a, 1);
            assertEquals(m.b, 0);
            assertEquals(m.c, 0);
            assertEquals(m.d, 1);
            assertEquals(m.e, 0);
            assertEquals(m.f, 0);
        });

        test('Matrix creation with initial values', () => {
            const m = new SWCanvas.Matrix([2, 3, 4, 5, 6, 7]);
            assertEquals(m.a, 2);
            assertEquals(m.b, 3);
            assertEquals(m.c, 4);
            assertEquals(m.d, 5);
            assertEquals(m.e, 6);
            assertEquals(m.f, 7);
        });

        test('Matrix multiplication', () => {
            const m1 = new SWCanvas.Matrix([2, 0, 0, 2, 10, 20]);
            const m2 = new SWCanvas.Matrix([1, 0, 0, 1, 5, 5]);
            const result = m1.multiply(m2);
            assertEquals(result.a, 2);
            assertEquals(result.d, 2);
            assertEquals(result.e, 15); // 10 + 5*2
            assertEquals(result.f, 25); // 20 + 5*2
        });

        test('Matrix translate', () => {
            const m = new SWCanvas.Matrix();
            const result = m.translate(10, 20);
            assertEquals(result.e, 10);
            assertEquals(result.f, 20);
        });

        test('Matrix scale', () => {
            const m = new SWCanvas.Matrix();
            const result = m.scale(2, 3);
            assertEquals(result.a, 2);
            assertEquals(result.d, 3);
        });

        test('Matrix transform point', () => {
            const m = new SWCanvas.Matrix([2, 0, 0, 2, 10, 20]);
            const point = m.transformPoint({x: 5, y: 10});
            assertEquals(point.x, 20); // 5*2 + 10
            assertEquals(point.y, 40); // 10*2 + 20
        });

        // Path2D tests
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

        test('Path2D rect convenience method', () => {
            const path = new SWCanvas.Path2D();
            path.rect(10, 20, 100, 50);
            
            assertEquals(path.commands.length, 5); // moveTo + 3 lineTo + closePath
            assertEquals(path.commands[0].type, 'moveTo');
            assertEquals(path.commands[0].x, 10);
            assertEquals(path.commands[0].y, 20);
        });

        // Context2D basic tests
        test('Context2D creation', () => {
            const surface = SWCanvas.Surface(100, 100);
            const ctx = new SWCanvas.Context2D(surface);
            assertEquals(ctx.globalAlpha, 1.0);
            assertEquals(ctx.globalCompositeOperation, 'source-over');
        });

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

        // Integration test: Create a simple image
        test('Create and save a simple test image', () => {
            // Use visual test registry if available, otherwise fall back to inline test
            if (typeof VisualTestRegistry !== 'undefined') {
                const visualTest = VisualTestRegistry.getTest('simple-test');
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

        // Alpha blending test
        test('Alpha blending test - semi-transparent rectangles', () => {
            // Use visual test registry if available
            if (typeof VisualTestRegistry !== 'undefined') {
                const visualTest = VisualTestRegistry.getTest('alpha-test');
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
                    // 50% green over white: src=[0,128,0,128] dst=[255,255,255,255] 
                    // Result should be: [127, 255, 127, 255]
                    const expectedR = 127;
                    const expectedG = 255;  
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
            ctx.setFillStyle(0, 255, 0, 255);
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
            // 50% green over white: src=[0,128,0,128] dst=[255,255,255,255] 
            // Result should be: [127, 255, 127, 255]
            const expectedR = 127;
            const expectedG = 255;  
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

        // M2: Path filling tests
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

        // M3: Stroke tests
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

        test('Complex path stroke with curves', () => {
            const surface = SWCanvas.Surface(150, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 150, 150);
            
            // Draw a curved path
            ctx.setStrokeStyle(255, 128, 0, 255);
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

        // Test results summary
        log(`\nShared Tests completed: ${passCount}/${testCount} passed`);
        return {
            total: testCount,
            passed: passCount,
            failed: testCount - passCount
        };
    }

    // Export for both Node.js and browser
    const SharedTestSuite = {
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
        module.exports = SharedTestSuite;
    } else {
        // Browser
        global.SharedTestSuite = SharedTestSuite;
    }

})(typeof window !== 'undefined' ? window : global);