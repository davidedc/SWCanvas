// Visual Test Registry
// Shared drawing logic for both Node.js and browser testing
// Each test defines drawing operations that work on both SWCanvas and HTML5 Canvas

(function(global) {
    'use strict';

    // Registry of visual tests
    const visualTests = {};

    // Helper function to render SWCanvas to HTML5 Canvas (for browser use)
    function renderSWCanvasToHTML5(swSurface, html5Canvas) {
        const ctx = html5Canvas.getContext('2d');
        const imageData = ctx.createImageData(swSurface.width, swSurface.height);
        
        // Copy pixel data (un-premultiply for display)
        for (let i = 0; i < swSurface.data.length; i += 4) {
            const r = swSurface.data[i];
            const g = swSurface.data[i + 1];
            const b = swSurface.data[i + 2];
            const a = swSurface.data[i + 3];
            
            if (a === 0) {
                imageData.data[i] = 0;
                imageData.data[i + 1] = 0;
                imageData.data[i + 2] = 0;
                imageData.data[i + 3] = 0;
            } else {
                imageData.data[i] = Math.round((r * 255) / a);
                imageData.data[i + 1] = Math.round((g * 255) / a);
                imageData.data[i + 2] = Math.round((b * 255) / a);
                imageData.data[i + 3] = a;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Test 1: Simple Rectangle Test
    visualTests['simple-test'] = {
        name: 'Create and save a simple test image',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(100, 100);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Fill with red background
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(0, 0, 100, 100);
            
            // Blue square in center
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(25, 25, 50, 50);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = 'blue';
            ctx.fillRect(25, 25, 50, 50);
        }
    };

    // Test 2: Alpha Blending Test  
    visualTests['alpha-test'] = {
        name: 'Alpha blending test - semi-transparent rectangles',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
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
            
            // Semi-transparent green rectangle
            ctx.globalAlpha = 0.5;
            ctx.setFillStyle(0, 255, 0, 255);
            ctx.fillRect(40, 40, 80, 60);
            ctx.globalAlpha = 1.0;
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            ctx.fillStyle = 'red';
            ctx.fillRect(20, 20, 80, 60);
            ctx.fillStyle = 'blue';
            ctx.fillRect(60, 60, 80, 60);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'rgb(0, 255, 0)';
            ctx.fillRect(40, 40, 80, 60);
            ctx.globalAlpha = 1.0;
        }
    };

    // Test 3: Triangle Path
    visualTests['triangle-test'] = {
        name: 'Path filling - simple triangle',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(50, 10);
            ctx.lineTo(80, 70);
            ctx.lineTo(20, 70);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test 4: Even-Odd Path  
    visualTests['evenodd-test'] = {
        name: 'Path filling - evenodd vs nonzero',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.rect(20, 20, 60, 60);
            ctx.rect(30, 30, 40, 40);
            ctx.fill('evenodd');
        }
    };

    // Test 5: Basic Clipping
    visualTests['clipping-test'] = {
        name: 'Basic clipping test',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            ctx.beginPath();
            ctx.arc(50, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
        }
    };

    // Test 6: Basic Stroke
    visualTests['stroke-basic-line'] = {
        name: 'Basic stroke - simple line',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(10, 50);
            ctx.lineTo(90, 50);
            ctx.stroke();
        }
    };

    // Test 7: Stroke Joins
    visualTests['stroke-joins'] = {
        name: 'Stroke joins - miter, bevel, round',
        width: 300, height: 100,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 100);
            ctx.strokeStyle = 'blue';
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
        }
    };

    // Test 8: Stroke Curves  
    visualTests['stroke-curves'] = {
        name: 'Complex path stroke with curves',
        width: 150, height: 150,
        drawSWCanvas: function(SWCanvas) {
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 150, 150);
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(20, 50);
            ctx.quadraticCurveTo(75, 20, 130, 50);
            ctx.quadraticCurveTo(100, 100, 50, 120);
            ctx.lineTo(20, 100);
            ctx.stroke();
        }
    };

    // Export for both Node.js and browser
    const VisualTestRegistry = {
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
        module.exports = VisualTestRegistry;
    } else {
        // Browser
        global.VisualTestRegistry = VisualTestRegistry;
    }

})(typeof window !== 'undefined' ? window : global);