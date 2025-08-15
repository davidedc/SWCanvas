#!/usr/bin/env node

// Node.js test runner using the core functionality tests

const fs = require('fs');

// Load built tests (no fallbacks - these are required)
console.log('Loading built modular tests...');
const CoreFunctionalityTests = require('./dist/core-functionality-tests.js');
const SWCanvas = require('../dist/swcanvas.js');
const VisualRenderingTests = require('./dist/visual-rendering-tests.js');

console.log('Running SWCanvas Tests in Node.js...\n');

// Helper function to save BMP files (same as in core-functionality-tests.js)
function saveBMP(surface, filename, description, SWCanvasRef) {
    try {
        const bmpData = SWCanvasRef.encodeBMP(surface);
        const fs = require('fs');
        const path = require('path');
        
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filePath = path.join(outputDir, filename);
        // Convert ArrayBuffer to Buffer for Node.js
        const buffer = Buffer.from(bmpData);
        fs.writeFileSync(filePath, buffer);
        console.log(`  Saved ${description}: ${filePath}`);
    } catch (error) {
        console.log(`  Warning: Could not save ${description} - ${error.message}`);
    }
}

try {
    // Run the core functionality test suite
    const results = CoreFunctionalityTests.runSharedTests(SWCanvas);
    
    console.log(`\nGenerating Visual Test BMPs...\n`);
    
    // Generate BMPs for all visual tests
    const visualTests = VisualRenderingTests.getTests();
    const visualTestNames = Object.keys(visualTests);
    
    visualTestNames.forEach(testName => {
        const visualTest = visualTests[testName];
        try {
            console.log(`Generating BMP for: ${visualTest.name}`);
            
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
            
            saveBMP(surface, `${testName}.bmp`, visualTest.name, SWCanvas);
        } catch (error) {
            console.log(`  Warning: Failed to generate ${testName}.bmp - ${error.message}`);
        }
    });
    
    console.log(`\nGenerated BMPs for ${visualTestNames.length} visual tests`);
    
    if (results.failed > 0) {
        console.log(`\n❌ ${results.failed} tests failed`);
        process.exit(1);
    } else {
        console.log(`\n✅ All ${results.passed} tests passed!`);
    }
} catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
}