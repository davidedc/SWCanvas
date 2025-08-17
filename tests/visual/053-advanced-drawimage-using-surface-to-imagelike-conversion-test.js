// Test 53: Advanced drawImage using surface-to-ImageLike conversion
// This file will be concatenated into the main visual test suite

// Test 53: Advanced drawImage using surface-to-ImageLike conversion
registerVisualTest('drawimage-surface-conversion', {
    name: 'drawImage using surface-to-ImageLike conversion',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Create source image using new unified createImageData API
        const sourceImage = ctx.createImageData(40, 40);
        
        // Populate with pixel data
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
        
        // Draw the source image at different positions and scales
        ctx.drawImage(sourceImage, 20, 20);           // Original size
        ctx.drawImage(sourceImage, 80, 20, 20, 20);   // Scaled down
        ctx.drawImage(sourceImage, 120, 20, 60, 60);  // Scaled up
    },
});