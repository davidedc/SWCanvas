#!/usr/bin/env node

// Build script to concatenate modular test files into single test suites

const fs = require('fs');
const path = require('path');

function getTestFiles(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory ${dir} does not exist`);
        return [];
    }
    
    const files = fs.readdirSync(dir)
        .filter(file => file.endsWith('.js') && /^\d{3}-/.test(file))
        .sort((a, b) => {
            const numA = parseInt(a.substring(0, 3));
            const numB = parseInt(b.substring(0, 3));
            return numA - numB;
        });
    
    return files.map(file => path.join(dir, file));
}

function buildCoreTests() {
    console.log('Building core functionality tests...');
    
    const testFiles = getTestFiles('tests/core');
    console.log(`Found ${testFiles.length} core test files`);
    
    if (testFiles.length === 0) {
        console.log('No core test files found, keeping original');
        return;
    }
    
    // Read the original file to get the header and footer
    const originalFile = 'tests/core-functionality-tests.js';
    if (!fs.existsSync(originalFile)) {
        console.error('Original core-functionality-tests.js not found');
        return;
    }
    
    const originalContent = fs.readFileSync(originalFile, 'utf8');
    
    // Extract header (up to first test)
    const headerMatch = originalContent.match(/([\s\S]*?)\/\/ Test 001/);
    if (!headerMatch) {
        console.error('Could not find test section in original file');
        return;
    }
    
    const header = headerMatch[1];
    
    // Extract footer (after last test - find the export section)
    const footerMatch = originalContent.match(/(    \/\/ Export for both Node\.js and browser[\s\S]*)/);
    let footer = '';
    if (footerMatch) {
        footer = footerMatch[1];
    } else {
        footer = '    // Export section not found\n})(typeof window !== "undefined" ? window : global);';
    }
    
    // Build the concatenated content
    let concatenated = header;
    
    testFiles.forEach((filePath, index) => {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Adding ${path.basename(filePath)}`);
        
        // Extract the test content - everything from the comment to the end of the test function
        // Use a more robust pattern that handles nested braces
        const lines = content.split('\n');
        let testContent = [];
        let inTest = false;
        let braceCount = 0;
        
        for (const line of lines) {
            if (line.includes('// Test ') || inTest) {
                testContent.push(line);
                inTest = true;
                
                // Count braces to find the end of the test function
                for (const char of line) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                }
                
                // If we hit 0 braces and we've seen the test function, we're done
                if (braceCount === 0 && line.includes('});')) {
                    break;
                }
            }
        }
        
        if (testContent.length > 0) {
            // Add the test with proper indentation
            const testString = testContent.join('\n');
            concatenated += `        ${testString}\n\n`;
        } else {
            console.warn(`Could not extract test from ${filePath}`);
        }
    });
    
    // Close the runSharedTests function with return statement
    concatenated += '        return {\n';
    concatenated += '            passed: passCount,\n';
    concatenated += '            total: testCount,\n';  
    concatenated += '            failed: testCount - passCount\n';
    concatenated += '        };\n';
    concatenated += '    }\n\n';
    
    concatenated += footer;
    
    // Write the built file to tests/dist/
    const outputFile = 'tests/dist/core-functionality-tests.js';
    fs.writeFileSync(outputFile, concatenated);
    console.log(`Built ${outputFile} with ${testFiles.length} tests`);
}

