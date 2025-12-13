#!/usr/bin/env node

// Node.js test runner using the core functionality tests

const fs = require('fs');
const path = require('path');

// Load built tests (no fallbacks - these are required)
console.log('Loading built modular tests...');
const CoreFunctionalityTests = require('./dist/core-functionality-tests.js');
const SWCanvas = require('../dist/swcanvas.js');
const VisualRenderingTests = require('./dist/visual-rendering-tests.js');

// Load high-level test utilities
const highLevelTestsDir = path.join(__dirname, 'high-level');
let highLevelTestUtils = null;
if (fs.existsSync(path.join(highLevelTestsDir, 'high-level-test-utils.js'))) {
    highLevelTestUtils = require('./high-level/high-level-test-utils.js');
}

console.log('Running SWCanvas Tests in Node.js...\n');

// Helper function to save PNG files (same as in core-functionality-tests.js)
function savePNG(surface, filename, description, SWCanvasRef) {
    try {
        const pngData = SWCanvasRef.Core.PngEncoder.encode(surface);
        const fs = require('fs');
        const path = require('path');
        
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filePath = path.join(outputDir, filename);
        // Convert ArrayBuffer to Buffer for Node.js
        const buffer = Buffer.from(pngData);
        fs.writeFileSync(filePath, buffer);
        console.log(`  Saved ${description}: ${filePath}`);
    } catch (error) {
        console.log(`  Warning: Could not save ${description} - ${error.message}`);
    }
}

