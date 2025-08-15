// Visual Test Registry
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

    // Helper function to register visual tests with automatic backward compatibility
    function registerVisualTest(testId, config) {
        if (!config.draw || typeof config.draw !== 'function') {
            throw new Error(`Visual test '${testId}' must have a 'draw' function`);
        }
        
        // Add backward compatibility functions if they don't already exist
        if (!config.drawSWCanvas) {
            config.drawSWCanvas = function(SWCanvas) {
                const canvas = SWCanvas.createCanvas(config.width, config.height);
                config.draw(canvas);
                return canvas._coreSurface;
            };
        }
        
        if (!config.drawHTML5Canvas) {
            config.drawHTML5Canvas = function(html5Canvas) {
                config.draw(html5Canvas);
            };
        }
        
        // Register the enhanced test
        visualTests[testId] = config;
    }


        registerVisualTest('simple-test', {
        name: 'Create and save a simple test image',
        width: 100, height: 100,
        // Unified drawing function that works with both canvas types
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Fill with red background
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            
            // Blue square in center
            ctx.fillStyle = 'blue';
            ctx.fillRect(25, 25, 50, 50);
        }
    });
        registerVisualTest('alpha-test', {
        name: 'Alpha blending test - semi-transparent rectangles',
        width: 200, height: 150,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Red rectangle (opaque)
            ctx.fillStyle = 'red';
            ctx.fillRect(20, 20, 80, 60);
            
            // Blue rectangle (opaque) with overlap
            ctx.fillStyle = 'blue';
            ctx.fillRect(60, 60, 80, 60);
            
            // Semi-transparent green rectangle
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'green';
            ctx.fillRect(40, 40, 80, 60);
            ctx.globalAlpha = 1.0;
        }
    });
        registerVisualTest('triangle-test', {
        name: 'Path filling - simple triangle',
        width: 100, height: 100,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            
            // Draw red triangle using path
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(50, 10);
            ctx.lineTo(80, 70);
            ctx.lineTo(20, 70);
            ctx.closePath();
            ctx.fill();
        }
    });
        registerVisualTest('evenodd-test', {
        name: 'Path filling - evenodd vs nonzero',
        width: 100, height: 100,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            
            // Create overlapping rectangles (outer and inner)
            ctx.fillStyle = 'red';
            ctx.beginPath();
            // Outer rectangle
            ctx.rect(20, 20, 60, 60);
            // Inner rectangle (opposite winding)
            ctx.rect(30, 30, 40, 40);
            
            // Fill with evenodd rule - should create a "hole"
            ctx.fill('evenodd');
        }
    });
        registerVisualTest('clipping-test', {
        name: 'Basic clipping test',
        width: 100, height: 100,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            
            // Set up circular clip path
            ctx.beginPath();
            ctx.arc(50, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill a large red rectangle - should be clipped to circle
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
        }
    });
        registerVisualTest('stroke-basic-line', {
        name: 'Basic stroke - simple line',
        width: 100, height: 100,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            
            // Draw red line stroke
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(10, 50);
            ctx.lineTo(90, 50);
            ctx.stroke();
        }
    });
        registerVisualTest('stroke-joins', {
        name: 'Stroke joins - miter, bevel, round',
        width: 300, height: 100,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
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
    });
        registerVisualTest('stroke-curves', {
        name: 'Complex path stroke with curves',
        width: 150, height: 150,
        // Unified drawing function
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 150, 150);
            
            // Draw a curved path
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
    });
        registerVisualTest('stroke-miter-limit', {
        name: 'Miter limit test',
        width: 200, height: 100,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
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
        },
    });
        registerVisualTest('miter-limits-basic', {
        name: 'Miter limit property and basic functionality',
        width: 100, height: 100,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
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
        },
    });
        registerVisualTest('transform-basic-translate', {
        name: 'Basic translation operations',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
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
        },
    });
        registerVisualTest('transform-basic-scale', {
        name: 'Basic scaling operations',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
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
        },
    });
        registerVisualTest('transform-basic-rotate', {
        name: 'Basic rotation operations',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
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
        },
    });
        registerVisualTest('transform-setTransform-vs-transform', {
        name: 'setTransform vs transform behavior comparison',
        width: 250, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 250, 150);
            
            // Left side: Using transform() - accumulative
            ctx.fillStyle = 'red';
            ctx.transform(1, 0, 0, 1, 20, 20); // translate(20, 20)
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.transform(2, 0, 0, 2, 0, 0); // scale(2, 2) - accumulative
            ctx.fillStyle = 'green';
            ctx.fillRect(15, 0, 15, 15);
            
            // Right side: Using setTransform() - absolute
            ctx.setTransform(1, 0, 0, 1, 150, 20); // absolute translate(150, 20)
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 20, 20);
            
            ctx.setTransform(2, 0, 0, 2, 150, 60); // absolute scale + translate
            ctx.fillStyle = 'magenta';
            ctx.fillRect(0, 0, 15, 15);
        },
    });
        registerVisualTest('transform-resetTransform', {
        name: 'resetTransform functionality',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
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
        },
    });
        registerVisualTest('transform-state-save-restore', {
        name: 'Transform with save/restore stack',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
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
        },
    });
        registerVisualTest('transform-combined-operations', {
        name: 'Multiple transforms combined',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
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
        },
    });
        registerVisualTest('transform-matrix-order', {
        name: 'Transform order dependency (A*B ≠ B*A)',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
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
        },
    });
        registerVisualTest('fill-concave-polygons', {
        name: 'Concave polygon filling (star and L-shape)',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Draw a 5-pointed star (concave polygon)
            ctx.beginPath();
            ctx.fillStyle = 'red';
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
            ctx.fillStyle = 'blue';
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
            ctx.fillStyle = 'green';
            ctx.moveTo(50, 140);
            ctx.lineTo(90, 140);
            ctx.lineTo(90, 130);
            ctx.lineTo(110, 150);
            ctx.lineTo(90, 170);
            ctx.lineTo(90, 160);
            ctx.lineTo(50, 160);
            ctx.closePath();
            ctx.fill();
        },
    });
        registerVisualTest('fill-self-intersecting', {
        name: 'Self-intersecting path filling',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Self-intersecting bowtie shape
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.moveTo(50, 50);
            ctx.lineTo(130, 50);
            ctx.lineTo(50, 100);
            ctx.lineTo(130, 100);
            ctx.closePath();
            ctx.fill();
            
            // Figure-8 like self-intersection
            ctx.beginPath();
            ctx.fillStyle = 'blue';
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
            ctx.fillStyle = 'green';
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
        },
    });
        registerVisualTest('fill-nested-holes', {
        name: 'Path filling with nested holes',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Outer rectangle with hole using even-odd rule
            ctx.beginPath();
            ctx.fillStyle = 'red';
            // Outer rectangle
            ctx.rect(30, 30, 100, 80);
            // Inner hole (reverse winding for even-odd)
            ctx.rect(50, 50, 60, 40);
            ctx.fill('evenodd');
            
            // Nested squares with holes
            ctx.beginPath();
            ctx.fillStyle = 'blue';
            // Outermost square
            ctx.rect(160, 20, 120, 120);
            // Middle hole
            ctx.rect(180, 40, 80, 80);
            // Inner filled square (creates hole in the hole)
            ctx.rect(200, 60, 40, 40);
            ctx.fill('evenodd');
            
            // Complex donut shape with inner hole
            ctx.beginPath();
            ctx.fillStyle = 'green';
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
        },
    });
        registerVisualTest('fill-multiple-subpaths', {
        name: 'Multiple subpath handling',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Multiple disconnected subpaths in one fill call
            ctx.beginPath();
            ctx.fillStyle = 'red';
            
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
            ctx.fillStyle = 'blue';
            
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
            ctx.fillStyle = 'green';
            
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
        },
    });
        registerVisualTest('fill-bezier-curves', {
        name: 'Cubic bezier curve filling',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with bezier curves
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.moveTo(50, 50);
            ctx.bezierCurveTo(50, 20, 100, 20, 100, 50);
            ctx.bezierCurveTo(130, 50, 130, 100, 100, 100);
            ctx.bezierCurveTo(100, 130, 50, 130, 50, 100);
            ctx.bezierCurveTo(20, 100, 20, 50, 50, 50);
            ctx.closePath();
            ctx.fill();
            
            // Heart-like shape using bezier curves
            ctx.beginPath();
            ctx.fillStyle = 'magenta';
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
            ctx.fillStyle = 'lightblue';
            ctx.moveTo(50, 160);
            ctx.bezierCurveTo(80, 140, 120, 140, 150, 160);
            ctx.bezierCurveTo(150, 180, 120, 200, 100, 180);
            ctx.bezierCurveTo(80, 200, 50, 180, 50, 160);
            ctx.closePath();
            ctx.fill();
            
            // Leaf-like shape
            ctx.beginPath();
            ctx.fillStyle = 'green';
            ctx.moveTo(220, 160);
            ctx.bezierCurveTo(240, 140, 260, 140, 270, 160);
            ctx.bezierCurveTo(270, 170, 260, 180, 250, 185);
            ctx.bezierCurveTo(240, 190, 230, 185, 220, 180);
            ctx.bezierCurveTo(210, 175, 210, 165, 220, 160);
            ctx.closePath();
            ctx.fill();
        },
    });
        registerVisualTest('fill-quadratic-curves', {
        name: 'Quadratic curve filling',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Simple curved shape with quadratic curves
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.moveTo(50, 80);
            ctx.quadraticCurveTo(75, 40, 100, 80);
            ctx.quadraticCurveTo(100, 120, 50, 120);
            ctx.quadraticCurveTo(25, 100, 50, 80);
            ctx.closePath();
            ctx.fill();
            
            // Petal-like shapes
            ctx.beginPath();
            ctx.fillStyle = 'magenta';
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
            ctx.fillStyle = 'blue';
            ctx.moveTo(30, 150);
            ctx.quadraticCurveTo(60, 130, 90, 150);
            ctx.quadraticCurveTo(120, 170, 150, 150);
            ctx.quadraticCurveTo(120, 180, 90, 170);
            ctx.quadraticCurveTo(60, 180, 30, 160);
            ctx.closePath();
            ctx.fill();
        },
    });
        registerVisualTest('fill-arcs-ellipses', {
        name: 'Arc and ellipse filling',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Full circle using arc
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(75, 75, 30, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Half circle (semicircle)
            ctx.beginPath();
            ctx.fillStyle = 'green';
            ctx.arc(180, 75, 25, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
            
            // Quarter circle (pie slice)
            ctx.beginPath();
            ctx.fillStyle = 'blue';
            ctx.moveTo(250, 75);
            ctx.arc(250, 75, 30, 0, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            
            // Pac-Man like shape (3/4 circle)
            ctx.beginPath();
            ctx.fillStyle = 'yellow';
            ctx.moveTo(75, 150);
            ctx.arc(75, 150, 30, Math.PI / 4, 7 * Math.PI / 4);
            ctx.closePath();
            ctx.fill();
            
            // Crescent moon (overlapping circles)
            ctx.beginPath();
            ctx.fillStyle = 'lightblue';
            ctx.arc(180, 150, 25, 0, 2 * Math.PI);
            ctx.arc(190, 150, 20, 0, 2 * Math.PI);
            ctx.fill('evenodd');
        },
    });
        registerVisualTest('fill-mixed-paths', {
        name: 'Mixed linear and curve paths',
        width: 300, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Shape mixing lines and curves
            ctx.beginPath();
            ctx.fillStyle = 'red';
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
            ctx.fillStyle = 'lightblue';
            ctx.moveTo(150, 120);
            ctx.lineTo(150, 80);
            ctx.quadraticCurveTo(175, 60, 200, 80);
            ctx.lineTo(200, 120);
            ctx.closePath();
            ctx.fill();
            
            // Flower-like shape
            ctx.beginPath();
            ctx.fillStyle = 'magenta';
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
            ctx.fillStyle = 'green';
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
        },
    });
        registerVisualTest('fill-rule-complex', {
        name: 'Complex fill rule comparisons (even-odd vs nonzero)',
        width: 400, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 200);
            
            // Left side: nonzero fill rule
            ctx.beginPath();
            ctx.fillStyle = 'red';
            
            // Outer rectangle
            ctx.rect(20, 20, 160, 80);
            // Inner rectangle (same winding direction)
            ctx.rect(60, 40, 80, 40);
            
            // Fill with nonzero rule (default)
            ctx.fill('nonzero');
            
            // Right side: evenodd fill rule
            ctx.beginPath();
            ctx.fillStyle = 'blue';
            
            // Same shapes, different fill rule
            ctx.rect(220, 20, 160, 80);
            ctx.rect(260, 40, 80, 40);
            
            // Fill with evenodd rule
            ctx.fill('evenodd');
            
            // Complex overlapping shapes - nonzero
            ctx.beginPath();
            ctx.fillStyle = 'green';
            
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
            ctx.fillStyle = 'magenta';
            
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
        },
    });
    
    // Phase 3: Advanced Clipping Tests
        registerVisualTest('clip-rectangular', {
        name: 'Basic Rectangular Clipping',
        width: 400,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // No need for clearRect with SWCanvas as it starts clean
            
            // Left side: No clipping
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(10, 10, 80, 60);
            ctx.fillStyle = 'red';
            ctx.fillRect(30, 30, 80, 60);
            
            // Right side: With rectangular clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(150, 20, 60, 40);
            ctx.clip();
            
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(130, 10, 80, 60);
            ctx.fillStyle = 'red';
            ctx.fillRect(150, 30, 80, 60);
            ctx.restore();
            
            // Bottom: Multiple overlapping rectangles with clip
            ctx.save();
            ctx.beginPath();
            ctx.rect(50, 120, 100, 50);
            ctx.clip();
            
            ctx.fillStyle = 'green';
            ctx.fillRect(20, 100, 60, 80);
            ctx.fillStyle = 'orange';
            ctx.fillRect(80, 110, 60, 80);
            ctx.fillStyle = 'purple';
            ctx.fillRect(40, 140, 60, 50);
            ctx.restore();
        },
    });
        registerVisualTest('clip-polygon', {
        name: 'Polygon Clipping',
        width: 400,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Triangle clip region
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(50, 20);
            ctx.lineTo(120, 20);
            ctx.lineTo(85, 80);
            ctx.closePath();
            ctx.clip();
            
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(20, 10, 100, 80);
            ctx.fillStyle = 'red';
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
            
            ctx.fillStyle = 'green';
            ctx.fillRect(140, 10, 120, 80);
            ctx.fillStyle = 'orange';
            ctx.fillRect(180, 40, 60, 40);
            ctx.restore();
            
            // Right: Star clip region
            // NOTE: Some browsers may show a thin outline around clip regions.
            // This is non-standard behavior - Chrome and SWCanvas correctly don't stroke clip paths.
            // The HTML5 Canvas spec does not require stroking of clip boundaries.
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
            
            ctx.fillStyle = 'purple';
            ctx.fillRect(300, 10, 80, 80);
            ctx.fillStyle = 'yellow';
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
            
            ctx.fillStyle = 'cyan';
            ctx.fillRect(140, 100, 120, 100);
            ctx.fillStyle = 'magenta';
            ctx.fillRect(180, 130, 40, 40);
            ctx.fillStyle = 'lime';
            ctx.fillRect(160, 120, 80, 20);
            ctx.restore();
        },
    });
        registerVisualTest('clip-curved', {
        name: 'Curved Clipping',
        width: 400,
        height: 250,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(20, 20, 120, 80);
            ctx.fillStyle = 'red';
            ctx.fillRect(50, 40, 60, 40);
            ctx.restore();
            
            // Center: Ellipse clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'green';
            ctx.fillRect(130, 20, 140, 80);
            ctx.fillStyle = 'orange';
            ctx.fillRect(170, 45, 60, 30);
            ctx.restore();
            
            // Right: Arc clip region (partial circle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(340, 60, 35, 0, Math.PI);
            ctx.lineTo(305, 60);
            ctx.closePath();
            ctx.clip();
            
            ctx.fillStyle = 'purple';
            ctx.fillRect(280, 20, 120, 80);
            ctx.fillStyle = 'yellow';
            ctx.fillRect(320, 30, 40, 60);
            ctx.restore();
            
            // Bottom left: Rotated ellipse
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 180, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'cyan';
            ctx.fillRect(40, 140, 120, 80);
            ctx.fillStyle = 'magenta';
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
            
            ctx.fillStyle = 'lime';
            ctx.fillRect(250, 140, 130, 90);
            ctx.fillStyle = 'navy';
            ctx.fillRect(280, 170, 70, 30);
            ctx.restore();
        },
    });
        registerVisualTest('clip-self-intersecting', {
        name: 'Self-Intersecting Clipping',
        width: 400,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Figure-8 clip path
            ctx.save();
            ctx.beginPath();
            ctx.arc(70, 50, 30, 0, 2 * Math.PI);
            ctx.arc(110, 50, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(20, 20, 120, 60);
            ctx.fillStyle = 'red';
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
            
            ctx.fillStyle = 'green';
            ctx.fillRect(140, 10, 120, 80);
            ctx.fillStyle = 'orange';
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
            
            ctx.fillStyle = 'purple';
            ctx.fillRect(270, 10, 120, 80);
            ctx.fillStyle = 'yellow';
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
            
            ctx.fillStyle = 'cyan';
            ctx.fillRect(30, 100, 140, 100);
            ctx.fillStyle = 'magenta';
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
            
            ctx.fillStyle = 'lime';
            ctx.fillRect(220, 110, 160, 80);
            ctx.fillStyle = 'navy';
            ctx.fillRect(270, 130, 60, 40);
            ctx.restore();
        },
    });
        registerVisualTest('clip-stack-nested', {
        name: 'Nested Clipping Stack',
        width: 400,
        height: 250,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Two nested rectangular clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(20, 20, 120, 80);
            ctx.clip();
            
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, 160, 120);
            
            ctx.save();
            // Second clip: smaller rectangle inside first
            ctx.beginPath();
            ctx.rect(40, 40, 60, 40);
            ctx.clip();
            
            ctx.fillStyle = 'red';
            ctx.fillRect(20, 20, 100, 80);
            ctx.restore();
            
            // After restore, only first clip applies
            ctx.fillStyle = 'green';
            ctx.fillRect(100, 50, 40, 30);
            ctx.restore();
            
            // Center: Circle then triangle clips
            ctx.save();
            // First clip: circle
            ctx.beginPath();
            ctx.arc(200, 60, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'orange';
            ctx.fillRect(140, 20, 120, 80);
            
            ctx.save();
            // Second clip: triangle inside circle
            ctx.beginPath();
            ctx.moveTo(180, 30);
            ctx.lineTo(220, 30);
            ctx.lineTo(200, 70);
            ctx.closePath();
            ctx.clip();
            
            ctx.fillStyle = 'purple';
            ctx.fillRect(160, 20, 80, 80);
            ctx.restore();
            
            // Back to circle clip only
            ctx.fillStyle = 'yellow';
            ctx.fillRect(185, 75, 30, 20);
            ctx.restore();
            
            // Right: Three nested clips
            ctx.save();
            // First clip: large rectangle
            ctx.beginPath();
            ctx.rect(280, 20, 100, 80);
            ctx.clip();
            
            ctx.fillStyle = 'cyan';
            ctx.fillRect(260, 0, 140, 120);
            
            ctx.save();
            // Second clip: circle inside rectangle
            ctx.beginPath();
            ctx.arc(330, 60, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'magenta';
            ctx.fillRect(300, 30, 60, 60);
            
            ctx.save();
            // Third clip: small rectangle inside circle
            ctx.beginPath();
            ctx.rect(315, 45, 30, 30);
            ctx.clip();
            
            ctx.fillStyle = 'lime';
            ctx.fillRect(310, 40, 40, 40);
            ctx.restore(); // Back to circle + rectangle
            
            ctx.fillStyle = 'navy';
            ctx.fillRect(305, 35, 50, 15);
            ctx.restore(); // Back to rectangle only
            
            ctx.fillStyle = 'maroon';
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
            
            ctx.fillStyle = 'lightcoral';
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
            
            ctx.fillStyle = 'darkblue';
            ctx.fillRect(70, 130, 100, 80);
            
            ctx.save();
            // Third clip: small circle in center
            ctx.beginPath();
            ctx.arc(120, 170, 15, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'gold';
            ctx.fillRect(100, 150, 40, 40);
            ctx.restore(); // Back to diamond + hexagon
            
            ctx.fillStyle = 'silver';
            ctx.fillRect(105, 155, 30, 10);
            ctx.restore(); // Back to hexagon only
            
            ctx.fillStyle = 'darkgreen';
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
            
            ctx.fillStyle = 'pink';
            ctx.fillRect(-60, -50, 120, 100);
            
            ctx.save();
            ctx.scale(0.7, 0.7);
            // Second clip: scaled circle
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'brown';
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore();
            
            ctx.fillStyle = 'indigo';
            ctx.fillRect(-15, -35, 30, 15);
            ctx.restore();
        },
    });
        registerVisualTest('clip-save-restore', {
        name: 'Clipping Save/Restore',
        width: 400,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Basic save/restore with clip
            ctx.fillStyle = 'lightgray';
            ctx.fillRect(10, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(20, 20, 60, 60);
            ctx.clip();
            
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            ctx.restore();
            
            // Should not be clipped after restore
            ctx.fillStyle = 'blue';
            ctx.fillRect(30, 85, 40, 15);
            
            // Center: Multiple save/restore levels
            ctx.save();
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(120, 10, 80, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(130, 20, 60, 40);
            ctx.clip();
            
            ctx.fillStyle = 'green';
            ctx.fillRect(110, 10, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(140, 30, 40, 20);
            ctx.clip();
            
            ctx.fillStyle = 'yellow';
            ctx.fillRect(120, 20, 80, 60);
            ctx.restore(); // Back to first clip
            
            ctx.fillStyle = 'orange';
            ctx.fillRect(135, 65, 30, 15);
            ctx.restore(); // Back to no clips
            
            ctx.fillStyle = 'purple';
            ctx.fillRect(125, 85, 70, 10);
            ctx.restore(); // Back to original state
            
            // Right: Clip with transform save/restore
            ctx.save();
            ctx.translate(280, 50);
            ctx.rotate(Math.PI / 4);
            
            ctx.beginPath();
            ctx.rect(-30, -30, 60, 60);
            ctx.clip();
            
            ctx.fillStyle = 'cyan';
            ctx.fillRect(-50, -50, 100, 100);
            
            ctx.save();
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = 'magenta';
            ctx.fillRect(-40, -40, 80, 80);
            ctx.restore(); // Back to rotated/translated but same clip
            
            ctx.fillStyle = 'lime';
            ctx.fillRect(-10, -40, 20, 80);
            ctx.restore(); // Back to original transform and no clip
            
            ctx.fillStyle = 'navy';
            ctx.fillRect(250, 85, 60, 10);
            
            // Bottom: Complex save/restore with multiple clips and fills
            ctx.save();
            // First level
            ctx.beginPath();
            ctx.arc(80, 150, 40, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'pink';
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
            
            ctx.fillStyle = 'brown';
            ctx.fillRect(40, 130, 80, 40);
            
            // Modify state without save
            ctx.fillStyle = 'gold';
            ctx.fillRect(70, 140, 20, 20);
            
            ctx.restore(); // Back to circle clip only
            
            ctx.fillStyle = 'silver';
            ctx.fillRect(60, 125, 40, 10);
            
            ctx.save();
            // Third level - small rectangle
            ctx.beginPath();
            ctx.rect(65, 160, 30, 15);
            ctx.clip();
            
            ctx.fillStyle = 'maroon';
            ctx.fillRect(50, 150, 60, 30);
            ctx.restore(); // Back to circle clip
            
            ctx.fillStyle = 'darkgreen';
            ctx.fillRect(90, 135, 25, 30);
            ctx.restore(); // Back to no clips
            
            // Should render without any clipping
            ctx.fillStyle = 'black';
            ctx.fillRect(30, 185, 100, 10);
            
            // Bottom right: Save/restore with stroke and fill
            ctx.save();
            ctx.beginPath();
            ctx.rect(220, 120, 80, 60);
            ctx.clip();
            
            ctx.fillStyle = 'lightcoral';
            ctx.fillRect(200, 100, 120, 100);
            
            ctx.strokeStyle = 'darkblue';
            ctx.lineWidth = 3;
            ctx.strokeRect(210, 110, 100, 80);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(260, 150, 25, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'yellow';
            ctx.fillRect(235, 125, 50, 50);
            
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(245, 135, 30, 30);
            ctx.restore();
            
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            ctx.strokeRect(225, 125, 70, 15);
            ctx.restore();
        },
    });
        registerVisualTest('clip-intersection', {
        name: 'Basic Clipping Regions',
        width: 400,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // Left: Single rectangular clip (simplified from intersection)
            ctx.save();
            // Direct rectangle clip representing the intersection area
            ctx.beginPath();
            ctx.rect(30, 50, 40, 40);
            ctx.clip();
            
            ctx.fillStyle = 'red';
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
            
            ctx.fillStyle = 'blue';
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
            
            ctx.fillStyle = 'green';
            ctx.fillRect(280, 20, 100, 100);
            ctx.restore();
            
            // Bottom left: Circle clip region
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, 150, 35, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'orange';
            ctx.fillRect(40, 110, 80, 80);
            ctx.restore();
            
            // Bottom center: Another circle clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 150, 32, 0, 2 * Math.PI);
            ctx.clip();
            
            ctx.fillStyle = 'cyan';
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
            
            ctx.fillStyle = 'magenta';
            ctx.fillRect(290, 110, 80, 80);
            ctx.restore();
        },
    });
        registerVisualTest('clip-intersection-enhanced', {
        name: 'Enhanced Clipping Intersection Test',
        width: 400, height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('combined-transform-fill-rotate', {
        name: 'Rotated complex polygons',
        width: 400, height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('combined-transform-fill-scale', {
        name: 'Scaled paths with fill rules',
        width: 400, height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('combined-transform-clip-fill', {
        name: 'Transform + Clip + Fill',
        width: 400, height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('combined-all-features', {
        name: 'All features + globalAlpha',
        width: 400, height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('debug-alpha-blending', {
        name: 'Debug Alpha Blending Issue',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
            ctx.fillStyle = 'blue';
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
            
            ctx.fillStyle = 'orange';
            ctx.fill();
            ctx.restore();
            
            // Pixel analysis for debugging (works with both canvas types)
            if (canvas._coreSurface) {
                // SWCanvas pixel analysis
                const surface = canvas._coreSurface;
                const layer1Offset = 100 * surface.stride + 100 * 4;
                const r1 = surface.data[layer1Offset];
                const g1 = surface.data[layer1Offset + 1];
                const b1 = surface.data[layer1Offset + 2];
                const a1 = surface.data[layer1Offset + 3];
                console.log(`After blue layer: R=${r1}, G=${g1}, B=${b1}, A=${a1}`);
                
                const orangeOffset = 100 * surface.stride + 90 * 4;
                const r = surface.data[orangeOffset];
                const g = surface.data[orangeOffset + 1];
                const b = surface.data[orangeOffset + 2];
                const a = surface.data[orangeOffset + 3];
                console.log(`SWCanvas orange area: R=${r}, G=${g}, B=${b}, A=${a}`);
            } else {
                // HTML5 Canvas pixel analysis
                const imageData = ctx.getImageData(100, 100, 1, 1);
                const r = imageData.data[0];
                const g = imageData.data[1];
                const b = imageData.data[2];
                const a = imageData.data[3];
                console.log(`HTML5Canvas clipped center: R=${r}, G=${g}, B=${b}, A=${a}`);
            }
        },
    });
        registerVisualTest('debug-star-shape', {
        name: 'Debug Star Shape Issue',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
            
            ctx.fillStyle = 'purple';
            ctx.fill();
            
            // Add stroked outline on top
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'magenta';
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        },
    });
        registerVisualTest('pixel-analysis', {
        name: 'Pixel Analysis Test',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.save();
            ctx.translate(100, 100);
            
            // First layer: Semi-transparent blue at alpha 0.4
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'blue'; // RGB(0, 0, 255)
            ctx.fillRect(-30, -30, 60, 60);
            
            // Second layer: Semi-transparent orange at alpha 0.6, overlapping
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'orange'; // RGB(255, 165, 0)
            ctx.fillRect(-20, -20, 40, 40);
            
            ctx.restore();
            
            // Pixel analysis for both canvas types
            if (canvas._coreSurface) {
                // SWCanvas pixel analysis
                const surface = canvas._coreSurface;
                const centerOffset = 100 * surface.stride + 100 * 4;
                const r = surface.data[centerOffset];
                const g = surface.data[centerOffset + 1];
                const b = surface.data[centerOffset + 2];
                const a = surface.data[centerOffset + 3];
                console.log(`SWCanvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
            } else {
                // HTML5Canvas pixel analysis
                const imageData = ctx.getImageData(100, 100, 1, 1);
                const r = imageData.data[0];
                const g = imageData.data[1];
                const b = imageData.data[2];
                const a = imageData.data[3];
                console.log(`HTML5Canvas center pixel: R=${r}, G=${g}, B=${b}, A=${a}`);
            }
        },
    });
        registerVisualTest('debug-star-path', {
        name: 'Debug Star Path Generation',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
                
                // Debug logging only for SWCanvas to avoid console spam
                if (canvas._coreSurface) {
                    console.log(`Star point ${i}: angle=${angle}`);
                }
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (canvas._coreSurface) {
                    console.log(`  Outer: (${outerX.toFixed(2)}, ${outerY.toFixed(2)})`);
                    console.log(`  Inner: (${innerX.toFixed(2)}, ${innerY.toFixed(2)})`);
                }
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.restore();
        },
    });
        registerVisualTest('combined-transform-stroke-rotate', {
        name: 'Rotated Stroke Joins',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
            
            ctx.strokeStyle = 'blue';
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
            ctx.strokeStyle = 'orange';
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
        },
    });
        registerVisualTest('combined-transform-stroke-scale', {
        name: 'Scaled Stroke Behavior',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
                
                ctx.strokeStyle = colors[i];
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
        },
    });
        registerVisualTest('combined-transform-clip-stroke', {
        name: 'Transform + Clip + Stroke',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
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
            ctx.strokeStyle = 'red';
            ctx.stroke();
            
            // Add diagonal lines
            ctx.beginPath();
            ctx.moveTo(-60, -60);
            ctx.lineTo(60, 60);
            ctx.moveTo(-60, 60);
            ctx.lineTo(60, -60);
            
            ctx.lineWidth = 6;
            ctx.strokeStyle = 'blue';
            ctx.stroke();
            ctx.restore();
            
            ctx.restore();
        },
    });
    
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
    
    // Helper function to create compatible images for both canvas types
    function createCompatibleImage(width, height, pattern, ctx) {
        const imagelike = createTestImage(width, height, pattern);
        
        // For HTML5 Canvas, create a temporary canvas element
        if (ctx.createImageData && typeof document !== 'undefined') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const imageData = tempCtx.createImageData(width, height);
            imageData.data.set(imagelike.data);
            tempCtx.putImageData(imageData, 0, 0);
            
            return tempCanvas;
        }
        
        // For SWCanvas, return the ImageLike object directly
        return imagelike;
    }
    
    // Helper function for RGB images
    function createCompatibleRGBImage(width, height, ctx) {
        const rgbImagelike = createRGBTestImage(width, height);
        
        // For HTML5 Canvas, create a temporary canvas element
        if (ctx.createImageData && typeof document !== 'undefined') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const imageData = tempCtx.createImageData(width, height);
            // Convert RGB to RGBA
            for (let i = 0, j = 0; i < rgbImagelike.data.length; i += 3, j += 4) {
                imageData.data[j] = rgbImagelike.data[i];     // R
                imageData.data[j + 1] = rgbImagelike.data[i + 1]; // G
                imageData.data[j + 2] = rgbImagelike.data[i + 2]; // B
                imageData.data[j + 3] = 255; // A
            }
            tempCtx.putImageData(imageData, 0, 0);
            
            return tempCanvas;
        }
        
        // For SWCanvas, return the RGB ImageLike object directly
        return rgbImagelike;
    }
        registerVisualTest('drawimage-basic', {
        name: 'Basic drawImage positioning',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Create test image compatible with both canvas types
            const testImage = createCompatibleImage(20, 20, 'checkerboard', ctx);
            
            // Draw at different positions
            ctx.drawImage(testImage, 10, 10);        // Basic position
            ctx.drawImage(testImage, 50, 10);        // Right
            ctx.drawImage(testImage, 10, 50);        // Below
            ctx.drawImage(testImage, 50, 50);        // Diagonal
        },
    });
        registerVisualTest('drawimage-scaling', {
        name: 'drawImage with scaling',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Create gradient test image compatible with both canvas types
            const testImage = createCompatibleImage(10, 10, 'gradient', ctx);
            
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
        },
    });
        registerVisualTest('drawimage-rgb-conversion', {
        name: 'RGB to RGBA auto-conversion',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Create RGB test image compatible with both canvas types
            const rgbImage = createCompatibleRGBImage(30, 30, ctx);
            
            // Draw RGB image - should auto-convert to RGBA
            ctx.drawImage(rgbImage, 20, 20);
            
            // Create RGBA test image for comparison
            const rgbaImage = createCompatibleImage(30, 30, 'border', ctx);
            ctx.drawImage(rgbaImage, 70, 20);
        },
    });
        registerVisualTest('drawimage-transforms', {
        name: 'drawImage with transforms',
        width: 200, height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 200);
            
            // Create compatible test image for both canvas types
            const testImage = createCompatibleImage(20, 20, 'checkerboard', ctx);
            
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
        },
    });
        registerVisualTest('drawimage-alpha-blending', {
        name: 'drawImage with alpha and blending',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            // Colored background
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, 200, 150);
            
            // Create alpha gradient image compatible with both canvas types
            const alphaImage = createCompatibleImage(40, 40, 'alpha', ctx);
            
            // Draw with full alpha
            ctx.drawImage(alphaImage, 20, 20);
            
            // Draw with global alpha
            ctx.globalAlpha = 0.5;
            ctx.drawImage(alphaImage, 80, 20);
            ctx.globalAlpha = 1.0;
            
            // Draw overlapping for blending test
            const solidImage = createCompatibleImage(30, 30, 'checkerboard', ctx);
            ctx.drawImage(solidImage, 120, 50);
            ctx.drawImage(alphaImage, 130, 60);
        },
    });
        registerVisualTest('drawimage-surface-conversion', {
        name: 'drawImage using surface-to-ImageLike conversion',
        width: 200, height: 150,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 150);
            
            // Create source image manually for both canvas types
            let sourceImage;
            
            if (canvas._coreSurface) {
                // For SWCanvas: Create ImageLike object directly
                sourceImage = {
                    width: 40,
                    height: 40,
                    data: new Uint8ClampedArray(40 * 40 * 4)
                };
            } else {
                // For HTML5Canvas: Create temporary canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 40;
                tempCanvas.height = 40;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Draw the complex pattern on the temporary canvas
                tempCtx.fillStyle = 'red';
                tempCtx.fillRect(0, 0, 40, 40);
                tempCtx.fillStyle = 'blue';
                tempCtx.fillRect(10, 10, 20, 20);
                tempCtx.fillStyle = 'yellow';
                tempCtx.fillRect(5, 5, 10, 10);
                
                sourceImage = tempCanvas;
            }
            
            // If we created an ImageLike object, populate it with pixel data
            if (sourceImage.data) {
                for (let y = 0; y < 40; y++) {
                    for (let x = 0; x < 40; x++) {
                        const offset = (y * 40 + x) * 4;
                        
                        if (x >= 5 && x < 15 && y >= 5 && y < 15) {
                            // Yellow square (5,5) to (15,15)
                            sourceImage.data[offset] = 255;     // R
                            sourceImage.data[offset + 1] = 255; // G
                            sourceImage.data[offset + 2] = 0;   // B
                            sourceImage.data[offset + 3] = 255; // A
                        } else if (x >= 10 && x < 30 && y >= 10 && y < 30) {
                            // Blue square (10,10) to (30,30)
                            sourceImage.data[offset] = 0;       // R
                            sourceImage.data[offset + 1] = 0;   // G
                            sourceImage.data[offset + 2] = 255; // B
                            sourceImage.data[offset + 3] = 255; // A
                        } else {
                            // Red background
                            sourceImage.data[offset] = 255;     // R
                            sourceImage.data[offset + 1] = 0;   // G
                            sourceImage.data[offset + 2] = 0;   // B
                            sourceImage.data[offset + 3] = 255; // A
                        }
                    }
                }
            }
            
            // Draw the source image at different positions and scales
            ctx.drawImage(sourceImage, 20, 20);           // Original size
            ctx.drawImage(sourceImage, 80, 20, 20, 20);   // Scaled down
            ctx.drawImage(sourceImage, 120, 20, 60, 60);  // Scaled up
        },
    });
        registerVisualTest('subpixel-strokes', {
        name: 'Sub-pixel Stroke Rendering',
        width: 600,
        height: 400,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 600, 400);
            
            // Test different stroke widths
            const strokeWidths = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
            const colors = ['red', 'blue', 'green', 'purple', 'orange', 'brown', 'pink'];
            
            // Horizontal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 50 + i * 30);
                ctx.lineTo(200, 50 + i * 30);
                ctx.stroke();
                
                // Label the width
                ctx.fillStyle = 'black';
                if (ctx.fillText) {
                    // HTML5Canvas: use fillText
                    ctx.font = '10px Arial';
                    ctx.fillText(strokeWidths[i].toString(), 10, 55 + i * 30);
                } else {
                    // SWCanvas: use a small rect to indicate width
                    ctx.fillRect(20, 45 + i * 30, 2, strokeWidths[i] * 10 + 2);
                }
            }
            
            // Vertical lines
            for (let i = 0; i < strokeWidths.length; i++) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(250 + i * 30, 50);
                ctx.lineTo(250 + i * 30, 200);
                ctx.stroke();
            }
            
            // Diagonal lines
            for (let i = 0; i < strokeWidths.length; i++) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.moveTo(50 + i * 25, 250);
                ctx.lineTo(150 + i * 25, 350);
                ctx.stroke();
            }
            
            // Rectangles
            for (let i = 0; i < strokeWidths.length; i++) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.rect(300 + (i % 4) * 60, 250 + Math.floor(i / 4) * 60, 40, 40);
                ctx.stroke();
            }
            
            // Circles
            for (let i = 0; i < strokeWidths.length; i++) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = strokeWidths[i];
                ctx.beginPath();
                ctx.arc(500, 70 + i * 40, 15, 0, 2 * Math.PI);
                ctx.stroke();
            }
        },
    });
        registerVisualTest('stroke-edge-cases', {
        name: 'Stroke Edge Cases',
        width: 500,
        height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 500, 300);
        registerVisualTest('clipped-path-strokes', {
        name: 'Clipped Path Strokes',
        width: 400,
        height: 300,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 300);
        registerVisualTest('stroke-pixel-analysis', {
        name: 'Stroke Pixel Analysis',
        width: 300,
        height: 200,
        draw: function(canvas) {
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 200);
            
            // Test 1: Single pixel stroke at integer coordinates
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(100, 50);
            ctx.stroke();
            
            // Test 2: Sub-pixel stroke widths at integer coordinates
            const subPixelWidths = [0.1, 0.25, 0.5, 0.75];
            for (let i = 0; i < subPixelWidths.length; i++) {
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = subPixelWidths[i];
                ctx.beginPath();
                ctx.moveTo(50, 70 + i * 10);
                ctx.lineTo(100, 70 + i * 10);
                ctx.stroke();
            }
            
            // Test 3: 1-pixel stroke at fractional coordinates
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(50.5, 120);
            ctx.lineTo(100.5, 120);
            ctx.stroke();
            
            // Test 4: Sub-pixel strokes at fractional coordinates
            for (let i = 0; i < subPixelWidths.length; i++) {
                ctx.strokeStyle = 'purple';
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
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = thinWidths[i];
                ctx.beginPath();
                ctx.moveTo(xPositions[i], 50);
                ctx.lineTo(xPositions[i], 120);
                ctx.stroke();
            }
            
            // Test 6: Diagonal lines with thin strokes
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = 'brown';
                ctx.lineWidth = 0.25 + i * 0.25;
                ctx.beginPath();
                ctx.moveTo(220, 50 + i * 20);
                ctx.lineTo(270, 100 + i * 20);
                ctx.stroke();
            }
            
            // Pixel analysis for both canvas types
            if (canvas._coreSurface) {
                // SWCanvas pixel analysis
                const surface = canvas._coreSurface;
                console.log('SWCanvas stroke pixel analysis:');
                const pixelAt50_50 = surface.data[(50 * surface.stride) + (50 * 4)];
                console.log(`  Pixel at (50,50) - Red stroke 1px: R=${pixelAt50_50} (should be 255 if rendered)`);
                
                const pixelAt50_70 = surface.data[(50 * surface.stride) + (70 * 4)];
                console.log(`  Pixel at (50,70) - Blue stroke 0.1px: R=${surface.data[(70 * surface.stride) + (50 * 4)]}`);
                
                const pixelAt50_75 = surface.data[(75 * surface.stride) + (50 * 4) + 2];
                console.log(`  Pixel at (50,75) - Blue stroke 0.5px: B=${pixelAt50_75}`);
            } else {
                // HTML5Canvas pixel analysis
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
        }
    });
        const VisualRenderingTests = {
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