// Test 60: Stroke pixel analysis
// This file will be concatenated into the main visual test suite

// Test 60: Stroke pixel analysis
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