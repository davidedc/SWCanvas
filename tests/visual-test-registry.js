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
            ctx.setFillStyle(0, 128, 0, 255);
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
            ctx.fillStyle = 'green';
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
            ctx.setStrokeStyle(255, 165, 0, 255);
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

    // Test 9: Stroke Miter Limit (Original Test)
    visualTests['stroke-miter-limit'] = {
        name: 'Miter limit test',
        width: 200, height: 100,
        drawSWCanvas: function(SWCanvas) {
            const surface = SWCanvas.Surface(200, 100);
            const ctx = new SWCanvas.Context2D(surface);
            
            // White background
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 100);
            
            ctx.setStrokeStyle(255, 0, 255, 255);
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
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 100);
            
            ctx.strokeStyle = 'magenta';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 100, 100);
            
            ctx.setStrokeStyle(0, 0, 255, 255);
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
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            
            ctx.strokeStyle = 'blue';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Red square at origin
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate and draw blue square
            ctx.translate(50, 20);
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate again and draw green square
            ctx.translate(60, 30);
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(10, 10, 30, 30);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Red square at origin
            ctx.fillStyle = 'red';
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate and draw blue square
            ctx.translate(50, 20);
            ctx.fillStyle = 'blue';
            ctx.fillRect(10, 10, 30, 30);
            
            // Translate again and draw green square
            ctx.translate(60, 30);
            ctx.fillStyle = 'green';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Original size red square
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(10, 10, 20, 20);
            
            // Scale 2x and draw blue square
            ctx.translate(60, 10);
            ctx.scale(2, 2);
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset, scale 0.5x and draw green square
            ctx.resetTransform();
            ctx.translate(10, 60);
            ctx.scale(0.5, 0.5);
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(0, 0, 40, 40);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Original size red square
            ctx.fillStyle = 'red';
            ctx.fillRect(10, 10, 20, 20);
            
            // Scale 2x and draw blue square
            ctx.translate(60, 10);
            ctx.scale(2, 2);
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset, scale 0.5x and draw green square
            ctx.resetTransform();
            ctx.translate(10, 60);
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = 'green';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Original red square
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(20, 20, 25, 25);
            
            // Rotate 45 degrees and draw blue square
            ctx.translate(100, 40);
            ctx.rotate(Math.PI / 4);
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(-12, -12, 25, 25);
            
            // Reset, rotate 90 degrees and draw green square
            ctx.resetTransform();
            ctx.translate(60, 100);
            ctx.rotate(Math.PI / 2);
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(-12, -12, 25, 25);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Original red square
            ctx.fillStyle = 'red';
            ctx.fillRect(20, 20, 25, 25);
            
            // Rotate 45 degrees and draw blue square
            ctx.translate(100, 40);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = 'blue';
            ctx.fillRect(-12, -12, 25, 25);
            
            // Reset, rotate 90 degrees and draw green square
            ctx.resetTransform();
            ctx.translate(60, 100);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = 'green';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 250, 150);
            
            // Left side: Using transform() - accumulative
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.transform(1, 0, 0, 1, 20, 20); // translate(20, 20)
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.transform(2, 0, 0, 2, 0, 0); // scale(2, 2) - accumulative
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(15, 0, 15, 15);
            
            // Right side: Using setTransform() - absolute
            ctx.setTransform(1, 0, 0, 1, 150, 20); // absolute translate(150, 20)
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.setTransform(2, 0, 0, 2, 150, 60); // absolute scale + translate
            ctx.setFillStyle(255, 0, 255, 255);
            ctx.fillRect(0, 0, 15, 15);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 250, 150);
            
            // Left side: Using transform() - accumulative
            ctx.fillStyle = 'red';
            ctx.transform(1, 0, 0, 1, 20, 20);
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.transform(2, 0, 0, 2, 0, 0);
            ctx.fillStyle = 'green';
            ctx.fillRect(15, 0, 15, 15);
            
            // Right side: Using setTransform() - absolute
            ctx.setTransform(1, 0, 0, 1, 150, 20);
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.setTransform(2, 0, 0, 2, 150, 60);
            ctx.fillStyle = 'magenta';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Apply complex transform
            ctx.translate(50, 30);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 1.5);
            
            // Draw transformed red square
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset transform and draw blue square at origin
            ctx.resetTransform();
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(10, 80, 20, 20);
            
            // Apply new transform after reset
            ctx.translate(120, 50);
            ctx.scale(0.8, 0.8);
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(0, 0, 25, 25);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Apply complex transform
            ctx.translate(50, 30);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 1.5);
            
            // Draw transformed red square
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 20, 20);
            
            // Reset transform and draw blue square at origin
            ctx.resetTransform();
            ctx.fillStyle = 'blue';
            ctx.fillRect(10, 80, 20, 20);
            
            // Apply new transform after reset
            ctx.translate(120, 50);
            ctx.scale(0.8, 0.8);
            ctx.fillStyle = 'green';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Initial transform
            ctx.translate(30, 30);
            ctx.scale(1.2, 1.2);
            
            // Draw red square with initial transform
            ctx.setFillStyle(255, 0, 0, 255);
            ctx.fillRect(0, 0, 20, 20);
            
            // Save state, apply additional transform
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.translate(40, 0);
            
            // Draw blue square with combined transforms
            ctx.setFillStyle(0, 0, 255, 255);
            ctx.fillRect(0, 0, 15, 15);
            
            // Restore to saved state, draw green square
            ctx.restore();
            ctx.translate(0, 40);
            ctx.setFillStyle(0, 128, 0, 255);
            ctx.fillRect(0, 0, 18, 18);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Initial transform
            ctx.translate(30, 30);
            ctx.scale(1.2, 1.2);
            
            // Draw red square with initial transform
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 20, 20);
            
            // Save state, apply additional transform
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.translate(40, 0);
            
            // Draw blue square with combined transforms
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 15, 15);
            
            // Restore to saved state, draw green square
            ctx.restore();
            ctx.translate(0, 40);
            ctx.fillStyle = 'green';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Complex combined transform: translate + rotate + scale
            ctx.translate(100, 75);
            ctx.rotate(Math.PI / 6);
            ctx.scale(1.5, 0.8);
            ctx.translate(-15, -10);
            
            // Draw transformed rectangle
            ctx.setFillStyle(255, 165, 0, 255);
            ctx.fillRect(0, 0, 30, 20);
            
            // Draw border to show original position
            ctx.resetTransform();
            ctx.setStrokeStyle(128, 128, 128, 255);
            ctx.lineWidth = 1;
            ctx.strokeRect(85, 65, 30, 20);
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
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
            ctx.strokeStyle = 'gray';
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
            ctx.setFillStyle(255, 255, 255, 255);
            ctx.fillRect(0, 0, 200, 150);
            
            // Square 1: Translate(40,40) THEN Scale(2,2) - Red
            ctx.save();
            ctx.translate(40, 40);
            ctx.scale(2, 2);
            ctx.setFillStyle(255, 0, 0, 255);  // Red
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            // Square 2: Scale(2,2) THEN Translate(60,60) - Blue  
            ctx.save();
            ctx.scale(2, 2);
            ctx.translate(60, 60);
            ctx.setFillStyle(0, 0, 255, 255);  // Blue
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            return surface;
        },
        drawHTML5Canvas: function(html5Canvas) {
            const ctx = html5Canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Square 1: Translate(40,40) THEN Scale(2,2) - Red
            ctx.save();
            ctx.translate(40, 40);
            ctx.scale(2, 2);
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
            
            // Square 2: Scale(2,2) THEN Translate(60,60) - Blue
            ctx.save();
            ctx.scale(2, 2);
            ctx.translate(60, 60);
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 15, 15);
            ctx.restore();
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