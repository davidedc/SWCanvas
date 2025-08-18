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
        console.log('Original core-functionality-tests.js not found - using default structure');
        buildCoreTestsWithDefaults();
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

function buildCoreTestsWithDefaults() {
    console.log('Building core tests with default structure...');
    
    const testFiles = getTestFiles('tests/core');
    console.log(`Found ${testFiles.length} core test files`);
    
    if (testFiles.length === 0) {
        console.log('No core test files found');
        return;
    }
    
    // Default header for core tests
    let concatenated = `// Core Functionality Tests
// Comprehensive test suite for SWCanvas API correctness
// Tests fundamental operations, edge cases, and mathematical accuracy

(function(global) {
    'use strict';
    
    // Simple test framework for Node.js and browser compatibility
    const testResults = { passed: 0, failed: 0 };
    
    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            const error = message || \`Expected \${expected}, got \${actual}\`;
            throw new Error(error);
        }
    }
    
    function assertThrows(fn, expectedMessage) {
        try {
            fn();
            throw new Error('Expected function to throw an error');
        } catch (error) {
            if (expectedMessage && !error.message.includes(expectedMessage)) {
                throw new Error(\`Expected error message to contain '\${expectedMessage}', got '\${error.message}'\`);
            }
        }
    }
    
    function test(testName, testFunction) {
        try {
            testFunction();
            testResults.passed++;
            console.log(\`✓ \${testName}\`);
        } catch (error) {
            testResults.failed++;
            console.log(\`✗ \${testName}\`);
            console.log(\`  \${error.message}\`);
        }
    }
    
    function log(message) {
        console.log(\`  \${message}\`);
    }
    
    // Helper function to save BMP files (Node.js only)
    function saveBMP(surface, filename, description, SWCanvas) {
        try {
            const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
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
            console.log(\`  Saved \${description}: \${filePath}\`);
        } catch (error) {
            console.log(\`  Warning: Could not save \${description} - \${error.message}\`);
        }
    }
    
    // Core functionality tests - run all tests
    function runSharedTests(SWCanvas) {
        console.log('Running SWCanvas Shared Test Suite...\\n');
        
`;

    // Add all test files
    testFiles.forEach((filePath, index) => {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Adding ${path.basename(filePath)}`);
        
        // Extract the test content - everything from the comment to the end of the test function
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
        }
    });
    
    // Default footer for core tests
    concatenated += `        return testResults;
    }
    
    // Export for both Node.js and browser
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            runSharedTests: runSharedTests
        };
    } else {
        global.CoreFunctionalityTests = {
            runSharedTests: runSharedTests
        };
    }
    
})(typeof window !== "undefined" ? window : global);`;
    
    // Write the built file
    const outputFile = 'tests/dist/core-functionality-tests.js';
    fs.writeFileSync(outputFile, concatenated);
    console.log(`Built ${outputFile} with ${testFiles.length} tests using default structure`);
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

    // Helper function to create test patterns (always RGBA)
    function createTestPattern(width, height, pattern) {
        const image = {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 4) // Always RGBA
        };
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                switch (pattern) {
                    case 'checkerboard':
                        const isEven = (x + y) % 2 === 0;
                        image.data[i] = isEven ? 255 : 0;     // R
                        image.data[i + 1] = isEven ? 0 : 255; // G  
                        image.data[i + 2] = 0;                // B
                        image.data[i + 3] = 255;              // A
                        break;
                        
                    case 'gradient':
                        image.data[i] = Math.floor((x / width) * 255);     // R
                        image.data[i + 1] = Math.floor((y / height) * 255); // G
                        image.data[i + 2] = 128;                           // B
                        image.data[i + 3] = 255;                           // A
                        break;
                        
                    case 'border':
                        const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
                        image.data[i] = isBorder ? 255 : 100;     // R
                        image.data[i + 1] = isBorder ? 255 : 150; // G
                        image.data[i + 2] = isBorder ? 0 : 200;   // B
                        image.data[i + 3] = 255;                  // A
                        break;
                        
                    case 'alpha':
                        image.data[i] = 255;                      // R
                        image.data[i + 1] = 0;                    // G
                        image.data[i + 2] = 0;                    // B
                        image.data[i + 3] = Math.floor((x / width) * 255); // A gradient
                        break;
                        
                    case 'rgbtest':
                        // RGBA pattern that simulates what an RGB conversion would look like
                        image.data[i] = x < width / 2 ? 255 : 0;     // R
                        image.data[i + 1] = y < height / 2 ? 255 : 0; // G
                        image.data[i + 2] = (x + y) % 2 ? 255 : 0;   // B
                        image.data[i + 3] = 255;                     // A (full opacity)
                        break;
                        
                    case 'overlapping-squares':
                        // Complex pattern: Red background with yellow and blue overlapping squares
                        if (x >= 5 && x < 15 && y >= 5 && y < 15) {
                            // Yellow square (5,5) to (15,15)
                            image.data[i] = 255;     // R
                            image.data[i + 1] = 255; // G
                            image.data[i + 2] = 0;   // B
                            image.data[i + 3] = 255; // A
                        } else if (x >= 10 && x < 30 && y >= 10 && y < 30) {
                            // Blue square (10,10) to (30,30)
                            image.data[i] = 0;       // R
                            image.data[i + 1] = 0;   // G
                            image.data[i + 2] = 255; // B
                            image.data[i + 3] = 255; // A
                        } else {
                            // Red background
                            image.data[i] = 255;     // R
                            image.data[i + 1] = 0;   // G
                            image.data[i + 2] = 0;   // B
                            image.data[i + 3] = 255; // A
                        }
                        break;
                }
            }
        }
        
        return image;
    }

    // Helper function to create test images for different canvas implementations
    // 
    // This function has divergent code paths due to fundamental API incompatibility:
    // - Native HTML5 Canvas drawImage() only accepts DOM elements (HTMLCanvasElement, HTMLImageElement, etc.)
    // - SWCanvas drawImage() accepts DOM elements PLUS ImageLike objects ({width, height, data})
    // 
    // The helper detects the environment and provides the appropriate object type:
    // - For native HTML5 Canvas in browser: Convert ImageLike to HTMLCanvasElement (required by W3C spec)
    // - For SWCanvas: Return ImageLike directly (efficient, no conversion needed)
    // 
    // This divergence cannot be eliminated without either:
    // 1. Limiting SWCanvas to only accept DOM elements (losing ImageLike convenience)
    // 2. Modifying browser Canvas API (impossible)
    function createTestImage(width, height, pattern, ctx) {
        const imagelike = createTestPattern(width, height, pattern);
        
        // For HTML5 Canvas, create a temporary canvas element
        // Detection: !ctx._core (not SWCanvas) && document exists (browser environment)
        if (!ctx._core && typeof document !== 'undefined') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const imageData = tempCtx.createImageData(width, height);
            // Always RGBA data - copy directly
            imageData.data.set(imagelike.data);
            
            tempCtx.putImageData(imageData, 0, 0);
            return tempCanvas;
        }
        
        // For SWCanvas, return the ImageLike object directly
        return imagelike;
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