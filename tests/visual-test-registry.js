// Visual Test Registry
// Shared drawing logic for both Node.js and browser testing
// Each test defines drawing operations that work on both SWCanvas and HTML5 Canvas

(function(global) {
    'use strict';
    
    // Load color system
    let TestColorSystem;
    let helpers;
    
    if (typeof require !== 'undefined') {
        // Node.js
        TestColorSystem = require('./test-colors.js');
        helpers = TestColorSystem.helpers;
    } else {
        // Browser - should be loaded globally
        TestColorSystem = global.TestColorSystem;
        if (TestColorSystem) {
            helpers = TestColorSystem.helpers;
        } else {
            throw new Error('TestColorSystem not loaded! Make sure test-colors.js is loaded before visual-test-registry.js');
        }
    }

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
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 100, 100);
            
            // Blue square in center
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(25, 25, 50, 50);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 100, 100);
            helpers.setHTML5CanvasFill(ctx, 'blue');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Red rectangle (opaque)
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 80, 60);
            
            // Blue rectangle (opaque) with overlap
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(60, 60, 80, 60);
            
            // Semi-transparent green rectangle
            ctx.globalAlpha = 0.5;
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(40, 40, 80, 60);
            ctx.globalAlpha = 1.0;
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 80, 60);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(60, 60, 80, 60);
            ctx.globalAlpha = 0.5;
            helpers.setHTML5CanvasFill(ctx, 'green');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            // Draw red triangle using path
            helpers.setSWCanvasFill(ctx, 'red');
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
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            helpers.setHTML5CanvasFill(ctx, 'red');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            // Create overlapping rectangles (outer and inner)
            helpers.setSWCanvasFill(ctx, 'red');
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
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            helpers.setHTML5CanvasFill(ctx, 'red');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            // Set up circular clip path
            ctx.beginPath();
            ctx.arc(50, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill a large red rectangle - should be clipped to circle
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 100, 100);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            ctx.beginPath();
            ctx.arc(50, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            helpers.setHTML5CanvasFill(ctx, 'red');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            // Draw red line stroke
            helpers.setSWCanvasStroke(ctx, 'red');
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(10, 50);
            ctx.lineTo(90, 50);
            ctx.stroke();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            helpers.setHTML5CanvasStroke(ctx, 'red');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 100);
            
            helpers.setSWCanvasStroke(ctx, 'blue');
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
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 100);
            helpers.setHTML5CanvasStroke(ctx, 'blue');
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
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 150, 150);
            
            // Draw a curved path
            helpers.setSWCanvasStroke(ctx, 'orange');
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
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 150, 150);
            helpers.setHTML5CanvasStroke(ctx, 'orange');
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

    // Test 9: Stroke Miter Limit (Original Test)
    visualTests['stroke-miter-limit'] = {
        name: 'Miter limit test',
        width: 200, height: 100,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 100);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 100);
            
            helpers.setSWCanvasStroke(ctx, 'magenta');
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
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 100);
            
            helpers.setHTML5CanvasStroke(ctx, 'magenta');
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
        }
    };

    // Test 10: Miter Limit Basic Functionality
    visualTests['miter-limits-basic'] = {
        name: 'Miter limit property and basic functionality',
        width: 100, height: 100,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(100, 100);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            helpers.setSWCanvasStroke(ctx, 'blue');
            ctx.lineWidth = 6;
            ctx.lineJoin = 'miter';
            
            // Test different miter limit values
            const miterLimits = [1.0, 2.0, 5.0, 10.0];
            
            for (let i = 0; i < miterLimits.length; i++) {
                const limit = miterLimits[i];
                ctx.miterLimit = limit;
                
                // Draw a V shape at different positions
                const x = 20 + i * 20;
                ctx.beginPath();
                ctx.moveTo(x - 5, 60);
                ctx.lineTo(x, 40);
                ctx.lineTo(x + 5, 60);
                ctx.stroke();
            }
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 100, 100);
            
            helpers.setHTML5CanvasStroke(ctx, 'blue');
            ctx.lineWidth = 6;
            ctx.lineJoin = 'miter';
            
            // Test different miter limit values
            const miterLimits = [1.0, 2.0, 5.0, 10.0];
            
            for (let i = 0; i < miterLimits.length; i++) {
                const limit = miterLimits[i];
                ctx.miterLimit = limit;
                
                // Draw a V shape at different positions
                const x = 20 + i * 20;
                ctx.beginPath();
                ctx.moveTo(x - 5, 60);
                ctx.lineTo(x, 40);
                ctx.lineTo(x + 5, 60);
                ctx.stroke();
            }
        }
    };

    // ===== PHASE 1: BASIC TRANSFORMATION TESTS =====

    // Test 11: Basic Translation
    visualTests['transform-basic-translate'] = {
        name: 'Basic translation operations',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Red square at origin
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate and draw blue square
            ctx.translate(50, 20);
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate again and draw green square
            ctx.translate(60, 30);
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(10, 10, 30, 30);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Red square at origin
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate and draw blue square
            ctx.translate(50, 20);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate again and draw green square
            ctx.translate(60, 30);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(10, 10, 30, 30);
        }
    };

    // Test 12: Basic Scaling
    visualTests['transform-basic-scale'] = {
        name: 'Basic scaling operations',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Original size red square
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(10, 10, 20, 20);
            
            // Scale 2x and draw blue square
            ctx.translate(60, 10);
            ctx.scale(2, 2);
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset, scale 0.5x and draw green square
            ctx.resetTransform();
            ctx.translate(10, 60);
            ctx.scale(0.5, 0.5);
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 40, 40);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Original size red square
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(10, 10, 20, 20);
            
            // Scale 2x and draw blue square
            ctx.translate(60, 10);
            ctx.scale(2, 2);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset, scale 0.5x and draw green square
            ctx.resetTransform();
            ctx.translate(10, 60);
            ctx.scale(0.5, 0.5);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 40, 40);
        }
    };

    // Test 13: Basic Rotation
    visualTests['transform-basic-rotate'] = {
        name: 'Basic rotation operations',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Original red square
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 25, 25);
            
            // Rotate 45 degrees and draw blue square
            ctx.translate(100, 40);
            ctx.rotate(Math.PI / 4);
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(-12, -12, 25, 25);
            
            // Reset, rotate 90 degrees and draw green square
            ctx.resetTransform();
            ctx.translate(60, 100);
            ctx.rotate(Math.PI / 2);
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(-12, -12, 25, 25);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Original red square
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 25, 25);
            
            // Rotate 45 degrees and draw blue square
            ctx.translate(100, 40);
            ctx.rotate(Math.PI / 4);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(-12, -12, 25, 25);
            
            // Reset, rotate 90 degrees and draw green square
            ctx.resetTransform();
            ctx.translate(60, 100);
            ctx.rotate(Math.PI / 2);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(-12, -12, 25, 25);
        }
    };

    // Test 14: setTransform vs transform behavior
    visualTests['transform-setTransform-vs-transform'] = {
        name: 'setTransform vs transform behavior comparison',
        width: 250, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(250, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 250, 150);
            
            // Left side: Using transform() - accumulative
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.transform(1, 0, 0, 1, 20, 20); // translate(20, 20)
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.transform(2, 0, 0, 2, 0, 0); // scale(2, 2) - accumulative
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(15, 0, 15, 15);
            
            // Right side: Using setTransform() - absolute
            ctx.setTransform(1, 0, 0, 1, 150, 20); // absolute translate(150, 20)
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.setTransform(2, 0, 0, 2, 150, 60); // absolute scale + translate
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(0, 0, 15, 15);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 250, 150);
            
            // Left side: Using transform() - accumulative
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.transform(1, 0, 0, 1, 20, 20);
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.transform(2, 0, 0, 2, 0, 0);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(15, 0, 15, 15);
            
            // Right side: Using setTransform() - absolute
            ctx.setTransform(1, 0, 0, 1, 150, 20);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.setTransform(2, 0, 0, 2, 150, 60);
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(0, 0, 15, 15);
        }
    };

    // Test 15: resetTransform functionality
    visualTests['transform-resetTransform'] = {
        name: 'resetTransform functionality',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Apply complex transform
            ctx.translate(50, 30);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 1.5);
            
            // Draw transformed red square
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset transform and draw blue square at origin
            ctx.resetTransform();
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(10, 80, 20, 20);
            
            // Apply new transform after reset
            ctx.translate(120, 50);
            ctx.scale(0.8, 0.8);
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 25, 25);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Apply complex transform
            ctx.translate(50, 30);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 1.5);
            
            // Draw transformed red square
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset transform and draw blue square at origin
            ctx.resetTransform();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(10, 80, 20, 20);
            
            // Apply new transform after reset
            ctx.translate(120, 50);
            ctx.scale(0.8, 0.8);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 25, 25);
        }
    };

    // Test 16: Transform state save/restore
    visualTests['transform-state-save-restore'] = {
        name: 'Transform with save/restore stack',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Initial transform
            ctx.translate(30, 30);
            ctx.scale(1.2, 1.2);
            
            // Draw red square with initial transform
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 20, 20);
            
            // Save state, apply additional transform
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.translate(40, 0);
            
            // Draw blue square with combined transforms
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 15, 15);
            
            // Restore to saved state, draw green square
            ctx.restore();
            ctx.translate(0, 40);
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 18, 18);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Initial transform
            ctx.translate(30, 30);
            ctx.scale(1.2, 1.2);
            
            // Draw red square with initial transform
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 20, 20);
            
            // Save state, apply additional transform
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.translate(40, 0);
            
            // Draw blue square with combined transforms
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 15, 15);
            
            // Restore to saved state, draw green square
            ctx.restore();
            ctx.translate(0, 40);
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(0, 0, 18, 18);
        }
    };

    // Test 17: Combined transform operations
    visualTests['transform-combined-operations'] = {
        name: 'Multiple transforms combined',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Complex combined transform: translate + rotate + scale
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 0.8);
            ctx.translate(-15, -10);
            
            // Draw transformed rectangle
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(0, 0, 30, 20);
            
            // Draw border to show original position
            ctx.resetTransform();
            helpers.setSWCanvasStroke(ctx, 'gray');
            ctx.lineWidth = 1;
            ctx.strokeRect(85, 65, 30, 20);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Complex combined transform: translate + rotate + scale
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 0.8);
            ctx.translate(-15, -10);
            
            // Draw transformed rectangle
            ctx.fillStyle = 'orange';
            ctx.fillRect(0, 0, 30, 20);
            
            // Draw border to show original position
            ctx.resetTransform();
            helpers.setHTML5CanvasStroke(ctx, 'gray');
            ctx.lineWidth = 1;
            ctx.strokeRect(85, 65, 30, 20);
        }
    };

    // Test 18: Transform matrix order dependency (A*B ≠ B*A)
    visualTests['transform-matrix-order'] = {
        name: 'Transform order dependency (A*B ≠ B*A)',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Square 1: Translate(40,40) THEN Scale(2,2) - Red
            ctx.save();
            ctx.translate(40, 40);
            ctx.scale(2, 2);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            // Square 2: Scale(2,2) THEN Translate(60,60) - Blue  
            ctx.save();
            ctx.scale(2, 2);
            ctx.translate(60, 60);
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Square 1: Translate(40,40) THEN Scale(2,2) - Red
            ctx.save();
            ctx.translate(40, 40);
            ctx.scale(2, 2);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            // Square 2: Scale(2,2) THEN Translate(60,60) - Blue
            ctx.save();
            ctx.scale(2, 2);
            ctx.translate(60, 60);
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
        }
    };

    // Export for both Node.js and browser
    // Phase 2: Advanced Path Filling Tests

    // Test: fill-concave-polygons - Star shapes and L-shapes
    visualTests['fill-concave-polygons'] = {
        name: 'Concave polygon filling (star and L-shape)',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Draw a 5-pointed star (concave polygon)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            const centerX = 75, centerY = 75;
            const outerRadius = 40, innerRadius = 16;
            
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw an L-shape (concave polygon)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.moveTo(160, 40);
            ctx.lineTo(220, 40);
            ctx.lineTo(220, 70);
            ctx.lineTo(190, 70);
            ctx.lineTo(190, 120);
            ctx.lineTo(160, 120);
            ctx.closePath();
            ctx.fill();
            
            // Draw a more complex concave shape (arrow-like)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.moveTo(50, 140);
            ctx.lineTo(90, 140);
            ctx.lineTo(90, 130);
            ctx.lineTo(110, 150);
            ctx.lineTo(90, 170);
            ctx.lineTo(90, 160);
            ctx.lineTo(50, 160);
            ctx.closePath();
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Draw a 5-pointed star
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            const centerX = 75, centerY = 75;
            const outerRadius = 40, innerRadius = 16;
            
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw an L-shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.moveTo(160, 40);
            ctx.lineTo(220, 40);
            ctx.lineTo(220, 70);
            ctx.lineTo(190, 70);
            ctx.lineTo(190, 120);
            ctx.lineTo(160, 120);
            ctx.closePath();
            ctx.fill();
            
            // Draw arrow-like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.moveTo(50, 140);
            ctx.lineTo(90, 140);
            ctx.lineTo(90, 130);
            ctx.lineTo(110, 150);
            ctx.lineTo(90, 170);
            ctx.lineTo(90, 160);
            ctx.lineTo(50, 160);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test: fill-self-intersecting - Self-intersecting paths
    visualTests['fill-self-intersecting'] = {
        name: 'Self-intersecting path filling',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Self-intersecting bowtie shape
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.lineTo(130, 50);
            ctx.lineTo(50, 100);
            ctx.lineTo(130, 100);
            ctx.closePath();
            ctx.fill();
            
            // Figure-8 like self-intersection
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.moveTo(180, 40);
            ctx.lineTo(220, 80);
            ctx.lineTo(260, 40);
            ctx.lineTo(220, 100);
            ctx.lineTo(260, 140);
            ctx.lineTo(220, 100);
            ctx.lineTo(180, 140);
            ctx.lineTo(220, 80);
            ctx.closePath();
            ctx.fill();
            
            // Complex self-intersecting star-like shape
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.moveTo(90, 140);
            ctx.lineTo(50, 180);
            ctx.lineTo(110, 160);
            ctx.lineTo(70, 190);
            ctx.lineTo(130, 170);
            ctx.lineTo(90, 200);
            ctx.lineTo(150, 180);
            ctx.lineTo(110, 210);
            ctx.closePath();
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Self-intersecting bowtie shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.lineTo(130, 50);
            ctx.lineTo(50, 100);
            ctx.lineTo(130, 100);
            ctx.closePath();
            ctx.fill();
            
            // Figure-8 like self-intersection
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.moveTo(180, 40);
            ctx.lineTo(220, 80);
            ctx.lineTo(260, 40);
            ctx.lineTo(220, 100);
            ctx.lineTo(260, 140);
            ctx.lineTo(220, 100);
            ctx.lineTo(180, 140);
            ctx.lineTo(220, 80);
            ctx.closePath();
            ctx.fill();
            
            // Complex self-intersecting star-like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.moveTo(90, 140);
            ctx.lineTo(50, 180);
            ctx.lineTo(110, 160);
            ctx.lineTo(70, 190);
            ctx.lineTo(130, 170);
            ctx.lineTo(90, 200);
            ctx.lineTo(150, 180);
            ctx.lineTo(110, 210);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test: fill-nested-holes - Paths with holes
    visualTests['fill-nested-holes'] = {
        name: 'Path filling with nested holes',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Outer rectangle with hole using even-odd rule
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            // Outer rectangle
            ctx.rect(30, 30, 100, 80);
            // Inner hole (reverse winding for even-odd)
            ctx.rect(50, 50, 60, 40);
            ctx.fill('evenodd');
            
            // Nested squares with holes
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            // Outermost square
            ctx.rect(160, 20, 120, 120);
            // Middle hole
            ctx.rect(180, 40, 80, 80);
            // Inner filled square (creates hole in the hole)
            ctx.rect(200, 60, 40, 40);
            ctx.fill('evenodd');
            
            // Complex donut shape with inner hole
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            // Outer circle approximated by octagon
            const cx = 100, cy = 170, outerR = 35, innerR = 15;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x = cx + Math.cos(angle) * outerR;
                const y = cy + Math.sin(angle) * outerR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner hole (octagon)
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x = cx + Math.cos(angle) * innerR;
                const y = cy + Math.sin(angle) * innerR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill('evenodd');
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Outer rectangle with hole using even-odd rule
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            // Outer rectangle
            ctx.rect(30, 30, 100, 80);
            // Inner hole
            ctx.rect(50, 50, 60, 40);
            ctx.fill('evenodd');
            
            // Nested squares with holes
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            // Outermost square
            ctx.rect(160, 20, 120, 120);
            // Middle hole
            ctx.rect(180, 40, 80, 80);
            // Inner filled square
            ctx.rect(200, 60, 40, 40);
            ctx.fill('evenodd');
            
            // Complex donut shape with inner hole
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            // Outer circle approximated by octagon
            const cx = 100, cy = 170, outerR = 35, innerR = 15;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x = cx + Math.cos(angle) * outerR;
                const y = cy + Math.sin(angle) * outerR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner hole (octagon)
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x = cx + Math.cos(angle) * innerR;
                const y = cy + Math.sin(angle) * innerR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill('evenodd');
        }
    };

    // Test: fill-multiple-subpaths - Multiple subpath handling
    visualTests['fill-multiple-subpaths'] = {
        name: 'Multiple subpath handling',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Multiple disconnected subpaths in one fill call
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            
            // First subpath - triangle
            ctx.moveTo(40, 40);
            ctx.lineTo(80, 40);
            ctx.lineTo(60, 70);
            ctx.closePath();
            
            // Second subpath - rectangle (not connected)
            ctx.moveTo(100, 30);
            ctx.lineTo(140, 30);
            ctx.lineTo(140, 80);
            ctx.lineTo(100, 80);
            ctx.closePath();
            
            // Third subpath - pentagon
            ctx.moveTo(170, 40);
            ctx.lineTo(190, 30);
            ctx.lineTo(210, 50);
            ctx.lineTo(200, 80);
            ctx.lineTo(160, 80);
            ctx.closePath();
            
            ctx.fill();
            
            // Multiple subpaths with different fill rules
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            
            // Outer shape
            ctx.moveTo(50, 120);
            ctx.lineTo(130, 120);
            ctx.lineTo(130, 180);
            ctx.lineTo(50, 180);
            ctx.closePath();
            
            // Inner hole (same winding - will create hole with evenodd)
            ctx.moveTo(70, 140);
            ctx.lineTo(110, 140);
            ctx.lineTo(110, 160);
            ctx.lineTo(70, 160);
            ctx.closePath();
            
            // Small separate rectangle
            ctx.moveTo(160, 130);
            ctx.lineTo(180, 130);
            ctx.lineTo(180, 150);
            ctx.lineTo(160, 150);
            ctx.closePath();
            
            ctx.fill('evenodd');
            
            // Mixed open and closed subpaths (only closed ones should fill)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            
            // Open subpath (should not fill)
            ctx.moveTo(200, 120);
            ctx.lineTo(220, 130);
            ctx.lineTo(240, 120);
            
            // Closed subpath (should fill)
            ctx.moveTo(210, 150);
            ctx.lineTo(250, 150);
            ctx.lineTo(230, 180);
            ctx.closePath();
            
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Multiple disconnected subpaths in one fill call
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            
            // First subpath - triangle
            ctx.moveTo(40, 40);
            ctx.lineTo(80, 40);
            ctx.lineTo(60, 70);
            ctx.closePath();
            
            // Second subpath - rectangle
            ctx.moveTo(100, 30);
            ctx.lineTo(140, 30);
            ctx.lineTo(140, 80);
            ctx.lineTo(100, 80);
            ctx.closePath();
            
            // Third subpath - pentagon
            ctx.moveTo(170, 40);
            ctx.lineTo(190, 30);
            ctx.lineTo(210, 50);
            ctx.lineTo(200, 80);
            ctx.lineTo(160, 80);
            ctx.closePath();
            
            ctx.fill();
            
            // Multiple subpaths with different fill rules
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            
            // Outer shape
            ctx.moveTo(50, 120);
            ctx.lineTo(130, 120);
            ctx.lineTo(130, 180);
            ctx.lineTo(50, 180);
            ctx.closePath();
            
            // Inner hole
            ctx.moveTo(70, 140);
            ctx.lineTo(110, 140);
            ctx.lineTo(110, 160);
            ctx.lineTo(70, 160);
            ctx.closePath();
            
            // Small separate rectangle
            ctx.moveTo(160, 130);
            ctx.lineTo(180, 130);
            ctx.lineTo(180, 150);
            ctx.lineTo(160, 150);
            ctx.closePath();
            
            ctx.fill('evenodd');
            
            // Mixed open and closed subpaths
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            
            // Open subpath
            ctx.moveTo(200, 120);
            ctx.lineTo(220, 130);
            ctx.lineTo(240, 120);
            
            // Closed subpath
            ctx.moveTo(210, 150);
            ctx.lineTo(250, 150);
            ctx.lineTo(230, 180);
            ctx.closePath();
            
            ctx.fill();
        }
    };

    // Test: fill-bezier-curves - Cubic bezier curve filling
    visualTests['fill-bezier-curves'] = {
        name: 'Cubic bezier curve filling',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with bezier curves
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.bezierCurveTo(50, 20, 100, 20, 100, 50);
            ctx.bezierCurveTo(130, 50, 130, 100, 100, 100);
            ctx.bezierCurveTo(100, 130, 50, 130, 50, 100);
            ctx.bezierCurveTo(20, 100, 20, 50, 50, 50);
            ctx.closePath();
            ctx.fill();
            
            // Heart-like shape using bezier curves
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.moveTo(200, 80);
            // Left side of heart
            ctx.bezierCurveTo(200, 60, 180, 50, 170, 60);
            ctx.bezierCurveTo(160, 70, 160, 85, 200, 120);
            // Right side of heart
            ctx.bezierCurveTo(240, 85, 240, 70, 230, 60);
            ctx.bezierCurveTo(220, 50, 200, 60, 200, 80);
            ctx.closePath();
            ctx.fill();
            
            // Complex curved path with multiple bezier segments
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.moveTo(50, 160);
            ctx.bezierCurveTo(80, 140, 120, 140, 150, 160);
            ctx.bezierCurveTo(150, 180, 120, 200, 100, 180);
            ctx.bezierCurveTo(80, 200, 50, 180, 50, 160);
            ctx.closePath();
            ctx.fill();
            
            // Leaf-like shape
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.moveTo(220, 160);
            ctx.bezierCurveTo(240, 140, 260, 140, 270, 160);
            ctx.bezierCurveTo(270, 170, 260, 180, 250, 185);
            ctx.bezierCurveTo(240, 190, 230, 185, 220, 180);
            ctx.bezierCurveTo(210, 175, 210, 165, 220, 160);
            ctx.closePath();
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with bezier curves
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.bezierCurveTo(50, 20, 100, 20, 100, 50);
            ctx.bezierCurveTo(130, 50, 130, 100, 100, 100);
            ctx.bezierCurveTo(100, 130, 50, 130, 50, 100);
            ctx.bezierCurveTo(20, 100, 20, 50, 50, 50);
            ctx.closePath();
            ctx.fill();
            
            // Heart-like shape using bezier curves
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.moveTo(200, 80);
            // Left side of heart
            ctx.bezierCurveTo(200, 60, 180, 50, 170, 60);
            ctx.bezierCurveTo(160, 70, 160, 85, 200, 120);
            // Right side of heart
            ctx.bezierCurveTo(240, 85, 240, 70, 230, 60);
            ctx.bezierCurveTo(220, 50, 200, 60, 200, 80);
            ctx.closePath();
            ctx.fill();
            
            // Complex curved path with multiple bezier segments
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.moveTo(50, 160);
            ctx.bezierCurveTo(80, 140, 120, 140, 150, 160);
            ctx.bezierCurveTo(150, 180, 120, 200, 100, 180);
            ctx.bezierCurveTo(80, 200, 50, 180, 50, 160);
            ctx.closePath();
            ctx.fill();
            
            // Leaf-like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.moveTo(220, 160);
            ctx.bezierCurveTo(240, 140, 260, 140, 270, 160);
            ctx.bezierCurveTo(270, 170, 260, 180, 250, 185);
            ctx.bezierCurveTo(240, 190, 230, 185, 220, 180);
            ctx.bezierCurveTo(210, 175, 210, 165, 220, 160);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test: fill-quadratic-curves - Quadratic curve filling
    visualTests['fill-quadratic-curves'] = {
        name: 'Quadratic curve filling',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with quadratic curves
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.moveTo(50, 80);
            ctx.quadraticCurveTo(75, 40, 100, 80);
            ctx.quadraticCurveTo(100, 120, 50, 120);
            ctx.quadraticCurveTo(25, 100, 50, 80);
            ctx.closePath();
            ctx.fill();
            
            // Petal-like shapes
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.moveTo(150, 60);
            ctx.quadraticCurveTo(180, 30, 210, 60);
            ctx.quadraticCurveTo(180, 90, 150, 60);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(180, 80);
            ctx.quadraticCurveTo(210, 50, 240, 80);
            ctx.quadraticCurveTo(210, 110, 180, 80);
            ctx.closePath();
            ctx.fill();
            
            // Wave-like shape
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.moveTo(30, 150);
            ctx.quadraticCurveTo(60, 130, 90, 150);
            ctx.quadraticCurveTo(120, 170, 150, 150);
            ctx.quadraticCurveTo(120, 180, 90, 170);
            ctx.quadraticCurveTo(60, 180, 30, 160);
            ctx.closePath();
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with quadratic curves
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.moveTo(50, 80);
            ctx.quadraticCurveTo(75, 40, 100, 80);
            ctx.quadraticCurveTo(100, 120, 50, 120);
            ctx.quadraticCurveTo(25, 100, 50, 80);
            ctx.closePath();
            ctx.fill();
            
            // Petal-like shapes
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.moveTo(150, 60);
            ctx.quadraticCurveTo(180, 30, 210, 60);
            ctx.quadraticCurveTo(180, 90, 150, 60);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(180, 80);
            ctx.quadraticCurveTo(210, 50, 240, 80);
            ctx.quadraticCurveTo(210, 110, 180, 80);
            ctx.closePath();
            ctx.fill();
            
            // Wave-like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.moveTo(30, 150);
            ctx.quadraticCurveTo(60, 130, 90, 150);
            ctx.quadraticCurveTo(120, 170, 150, 150);
            ctx.quadraticCurveTo(120, 180, 90, 170);
            ctx.quadraticCurveTo(60, 180, 30, 160);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test: fill-arcs-ellipses - Arc and ellipse filling
    visualTests['fill-arcs-ellipses'] = {
        name: 'Arc and ellipse filling',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Full circle using arc
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.arc(75, 75, 30, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Half circle (semicircle)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.arc(180, 75, 25, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Quarter circle (pie slice)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.moveTo(250, 75);
            ctx.arc(250, 75, 30, 0, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            
            // Pac-Man like shape (3/4 circle)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.moveTo(75, 150);
            ctx.arc(75, 150, 30, Math.PI / 4, 7 * Math.PI / 4);
            ctx.closePath();
            ctx.fill();
            
            // Crescent moon (overlapping circles)
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.arc(180, 150, 25, 0, 2 * Math.PI);
            ctx.arc(190, 150, 20, 0, 2 * Math.PI);
            ctx.fill('evenodd');
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Full circle using arc
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.arc(75, 75, 30, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Half circle (semicircle)
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.arc(180, 75, 25, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Quarter circle (pie slice)
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.moveTo(250, 75);
            ctx.arc(250, 75, 30, 0, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            
            // Pac-Man like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.moveTo(75, 150);
            ctx.arc(75, 150, 30, Math.PI / 4, 7 * Math.PI / 4);
            ctx.closePath();
            ctx.fill();
            
            // Crescent moon
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.arc(180, 150, 25, 0, 2 * Math.PI);
            ctx.arc(190, 150, 20, 0, 2 * Math.PI);
            ctx.fill('evenodd');
        }
    };

    // Test: fill-mixed-paths - Linear + curve combinations
    visualTests['fill-mixed-paths'] = {
        name: 'Mixed linear and curve paths',
        width: 300, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Shape mixing lines and curves
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.lineTo(100, 40);
            ctx.quadraticCurveTo(120, 60, 100, 80);
            ctx.lineTo(80, 90);
            ctx.bezierCurveTo(60, 100, 40, 90, 30, 70);
            ctx.arc(50, 50, 20, Math.PI, 3 * Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            
            // House with curved roof
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.moveTo(150, 120);
            ctx.lineTo(150, 80);
            ctx.quadraticCurveTo(175, 60, 200, 80);
            ctx.lineTo(200, 120);
            ctx.closePath();
            ctx.fill();
            
            // Flower-like shape
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.moveTo(250, 80);
            // Petal 1
            ctx.quadraticCurveTo(270, 60, 280, 80);
            ctx.lineTo(260, 90);
            // Petal 2  
            ctx.quadraticCurveTo(280, 100, 260, 120);
            ctx.lineTo(250, 100);
            // Petal 3
            ctx.quadraticCurveTo(230, 120, 220, 100);
            ctx.lineTo(240, 90);
            // Petal 4
            ctx.quadraticCurveTo(220, 80, 240, 60);
            ctx.closePath();
            ctx.fill();
            
            // Wave with straight segments
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.moveTo(30, 160);
            ctx.lineTo(60, 160);
            ctx.quadraticCurveTo(75, 140, 90, 160);
            ctx.lineTo(120, 160);
            ctx.quadraticCurveTo(135, 180, 150, 160);
            ctx.lineTo(180, 160);
            ctx.lineTo(180, 180);
            ctx.lineTo(30, 180);
            ctx.closePath();
            ctx.fill();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Shape mixing lines and curves
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.moveTo(50, 50);
            ctx.lineTo(100, 40);
            ctx.quadraticCurveTo(120, 60, 100, 80);
            ctx.lineTo(80, 90);
            ctx.bezierCurveTo(60, 100, 40, 90, 30, 70);
            ctx.arc(50, 50, 20, Math.PI, 3 * Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            
            // House with curved roof
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.moveTo(150, 120);
            ctx.lineTo(150, 80);
            ctx.quadraticCurveTo(175, 60, 200, 80);
            ctx.lineTo(200, 120);
            ctx.closePath();
            ctx.fill();
            
            // Flower-like shape
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.moveTo(250, 80);
            // Petal 1
            ctx.quadraticCurveTo(270, 60, 280, 80);
            ctx.lineTo(260, 90);
            // Petal 2  
            ctx.quadraticCurveTo(280, 100, 260, 120);
            ctx.lineTo(250, 100);
            // Petal 3
            ctx.quadraticCurveTo(230, 120, 220, 100);
            ctx.lineTo(240, 90);
            // Petal 4
            ctx.quadraticCurveTo(220, 80, 240, 60);
            ctx.closePath();
            ctx.fill();
            
            // Wave with straight segments
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.moveTo(30, 160);
            ctx.lineTo(60, 160);
            ctx.quadraticCurveTo(75, 140, 90, 160);
            ctx.lineTo(120, 160);
            ctx.quadraticCurveTo(135, 180, 150, 160);
            ctx.lineTo(180, 160);
            ctx.lineTo(180, 180);
            ctx.lineTo(30, 180);
            ctx.closePath();
            ctx.fill();
        }
    };

    // Test: fill-rule-complex - Complex even-odd vs nonzero comparisons
    visualTests['fill-rule-complex'] = {
        name: 'Complex fill rule comparisons (even-odd vs nonzero)',
        width: 400, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 200);
            
            // Left side: nonzero fill rule
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'red');
            
            // Outer rectangle
            ctx.rect(20, 20, 160, 80);
            // Inner rectangle (same winding direction)
            ctx.rect(60, 40, 80, 40);
            
            // Fill with nonzero rule (default)
            ctx.fill('nonzero');
            
            // Right side: evenodd fill rule
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'blue');
            
            // Same shapes, different fill rule
            ctx.rect(220, 20, 160, 80);
            ctx.rect(260, 40, 80, 40);
            
            // Fill with evenodd rule
            ctx.fill('evenodd');
            
            // Complex overlapping shapes - nonzero
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'green');
            
            // Star with overlapping triangles
            const cx = 100, cy = 150;
            // Outer points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 30;
                const y = cy + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner pentagon (reverse winding)
            for (let i = 4; i >= 0; i--) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 12;
                const y = cy + Math.sin(angle) * 12;
                if (i === 4) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            ctx.fill('nonzero');
            
            // Same complex shape - evenodd
            ctx.beginPath();
            helpers.setSWCanvasFill(ctx, 'magenta');
            
            const cx2 = 300, cy2 = 150;
            // Outer points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 30;
                const y = cy2 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner pentagon (same winding as outer)
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 12;
                const y = cy2 + Math.sin(angle) * 12;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            ctx.fill('evenodd');
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 200);
            
            // Left side: nonzero fill rule
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'red');
            
            // Outer rectangle
            ctx.rect(20, 20, 160, 80);
            // Inner rectangle
            ctx.rect(60, 40, 80, 40);
            
            ctx.fill('nonzero');
            
            // Right side: evenodd fill rule
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'blue');
            
            ctx.rect(220, 20, 160, 80);
            ctx.rect(260, 40, 80, 40);
            
            ctx.fill('evenodd');
            
            // Complex overlapping shapes - nonzero
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'green');
            
            const cx = 100, cy = 150;
            // Outer points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 30;
                const y = cy + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner pentagon (reverse winding)
            for (let i = 4; i >= 0; i--) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 12;
                const y = cy + Math.sin(angle) * 12;
                if (i === 4) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            ctx.fill('nonzero');
            
            // Same complex shape - evenodd
            ctx.beginPath();
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            
            const cx2 = 300, cy2 = 150;
            // Outer points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 30;
                const y = cy2 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Inner pentagon
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 12;
                const y = cy2 + Math.sin(angle) * 12;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            ctx.fill('evenodd');
        }
    };

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