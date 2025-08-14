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

    // Phase 3: Advanced Clipping Tests

    // Test 1: Basic rectangular clip regions
    visualTests['clip-rectangular'] = {
        name: 'Basic Rectangular Clipping',
        description: 'Test rectangular clipping regions with simple shapes',
        width: 400,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left side: No clipping
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(10, 10, 80, 60);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(30, 30, 80, 60);
            
            // Right side: With rectangular clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(150, 20, 60, 40);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(130, 10, 80, 60);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(150, 30, 80, 60);
            ctx.restore();
            
            // Bottom: Multiple overlapping rectangles with clip
            ctx.save();
            ctx.beginPath();
            ctx.rect(50, 120, 100, 50);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(20, 100, 60, 80);
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(80, 110, 60, 80);
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(40, 140, 60, 50);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left side: No clipping
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(10, 10, 80, 60);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(30, 30, 80, 60);
            
            // Right side: With rectangular clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(150, 20, 60, 40);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(130, 10, 80, 60);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(150, 30, 80, 60);
            ctx.restore();
            
            // Bottom: Multiple overlapping rectangles with clip
            ctx.save();
            ctx.beginPath();
            ctx.rect(50, 120, 100, 50);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(20, 100, 60, 80);
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(80, 110, 60, 80);
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(40, 140, 60, 50);
            ctx.restore();
        }
    };

    // Test 2: Polygon clip shapes
    visualTests['clip-polygon'] = {
        name: 'Polygon Clipping',
        description: 'Test clipping with polygon shapes - triangles and complex polygons',
        width: 400,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Triangle clip region
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(50, 20);
            ctx.lineTo(120, 20);
            ctx.lineTo(85, 80);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 10, 100, 80);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(60, 30, 60, 60);
            ctx.restore();
            
            // Center: Diamond clip region
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(200, 20);
            ctx.lineTo(240, 50);
            ctx.lineTo(200, 80);
            ctx.lineTo(160, 50);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(140, 10, 120, 80);
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(180, 40, 60, 40);
            ctx.restore();
            
            // Right: Star clip region
            ctx.save();
            ctx.beginPath();
            const cx = 340, cy = 50;
            // Outer star points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 30;
                const y = cy + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                // Inner points
                const innerAngle = angle + Math.PI / 5;
                const ix = cx + Math.cos(innerAngle) * 12;
                const iy = cy + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(300, 10, 80, 80);
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(320, 30, 40, 40);
            ctx.restore();
            
            // Bottom: Hexagon clip with multiple fills
            ctx.save();
            ctx.beginPath();
            const hx = 200, hy = 150;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = hx + Math.cos(angle) * 40;
                const y = hy + Math.sin(angle) * 40;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(140, 100, 120, 100);
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(180, 130, 40, 40);
            helpers.setSWCanvasFill(ctx, 'lime');
            ctx.fillRect(160, 120, 80, 20);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Triangle clip region
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(50, 20);
            ctx.lineTo(120, 20);
            ctx.lineTo(85, 80);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 10, 100, 80);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(60, 30, 60, 60);
            ctx.restore();
            
            // Center: Diamond clip region
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(200, 20);
            ctx.lineTo(240, 50);
            ctx.lineTo(200, 80);
            ctx.lineTo(160, 50);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(140, 10, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(180, 40, 60, 40);
            ctx.restore();
            
            // Right: Star clip region
            ctx.save();
            ctx.beginPath();
            const cx = 340, cy = 50;
            // Outer star points
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 30;
                const y = cy + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                // Inner points
                const innerAngle = angle + Math.PI / 5;
                const ix = cx + Math.cos(innerAngle) * 12;
                const iy = cy + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(300, 10, 80, 80);
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(320, 30, 40, 40);
            ctx.restore();
            
            // Bottom: Hexagon clip with multiple fills
            ctx.save();
            ctx.beginPath();
            const hx = 200, hy = 150;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = hx + Math.cos(angle) * 40;
                const y = hy + Math.sin(angle) * 40;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(140, 100, 120, 100);
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(180, 130, 40, 40);
            helpers.setHTML5CanvasFill(ctx, 'lime');
            ctx.fillRect(160, 120, 80, 20);
            ctx.restore();
        }
    };

    // Test 3: Arc/ellipse clip regions
    visualTests['clip-curved'] = {
        name: 'Curved Clipping',
        description: 'Test clipping with arcs and elliptical shapes',
        width: 400,
        height: 250,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 20, 120, 80);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(50, 40, 60, 40);
            ctx.restore();
            
            // Center: Ellipse clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(130, 20, 140, 80);
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(170, 45, 60, 30);
            ctx.restore();
            
            // Right: Arc clip region (partial circle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(340, 60, 35, 0, Math.PI);
            ctx.lineTo(305, 60);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(280, 20, 120, 80);
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(320, 30, 40, 60);
            ctx.restore();
            
            // Bottom left: Rotated ellipse
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 180, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(40, 140, 120, 80);
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(80, 160, 40, 40);
            ctx.restore();
            
            // Bottom right: Complex arc path
            ctx.save();
            ctx.beginPath();
            ctx.arc(300, 180, 30, 0, Math.PI / 2);
            ctx.arc(350, 180, 30, Math.PI / 2, Math.PI);
            ctx.arc(350, 210, 30, Math.PI, 3 * Math.PI / 2);
            ctx.arc(300, 210, 30, 3 * Math.PI / 2, 0);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lime');
            ctx.fillRect(250, 140, 130, 90);
            helpers.setSWCanvasFill(ctx, 'navy');
            ctx.fillRect(280, 170, 70, 30);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 20, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(50, 40, 60, 40);
            ctx.restore();
            
            // Center: Ellipse clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(130, 20, 140, 80);
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(170, 45, 60, 30);
            ctx.restore();
            
            // Right: Arc clip region (partial circle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(340, 60, 35, 0, Math.PI);
            ctx.lineTo(305, 60);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(280, 20, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(320, 30, 40, 60);
            ctx.restore();
            
            // Bottom left: Rotated ellipse
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 180, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(40, 140, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(80, 160, 40, 40);
            ctx.restore();
            
            // Bottom right: Complex arc path
            ctx.save();
            ctx.beginPath();
            ctx.arc(300, 180, 30, 0, Math.PI / 2);
            ctx.arc(350, 180, 30, Math.PI / 2, Math.PI);
            ctx.arc(350, 210, 30, Math.PI, 3 * Math.PI / 2);
            ctx.arc(300, 210, 30, 3 * Math.PI / 2, 0);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lime');
            ctx.fillRect(250, 140, 130, 90);
            helpers.setHTML5CanvasFill(ctx, 'navy');
            ctx.fillRect(280, 170, 70, 30);
            ctx.restore();
        }
    };

    // Test 4: Self-intersecting clip paths
    visualTests['clip-self-intersecting'] = {
        name: 'Self-Intersecting Clipping',
        description: 'Test clipping with self-intersecting paths and complex winding',
        width: 400,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Figure-8 clip path
            ctx.save();
            ctx.beginPath();
            ctx.arc(70, 50, 30, 0, 2 * Math.PI);
            ctx.arc(110, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 20, 120, 60);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(60, 35, 60, 30);
            ctx.restore();
            
            // Center: Self-intersecting star
            ctx.save();
            ctx.beginPath();
            const cx = 200, cy = 50;
            // Create self-intersecting star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 40;
                const y = cy + Math.sin(angle) * 40;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(140, 10, 120, 80);
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(180, 30, 40, 40);
            ctx.restore();
            
            // Right: Bow-tie/hourglass shape
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(290, 20);
            ctx.lineTo(350, 80);
            ctx.lineTo(370, 20);
            ctx.lineTo(330, 50);
            ctx.lineTo(370, 80);
            ctx.lineTo(290, 80);
            ctx.lineTo(310, 20);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(270, 10, 120, 80);
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(300, 35, 60, 30);
            ctx.restore();
            
            // Bottom: Complex self-intersecting polygon
            ctx.save();
            ctx.beginPath();
            const points = [
                [50, 130], [120, 160], [80, 120], [150, 150], [90, 180],
                [130, 110], [60, 170], [140, 140], [70, 110], [110, 190]
            ];
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(30, 100, 140, 100);
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(70, 130, 60, 40);
            ctx.restore();
            
            // Bottom right: Spiral-like intersecting path
            ctx.save();
            ctx.beginPath();
            const spiralCx = 300, spiralCy = 150;
            for (let t = 0; t < 4 * Math.PI; t += 0.5) {
                const r = 5 + t * 3;
                const x = spiralCx + r * Math.cos(t);
                const y = spiralCy + r * Math.sin(t);
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            // Connect back to create intersections
            ctx.lineTo(spiralCx + 20, spiralCy - 20);
            ctx.lineTo(spiralCx - 30, spiralCy + 30);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lime');
            ctx.fillRect(220, 110, 160, 80);
            helpers.setSWCanvasFill(ctx, 'navy');
            ctx.fillRect(270, 130, 60, 40);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Figure-8 clip path
            ctx.save();
            ctx.beginPath();
            ctx.arc(70, 50, 30, 0, 2 * Math.PI);
            ctx.arc(110, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(20, 20, 120, 60);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(60, 35, 60, 30);
            ctx.restore();
            
            // Center: Self-intersecting star
            ctx.save();
            ctx.beginPath();
            const cx = 200, cy = 50;
            // Create self-intersecting star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * 40;
                const y = cy + Math.sin(angle) * 40;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(140, 10, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(180, 30, 40, 40);
            ctx.restore();
            
            // Right: Bow-tie/hourglass shape
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(290, 20);
            ctx.lineTo(350, 80);
            ctx.lineTo(370, 20);
            ctx.lineTo(330, 50);
            ctx.lineTo(370, 80);
            ctx.lineTo(290, 80);
            ctx.lineTo(310, 20);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(270, 10, 120, 80);
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(300, 35, 60, 30);
            ctx.restore();
            
            // Bottom: Complex self-intersecting polygon
            ctx.save();
            ctx.beginPath();
            const points = [
                [50, 130], [120, 160], [80, 120], [150, 150], [90, 180],
                [130, 110], [60, 170], [140, 140], [70, 110], [110, 190]
            ];
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(30, 100, 140, 100);
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(70, 130, 60, 40);
            ctx.restore();
            
            // Bottom right: Spiral-like intersecting path
            ctx.save();
            ctx.beginPath();
            const spiralCx = 300, spiralCy = 150;
            for (let t = 0; t < 4 * Math.PI; t += 0.5) {
                const r = 5 + t * 3;
                const x = spiralCx + r * Math.cos(t);
                const y = spiralCy + r * Math.sin(t);
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            // Connect back to create intersections
            ctx.lineTo(spiralCx + 20, spiralCy - 20);
            ctx.lineTo(spiralCx - 30, spiralCy + 30);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lime');
            ctx.fillRect(220, 110, 160, 80);
            helpers.setHTML5CanvasFill(ctx, 'navy');
            ctx.fillRect(270, 130, 60, 40);
            ctx.restore();
        }
    };

    // Test 5: Multiple nested clips
    visualTests['clip-stack-nested'] = {
        name: 'Nested Clipping Stack',
        description: 'Test multiple nested clip regions with proper stack behavior',
        width: 400,
        height: 250,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Two nested rectangular clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(20, 20, 120, 80);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(0, 0, 160, 120);
            
            ctx.save();
            // Second clip: smaller rectangle inside first
            ctx.beginPath();
            ctx.rect(40, 40, 60, 40);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 100, 80);
            ctx.restore();
            
            // After restore, only first clip applies
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(100, 50, 40, 30);
            ctx.restore();
            
            // Center: Circle then triangle clips
            ctx.save();
            // First clip: circle
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(140, 20, 120, 80);
            
            ctx.save();
            // Second clip: triangle inside circle
            ctx.beginPath();
            ctx.moveTo(180, 30);
            ctx.lineTo(220, 30);
            ctx.lineTo(200, 70);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(160, 20, 80, 80);
            ctx.restore();
            
            // Back to circle clip only
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(185, 75, 30, 20);
            ctx.restore();
            
            // Right: Three nested clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(280, 20, 100, 80);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(260, 0, 140, 120);
            
            ctx.save();
            // Second clip: circle inside rectangle
            ctx.beginPath();
            ctx.arc(330, 60, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(300, 30, 60, 60);
            
            ctx.save();
            // Third clip: small rectangle inside circle
            ctx.beginPath();
            ctx.rect(315, 45, 30, 30);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lime');
            ctx.fillRect(310, 40, 40, 40);
            ctx.restore(); // Back to circle + rectangle
            
            helpers.setSWCanvasFill(ctx, 'navy');
            ctx.fillRect(305, 35, 50, 15);
            ctx.restore(); // Back to rectangle only
            
            helpers.setSWCanvasFill(ctx, 'maroon');
            ctx.fillRect(285, 85, 90, 10);
            ctx.restore(); // No clips
            
            // Bottom: Complex nested polygon clips
            ctx.save();
            // First clip: hexagon
            ctx.beginPath();
            const hx = 120, hy = 170;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = hx + Math.cos(angle) * 50;
                const y = hy + Math.sin(angle) * 50;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightcoral');
            ctx.fillRect(50, 110, 140, 120);
            
            ctx.save();
            // Second clip: diamond inside hexagon
            ctx.beginPath();
            ctx.moveTo(120, 140);
            ctx.lineTo(150, 170);
            ctx.lineTo(120, 200);
            ctx.lineTo(90, 170);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'darkblue');
            ctx.fillRect(70, 130, 100, 80);
            
            ctx.save();
            // Third clip: small circle in center
            ctx.beginPath();
            ctx.arc(120, 170, 15, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'gold');
            ctx.fillRect(100, 150, 40, 40);
            ctx.restore(); // Back to diamond + hexagon
            
            helpers.setSWCanvasFill(ctx, 'silver');
            ctx.fillRect(105, 155, 30, 10);
            ctx.restore(); // Back to hexagon only
            
            helpers.setSWCanvasFill(ctx, 'darkgreen');
            ctx.fillRect(140, 145, 25, 50);
            ctx.restore(); // No clips
            
            // Bottom right: Clip stack with transforms
            ctx.save();
            ctx.translate(280, 150);
            ctx.rotate(Math.PI / 6);
            
            // First clip: rotated rectangle
            ctx.beginPath();
            ctx.rect(-40, -30, 80, 60);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'pink');
            ctx.fillRect(-60, -50, 120, 100);
            
            ctx.save();
            ctx.scale(0.7, 0.7);
            // Second clip: scaled circle
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'brown');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore();
            
            helpers.setSWCanvasFill(ctx, 'indigo');
            ctx.fillRect(-15, -35, 30, 15);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Two nested rectangular clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(20, 20, 120, 80);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(0, 0, 160, 120);
            
            ctx.save();
            // Second clip: smaller rectangle inside first
            ctx.beginPath();
            ctx.rect(40, 40, 60, 40);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(20, 20, 100, 80);
            ctx.restore();
            
            // After restore, only first clip applies
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(100, 50, 40, 30);
            ctx.restore();
            
            // Center: Circle then triangle clips
            ctx.save();
            // First clip: circle
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(140, 20, 120, 80);
            
            ctx.save();
            // Second clip: triangle inside circle
            ctx.beginPath();
            ctx.moveTo(180, 30);
            ctx.lineTo(220, 30);
            ctx.lineTo(200, 70);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(160, 20, 80, 80);
            ctx.restore();
            
            // Back to circle clip only
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(185, 75, 30, 20);
            ctx.restore();
            
            // Right: Three nested clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(280, 20, 100, 80);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(260, 0, 140, 120);
            
            ctx.save();
            // Second clip: circle inside rectangle
            ctx.beginPath();
            ctx.arc(330, 60, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(300, 30, 60, 60);
            
            ctx.save();
            // Third clip: small rectangle inside circle
            ctx.beginPath();
            ctx.rect(315, 45, 30, 30);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lime');
            ctx.fillRect(310, 40, 40, 40);
            ctx.restore(); // Back to circle + rectangle
            
            helpers.setHTML5CanvasFill(ctx, 'navy');
            ctx.fillRect(305, 35, 50, 15);
            ctx.restore(); // Back to rectangle only
            
            helpers.setHTML5CanvasFill(ctx, 'maroon');
            ctx.fillRect(285, 85, 90, 10);
            ctx.restore(); // No clips
            
            // Bottom: Complex nested polygon clips
            ctx.save();
            // First clip: hexagon
            ctx.beginPath();
            const hx = 120, hy = 170;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = hx + Math.cos(angle) * 50;
                const y = hy + Math.sin(angle) * 50;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightcoral');
            ctx.fillRect(50, 110, 140, 120);
            
            ctx.save();
            // Second clip: diamond inside hexagon
            ctx.beginPath();
            ctx.moveTo(120, 140);
            ctx.lineTo(150, 170);
            ctx.lineTo(120, 200);
            ctx.lineTo(90, 170);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'darkblue');
            ctx.fillRect(70, 130, 100, 80);
            
            ctx.save();
            // Third clip: small circle in center
            ctx.beginPath();
            ctx.arc(120, 170, 15, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'gold');
            ctx.fillRect(100, 150, 40, 40);
            ctx.restore(); // Back to diamond + hexagon
            
            helpers.setHTML5CanvasFill(ctx, 'silver');
            ctx.fillRect(105, 155, 30, 10);
            ctx.restore(); // Back to hexagon only
            
            helpers.setHTML5CanvasFill(ctx, 'darkgreen');
            ctx.fillRect(140, 145, 25, 50);
            ctx.restore(); // No clips
            
            // Bottom right: Clip stack with transforms
            ctx.save();
            ctx.translate(280, 150);
            ctx.rotate(Math.PI / 6);
            
            // First clip: rotated rectangle
            ctx.beginPath();
            ctx.rect(-40, -30, 80, 60);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'pink');
            ctx.fillRect(-60, -50, 120, 100);
            
            ctx.save();
            ctx.scale(0.7, 0.7);
            // Second clip: scaled circle
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'brown');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore();
            
            helpers.setHTML5CanvasFill(ctx, 'indigo');
            ctx.fillRect(-15, -35, 30, 15);
            ctx.restore();
        }
    };

    // Test 6: Clip with save/restore behavior
    visualTests['clip-save-restore'] = {
        name: 'Clipping Save/Restore',
        description: 'Test proper clipping behavior with save/restore state management',
        width: 400,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Basic save/restore with clip
            helpers.setSWCanvasFill(ctx, 'lightgray');
            ctx.fillRect(10, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(20, 20, 60, 60);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 100, 100);
            ctx.restore();
            
            // Should not be clipped after restore
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(30, 85, 40, 15);
            
            // Center: Multiple save/restore levels
            ctx.save();
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(120, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(130, 20, 60, 40);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(110, 10, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(140, 30, 40, 20);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(120, 20, 80, 60);
            ctx.restore(); // Back to first clip
            
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(135, 65, 30, 15);
            ctx.restore(); // Back to no clips
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(125, 85, 70, 10);
            ctx.restore(); // Back to original state
            
            // Right: Clip with transform save/restore
            ctx.save();
            ctx.translate(280, 50);
            ctx.rotate(Math.PI / 4);
            
            ctx.beginPath();
            ctx.rect(-30, -30, 60, 60);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(-50, -50, 100, 100);
            
            ctx.save();
            ctx.scale(0.5, 0.5);
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore(); // Back to rotated/translated but same clip
            
            helpers.setSWCanvasFill(ctx, 'lime');
            ctx.fillRect(-10, -40, 20, 80);
            ctx.restore(); // Back to original transform and no clip
            
            helpers.setSWCanvasFill(ctx, 'navy');
            ctx.fillRect(250, 85, 60, 10);
            
            // Bottom: Complex save/restore with multiple clips and fills
            ctx.save();
            // First level
            ctx.beginPath();
            ctx.arc(80, 150, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'pink');
            ctx.fillRect(20, 110, 120, 80);
            
            ctx.save();
            // Second level - diamond clip
            ctx.beginPath();
            ctx.moveTo(80, 120);
            ctx.lineTo(110, 150);
            ctx.lineTo(80, 180);
            ctx.lineTo(50, 150);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'brown');
            ctx.fillRect(40, 130, 80, 40);
            
            // Modify state without save
            helpers.setSWCanvasFill(ctx, 'gold');
            ctx.fillRect(70, 140, 20, 20);
            
            ctx.restore(); // Back to circle clip only
            
            helpers.setSWCanvasFill(ctx, 'silver');
            ctx.fillRect(60, 125, 40, 10);
            
            ctx.save();
            // Third level - small rectangle
            ctx.beginPath();
            ctx.rect(65, 160, 30, 15);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'maroon');
            ctx.fillRect(50, 150, 60, 30);
            ctx.restore(); // Back to circle clip
            
            helpers.setSWCanvasFill(ctx, 'darkgreen');
            ctx.fillRect(90, 135, 25, 30);
            ctx.restore(); // Back to no clips
            
            // Should render without any clipping
            helpers.setSWCanvasFill(ctx, 'black');
            ctx.fillRect(30, 185, 100, 10);
            
            // Bottom right: Save/restore with stroke and fill
            ctx.save();
            ctx.beginPath();
            ctx.rect(220, 120, 80, 60);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'lightcoral');
            ctx.fillRect(200, 100, 120, 100);
            
            helpers.setSWCanvasStroke(ctx, 'darkblue');
            ctx.lineWidth = 3;
            ctx.strokeRect(210, 110, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(260, 150, 25, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(235, 125, 50, 50);
            
            helpers.setSWCanvasStroke(ctx, 'red');
            ctx.lineWidth = 2;
            ctx.strokeRect(245, 135, 30, 30);
            ctx.restore();
            
            helpers.setSWCanvasStroke(ctx, 'green');
            ctx.lineWidth = 4;
            ctx.strokeRect(225, 125, 70, 15);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Basic save/restore with clip
            helpers.setHTML5CanvasFill(ctx, 'lightgray');
            ctx.fillRect(10, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(20, 20, 60, 60);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 100, 100);
            ctx.restore();
            
            // Should not be clipped after restore
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(30, 85, 40, 15);
            
            // Center: Multiple save/restore levels
            ctx.save();
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(120, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(130, 20, 60, 40);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(110, 10, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(140, 30, 40, 20);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(120, 20, 80, 60);
            ctx.restore(); // Back to first clip
            
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(135, 65, 30, 15);
            ctx.restore(); // Back to no clips
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(125, 85, 70, 10);
            ctx.restore(); // Back to original state
            
            // Right: Clip with transform save/restore
            ctx.save();
            ctx.translate(280, 50);
            ctx.rotate(Math.PI / 4);
            
            ctx.beginPath();
            ctx.rect(-30, -30, 60, 60);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(-50, -50, 100, 100);
            
            ctx.save();
            ctx.scale(0.5, 0.5);
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore(); // Back to rotated/translated but same clip
            
            helpers.setHTML5CanvasFill(ctx, 'lime');
            ctx.fillRect(-10, -40, 20, 80);
            ctx.restore(); // Back to original transform and no clip
            
            helpers.setHTML5CanvasFill(ctx, 'navy');
            ctx.fillRect(250, 85, 60, 10);
            
            // Bottom: Complex save/restore with multiple clips and fills
            ctx.save();
            // First level
            ctx.beginPath();
            ctx.arc(80, 150, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'pink');
            ctx.fillRect(20, 110, 120, 80);
            
            ctx.save();
            // Second level - diamond clip
            ctx.beginPath();
            ctx.moveTo(80, 120);
            ctx.lineTo(110, 150);
            ctx.lineTo(80, 180);
            ctx.lineTo(50, 150);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'brown');
            ctx.fillRect(40, 130, 80, 40);
            
            // Modify state without save
            helpers.setHTML5CanvasFill(ctx, 'gold');
            ctx.fillRect(70, 140, 20, 20);
            
            ctx.restore(); // Back to circle clip only
            
            helpers.setHTML5CanvasFill(ctx, 'silver');
            ctx.fillRect(60, 125, 40, 10);
            
            ctx.save();
            // Third level - small rectangle
            ctx.beginPath();
            ctx.rect(65, 160, 30, 15);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'maroon');
            ctx.fillRect(50, 150, 60, 30);
            ctx.restore(); // Back to circle clip
            
            helpers.setHTML5CanvasFill(ctx, 'darkgreen');
            ctx.fillRect(90, 135, 25, 30);
            ctx.restore(); // Back to no clips
            
            // Should render without any clipping
            helpers.setHTML5CanvasFill(ctx, 'black');
            ctx.fillRect(30, 185, 100, 10);
            
            // Bottom right: Save/restore with stroke and fill
            ctx.save();
            ctx.beginPath();
            ctx.rect(220, 120, 80, 60);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'lightcoral');
            ctx.fillRect(200, 100, 120, 100);
            
            helpers.setHTML5CanvasStroke(ctx, 'darkblue');
            ctx.lineWidth = 3;
            ctx.strokeRect(210, 110, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(260, 150, 25, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(235, 125, 50, 50);
            
            helpers.setHTML5CanvasStroke(ctx, 'red');
            ctx.lineWidth = 2;
            ctx.strokeRect(245, 135, 30, 30);
            ctx.restore();
            
            helpers.setHTML5CanvasStroke(ctx, 'green');
            ctx.lineWidth = 4;
            ctx.strokeRect(225, 125, 70, 15);
            ctx.restore();
        }
    };

    // Test 7: Basic clipping regions  
    visualTests['clip-intersection'] = {
        name: 'Basic Clipping Regions',
        description: 'Test various single clipping regions with different shapes',
        width: 400,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(this.width, this.height);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Left: Single rectangular clip (simplified from intersection)
            ctx.save();
            // Direct rectangle clip representing the intersection area
            ctx.beginPath();
            ctx.rect(30, 50, 40, 40);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 120, 120);
            ctx.restore();
            
            // Center: Triangle clip region  
            ctx.save();
            // Triangle clip
            ctx.beginPath();
            ctx.moveTo(180, 90);
            ctx.lineTo(220, 90);
            ctx.lineTo(200, 50);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(160, 30, 80, 80);
            ctx.restore();
            
            // Right: Diamond clip region
            ctx.save();
            // Diamond clip
            ctx.beginPath();
            ctx.moveTo(330, 40);
            ctx.lineTo(360, 70);
            ctx.lineTo(330, 100);
            ctx.lineTo(300, 70);
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(280, 20, 100, 100);
            ctx.restore();
            
            // Bottom left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 150, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(40, 110, 80, 80);
            ctx.restore();
            
            // Bottom center: Another circle clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 150, 32, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'cyan');
            ctx.fillRect(160, 110, 80, 80);
            ctx.restore();
            
            // Bottom right: Star clip region
            ctx.save();
            ctx.beginPath();
            const starCx = 330, starCy = 150;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerX = starCx + Math.cos(angle) * 30;
                const outerY = starCy + Math.sin(angle) * 30;
                const innerAngle = angle + Math.PI / 5;
                const innerX = starCx + Math.cos(innerAngle) * 15;
                const innerY = starCy + Math.sin(innerAngle) * 15;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fillRect(290, 110, 80, 80);
            ctx.restore();
            
            return surface;
        },
        
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Left: Single rectangular clip (simplified from intersection)
            ctx.save();
            // Direct rectangle clip representing the intersection area
            ctx.beginPath();
            ctx.rect(30, 50, 40, 40);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(0, 0, 120, 120);
            ctx.restore();
            
            // Center: Triangle clip region  
            ctx.save();
            // Triangle clip
            ctx.beginPath();
            ctx.moveTo(180, 90);
            ctx.lineTo(220, 90);
            ctx.lineTo(200, 50);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(160, 30, 80, 80);
            ctx.restore();
            
            // Right: Diamond clip region
            ctx.save();
            // Diamond clip
            ctx.beginPath();
            ctx.moveTo(330, 40);
            ctx.lineTo(360, 70);
            ctx.lineTo(330, 100);
            ctx.lineTo(300, 70);
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(280, 20, 100, 100);
            ctx.restore();
            
            // Bottom left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 150, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(40, 110, 80, 80);
            ctx.restore();
            
            // Bottom center: Another circle clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 150, 32, 0, 2 * Math.PI);
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'cyan');
            ctx.fillRect(160, 110, 80, 80);
            ctx.restore();
            
            // Bottom right: Star clip region
            ctx.save();
            ctx.beginPath();
            const starCx = 330, starCy = 150;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerX = starCx + Math.cos(angle) * 30;
                const outerY = starCy + Math.sin(angle) * 30;
                const innerAngle = angle + Math.PI / 5;
                const innerX = starCx + Math.cos(innerAngle) * 15;
                const innerY = starCy + Math.sin(innerAngle) * 15;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fillRect(290, 110, 80, 80);
            ctx.restore();
        }
    };

    // Test 34: Enhanced Clipping Intersection Test
    visualTests['clip-intersection-enhanced'] = {
        name: 'Enhanced Clipping Intersection Test',
        width: 400, height: 300,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Overlapping circles (top left)
            ctx.save();
            
            // First clip: circle at (80, 60)
            ctx.beginPath();
            ctx.arc(80, 60, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Second clip: circle at (120, 60) - intersection
            ctx.beginPath();
            ctx.arc(120, 60, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill - should only appear in intersection
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(40, 30, 100, 60);
            ctx.restore();
            
            // Test 2: Rectangle intersecting circle (top right)
            ctx.save();
            
            // First clip: circle
            ctx.beginPath();
            ctx.arc(300, 60, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            // Second clip: rectangle
            ctx.rect(270, 40, 60, 40);
            ctx.clip();
            
            // Fill intersection
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fillRect(250, 20, 100, 80);
            ctx.restore();
            
            // Test 3: Complex polygon intersection (bottom left)
            ctx.save();
            
            // First clip: triangle
            ctx.beginPath();
            ctx.moveTo(100, 150);
            ctx.lineTo(50, 220);
            ctx.lineTo(150, 220);
            ctx.closePath();
            ctx.clip();
            
            // Second clip: diamond
            ctx.beginPath();
            ctx.moveTo(100, 180);
            ctx.lineTo(130, 200);
            ctx.lineTo(100, 220);
            ctx.lineTo(70, 200);
            ctx.closePath();
            ctx.clip();
            
            // Fill intersection
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(30, 130, 140, 120);
            ctx.restore();
            
            // Test 4: Nested save/restore with multiple clips (bottom right)
            ctx.save();
            
            // Outer clip: large rectangle
            ctx.rect(220, 160, 120, 80);
            ctx.clip();
            
            ctx.save();
            // Inner clip: circle within rectangle
            ctx.beginPath();
            ctx.arc(280, 200, 25, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill inner intersection
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fillRect(200, 140, 160, 120);
            
            ctx.restore(); // Restore to just outer clip
            
            // Fill outer area (but not inner circle)
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(210, 150, 140, 100);
            
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Overlapping circles (top left)
            ctx.save();
            
            // First clip: circle at (80, 60)
            ctx.beginPath();
            ctx.arc(80, 60, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Second clip: circle at (120, 60) - intersection
            ctx.beginPath();
            ctx.arc(120, 60, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill - should only appear in intersection
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(40, 30, 100, 60);
            ctx.restore();
            
            // Test 2: Rectangle intersecting circle (top right)
            ctx.save();
            
            // First clip: circle
            ctx.beginPath();
            ctx.arc(300, 60, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            // Second clip: rectangle
            ctx.rect(270, 40, 60, 40);
            ctx.clip();
            
            // Fill intersection
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fillRect(250, 20, 100, 80);
            ctx.restore();
            
            // Test 3: Complex polygon intersection (bottom left)
            ctx.save();
            
            // First clip: triangle
            ctx.beginPath();
            ctx.moveTo(100, 150);
            ctx.lineTo(50, 220);
            ctx.lineTo(150, 220);
            ctx.closePath();
            ctx.clip();
            
            // Second clip: diamond
            ctx.beginPath();
            ctx.moveTo(100, 180);
            ctx.lineTo(130, 200);
            ctx.lineTo(100, 220);
            ctx.lineTo(70, 200);
            ctx.closePath();
            ctx.clip();
            
            // Fill intersection
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(30, 130, 140, 120);
            ctx.restore();
            
            // Test 4: Nested save/restore with multiple clips (bottom right)
            ctx.save();
            
            // Outer clip: large rectangle
            ctx.rect(220, 160, 120, 80);
            ctx.clip();
            
            ctx.save();
            // Inner clip: circle within rectangle
            ctx.beginPath();
            ctx.arc(280, 200, 25, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill inner intersection
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fillRect(200, 140, 160, 120);
            
            ctx.restore(); // Restore to just outer clip
            
            // Fill outer area (but not inner circle)
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(210, 150, 140, 100);
            
            ctx.restore();
        }
    };

    // Test 35: Combined Transform + Fill + Rotate - Rotated complex polygons
    visualTests['combined-transform-fill-rotate'] = {
        name: 'Rotated complex polygons',
        width: 400, height: 300,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated star (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 4); // 45 degrees
            
            ctx.beginPath();
            // Create 6-pointed star
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const outerRadius = 30;
                const innerRadius = 15;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 6;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
            
            // Test 2: Rotated self-intersecting polygon (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.rotate(-Math.PI / 6); // -30 degrees
            
            ctx.beginPath();
            // Figure-8 shape
            ctx.moveTo(-40, -20);
            ctx.quadraticCurveTo(0, -40, 40, -20);
            ctx.quadraticCurveTo(0, 0, -40, 20);
            ctx.quadraticCurveTo(0, 40, 40, 20);
            ctx.quadraticCurveTo(0, 0, -40, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fill('evenodd');
            ctx.restore();
            
            // Test 3: Multiple rotated rectangles with different angles (bottom left)
            const colors = ['blue', 'orange', 'purple', 'brown'];
            const angles = [0, Math.PI/6, Math.PI/3, Math.PI/2];
            
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.translate(100, 200);
                ctx.rotate(angles[i]);
                
                helpers.setSWCanvasFill(ctx, colors[i]);
                ctx.fillRect(-30 + i*5, -10 + i*5, 60, 20);
                ctx.restore();
            }
            
            // Test 4: Rotated complex path with curves (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(Math.PI / 8);
            ctx.scale(0.8, 1.2);
            
            ctx.beginPath();
            ctx.moveTo(-30, -25);
            ctx.bezierCurveTo(-20, -40, 20, -40, 30, -25);
            ctx.bezierCurveTo(40, -10, 40, 10, 30, 25);
            ctx.bezierCurveTo(20, 40, -20, 40, -30, 25);
            ctx.bezierCurveTo(-40, 10, -40, -10, -30, -25);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fill();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated star (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 4); // 45 degrees
            
            ctx.beginPath();
            // Create 6-pointed star
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const outerRadius = 30;
                const innerRadius = 15;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 6;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
            
            // Test 2: Rotated self-intersecting polygon (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.rotate(-Math.PI / 6); // -30 degrees
            
            ctx.beginPath();
            // Figure-8 shape
            ctx.moveTo(-40, -20);
            ctx.quadraticCurveTo(0, -40, 40, -20);
            ctx.quadraticCurveTo(0, 0, -40, 20);
            ctx.quadraticCurveTo(0, 40, 40, 20);
            ctx.quadraticCurveTo(0, 0, -40, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fill('evenodd');
            ctx.restore();
            
            // Test 3: Multiple rotated rectangles with different angles (bottom left)
            const colors = ['blue', 'orange', 'purple', 'brown'];
            const angles = [0, Math.PI/6, Math.PI/3, Math.PI/2];
            
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.translate(100, 200);
                ctx.rotate(angles[i]);
                
                helpers.setHTML5CanvasFill(ctx, colors[i]);
                ctx.fillRect(-30 + i*5, -10 + i*5, 60, 20);
                ctx.restore();
            }
            
            // Test 4: Rotated complex path with curves (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(Math.PI / 8);
            ctx.scale(0.8, 1.2);
            
            ctx.beginPath();
            ctx.moveTo(-30, -25);
            ctx.bezierCurveTo(-20, -40, 20, -40, 30, -25);
            ctx.bezierCurveTo(40, -10, 40, 10, 30, 25);
            ctx.bezierCurveTo(20, 40, -20, 40, -30, 25);
            ctx.bezierCurveTo(-40, 10, -40, -10, -30, -25);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fill();
            ctx.restore();
        }
    };

    // Test 36: Combined Transform + Fill + Scale - Scaled paths with fill rules
    visualTests['combined-transform-fill-scale'] = {
        name: 'Scaled paths with fill rules',
        width: 400, height: 300,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Asymmetrically scaled star with nonzero fill rule (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.scale(1.5, 0.8); // Wide and short
            
            ctx.beginPath();
            // Create 5-pointed star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fill('nonzero');
            ctx.restore();
            
            // Test 2: Scaled self-intersecting shape with evenodd rule (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(0.7, 1.8); // Tall and narrow
            
            ctx.beginPath();
            // Bow-tie / hourglass shape
            ctx.moveTo(-30, -20);
            ctx.lineTo(30, 20);
            ctx.lineTo(-30, 20);
            ctx.lineTo(30, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fill('evenodd');
            ctx.restore();
            
            // Test 3: Multiple scaled concentric shapes (bottom left)
            const scales = [1.0, 0.75, 0.5, 0.25];
            const colors = ['blue', 'orange', 'purple', 'yellow'];
            
            ctx.save();
            ctx.translate(100, 200);
            
            for (let i = 0; i < scales.length; i++) {
                ctx.save();
                ctx.scale(scales[i], scales[i]);
                
                ctx.beginPath();
                // Hexagon
                for (let j = 0; j < 6; j++) {
                    const angle = (j * Math.PI) / 3;
                    const x = Math.cos(angle) * 30;
                    const y = Math.sin(angle) * 30;
                    if (j === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                
                helpers.setSWCanvasFill(ctx, colors[i]);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            
            // Test 4: Extremely scaled bezier curves (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.scale(2.5, 0.4); // Very wide and very short
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-15, -30, 15, -30, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(15, 30, -15, 30, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'magenta');
            ctx.fill();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Asymmetrically scaled star with nonzero fill rule (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.scale(1.5, 0.8); // Wide and short
            
            ctx.beginPath();
            // Create 5-pointed star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fill('nonzero');
            ctx.restore();
            
            // Test 2: Scaled self-intersecting shape with evenodd rule (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(0.7, 1.8); // Tall and narrow
            
            ctx.beginPath();
            // Bow-tie / hourglass shape
            ctx.moveTo(-30, -20);
            ctx.lineTo(30, 20);
            ctx.lineTo(-30, 20);
            ctx.lineTo(30, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fill('evenodd');
            ctx.restore();
            
            // Test 3: Multiple scaled concentric shapes (bottom left)
            const scales = [1.0, 0.75, 0.5, 0.25];
            const colors = ['blue', 'orange', 'purple', 'yellow'];
            
            ctx.save();
            ctx.translate(100, 200);
            
            for (let i = 0; i < scales.length; i++) {
                ctx.save();
                ctx.scale(scales[i], scales[i]);
                
                ctx.beginPath();
                // Hexagon
                for (let j = 0; j < 6; j++) {
                    const angle = (j * Math.PI) / 3;
                    const x = Math.cos(angle) * 30;
                    const y = Math.sin(angle) * 30;
                    if (j === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                
                helpers.setHTML5CanvasFill(ctx, colors[i]);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            
            // Test 4: Extremely scaled bezier curves (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.scale(2.5, 0.4); // Very wide and very short
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-15, -30, 15, -30, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(15, 30, -15, 30, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'magenta');
            ctx.fill();
            ctx.restore();
        }
    };

    // Test 37: Combined Transform + Clip + Fill - Critical stencil buffer test
    visualTests['combined-transform-clip-fill'] = {
        name: 'Transform + Clip + Fill',
        width: 400, height: 300,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated clip with translated fill (top left)
            ctx.save();
            ctx.translate(100, 75);
            
            // Rotated circular clip
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Translated fill
            ctx.translate(10, 10);
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fillRect(-30, -30, 60, 60);
            ctx.restore();
            
            // Test 2: Scaled clip with scaled fill (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(1.5, 0.8);
            
            // Star clip shape
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 20;
                const innerRadius = 10;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.beginPath();
            ctx.moveTo(-25, -20);
            ctx.quadraticCurveTo(0, -35, 25, -20);
            ctx.quadraticCurveTo(35, 0, 25, 20);
            ctx.quadraticCurveTo(0, 35, -25, 20);
            ctx.quadraticCurveTo(-35, 0, -25, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'green');
            ctx.fill();
            ctx.restore();
            
            // Test 3: Multiple clip intersections with transforms (bottom left)
            ctx.save();
            ctx.translate(100, 200);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(Math.PI / 6);
            ctx.rect(-25, -15, 50, 30);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled circle (intersection)
            ctx.save();
            ctx.scale(1.2, 0.6);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Fill should only appear in intersection
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore();
            
            // Test 4: Complex nested transforms with clips (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(-Math.PI / 8);
            ctx.scale(0.9, 1.1);
            
            // Outer clip: diamond
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(30, 0);
            ctx.lineTo(0, 30);
            ctx.lineTo(-30, 0);
            ctx.closePath();
            ctx.clip();
            
            ctx.save();
            ctx.translate(5, -5);
            ctx.rotate(Math.PI / 4);
            ctx.scale(1.2, 0.8);
            
            // Inner clip: triangle
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(15, 15);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            ctx.clip();
            
            // Complex fill path
            ctx.beginPath();
            ctx.moveTo(-20, -20);
            ctx.bezierCurveTo(-10, -30, 10, -30, 20, -20);
            ctx.bezierCurveTo(30, -10, 30, 10, 20, 20);
            ctx.bezierCurveTo(10, 30, -10, 30, -20, 20);
            ctx.bezierCurveTo(-30, 10, -30, -10, -20, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fill();
            ctx.restore();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated clip with translated fill (top left)
            ctx.save();
            ctx.translate(100, 75);
            
            // Rotated circular clip
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Translated fill
            ctx.translate(10, 10);
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fillRect(-30, -30, 60, 60);
            ctx.restore();
            
            // Test 2: Scaled clip with scaled fill (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(1.5, 0.8);
            
            // Star clip shape
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 20;
                const innerRadius = 10;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.beginPath();
            ctx.moveTo(-25, -20);
            ctx.quadraticCurveTo(0, -35, 25, -20);
            ctx.quadraticCurveTo(35, 0, 25, 20);
            ctx.quadraticCurveTo(0, 35, -25, 20);
            ctx.quadraticCurveTo(-35, 0, -25, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'green');
            ctx.fill();
            ctx.restore();
            
            // Test 3: Multiple clip intersections with transforms (bottom left)
            ctx.save();
            ctx.translate(100, 200);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(Math.PI / 6);
            ctx.rect(-25, -15, 50, 30);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled circle (intersection)
            ctx.save();
            ctx.scale(1.2, 0.6);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Fill should only appear in intersection
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore();
            
            // Test 4: Complex nested transforms with clips (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(-Math.PI / 8);
            ctx.scale(0.9, 1.1);
            
            // Outer clip: diamond
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(30, 0);
            ctx.lineTo(0, 30);
            ctx.lineTo(-30, 0);
            ctx.closePath();
            ctx.clip();
            
            ctx.save();
            ctx.translate(5, -5);
            ctx.rotate(Math.PI / 4);
            ctx.scale(1.2, 0.8);
            
            // Inner clip: triangle
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(15, 15);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            ctx.clip();
            
            // Complex fill path
            ctx.beginPath();
            ctx.moveTo(-20, -20);
            ctx.bezierCurveTo(-10, -30, 10, -30, 20, -20);
            ctx.bezierCurveTo(30, -10, 30, 10, 20, 20);
            ctx.bezierCurveTo(10, 30, -10, 30, -20, 20);
            ctx.bezierCurveTo(-30, 10, -30, -10, -20, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fill();
            ctx.restore();
            ctx.restore();
        }
    };

    // Test 38: Combined All Features + GlobalAlpha - Ultimate comprehensive test
    visualTests['combined-all-features'] = {
        name: 'All features + globalAlpha',
        width: 400, height: 300,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated clip with semi-transparent fill (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 6);
            ctx.globalAlpha = 0.7;
            
            // Diamond clip
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(25, 0);
            ctx.lineTo(0, 25);
            ctx.lineTo(-25, 0);
            ctx.closePath();
            ctx.clip();
            
            // Complex filled path with transparency
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = Math.cos(angle) * 20;
                const y = Math.sin(angle) * 20;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
            
            // Test 2: Scaled stroke with clip and alpha (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(1.2, 0.8);
            ctx.globalAlpha = 0.6;
            
            // Circular clip
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Stroked spiral path
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let t = 0; t < 4 * Math.PI; t += 0.2) {
                const r = t * 3;
                const x = Math.cos(t) * r;
                const y = Math.sin(t) * r;
                ctx.lineTo(x, y);
            }
            
            ctx.lineWidth = 3;
            helpers.setSWCanvasStroke(ctx, 'green');
            ctx.stroke();
            ctx.restore();
            
            // Test 3: Multiple nested clips with varying alpha (bottom left)
            ctx.save();
            ctx.translate(100, 200);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(-Math.PI / 8);
            ctx.rect(-30, -20, 60, 40);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled ellipse
            ctx.save();
            ctx.scale(0.8, 1.3);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Layer 1: Semi-transparent background
            ctx.globalAlpha = 0.4;
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            
            // Layer 2: More transparent overlay
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(-15, -20);
            ctx.quadraticCurveTo(0, -30, 15, -20);
            ctx.quadraticCurveTo(25, 0, 15, 20);
            ctx.quadraticCurveTo(0, 30, -15, 20);
            ctx.quadraticCurveTo(-25, 0, -15, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fill();
            ctx.restore();
            
            // Test 4: Ultimate complexity - all features combined (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(Math.PI / 12);
            ctx.scale(1.1, 0.9);
            ctx.globalAlpha = 0.8;
            
            // Complex clip shape: star with hole
            ctx.beginPath();
            // Outer star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.globalAlpha = 0.9; // Alpha on alpha
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-10, -25, 10, -25, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(10, 25, -10, 25, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fill();
            
            // Add stroked outline on top
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            helpers.setSWCanvasStroke(ctx, 'magenta');
            ctx.stroke();
            ctx.restore();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Rotated clip with semi-transparent fill (top left)
            ctx.save();
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 6);
            ctx.globalAlpha = 0.7;
            
            // Diamond clip
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(25, 0);
            ctx.lineTo(0, 25);
            ctx.lineTo(-25, 0);
            ctx.closePath();
            ctx.clip();
            
            // Complex filled path with transparency
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = Math.cos(angle) * 20;
                const y = Math.sin(angle) * 20;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
            
            // Test 2: Scaled stroke with clip and alpha (top right)
            ctx.save();
            ctx.translate(300, 75);
            ctx.scale(1.2, 0.8);
            ctx.globalAlpha = 0.6;
            
            // Circular clip
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Stroked spiral path
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let t = 0; t < 4 * Math.PI; t += 0.2) {
                const r = t * 3;
                const x = Math.cos(t) * r;
                const y = Math.sin(t) * r;
                ctx.lineTo(x, y);
            }
            
            ctx.lineWidth = 3;
            helpers.setHTML5CanvasStroke(ctx, 'green');
            ctx.stroke();
            ctx.restore();
            
            // Test 3: Multiple nested clips with varying alpha (bottom left)
            ctx.save();
            ctx.translate(100, 200);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(-Math.PI / 8);
            ctx.rect(-30, -20, 60, 40);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled ellipse
            ctx.save();
            ctx.scale(0.8, 1.3);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Layer 1: Semi-transparent background
            ctx.globalAlpha = 0.4;
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            
            // Layer 2: More transparent overlay
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(-15, -20);
            ctx.quadraticCurveTo(0, -30, 15, -20);
            ctx.quadraticCurveTo(25, 0, 15, 20);
            ctx.quadraticCurveTo(0, 30, -15, 20);
            ctx.quadraticCurveTo(-25, 0, -15, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fill();
            ctx.restore();
            
            // Test 4: Ultimate complexity - all features combined (bottom right)
            ctx.save();
            ctx.translate(300, 200);
            ctx.rotate(Math.PI / 12);
            ctx.scale(1.1, 0.9);
            ctx.globalAlpha = 0.8;
            
            // Complex clip shape: star with hole
            ctx.beginPath();
            // Outer star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.globalAlpha = 0.9; // Alpha on alpha
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-10, -25, 10, -25, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(10, 25, -10, 25, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fill();
            
            // Add stroked outline on top
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            helpers.setHTML5CanvasStroke(ctx, 'magenta');
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        }
    };

    // Test 39: Debug Alpha Blending Issue - Multiple nested clips with varying alpha
    visualTests['debug-alpha-blending'] = {
        name: 'Debug Alpha Blending Issue',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(-Math.PI / 8);
            ctx.rect(-30, -20, 60, 40);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled ellipse
            ctx.save();
            ctx.scale(0.8, 1.3);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Layer 1: Semi-transparent background
            ctx.globalAlpha = 0.4;
            helpers.setSWCanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            
            // Check pixel value after first layer
            const layer1Offset = 100 * surface.stride + 100 * 4;
            const r1 = surface.data[layer1Offset];
            const g1 = surface.data[layer1Offset + 1];
            const b1 = surface.data[layer1Offset + 2];
            const a1 = surface.data[layer1Offset + 3];
            console.log(`After blue layer: R=${r1}, G=${g1}, B=${b1}, A=${a1}`);
            
            // Layer 2: More transparent overlay
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(-15, -20);
            ctx.quadraticCurveTo(0, -30, 15, -20);
            ctx.quadraticCurveTo(25, 0, 15, 20);
            ctx.quadraticCurveTo(0, 30, -15, 20);
            ctx.quadraticCurveTo(-25, 0, -15, -20);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'orange');
            ctx.fill();
            ctx.restore();
            
            // Check pixel value inside orange shape at (90, 100) = (-10, 0) in translated coords
            const orangeOffset = 100 * surface.stride + 90 * 4;
            const r = surface.data[orangeOffset];
            const g = surface.data[orangeOffset + 1];
            const b = surface.data[orangeOffset + 2];
            const a = surface.data[orangeOffset + 3];
            
            console.log(`SWCanvas orange area: R=${r}, G=${g}, B=${b}, A=${a}`);
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            
            // First clip: rotated rectangle
            ctx.save();
            ctx.rotate(-Math.PI / 8);
            ctx.rect(-30, -20, 60, 40);
            ctx.clip();
            ctx.restore();
            
            // Second clip: scaled ellipse
            ctx.save();
            ctx.scale(0.8, 1.3);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, 2 * Math.PI);
            ctx.clip();
            ctx.restore();
            
            // Layer 1: Semi-transparent background
            ctx.globalAlpha = 0.4;
            helpers.setHTML5CanvasFill(ctx, 'blue');
            ctx.fillRect(-40, -40, 80, 80);
            
            // Layer 2: More transparent overlay
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(-15, -20);
            ctx.quadraticCurveTo(0, -30, 15, -20);
            ctx.quadraticCurveTo(25, 0, 15, 20);
            ctx.quadraticCurveTo(0, 30, -15, 20);
            ctx.quadraticCurveTo(-25, 0, -15, -20);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'orange');
            ctx.fill();
            ctx.restore();
            
            // Check pixel value at center of clipped region (100, 100)  
            const imageData = ctx.getImageData(100, 100, 1, 1);
            const r = imageData.data[0];
            const g = imageData.data[1];
            const b = imageData.data[2];
            const a = imageData.data[3];
            
            console.log(`HTML5Canvas clipped center: R=${r}, G=${g}, B=${b}, A=${a}`);
        }
    };

    // Test 40: Debug Star Shape Issue - Complex clip path with transforms
    visualTests['debug-star-shape'] = {
        name: 'Debug Star Shape Issue',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 12);
            ctx.scale(1.1, 0.9);
            ctx.globalAlpha = 0.8;
            
            // Complex clip shape: star with hole
            ctx.beginPath();
            // Outer star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.globalAlpha = 0.9; // Alpha on alpha
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-10, -25, 10, -25, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(10, 25, -10, 25, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fill();
            
            // Add stroked outline on top
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            helpers.setSWCanvasStroke(ctx, 'magenta');
            ctx.stroke();
            ctx.restore();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 12);
            ctx.scale(1.1, 0.9);
            ctx.globalAlpha = 0.8;
            
            // Complex clip shape: star with hole
            ctx.beginPath();
            // Outer star
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 25;
                const innerRadius = 12;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.clip();
            
            // Fill with complex path
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.globalAlpha = 0.9; // Alpha on alpha
            
            ctx.beginPath();
            ctx.moveTo(-20, -15);
            ctx.bezierCurveTo(-10, -25, 10, -25, 20, -15);
            ctx.bezierCurveTo(25, 0, 25, 0, 20, 15);
            ctx.bezierCurveTo(10, 25, -10, 25, -20, 15);
            ctx.bezierCurveTo(-25, 0, -25, 0, -20, -15);
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fill();
            
            // Add stroked outline on top
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            helpers.setHTML5CanvasStroke(ctx, 'magenta');
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        }
    };

    // Test 41: Pixel Analysis - Check exact pixel values at center
    visualTests['pixel-analysis'] = {
        name: 'Pixel Analysis Test',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            
            // First layer: Semi-transparent blue at alpha 0.4
            ctx.globalAlpha = 0.4;
            helpers.setSWCanvasFill(ctx, 'blue'); // RGB(0, 0, 255)
            ctx.fillRect(-30, -30, 60, 60);
            
            // Second layer: Semi-transparent orange at alpha 0.6, overlapping
            ctx.globalAlpha = 0.6;
            helpers.setSWCanvasFill(ctx, 'orange'); // RGB(255, 165, 0)
            ctx.fillRect(-20, -20, 40, 40);
            
            ctx.restore();
            
            // Check pixel value at center (100, 100)
            const centerOffset = 100 * surface.stride + 100 * 4;
            const r = surface.data[centerOffset];
            const g = surface.data[centerOffset + 1];
            const b = surface.data[centerOffset + 2];
            const a = surface.data[centerOffset + 3];
            
            console.log(`SWCanvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            
            // First layer: Semi-transparent blue at alpha 0.4
            ctx.globalAlpha = 0.4;
            helpers.setHTML5CanvasFill(ctx, 'blue'); // RGB(0, 0, 255)
            ctx.fillRect(-30, -30, 60, 60);
            
            // Second layer: Semi-transparent orange at alpha 0.6, overlapping
            ctx.globalAlpha = 0.6;
            helpers.setHTML5CanvasFill(ctx, 'orange'); // RGB(255, 165, 0)
            ctx.fillRect(-20, -20, 40, 40);
            
            ctx.restore();
            
            // Check pixel value at center (100, 100)
            const imageData = ctx.getImageData(100, 100, 1, 1);
            const r = imageData.data[0];
            const g = imageData.data[1];
            const b = imageData.data[2];
            const a = imageData.data[3];
            
            console.log(`HTML5Canvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
        }
    };

    // Test 42: Debug Star Path Generation - Isolated star path test
    visualTests['debug-star-path'] = {
        name: 'Debug Star Path Generation',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            // No transforms - just the raw star
            
            // Draw star path for debugging
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 40;
                const innerRadius = 20;
                
                console.log(`Star point ${i}: angle=${angle}`);
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                console.log(`  Outer: (${outerX.toFixed(2)}, ${outerY.toFixed(2)})`);
                console.log(`  Inner: (${innerX.toFixed(2)}, ${innerY.toFixed(2)})`);
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setSWCanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            // No transforms - just the raw star
            
            // Draw star path for debugging
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = 40;
                const innerRadius = 20;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            helpers.setHTML5CanvasFill(ctx, 'red');
            ctx.fill();
            ctx.restore();
        }
    };

    // Test 43: Combined Transform + Stroke + Rotate - Phase 4 Integration Test
    visualTests['combined-transform-stroke-rotate'] = {
        name: 'Rotated Stroke Joins',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 6); // 30 degrees
            ctx.scale(1.2, 0.8); // Non-uniform scaling
            
            // Complex path with sharp corners to test stroke joins
            ctx.beginPath();
            ctx.moveTo(-60, -40);
            ctx.lineTo(20, -40);
            ctx.lineTo(40, -20);
            ctx.lineTo(40, 20);
            ctx.lineTo(20, 40);
            ctx.lineTo(-20, 40);
            ctx.lineTo(-40, 20);
            ctx.lineTo(-40, -20);
            ctx.closePath();
            
            // Test different stroke properties
            ctx.lineWidth = 8;
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 4;
            ctx.globalAlpha = 0.8;
            
            helpers.setSWCanvasStroke(ctx, 'blue');
            ctx.stroke();
            
            // Add smaller rotated shape inside
            ctx.save();
            ctx.rotate(Math.PI / 4); // Additional 45 degrees
            ctx.beginPath();
            ctx.moveTo(-15, -15);
            ctx.lineTo(15, -15);
            ctx.lineTo(15, 15);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            helpers.setSWCanvasStroke(ctx, 'orange');
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 6); // 30 degrees
            ctx.scale(1.2, 0.8); // Non-uniform scaling
            
            // Complex path with sharp corners to test stroke joins
            ctx.beginPath();
            ctx.moveTo(-60, -40);
            ctx.lineTo(20, -40);
            ctx.lineTo(40, -20);
            ctx.lineTo(40, 20);
            ctx.lineTo(20, 40);
            ctx.lineTo(-20, 40);
            ctx.lineTo(-40, 20);
            ctx.lineTo(-40, -20);
            ctx.closePath();
            
            // Test different stroke properties
            ctx.lineWidth = 8;
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 4;
            ctx.globalAlpha = 0.8;
            
            helpers.setHTML5CanvasStroke(ctx, 'blue');
            ctx.stroke();
            
            // Add smaller rotated shape inside
            ctx.save();
            ctx.rotate(Math.PI / 4); // Additional 45 degrees
            ctx.beginPath();
            ctx.moveTo(-15, -15);
            ctx.lineTo(15, -15);
            ctx.lineTo(15, 15);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            helpers.setHTML5CanvasStroke(ctx, 'orange');
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
        }
    };

    // Test 44: Combined Transform + Stroke + Scale - Phase 4 Integration Test
    visualTests['combined-transform-stroke-scale'] = {
        name: 'Scaled Stroke Behavior',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            // Test different scaling effects on strokes
            const scales = [[2, 1], [1, 2], [0.5, 2], [1.5, 1.5]];
            const colors = ['red', 'blue', 'green', 'purple'];
            
            for (let i = 0; i < scales.length; i++) {
                ctx.save();
                ctx.translate(50 + (i % 2) * 100, 50 + Math.floor(i / 2) * 100);
                ctx.scale(scales[i][0], scales[i][1]);
                
                // Circle that will be scaled
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                
                ctx.lineWidth = 6;
                ctx.lineJoin = 'miter';
                ctx.globalAlpha = 0.7;
                
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.stroke();
                
                // Add a cross inside to show scaling effects
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(20, 0);
                ctx.moveTo(0, -20);
                ctx.lineTo(0, 20);
                
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
            
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            // Test different scaling effects on strokes
            const scales = [[2, 1], [1, 2], [0.5, 2], [1.5, 1.5]];
            const colors = ['red', 'blue', 'green', 'purple'];
            
            for (let i = 0; i < scales.length; i++) {
                ctx.save();
                ctx.translate(50 + (i % 2) * 100, 50 + Math.floor(i / 2) * 100);
                ctx.scale(scales[i][0], scales[i][1]);
                
                // Circle that will be scaled
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                
                ctx.lineWidth = 6;
                ctx.lineJoin = 'miter';
                ctx.globalAlpha = 0.7;
                
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.stroke();
                
                // Add a cross inside to show scaling effects
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(20, 0);
                ctx.moveTo(0, -20);
                ctx.lineTo(0, 20);
                
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    // Test 45: Combined Transform + Clip + Stroke - Phase 4 Integration Test
    visualTests['combined-transform-clip-stroke'] = {
        name: 'Transform + Clip + Stroke',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 8); // Small rotation
            
            // Create clipping region: circle
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, 2 * Math.PI);
            ctx.clip();
            
            // Now apply additional transform and stroke
            ctx.save();
            ctx.scale(1.5, 0.8);
            ctx.rotate(Math.PI / 6);
            
            // Draw stroked shapes that will be clipped
            ctx.beginPath();
            ctx.moveTo(-80, -40);
            ctx.lineTo(80, -40);
            ctx.lineTo(80, 40);
            ctx.lineTo(-80, 40);
            ctx.closePath();
            
            ctx.lineWidth = 12;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.8;
            helpers.setSWCanvasStroke(ctx, 'red');
            ctx.stroke();
            
            // Add diagonal lines
            ctx.beginPath();
            ctx.moveTo(-60, -60);
            ctx.lineTo(60, 60);
            ctx.moveTo(-60, 60);
            ctx.lineTo(60, -60);
            
            ctx.lineWidth = 6;
            helpers.setSWCanvasStroke(ctx, 'blue');
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
            return surface;
        },
        drawHTML5Canvas: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.rotate(Math.PI / 8); // Small rotation
            
            // Create clipping region: circle
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, 2 * Math.PI);
            ctx.clip();
            
            // Now apply additional transform and stroke
            ctx.save();
            ctx.scale(1.5, 0.8);
            ctx.rotate(Math.PI / 6);
            
            // Draw stroked shapes that will be clipped
            ctx.beginPath();
            ctx.moveTo(-80, -40);
            ctx.lineTo(80, -40);
            ctx.lineTo(80, 40);
            ctx.lineTo(-80, 40);
            ctx.closePath();
            
            ctx.lineWidth = 12;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.8;
            helpers.setHTML5CanvasStroke(ctx, 'red');
            ctx.stroke();
            
            // Add diagonal lines
            ctx.beginPath();
            ctx.moveTo(-60, -60);
            ctx.lineTo(60, 60);
            ctx.moveTo(-60, 60);
            ctx.lineTo(60, -60);
            
            ctx.lineWidth = 6;
            helpers.setHTML5CanvasStroke(ctx, 'blue');
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
        }
    };

    // ===== PHASE 5: IMAGE RENDERING TESTS =====

    // Helper function to create synthetic test images
    function createTestImage(width, height, pattern) {
        const image = {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 4)
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
                }
            }
        }
        
        return image;
    }
    
    // Helper function to create RGB test image (3 channels)
    function createRGBTestImage(width, height) {
        const image = {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 3) // RGB only
        };
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 3;
                image.data[i] = x < width / 2 ? 255 : 0;     // R
                image.data[i + 1] = y < height / 2 ? 255 : 0; // G
                image.data[i + 2] = (x + y) % 2 ? 255 : 0;   // B
            }
        }
        
        return image;
    }
    
    // Helper function to convert SWCanvas Surface to ImageLike
    function surfaceToImageLike(surface) {
        return {
            width: surface.width,
            height: surface.height,
            data: surface.data // Already Uint8ClampedArray in RGBA format
        };
    }
    
    // Helper function to convert ImageLike to HTML5 Canvas ImageData
    function imagelikeToImageData(imageLike, canvasCtx) {
        const imageData = canvasCtx.createImageData(imageLike.width, imageLike.height);
        
        if (imageLike.data.length === imageLike.width * imageLike.height * 3) {
            // Convert RGB to RGBA
            for (let i = 0; i < imageLike.width * imageLike.height; i++) {
                imageData.data[i*4] = imageLike.data[i*3];     // R
                imageData.data[i*4+1] = imageLike.data[i*3+1]; // G  
                imageData.data[i*4+2] = imageLike.data[i*3+2]; // B
                imageData.data[i*4+3] = 255;                   // A
            }
        } else {
            // Copy RGBA as-is
            imageData.data.set(imageLike.data);
        }
        
        return imageData;
    }

    // Test: Basic drawImage
    visualTests['drawimage-basic'] = {
        name: 'Basic drawImage positioning',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create test image
            const testImage = createTestImage(20, 20, 'checkerboard');
            
            // Draw at different positions
            ctx.drawImage(testImage, 10, 10);        // Basic position
            ctx.drawImage(testImage, 50, 10);        // Right
            ctx.drawImage(testImage, 10, 50);        // Below
            ctx.drawImage(testImage, 50, 50);        // Diagonal
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create equivalent ImageData
            const testImage = createTestImage(20, 20, 'checkerboard');
            const imageData = imagelikeToImageData(testImage, ctx);
            
            // Draw at same positions
            ctx.putImageData(imageData, 10, 10);
            ctx.putImageData(imageData, 50, 10); 
            ctx.putImageData(imageData, 10, 50);
            ctx.putImageData(imageData, 50, 50);
        }
    };

    // Test: drawImage scaling
    visualTests['drawimage-scaling'] = {
        name: 'drawImage with scaling',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create gradient test image
            const testImage = createTestImage(10, 10, 'gradient');
            
            // Draw at original size
            ctx.drawImage(testImage, 10, 10);
            
            // Draw scaled up 2x
            ctx.drawImage(testImage, 30, 10, 20, 20);
            
            // Draw scaled up 3x
            ctx.drawImage(testImage, 60, 10, 30, 30);
            
            // Draw scaled down
            ctx.drawImage(testImage, 100, 10, 5, 5);
            
            // Draw with non-uniform scaling
            ctx.drawImage(testImage, 10, 50, 40, 10);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            const testImage = createTestImage(10, 10, 'gradient');
            const imageData = imagelikeToImageData(testImage, ctx);
            
            // Create a temporary canvas for scaling
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 10;
            tempCanvas.height = 10;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw at original size
            ctx.drawImage(tempCanvas, 10, 10);
            
            // Draw scaled
            ctx.drawImage(tempCanvas, 30, 10, 20, 20);
            ctx.drawImage(tempCanvas, 60, 10, 30, 30);
            ctx.drawImage(tempCanvas, 100, 10, 5, 5);
            ctx.drawImage(tempCanvas, 10, 50, 40, 10);
        }
    };

    // Test: RGB to RGBA conversion
    visualTests['drawimage-rgb-conversion'] = {
        name: 'RGB to RGBA auto-conversion',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create RGB test image (3 channels)
            const rgbImage = createRGBTestImage(30, 30);
            
            // Draw RGB image - should auto-convert to RGBA
            ctx.drawImage(rgbImage, 20, 20);
            
            // Create RGBA test image for comparison
            const rgbaImage = createTestImage(30, 30, 'border');
            ctx.drawImage(rgbaImage, 70, 20);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // RGB image converted to ImageData
            const rgbImage = createRGBTestImage(30, 30);
            const rgbImageData = imagelikeToImageData(rgbImage, ctx);
            ctx.putImageData(rgbImageData, 20, 20);
            
            // RGBA image
            const rgbaImage = createTestImage(30, 30, 'border');
            const rgbaImageData = imagelikeToImageData(rgbaImage, ctx);
            ctx.putImageData(rgbaImageData, 70, 20);
        }
    };

    // Test: drawImage with transforms
    visualTests['drawimage-transforms'] = {
        name: 'drawImage with transforms',
        width: 200, height: 200,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            const testImage = createTestImage(20, 20, 'checkerboard');
            
            // Original
            ctx.drawImage(testImage, 10, 10);
            
            // Translated
            ctx.save();
            ctx.translate(50, 50);
            ctx.drawImage(testImage, 0, 0);
            ctx.restore();
            
            // Scaled  
            ctx.save();
            ctx.translate(100, 100);
            ctx.scale(1.5, 1.5);
            ctx.drawImage(testImage, 0, 0);
            ctx.restore();
            
            // Rotated
            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(Math.PI / 4);
            ctx.drawImage(testImage, -10, -10);
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 200);
            
            const testImage = createTestImage(20, 20, 'checkerboard');
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 20;
            tempCanvas.height = 20;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imagelikeToImageData(testImage, tempCtx), 0, 0);
            
            // Same transforms
            ctx.drawImage(tempCanvas, 10, 10);
            
            ctx.save();
            ctx.translate(50, 50);
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
            
            ctx.save();
            ctx.translate(100, 100);
            ctx.scale(1.5, 1.5);
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
            
            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(Math.PI / 4);
            ctx.drawImage(tempCanvas, -10, -10);
            ctx.restore();
        }
    };

    // Test: drawImage with alpha and blending
    visualTests['drawimage-alpha-blending'] = {
        name: 'drawImage with alpha and blending',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // Colored background
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create alpha gradient image
            const alphaImage = createTestImage(40, 40, 'alpha');
            
            // Draw with full alpha
            ctx.drawImage(alphaImage, 20, 20);
            
            // Draw with global alpha
            ctx.globalAlpha = 0.5;
            ctx.drawImage(alphaImage, 80, 20);
            ctx.globalAlpha = 1.0;
            
            // Draw overlapping for blending test
            const solidImage = createTestImage(30, 30, 'checkerboard');
            ctx.drawImage(solidImage, 120, 50);
            ctx.drawImage(alphaImage, 130, 60);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fillRect(0, 0, 200, 150);
            
            const alphaImage = createTestImage(40, 40, 'alpha');
            const alphaCanvas = document.createElement('canvas');
            alphaCanvas.width = 40;
            alphaCanvas.height = 40;
            const alphaCtx = alphaCanvas.getContext('2d');
            alphaCtx.putImageData(imagelikeToImageData(alphaImage, alphaCtx), 0, 0);
            
            ctx.drawImage(alphaCanvas, 20, 20);
            
            ctx.globalAlpha = 0.5;
            ctx.drawImage(alphaCanvas, 80, 20);
            ctx.globalAlpha = 1.0;
            
            const solidImage = createTestImage(30, 30, 'checkerboard');
            const solidCanvas = document.createElement('canvas');
            solidCanvas.width = 30;
            solidCanvas.height = 30;
            const solidCtx = solidCanvas.getContext('2d');
            solidCtx.putImageData(imagelikeToImageData(solidImage, solidCtx), 0, 0);
            
            ctx.drawImage(solidCanvas, 120, 50);
            ctx.drawImage(alphaCanvas, 130, 60);
        }
    };

    // Test: Advanced drawImage using surface-to-ImageLike conversion
    visualTests['drawimage-surface-conversion'] = {
        name: 'drawImage using surface-to-ImageLike conversion',
        width: 200, height: 150,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 150);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create a source surface with some content
            const sourceSurface = SWCanvas.Surface(40, 40);
            const sourceCtx = new SWCanvas.Context2D(sourceSurface);
            
            // Draw complex content on source surface
            helpers.setSWCanvasFill(sourceCtx, 'red');
            sourceCtx.fillRect(0, 0, 40, 40);
            helpers.setSWCanvasFill(sourceCtx, 'blue');
            sourceCtx.fillRect(10, 10, 20, 20);
            helpers.setSWCanvasFill(sourceCtx, 'yellow');
            sourceCtx.fillRect(5, 5, 10, 10);
            
            // Convert surface to ImageLike and draw it
            const imageData = surfaceToImageLike(sourceSurface);
            ctx.drawImage(imageData, 20, 20);
            ctx.drawImage(imageData, 80, 20, 20, 20); // Scaled down
            ctx.drawImage(imageData, 120, 20, 60, 60); // Scaled up
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 200, 150);
            
            // Create equivalent content using temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 40;
            tempCanvas.height = 40;
            const tempCtx = tempCanvas.getContext('2d');
            
            helpers.setHTML5CanvasFill(tempCtx, 'red');
            tempCtx.fillRect(0, 0, 40, 40);
            helpers.setHTML5CanvasFill(tempCtx, 'blue');
            tempCtx.fillRect(10, 10, 20, 20);
            helpers.setHTML5CanvasFill(tempCtx, 'yellow');
            tempCtx.fillRect(5, 5, 10, 10);
            
            // Draw at same positions
            ctx.drawImage(tempCanvas, 20, 20);
            ctx.drawImage(tempCanvas, 80, 20, 20, 20); // Scaled down
            ctx.drawImage(tempCanvas, 120, 20, 60, 60); // Scaled up
        }
    };

    // Test: Sub-pixel stroke rendering comparison
    visualTests['subpixel-strokes'] = {
        name: 'Sub-pixel Stroke Rendering',
        description: 'Test various sub-pixel stroke widths to compare rendering differences',
        width: 600,
        height: 400,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(600, 400);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 600, 400);
            
            // Test different stroke widths
            const strokeWidths = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
            const colors = ['red', 'blue', 'green', 'purple', 'orange', 'brown', 'pink'];
            
            // Horizontal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 50 + i * 30);
                ctx.lineTo(200, 50 + i * 30);
                ctx.stroke();
                
                // Label the width
                helpers.setSWCanvasFill(ctx, 'black');
                // Note: SWCanvas doesn't have fillText, so we'll use a small rect to indicate
                ctx.fillRect(20, 45 + i * 30, 2, strokeWidths[i] * 10 + 2);
            }
            
            // Vertical lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(250 + i * 30, 50);
                ctx.lineTo(250 + i * 30, 200);
                ctx.stroke();
            }
            
            // Diagonal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50 + i * 25, 250);
                ctx.lineTo(150 + i * 25, 350);
                ctx.stroke();
            }
            
            // Rectangles
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.rect(300 + (i % 4) * 60, 250 + Math.floor(i / 4) * 60, 40, 40);
                ctx.stroke();
            }
            
            // Circles
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.arc(500, 70 + i * 40, 15, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            return surface;
        },
        
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 600, 400);
            
            // Test different stroke widths
            const strokeWidths = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
            const colors = ['red', 'blue', 'green', 'purple', 'orange', 'brown', 'pink'];
            
            // Horizontal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 50 + i * 30);
                ctx.lineTo(200, 50 + i * 30);
                ctx.stroke();
                
                // Label the width with text
                helpers.setHTML5CanvasFill(ctx, 'black');
                ctx.font = '10px Arial';
                ctx.fillText(strokeWidths[i].toString(), 10, 55 + i * 30);
            }
            
            // Vertical lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(250 + i * 30, 50);
                ctx.lineTo(250 + i * 30, 200);
                ctx.stroke();
            }
            
            // Diagonal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50 + i * 25, 250);
                ctx.lineTo(150 + i * 25, 350);
                ctx.stroke();
            }
            
            // Rectangles
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.rect(300 + (i % 4) * 60, 250 + Math.floor(i / 4) * 60, 40, 40);
                ctx.stroke();
            }
            
            // Circles
            for (let i = 0; i < strokeWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, colors[i]);
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.arc(500, 70 + i * 40, 15, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    };

    // Test: Stroke edge cases
    visualTests['stroke-edge-cases'] = {
        name: 'Stroke Edge Cases',
        description: 'Test edge cases for stroke rendering: zero-width, transforms, clipping',
        width: 500,
        height: 300,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(500, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 500, 300);
            
            // Test 1: Zero-width stroke (should not render)
            try {
                helpers.setSWCanvasStroke(ctx, 'red');
                ctx.lineWidth = 0;
                ctx.beginPath();
                ctx.moveTo(50, 50);
                ctx.lineTo(150, 50);
                ctx.stroke();
            } catch (e) {
                // SWCanvas throws error for zero-width strokes - this is expected behavior
                console.log('SWCanvas correctly rejects zero-width strokes:', e.message);
            }
            
            // Test 2: Very thin strokes
            const thinWidths = [0.01, 0.1, 0.2, 0.3, 0.4];
            for (let i = 0; i < thinWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, 'blue');
                ctx.lineWidth = thinWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 80 + i * 20);
                ctx.lineTo(150, 80 + i * 20);
                ctx.stroke();
            }
            
            // Test 3: Strokes with scale transform (should scale the width)
            ctx.save();
            ctx.scale(0.5, 0.5);
            helpers.setSWCanvasStroke(ctx, 'green');
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(400, 100); // Will be at (200, 50) after scale
            ctx.lineTo(600, 100); // Will be at (300, 50) after scale
            ctx.stroke();
            ctx.restore();
            
            // Test 4: Strokes with clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(250, 50, 100, 80);
            ctx.clip();
            
            helpers.setSWCanvasStroke(ctx, 'purple');
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(200, 90);
            ctx.lineTo(400, 90);
            ctx.stroke();
            ctx.restore();
            
            // Test 5: Circles with very thin strokes
            const circleWidths = [0.1, 0.3, 0.5, 1.0, 2.0];
            for (let i = 0; i < circleWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, 'orange');
                ctx.lineWidth = circleWidths[i];
                ctx.beginPath();
                ctx.arc(80 + i * 60, 200, 20, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // Test 6: Single pixel positioned strokes (integer vs fractional positions)
            helpers.setSWCanvasStroke(ctx, 'black');
            ctx.lineWidth = 1.0;
            
            // Integer position
            ctx.beginPath();
            ctx.moveTo(50, 250);
            ctx.lineTo(100, 250);
            ctx.stroke();
            
            // Half-pixel position
            ctx.beginPath();
            ctx.moveTo(50.5, 260);
            ctx.lineTo(100.5, 260);
            ctx.stroke();
            
            // Quarter-pixel position
            ctx.beginPath();
            ctx.moveTo(50.25, 270);
            ctx.lineTo(100.25, 270);
            ctx.stroke();
            
            return surface;
        },
        
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 500, 300);
            
            // Test 1: Zero-width stroke (should not render)
            helpers.setHTML5CanvasStroke(ctx, 'red');
            ctx.lineWidth = 0;
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(150, 50);
            ctx.stroke();
            
            // Test 2: Very thin strokes
            const thinWidths = [0.01, 0.1, 0.2, 0.3, 0.4];
            for (let i = 0; i < thinWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'blue');
                ctx.lineWidth = thinWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 80 + i * 20);
                ctx.lineTo(150, 80 + i * 20);
                ctx.stroke();
            }
            
            // Test 3: Strokes with scale transform
            ctx.save();
            ctx.scale(0.5, 0.5);
            helpers.setHTML5CanvasStroke(ctx, 'green');
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(400, 100);
            ctx.lineTo(600, 100);
            ctx.stroke();
            ctx.restore();
            
            // Test 4: Strokes with clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(250, 50, 100, 80);
            ctx.clip();
            
            helpers.setHTML5CanvasStroke(ctx, 'purple');
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(200, 90);
            ctx.lineTo(400, 90);
            ctx.stroke();
            ctx.restore();
            
            // Test 5: Circles with very thin strokes
            const circleWidths = [0.1, 0.3, 0.5, 1.0, 2.0];
            for (let i = 0; i < circleWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'orange');
                ctx.lineWidth = circleWidths[i];
                ctx.beginPath();
                ctx.arc(80 + i * 60, 200, 20, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // Test 6: Single pixel positioned strokes
            helpers.setHTML5CanvasStroke(ctx, 'black');
            ctx.lineWidth = 1.0;
            
            // Integer position
            ctx.beginPath();
            ctx.moveTo(50, 250);
            ctx.lineTo(100, 250);
            ctx.stroke();
            
            // Half-pixel position
            ctx.beginPath();
            ctx.moveTo(50.5, 260);
            ctx.lineTo(100.5, 260);
            ctx.stroke();
            
            // Quarter-pixel position
            ctx.beginPath();
            ctx.moveTo(50.25, 270);
            ctx.lineTo(100.25, 270);
            ctx.stroke();
        }
    };

    // Test: Clipped path strokes (recreates Polygon Clipping star issue)
    visualTests['clipped-path-strokes'] = {
        name: 'Clipped Path Strokes',
        description: 'Test stroke rendering on clipped paths (recreates star from Polygon Clipping)',
        width: 400,
        height: 300,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(400, 300);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Star without clipping (left side)
            const cx1 = 100, cy1 = 80;
            ctx.save();
            ctx.beginPath();
            // Create star path (same as in Polygon Clipping test)
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx1 + Math.cos(angle) * 30;
                const y = cy1 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                // Inner points
                const innerAngle = angle + Math.PI / 5;
                const ix = cx1 + Math.cos(innerAngle) * 12;
                const iy = cy1 + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            
            // Fill the star
            helpers.setSWCanvasFill(ctx, 'lightblue');
            ctx.fill();
            
            // Stroke the star with different widths
            helpers.setSWCanvasStroke(ctx, 'red');
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
            
            // Test 2: Star with clipping (right side) - same as Polygon Clipping
            const cx2 = 300, cy2 = 80;
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 30;
                const y = cy2 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const ix = cx2 + Math.cos(innerAngle) * 12;
                const iy = cy2 + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.clip(); // Use as clipping region
            
            // Fill rectangles (like in original test)
            helpers.setSWCanvasFill(ctx, 'purple');
            ctx.fillRect(260, 40, 80, 80);
            helpers.setSWCanvasFill(ctx, 'yellow');
            ctx.fillRect(280, 60, 40, 40);
            ctx.restore();
            
            // Test 3: Compare stroke widths
            const strokeWidths = [0.25, 0.5, 1.0, 2.0];
            for (let j = 0; j < strokeWidths.length; j++) {
                const cx = 50 + j * 80;
                const cy = 200;
                
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const x = cx + Math.cos(angle) * 25;
                    const y = cy + Math.sin(angle) * 25;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    
                    const innerAngle = angle + Math.PI / 5;
                    const ix = cx + Math.cos(innerAngle) * 10;
                    const iy = cy + Math.sin(innerAngle) * 10;
                    ctx.lineTo(ix, iy);
                }
                ctx.closePath();
                
                // Fill
                helpers.setSWCanvasFill(ctx, 'lightgray');
                ctx.fill();
                
                // Stroke with different widths
                helpers.setSWCanvasStroke(ctx, 'blue');
                ctx.lineWidth = strokeWidths[j];
                ctx.stroke();
                ctx.restore();
            }
            
            return surface;
        },
        
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 400, 300);
            
            // Test 1: Star without clipping (left side)
            const cx1 = 100, cy1 = 80;
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx1 + Math.cos(angle) * 30;
                const y = cy1 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const ix = cx1 + Math.cos(innerAngle) * 12;
                const iy = cy1 + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            
            // Fill the star
            helpers.setHTML5CanvasFill(ctx, 'lightblue');
            ctx.fill();
            
            // Stroke the star
            helpers.setHTML5CanvasStroke(ctx, 'red');
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
            
            // Test 2: Star with clipping (right side)
            const cx2 = 300, cy2 = 80;
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = cx2 + Math.cos(angle) * 30;
                const y = cy2 + Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                const innerAngle = angle + Math.PI / 5;
                const ix = cx2 + Math.cos(innerAngle) * 12;
                const iy = cy2 + Math.sin(innerAngle) * 12;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.clip();
            
            helpers.setHTML5CanvasFill(ctx, 'purple');
            ctx.fillRect(260, 40, 80, 80);
            helpers.setHTML5CanvasFill(ctx, 'yellow');
            ctx.fillRect(280, 60, 40, 40);
            ctx.restore();
            
            // Test 3: Compare stroke widths
            const strokeWidths = [0.25, 0.5, 1.0, 2.0];
            for (let j = 0; j < strokeWidths.length; j++) {
                const cx = 50 + j * 80;
                const cy = 200;
                
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const x = cx + Math.cos(angle) * 25;
                    const y = cy + Math.sin(angle) * 25;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    
                    const innerAngle = angle + Math.PI / 5;
                    const ix = cx + Math.cos(innerAngle) * 10;
                    const iy = cy + Math.sin(innerAngle) * 10;
                    ctx.lineTo(ix, iy);
                }
                ctx.closePath();
                
                // Fill
                helpers.setHTML5CanvasFill(ctx, 'lightgray');
                ctx.fill();
                
                // Stroke with different widths
                helpers.setHTML5CanvasStroke(ctx, 'blue');
                ctx.lineWidth = strokeWidths[j];
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    // Test: Stroke pixel analysis
    visualTests['stroke-pixel-analysis'] = {
        name: 'Stroke Pixel Analysis',
        description: 'Detailed pixel-level analysis of stroke rendering for debugging',
        width: 300,
        height: 200,
        
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(300, 200);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            helpers.setSWCanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Test 1: Single pixel stroke at integer coordinates
            helpers.setSWCanvasStroke(ctx, 'red');
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(100, 50);
            ctx.stroke();
            
            // Test 2: Sub-pixel stroke widths at integer coordinates
            const subPixelWidths = [0.1, 0.25, 0.5, 0.75];
            for (let i = 0; i < subPixelWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, 'blue');
                ctx.lineWidth = subPixelWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 70 + i * 10);
                ctx.lineTo(100, 70 + i * 10);
                ctx.stroke();
            }
            
            // Test 3: 1-pixel stroke at fractional coordinates
            helpers.setSWCanvasStroke(ctx, 'green');
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50.5, 120);
            ctx.lineTo(100.5, 120);
            ctx.stroke();
            
            // Test 4: Sub-pixel strokes at fractional coordinates
            for (let i = 0; i < subPixelWidths.length; i++) {
                helpers.setSWCanvasStroke(ctx, 'purple');
                ctx.lineWidth = subPixelWidths[i];
                ctx.beginPath();
                ctx.moveTo(50.5, 130 + i * 10);
                ctx.lineTo(100.5, 130 + i * 10);
                ctx.stroke();
            }
            
            // Test 5: Very thin vertical lines
            const xPositions = [150, 160, 170, 180, 190];
            const thinWidths = [0.1, 0.2, 0.3, 0.5, 1.0];
            for (let i = 0; i < xPositions.length; i++) {
                helpers.setSWCanvasStroke(ctx, 'orange');
                ctx.lineWidth = thinWidths[i];
                ctx.beginPath();
                ctx.moveTo(xPositions[i], 50);
                ctx.lineTo(xPositions[i], 120);
                ctx.stroke();
            }
            
            // Test 6: Diagonal lines with thin strokes
            for (let i = 0; i < 3; i++) {
                helpers.setSWCanvasStroke(ctx, 'brown');
                ctx.lineWidth = 0.25 + i * 0.25;
                ctx.beginPath();
                ctx.moveTo(220, 50 + i * 20);
                ctx.lineTo(270, 100 + i * 20);
                ctx.stroke();
            }
            
            // Sample and log pixel values for debugging
            console.log('SWCanvas stroke pixel analysis:');
            const pixelAt50_50 = surface.data[(50 * surface.stride) + (50 * 4)];
            console.log(`  Pixel at (50,50) - Red stroke 1px: R=${pixelAt50_50} (should be 255 if rendered)`);
            
            const pixelAt50_70 = surface.data[(50 * surface.stride) + (70 * 4)];
            console.log(`  Pixel at (50,70) - Blue stroke 0.1px: R=${surface.data[(70 * surface.stride) + (50 * 4)]}`);
            
            const pixelAt50_75 = surface.data[(75 * surface.stride) + (50 * 4) + 2];
            console.log(`  Pixel at (50,75) - Blue stroke 0.5px: B=${pixelAt50_75}`);
            
            return surface;
        },
        
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            
            // White background
            helpers.setHTML5CanvasFill(ctx, 'white');
            ctx.fillRect(0, 0, 300, 200);
            
            // Test 1: Single pixel stroke at integer coordinates
            helpers.setHTML5CanvasStroke(ctx, 'red');
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(100, 50);
            ctx.stroke();
            
            // Test 2: Sub-pixel stroke widths at integer coordinates
            const subPixelWidths = [0.1, 0.25, 0.5, 0.75];
            for (let i = 0; i < subPixelWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'blue');
                ctx.lineWidth = subPixelWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 70 + i * 10);
                ctx.lineTo(100, 70 + i * 10);
                ctx.stroke();
            }
            
            // Test 3: 1-pixel stroke at fractional coordinates
            helpers.setHTML5CanvasStroke(ctx, 'green');
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50.5, 120);
            ctx.lineTo(100.5, 120);
            ctx.stroke();
            
            // Test 4: Sub-pixel strokes at fractional coordinates
            for (let i = 0; i < subPixelWidths.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'purple');
                ctx.lineWidth = subPixelWidths[i];
                ctx.beginPath();
                ctx.moveTo(50.5, 130 + i * 10);
                ctx.lineTo(100.5, 130 + i * 10);
                ctx.stroke();
            }
            
            // Test 5: Very thin vertical lines
            const xPositions = [150, 160, 170, 180, 190];
            const thinWidths = [0.1, 0.2, 0.3, 0.5, 1.0];
            for (let i = 0; i < xPositions.length; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'orange');
                ctx.lineWidth = thinWidths[i];
                ctx.beginPath();
                ctx.moveTo(xPositions[i], 50);
                ctx.lineTo(xPositions[i], 120);
                ctx.stroke();
            }
            
            // Test 6: Diagonal lines with thin strokes
            for (let i = 0; i < 3; i++) {
                helpers.setHTML5CanvasStroke(ctx, 'brown');
                ctx.lineWidth = 0.25 + i * 0.25;
                ctx.beginPath();
                ctx.moveTo(220, 50 + i * 20);
                ctx.lineTo(270, 100 + i * 20);
                ctx.stroke();
            }
            
            // Sample pixel values from HTML5 Canvas for comparison
            try {
                const imageData = ctx.getImageData(0, 0, 300, 200);
                console.log('HTML5Canvas stroke pixel analysis:');
                const redPixel = imageData.data[(50 * 300 + 50) * 4];
                console.log(`  Pixel at (50,50) - Red stroke 1px: R=${redPixel}`);
                
                const bluePixel70 = imageData.data[(70 * 300 + 50) * 4 + 2];
                console.log(`  Pixel at (50,70) - Blue stroke 0.1px: B=${bluePixel70}`);
                
                const bluePixel75 = imageData.data[(75 * 300 + 50) * 4 + 2];
                console.log(`  Pixel at (50,75) - Blue stroke 0.5px: B=${bluePixel75}`);
            } catch (e) {
                console.log('Could not sample HTML5Canvas pixels (security restriction)');
            }
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