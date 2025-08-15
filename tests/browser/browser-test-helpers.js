// Browser-specific visual tests for SWCanvas
// These tests require DOM interaction and visual comparison with HTML5 Canvas

function createBrowserVisualTests(SWCanvas) {
    'use strict';
    
    let swSurface, swContext;
    let interactiveSurface, interactiveContext;
    let interactiveHTML5Context;

    function initSWCanvas() {
        try {
            // Check if SWCanvas loaded
            if (typeof SWCanvas === 'undefined') {
                throw new Error('SWCanvas not loaded');
            }

            // Test surface creation
            swSurface = SWCanvas.Surface(400, 300);
            swContext = new SWCanvas.Context2D(swSurface);
            
            interactiveSurface = SWCanvas.Surface(400, 300);
            interactiveContext = new SWCanvas.Context2D(interactiveSurface);
            
            // Initialize HTML5 canvas for interactive tests
            const html5Canvas = document.getElementById('interactive-html5');
            if (html5Canvas) {
                interactiveHTML5Context = html5Canvas.getContext('2d');
            }

            document.getElementById('library-status').innerHTML = 
                '<div class="success">✓ SWCanvas loaded successfully</div>';
            
            return true;
        } catch (error) {
            document.getElementById('library-status').innerHTML = 
                `<div class="error">✗ Error: ${error.message}</div>`;
            return false;
        }
    }

    function runM1ComparisonTest() {
        if (!initSWCanvas()) return;

        try {
            // Clear surface
            swContext.clearRect(0, 0, 400, 300);
            
            // White background
            swContext.setFillStyle(255, 255, 255, 255);
            swContext.fillRect(0, 0, 400, 300);
            
            // Red rectangle
            swContext.setFillStyle(255, 0, 0, 255);
            swContext.fillRect(50, 50, 100, 80);
            
            // Blue rectangle with some overlap
            swContext.setFillStyle(0, 0, 255, 255);
            swContext.fillRect(100, 100, 100, 80);
            
            // Green rectangle with alpha
            swContext.globalAlpha = 0.5;
            swContext.setFillStyle(0, 255, 0, 255);
            swContext.fillRect(75, 75, 100, 80);
            swContext.globalAlpha = 1.0;
            
            // Display result
            displaySWCanvasResult('swcanvas-result');
            
            // Also draw equivalent on HTML5 canvas for comparison
            drawHTML5Comparison();
            
            document.getElementById('test-results').innerHTML = 
                '<div class="success">✓ M1 comparison test completed</div>';
                
        } catch (error) {
            document.getElementById('test-results').innerHTML = 
                `<div class="error">✗ Test error: ${error.message}</div>`;
        }
    }

    function drawHTML5Comparison() {
        const canvas = document.getElementById('test-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Clear
        ctx.clearRect(0, 0, 400, 300);
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Red rectangle
        ctx.fillStyle = 'red';
        ctx.fillRect(50, 50, 100, 80);
        
        // Blue rectangle
        ctx.fillStyle = 'blue';
        ctx.fillRect(100, 100, 100, 80);
        
        // Green rectangle with alpha
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgb(0, 255, 0)'; // Use explicit RGB to match SWCanvas
        ctx.fillRect(75, 75, 100, 80);
        ctx.globalAlpha = 1.0;
    }

    function displaySWCanvasResult(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Convert SWCanvas surface to ImageData
        const imageData = ctx.createImageData(swSurface.width, swSurface.height);
        
        // Copy pixel data (always un-premultiply for display)
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

    function downloadBMP() {
        if (!swSurface) {
            alert('Run tests first!');
            return;
        }
        
        try {
            const bmpData = SWCanvas.encodeBMP(swSurface);
            const blob = new Blob([bmpData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'swcanvas-test.bmp';
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('BMP download failed: ' + error.message);
        }
    }

    // Interactive test functions
    function clearCanvas() {
        if (!interactiveContext || !interactiveHTML5Context) return;
        
        // Clear SWCanvas
        interactiveContext.clearRect(0, 0, 400, 300);
        
        // Clear HTML5 Canvas
        interactiveHTML5Context.clearRect(0, 0, 400, 300);
        
        displayInteractiveResult();
    }

    function drawRedRect() {
        if (!interactiveContext || !interactiveHTML5Context) return;
        
        const x = 50 + Math.random() * 100;
        const y = 50 + Math.random() * 100;
        
        // Draw on SWCanvas
        interactiveContext.setFillStyle(255, 0, 0, 255);
        interactiveContext.fillRect(x, y, 80, 60);
        
        // Draw on HTML5 Canvas
        interactiveHTML5Context.fillStyle = 'red';
        interactiveHTML5Context.fillRect(x, y, 80, 60);
        
        displayInteractiveResult();
    }

    function drawBlueRect() {
        if (!interactiveContext || !interactiveHTML5Context) return;
        
        const x = 50 + Math.random() * 100;
        const y = 50 + Math.random() * 100;
        
        // Draw on SWCanvas
        interactiveContext.setFillStyle(0, 0, 255, 255);
        interactiveContext.fillRect(x, y, 80, 60);
        
        // Draw on HTML5 Canvas
        interactiveHTML5Context.fillStyle = 'blue';
        interactiveHTML5Context.fillRect(x, y, 80, 60);
        
        displayInteractiveResult();
    }

    function drawWithAlpha() {
        if (!interactiveContext || !interactiveHTML5Context) return;
        
        const x = 50 + Math.random() * 100;
        const y = 50 + Math.random() * 100;
        
        // Clear first to ensure white background
        interactiveContext.setFillStyle(255, 255, 255, 255);
        interactiveContext.fillRect(0, 0, 400, 300);
        interactiveHTML5Context.fillStyle = 'white';
        interactiveHTML5Context.fillRect(0, 0, 400, 300);
        
        // Draw on SWCanvas
        interactiveContext.globalAlpha = 0.5;
        interactiveContext.setFillStyle(0, 255, 0, 255);
        interactiveContext.fillRect(x, y, 80, 60);
        interactiveContext.globalAlpha = 1.0;
        
        // Draw on HTML5 Canvas
        interactiveHTML5Context.globalAlpha = 0.5;
        interactiveHTML5Context.fillStyle = 'rgb(0, 255, 0)'; // Use explicit RGB to match SWCanvas
        interactiveHTML5Context.fillRect(x, y, 80, 60);
        interactiveHTML5Context.globalAlpha = 1.0;
        
        // Debug: Log some pixel values from both canvases
        const debugX = Math.floor(x + 40);
        const debugY = Math.floor(y + 30);
        const debugOffset = debugY * interactiveSurface.stride + debugX * 4;
        console.log(`SWCanvas pixel at (${debugX}, ${debugY}): R=${interactiveSurface.data[debugOffset]}, G=${interactiveSurface.data[debugOffset+1]}, B=${interactiveSurface.data[debugOffset+2]}, A=${interactiveSurface.data[debugOffset+3]}`);
        
        // Get HTML5 Canvas pixel for comparison
        const html5ImageData = interactiveHTML5Context.getImageData(debugX, debugY, 1, 1);
        console.log(`HTML5 Canvas pixel at (${debugX}, ${debugY}): R=${html5ImageData.data[0]}, G=${html5ImageData.data[1]}, B=${html5ImageData.data[2]}, A=${html5ImageData.data[3]}`);
        
        displayInteractiveResult();
    }

    function testTransform() {
        if (!interactiveContext || !interactiveHTML5Context) return;
        
        // Draw on SWCanvas
        interactiveContext.save();
        interactiveContext.setTransform(1, 0.2, 0.2, 1, 200, 150);
        interactiveContext.setFillStyle(255, 128, 0, 255);
        interactiveContext.fillRect(-40, -30, 80, 60);
        interactiveContext.restore();
        
        // Draw on HTML5 Canvas
        interactiveHTML5Context.save();
        interactiveHTML5Context.setTransform(1, 0.2, 0.2, 1, 200, 150);
        interactiveHTML5Context.fillStyle = 'orange';
        interactiveHTML5Context.fillRect(-40, -30, 80, 60);
        interactiveHTML5Context.restore();
        
        displayInteractiveResult();
    }

    function displayInteractiveResult() {
        const canvas = document.getElementById('interactive-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(interactiveSurface.width, interactiveSurface.height);
        
        for (let i = 0; i < interactiveSurface.data.length; i += 4) {
            const r = interactiveSurface.data[i];
            const g = interactiveSurface.data[i + 1];
            const b = interactiveSurface.data[i + 2];
            const a = interactiveSurface.data[i + 3];
            
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

    // Public API
    return {
        initSWCanvas: initSWCanvas,
        runM1ComparisonTest: runM1ComparisonTest,
        downloadBMP: downloadBMP,
        clearCanvas: clearCanvas,
        drawRedRect: drawRedRect,
        drawBlueRect: drawBlueRect,
        drawWithAlpha: drawWithAlpha,
        testTransform: testTransform
    };
}