function buildVisualTests() {
    console.log('Building visual rendering tests...');
    
    const testFiles = getTestFiles('tests/visual');
    console.log(`Found ${testFiles.length} visual test files`);
    
    if (testFiles.length === 0) {
        console.log('No visual test files found, keeping original');
        return;
    }
    
    // Read the original file to get the header and footer (if available)
    const originalFile = 'tests/visual-rendering-tests.js';
    if (!fs.existsSync(originalFile)) {
        console.log('Original visual-rendering-tests.js not found - using default structure');
        buildVisualTestsWithDefaults();
        return;
    }
    
    const originalContent = fs.readFileSync(originalFile, 'utf8');
    
    // Extract header (up to first test)
    const headerMatch = originalContent.match(/([\s\S]*?)\/\/ Test 1:/);
    if (!headerMatch) {
        console.error('Could not find test section in original visual file');
        return;
    }
    
    const header = headerMatch[1];
    
    // Extract footer (after last test - find the VisualRenderingTests object definition)
    const footerMatch = originalContent.match(/(    const VisualRenderingTests = \{[\s\S]*$)/);
    let footer = '';
    if (footerMatch) {
        footer = footerMatch[1];
    } else {
        footer = '    const VisualRenderingTests = {\n        getTests: function() { return visualTests; },\n        getTest: function(name) { return visualTests[name]; },\n        renderSWCanvasToHTML5: renderSWCanvasToHTML5\n    };\n\n    if (typeof module !== "undefined" && module.exports) {\n        module.exports = VisualRenderingTests;\n    } else {\n        global.VisualRenderingTests = VisualRenderingTests;\n    }\n\n})(typeof window !== "undefined" ? window : global);';
    }
    
    // Build the concatenated content
    let concatenated = header;
    
    testFiles.forEach((filePath, index) => {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Adding ${path.basename(filePath)}`);
        
        // Simply add the entire file content with proper indentation, removing comment headers
        const lines = content.split('\n');
        const testLines = [];
        
        // Skip first few lines (comments) and add the registerVisualTest call
        let foundRegister = false;
        for (const line of lines) {
            if (line.includes('registerVisualTest(') || foundRegister) {
                foundRegister = true;
                testLines.push('    ' + line);
            }
        }
        
        if (testLines.length > 0) {
            concatenated += testLines.join('\n') + '\n\n';
        } else {
            console.warn(`Could not extract test from ${filePath}`);
        }
    });
    
    concatenated += footer;
    
    // Write the built file to tests/dist/
    const outputFile = 'tests/dist/visual-rendering-tests.js';
    fs.writeFileSync(outputFile, concatenated);
    console.log(`Built ${outputFile} with ${testFiles.length} tests`);
}

function buildVisualTestsWithDefaults() {
    console.log('Building visual rendering tests with default structure...');
    
    const testFiles = getTestFiles('tests/visual');
    console.log(`Found ${testFiles.length} visual test files`);
    
    if (testFiles.length === 0) {
        console.log('No visual test files found');
        return;
    }
    
    // Default header
    let concatenated = `// Visual Test Registry
// Shared drawing logic for both Node.js and browser testing
// Each test defines drawing operations that work on both SWCanvas and HTML5 Canvas

(function(global) {
    'use strict';
    
    // Visual test registry using standard HTML5 Canvas API

    // Registry of visual tests
    const visualTests = {};

    // Helper function to create temporary canvases for unified API
    function createTempCanvas(width = 300, height = 150) {
        if (typeof document !== 'undefined') {
            // Browser environment - create HTML5 Canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        } else if (typeof SWCanvas !== 'undefined' && SWCanvas.createCanvas) {
            // Node.js environment with SWCanvas - create SWCanvas
            return SWCanvas.createCanvas(width, height);
        } else {
            // Fallback - create a basic canvas-like object for testing
            throw new Error('No canvas creation method available');
        }
    }

    // Helper function to render SWCanvas to HTML5 Canvas (for browser use)
    function renderSWCanvasToHTML5(swSurface, html5Canvas) {
        if (!html5Canvas || !html5Canvas.getContext) return;
        
        const ctx = html5Canvas.getContext('2d');
        const imageData = ctx.createImageData(swSurface.width, swSurface.height);
        
        // Copy pixel data with proper unpremultiplication
        for (let i = 0; i < swSurface.data.length; i += 4) {
            const r = swSurface.data[i];
            const g = swSurface.data[i + 1];
            const b = swSurface.data[i + 2];
            const a = swSurface.data[i + 3];
            
            // Always unpremultiply for display (HTML5 ImageData expects non-premultiplied)
            if (a === 0) {
                imageData.data[i] = 0;
                imageData.data[i + 1] = 0;
                imageData.data[i + 2] = 0;
                imageData.data[i + 3] = 0;
            } else {
                // Unpremultiply: non_premult = premult * 255 / alpha
                imageData.data[i] = Math.round((r * 255) / a);
                imageData.data[i + 1] = Math.round((g * 255) / a);
                imageData.data[i + 2] = Math.round((b * 255) / a);
                imageData.data[i + 3] = a;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Helper function to register a visual test with unified API
    function registerVisualTest(testName, testConfig) {
        // Store the original config
        visualTests[testName] = testConfig;
        
        // If it has a unified draw function, create the legacy functions for compatibility
        if (testConfig.draw && typeof testConfig.draw === 'function' && !testConfig.drawSWCanvas) {
            testConfig.drawSWCanvas = function(SWCanvas) {
                const canvas = SWCanvas.createCanvas(testConfig.width || 300, testConfig.height || 150);
                testConfig.draw(canvas);
                return canvas._coreSurface;
            };
            
            testConfig.drawHTML5Canvas = function(html5Canvas) {
                testConfig.draw(html5Canvas);
            };
        }
    }

`;

    // Add all test files
    testFiles.forEach((filePath, index) => {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Adding ${path.basename(filePath)}`);
        
        // Simply add the entire file content with proper indentation, removing comment headers
        const lines = content.split('\n');
        const testLines = [];
        
        // Skip first few lines (comments) and add the registerVisualTest call
        let foundRegister = false;
        for (const line of lines) {
            if (line.includes('registerVisualTest(') || foundRegister) {
                foundRegister = true;
                testLines.push('    ' + line);
            }
        }
        
        if (testLines.length > 0) {
            concatenated += testLines.join('\n') + '\n\n';
        } else {
            console.warn(`Could not extract test from ${filePath}`);
        }
    });
    
    // Default footer
    concatenated += `    const VisualRenderingTests = {
        getTests: function() { return visualTests; },
        getTest: function(name) { return visualTests[name]; },
        renderSWCanvasToHTML5: renderSWCanvasToHTML5,
        
        // Run a visual test and return both canvases for comparison
        runVisualTest: function(testName, SWCanvas, html5Canvas) {
            const test = visualTests[testName];
            if (!test) throw new Error('Visual test not found: ' + testName);
            
            // Draw on SWCanvas
            const surface = test.drawSWCanvas(SWCanvas);
            
            // Draw on HTML5 Canvas 
            test.drawHTML5Canvas(html5Canvas);
            
            return { surface: surface, html5Canvas: html5Canvas };
        }
    };

    // Universal module definition (UMD) pattern
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = VisualRenderingTests;
    } else {
        // Browser
        global.VisualRenderingTests = VisualRenderingTests;
    }

})(typeof window !== 'undefined' ? window : global);
`;
    
    // Write the built file
    const outputFile = 'tests/dist/visual-rendering-tests.js';
    fs.writeFileSync(outputFile, concatenated);
    console.log(`Built ${outputFile} with ${testFiles.length} tests using default structure`);
}

// Main execution
console.log('SWCanvas Test Concatenation Build');
console.log('=================================');

buildCoreTests();
buildVisualTests();

console.log('Build complete!');