try {
    // Run the core functionality test suite
    const results = CoreFunctionalityTests.runSharedTests(SWCanvas);
    
    console.log(`\nGenerating Visual Test PNGs...\n`);
    
    // Generate PNGs for all visual tests
    const visualTests = VisualRenderingTests.getTests();
    const visualTestNames = Object.keys(visualTests);
    
    visualTestNames.forEach(testName => {
        const visualTest = visualTests[testName];
        try {
            console.log(`Generating PNG for: ${visualTest.name}`);
            
            let surface;
            if (visualTest.draw && typeof visualTest.draw === 'function') {
                // Use unified API if available
                const canvas = SWCanvas.createCanvas(visualTest.width, visualTest.height);
                visualTest.draw(canvas);
                surface = canvas._coreSurface;
            } else if (visualTest.drawSWCanvas && typeof visualTest.drawSWCanvas === 'function') {
                // Fall back to legacy API
                surface = visualTest.drawSWCanvas(SWCanvas);
            } else {
                throw new Error('No valid draw function found');
            }
            
            savePNG(surface, `${testName}.basic.png`, visualTest.name, SWCanvas);
        } catch (error) {
            console.log(`  Warning: Failed to generate ${testName}.basic.png - ${error.message}`);
        }
    });
    
    console.log(`\nGenerated PNGs for ${visualTestNames.length} visual tests`);

    // Run high-level tests (fast path verification)
    let highLevelPassed = 0;
    let highLevelFailed = 0;

    if (highLevelTestUtils) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Running High-Level Tests (Fast Path Verification)...\n`);

        // Load test cases
        const casesDir = path.join(highLevelTestsDir, 'cases');
        if (fs.existsSync(casesDir)) {
            const caseFiles = fs.readdirSync(casesDir).filter(f => f.endsWith('.js'));

            // Make utilities globally available
            global.SWCanvas = SWCanvas;
            global.SeededRandom = highLevelTestUtils.SeededRandom;
            global.getRandomColor = highLevelTestUtils.getRandomColor;
            global.getRandomOpaqueColor = highLevelTestUtils.getRandomOpaqueColor;
            global.getRandomOpaqueVisibleColor = highLevelTestUtils.getRandomOpaqueVisibleColor;
            global.getRandomPoint = highLevelTestUtils.getRandomPoint;
            global.placeCloseToCenterAtPixel = highLevelTestUtils.placeCloseToCenterAtPixel;
            global.placeCloseToCenterAtGrid = highLevelTestUtils.placeCloseToCenterAtGrid;
            global.adjustDimensionsForCrispStrokeRendering = highLevelTestUtils.adjustDimensionsForCrispStrokeRendering;
            global.calculateCircleTestParameters = highLevelTestUtils.calculateCircleTestParameters;
            global.calculateArcTestParameters = highLevelTestUtils.calculateArcTestParameters;
            global.calculate90DegQuadrantArcParams = highLevelTestUtils.calculate90DegQuadrantArcParams;
            global.generateConstrainedArcAngles = highLevelTestUtils.generateConstrainedArcAngles;
            global.registerHighLevelTest = highLevelTestUtils.registerHighLevelTest;
            global.roundPoint = highLevelTestUtils.roundPoint;
            global.adjustCenterForCrispStrokeRendering = highLevelTestUtils.adjustCenterForCrispStrokeRendering;
            global.calculateCrispFillAndStrokeRectParams = highLevelTestUtils.calculateCrispFillAndStrokeRectParams;

            for (const file of caseFiles) {
                try {
                    require(path.join(casesDir, file));
                } catch (e) {
                    console.error(`Error loading test case ${file}: ${e.message}`);
                }
            }

            // Run each test
            for (const test of highLevelTestUtils.HIGH_LEVEL_TESTS) {
                const testPassed = runHighLevelTest(test);
                if (testPassed) highLevelPassed++;
                else highLevelFailed++;
            }

            console.log(`\nHigh-Level Tests: ${highLevelPassed} passed, ${highLevelFailed} failed`);
        } else {
            console.log('No high-level test cases found.');
        }
    }

    // Final summary
    const totalPassed = results.passed + highLevelPassed;
    const totalFailed = results.failed + highLevelFailed;

    console.log(`\n${'='.repeat(50)}`);
    if (totalFailed > 0) {
        console.log(`\n❌ ${totalFailed} tests failed (Core: ${results.failed}, High-Level: ${highLevelFailed})`);
        process.exit(1);
    } else {
        console.log(`\n✅ All ${totalPassed} tests passed!`);
    }
} catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
}

/**
 * Run a single high-level test
 */
function runHighLevelTest(test) {
    const { name, drawFunction, category, checks, metadata } = test;

    // Create canvas
    const canvas = SWCanvas.createCanvas(400, 300);
    const ctx = canvas.getContext('2d');
    ctx.canvas = canvas;

    // Clear to white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);

    // Seed random for reproducibility
    highLevelTestUtils.SeededRandom.seedWithInteger(12345);

    // Reset slow path flag
    SWCanvas.Core.Context2D.resetSlowPathFlag();

    // Run test
    let result;
    try {
        result = drawFunction(ctx, 1, null);
    } catch (e) {
        console.log(`  \x1b[31m✗\x1b[0m ${name}: ${e.message}`);
        return false;
    }

    // Check fast path
    const slowPathUsed = SWCanvas.Core.Context2D.wasSlowPathUsed();

    let testPassed = true;
    const issues = [];

    // Fast path check
    if (!checks.allowSlowPath && slowPathUsed) {
        testPassed = false;
        issues.push('Slow path used');
    }

    // Extremes check
    if (checks.extremes && result && result.checkData) {
        const surface = canvas._coreSurface;
        const actual = highLevelTestUtils.analyzeExtremes(surface);
        const expected = result.checkData;
        const tolerance = typeof checks.extremes === 'object' ? checks.extremes.tolerance || 0 : 0;
        const tolerancePixels = Math.ceil(Math.max(surface.width, surface.height) * tolerance);

        if (Math.abs(actual.topY - expected.topY) > tolerancePixels ||
            Math.abs(actual.bottomY - expected.bottomY) > tolerancePixels ||
            Math.abs(actual.leftX - expected.leftX) > tolerancePixels ||
            Math.abs(actual.rightX - expected.rightX) > tolerancePixels) {
            testPassed = false;
            issues.push('Extremes mismatch');
        }
    }

    if (testPassed) {
        console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    } else {
        console.log(`  \x1b[31m✗\x1b[0m ${name}: ${issues.join(', ')}`);
    }

    return testPassed;
}