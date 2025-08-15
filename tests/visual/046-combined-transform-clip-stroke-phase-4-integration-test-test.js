// Test 46: Combined Transform + Clip + Stroke - Phase 4 Integration Test
// This file will be concatenated into the main visual test suite

// Test 46: Combined Transform + Clip + Stroke - Phase 4 Integration Test
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