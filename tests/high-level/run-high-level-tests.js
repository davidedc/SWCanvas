#!/usr/bin/env node
/**
 * High-Level Test Runner for SWCanvas
 *
 * Runs direct shape API tests and verifies fast paths are used.
 * Tests port functionality from CrispSwCanvas high-level tests.
 */

const fs = require('fs');
const path = require('path');

// Load SWCanvas
const SWCanvas = require('../../dist/swcanvas.js');

// Load test utilities
const {
    HIGH_LEVEL_TESTS,
    SeededRandom,
    getRandomColor,
    getRandomOpaqueColor,
    getRandomPoint,
    placeCloseToCenterAtPixel,
    placeCloseToCenterAtGrid,
    adjustDimensionsForCrispStrokeRendering,
    roundPoint,
    adjustCenterForCrispStrokeRendering,
    calculateCrispFillAndStrokeRectParams,
    calculateCircleTestParameters,
    registerHighLevelTest,
    analyzeExtremes,
    countUniqueColors,
    hasSpeckles
} = require('./high-level-test-utils.js');

// Make utilities globally available for test files
global.SWCanvas = SWCanvas;
global.SeededRandom = SeededRandom;
global.getRandomColor = getRandomColor;
global.getRandomOpaqueColor = getRandomOpaqueColor;
global.getRandomPoint = getRandomPoint;
global.placeCloseToCenterAtPixel = placeCloseToCenterAtPixel;
global.placeCloseToCenterAtGrid = placeCloseToCenterAtGrid;
global.adjustDimensionsForCrispStrokeRendering = adjustDimensionsForCrispStrokeRendering;
global.roundPoint = roundPoint;
global.adjustCenterForCrispStrokeRendering = adjustCenterForCrispStrokeRendering;
global.calculateCrispFillAndStrokeRectParams = calculateCrispFillAndStrokeRectParams;
global.calculateCircleTestParameters = calculateCircleTestParameters;
global.registerHighLevelTest = registerHighLevelTest;

// Test results
let passed = 0;
let failed = 0;
const failures = [];

/**
 * Run a single test
 */
function runTest(test) {
    const { name, drawFunction, category, checks, metadata } = test;

    // Create canvas
    const canvas = SWCanvas.createCanvas(400, 300);
    const ctx = canvas.getContext('2d');

    // Add canvas reference for drawFunction
    ctx.canvas = canvas;

    // Clear to white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);

    // Seed random for reproducibility
    SeededRandom.seedWithInteger(12345);

    // Reset slow path flag
    SWCanvas.Core.Context2D.resetSlowPathFlag();

    // Run the test's draw function
    let result;
    try {
        result = drawFunction(ctx, 1, null);
    } catch (e) {
        failed++;
        failures.push({
            name,
            reason: `Exception during draw: ${e.message}`
        });
        return false;
    }

    // Check if fast path was used (this is the critical check)
    const slowPathUsed = SWCanvas.Core.Context2D.wasSlowPathUsed();

    // Get surface for validation
    const surface = canvas._coreSurface;

    // Validate checks
    let testPassed = true;
    const issues = [];

    // Fast path check (unless explicitly allowed slow path)
    if (!checks.allowSlowPath && slowPathUsed) {
        testPassed = false;
        issues.push('Slow path was used instead of fast path');
    }

    // Extremes check
    if (checks.extremes && result && result.checkData) {
        const actual = analyzeExtremes(surface);
        const expected = result.checkData;
        const tolerance = typeof checks.extremes === 'object' ? checks.extremes.tolerance || 0 : 0;
        const tolerancePixels = Math.ceil(Math.max(surface.width, surface.height) * tolerance);

        if (Math.abs(actual.topY - expected.topY) > tolerancePixels ||
            Math.abs(actual.bottomY - expected.bottomY) > tolerancePixels ||
            Math.abs(actual.leftX - expected.leftX) > tolerancePixels ||
            Math.abs(actual.rightX - expected.rightX) > tolerancePixels) {
            testPassed = false;
            issues.push(`Extremes mismatch: expected (${expected.leftX},${expected.topY})-(${expected.rightX},${expected.bottomY}), ` +
                       `got (${actual.leftX},${actual.topY})-(${actual.rightX},${actual.bottomY})`);
        }
    }

    // Unique colors check
    if (checks.totalUniqueColors) {
        const expected = typeof checks.totalUniqueColors === 'number' ?
            checks.totalUniqueColors : checks.totalUniqueColors.count;
        const actual = countUniqueColors(surface);
        // We check for at least the expected number (background + shapes)
        if (actual < expected) {
            testPassed = false;
            issues.push(`Unique colors: expected at least ${expected}, got ${actual}`);
        }
    }

    // Speckles check
    if (checks.speckles === true) {
        // speckles: true means we allow speckles (don't fail if present)
    } else if (checks.noSpeckles === true || checks.speckles === false) {
        if (hasSpeckles(surface)) {
            testPassed = false;
            issues.push('Unexpected speckles found');
        }
    }

    if (testPassed) {
        passed++;
        console.log(`  \x1b[32m\u2713\x1b[0m ${name}`);
    } else {
        failed++;
        failures.push({ name, reason: issues.join('; ') });
        console.log(`  \x1b[31m\u2717\x1b[0m ${name}`);
        issues.forEach(issue => console.log(`    - ${issue}`));
    }

    return testPassed;
}

/**
 * Load all test case files
 */
function loadTestCases() {
    const casesDir = path.join(__dirname, 'cases');

    if (!fs.existsSync(casesDir)) {
        console.log('No test cases directory found. Creating sample tests...');
        return;
    }

    const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            require(path.join(casesDir, file));
        } catch (e) {
            console.error(`Error loading test case ${file}: ${e.message}`);
        }
    }
}

/**
 * Main entry point
 */
function main() {
    console.log('\n=== High-Level Tests (Fast Path Verification) ===\n');

    // Load test case files
    loadTestCases();

    if (HIGH_LEVEL_TESTS.length === 0) {
        console.log('No high-level tests registered.');
        console.log('Create test files in tests/high-level/cases/');
        return;
    }

    console.log(`Running ${HIGH_LEVEL_TESTS.length} tests...\n`);

    // Group by category
    const categories = {};
    for (const test of HIGH_LEVEL_TESTS) {
        const cat = test.category || 'uncategorized';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(test);
    }

    // Run tests by category
    for (const [category, tests] of Object.entries(categories)) {
        console.log(`\n${category.toUpperCase()}:`);
        for (const test of tests) {
            runTest(test);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        for (const { name, reason } of failures) {
            console.log(`  - ${name}: ${reason}`);
        }
        process.exit(1);
    } else {
        console.log('\n\x1b[32mAll high-level tests passed!\x1b[0m');
        process.exit(0);
    }
}

main();
