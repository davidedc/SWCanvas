#!/usr/bin/env node

// Test strokeRect implementation
const SWCanvas = require('./dist/swcanvas.js');
const VisualTestRegistry = require('./tests/visual-test-registry.js');

function testStrokeRect() {
    console.log('=== strokeRect Test ===\n');
    
    // Test the visual test that was failing
    const visualTest = VisualTestRegistry.getTest('transform-combined-operations');
    
    console.log('Running "Multiple transforms combined" test...');
    try {
        const surface = visualTest.drawSWCanvas(SWCanvas);
        console.log('✅ Test completed successfully!');
        console.log(`Surface dimensions: ${surface.width}x${surface.height}`);
        
        // Check if we have some stroked pixels (gray border)
        let grayPixels = 0;
        let orangePixels = 0;
        let whitePixels = 0;
        
        for (let i = 0; i < surface.data.length; i += 4) {
            const r = surface.data[i];
            const g = surface.data[i + 1];
            const b = surface.data[i + 2];
            
            if (r > 200 && g > 100 && g < 150 && b < 50) {
                orangePixels++; // Orange fill
            } else if (r > 100 && r < 150 && g > 100 && g < 150 && b > 100 && b < 150) {
                grayPixels++; // Gray stroke
            } else if (r > 240 && g > 240 && b > 240) {
                whitePixels++; // White background
            }
        }
        
        console.log('\n=== Pixel Analysis ===');
        console.log(`Orange pixels (transformed fill): ${orangePixels}`);
        console.log(`Gray pixels (stroke border): ${grayPixels}`);
        console.log(`White pixels (background): ${whitePixels}`);
        console.log(`Total pixels: ${surface.width * surface.height}`);
        
        if (orangePixels > 0 && grayPixels > 0) {
            console.log('\n✅ Both fill and stroke are visible - strokeRect working correctly!');
        } else if (orangePixels > 0) {
            console.log('\n⚠️ Fill visible but stroke may be missing');
        } else {
            console.log('\n❌ No visible shapes detected');
        }
        
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    }
}

function testSimpleStrokeRect() {
    console.log('\n=== Simple strokeRect Test ===\n');
    
    // Test strokeRect directly
    const surface = SWCanvas.Surface(100, 100);
    const ctx = new SWCanvas.Context2D(surface);
    
    // White background
    ctx.setFillStyle(255, 255, 255, 255);
    ctx.fillRect(0, 0, 100, 100);
    
    // Set stroke style and draw rectangle
    ctx.setStrokeStyle(255, 0, 0, 255); // Red stroke
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 60, 40);
    
    // Check for red pixels (stroke)
    let redPixels = 0;
    for (let i = 0; i < surface.data.length; i += 4) {
        const r = surface.data[i];
        const g = surface.data[i + 1];
        const b = surface.data[i + 2];
        
        if (r > 200 && g < 50 && b < 50) {
            redPixels++;
        }
    }
    
    console.log(`Red stroke pixels found: ${redPixels}`);
    console.log(redPixels > 0 ? '✅ strokeRect renders successfully!' : '❌ No stroke pixels found');
}

testStrokeRect();
testSimpleStrokeRect();