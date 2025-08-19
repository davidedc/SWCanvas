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
            swSurface = SWCanvas.Core.Surface(400, 300);
            swContext = new SWCanvas.Core.Context2D(swSurface);
            
            interactiveSurface = SWCanvas.Core.Surface(400, 300);
            interactiveContext = new SWCanvas.Core.Context2D(interactiveSurface);
            
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

}