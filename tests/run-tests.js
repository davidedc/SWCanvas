#!/usr/bin/env node

// Node.js test runner using the shared test suite

const SharedTestSuite = require('./shared-test-suite.js');

// Load SWCanvas
const SWCanvas = require('../dist/swcanvas.js');

console.log('Running SWCanvas Tests in Node.js...\n');

try {
    // Run the shared test suite
    const results = SharedTestSuite.runSharedTests(SWCanvas);
    
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