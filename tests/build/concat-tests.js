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
    
    // Write the built file
    const outputFile = 'tests/core-functionality-tests-built.js';
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
    
    // Read the original file to get the header and footer
    const originalFile = 'tests/visual-rendering-tests.js';
    if (!fs.existsSync(originalFile)) {
        console.error('Original visual-rendering-tests.js not found');
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
    const footerMatch = originalContent.match(/(    const VisualRenderingTests = \{[\s\S]*)/);
    let footer = '';
    if (footerMatch) {
        footer = footerMatch[1];
    } else {
        footer = '    const VisualRenderingTests = {\n        getTests: function() { return visualTests; },\n        getTest: function(name) { return visualTests[name]; }\n    };\n    if (typeof module !== "undefined" && module.exports) {\n        module.exports = VisualRenderingTests;\n    } else {\n        global.VisualRenderingTests = VisualRenderingTests;\n    }\n})(typeof window !== "undefined" ? window : global);';
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
            concatenated += testLines.join('\n') + '\n    ';
        } else {
            console.warn(`Could not extract test from ${filePath}`);
        }
    });
    
    concatenated += footer;
    
    // Write the built file
    const outputFile = 'tests/visual-rendering-tests-built.js';
    fs.writeFileSync(outputFile, concatenated);
    console.log(`Built ${outputFile} with ${testFiles.length} tests`);
}

// Main execution
console.log('SWCanvas Test Concatenation Build');
console.log('=================================');

buildCoreTests();
buildVisualTests();

console.log('Build complete!');