// Test: Stroke pixel analysis
// This file will be concatenated into the main visual test suite

registerVisualTest('stroke-pixel-analysis', {
    name: 'Stroke Pixel Analysis',
    width: 300,
    height: 200,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        // Test: Single pixel stroke at integer coordinates
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(100, 50);
        ctx.stroke();
        
        // Test: Sub-pixel stroke widths at integer coordinates
        const subPixelWidths = [0.1, 0.25, 0.5, 0.75];
        for (let i = 0; i < subPixelWidths.length; i++) {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = subPixelWidths[i];
            ctx.beginPath();
            ctx.moveTo(50, 70 + i * 10);
            ctx.lineTo(100, 70 + i * 10);
            ctx.stroke();
        }
        
        // Test: 1-pixel stroke at fractional coordinates
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(50.5, 120);
        ctx.lineTo(100.5, 120);
        ctx.stroke();
        
        // Test: Sub-pixel strokes at fractional coordinates
        for (let i = 0; i < subPixelWidths.length; i++) {
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = subPixelWidths[i];
            ctx.beginPath();
            ctx.moveTo(50.5, 130 + i * 10);
            ctx.lineTo(100.5, 130 + i * 10);
            ctx.stroke();
        }
        
        // Test: Very thin vertical lines
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
        
        // Test: Diagonal lines with thin strokes
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = 'brown';
            ctx.lineWidth = 0.25 + i * 0.25;
            ctx.beginPath();
            ctx.moveTo(220, 50 + i * 20);
            ctx.lineTo(270, 100 + i * 20);
            ctx.stroke();
        }
        
        // Unified stroke pixel analysis using standard getImageData API
        try {
            console.log('Stroke pixel analysis:');
            
            // Check red stroke at (50,50)
            const redPixelData = ctx.getImageData(50, 50, 1, 1);
            const redPixel = redPixelData.data[0];
            console.log(`  Pixel at (50,50) - Red stroke 1px: R=${redPixel} (should be 255 if rendered)`);
            
            // Check blue strokes
            const bluePixel70Data = ctx.getImageData(50, 70, 1, 1);
            const bluePixel75Data = ctx.getImageData(50, 75, 1, 1);
            
            const bluePixel70 = bluePixel70Data.data[0];
            const bluePixel75 = bluePixel75Data.data[2];
            
            console.log(`  Pixel at (50,70) - Blue stroke 0.1px: R=${bluePixel70}`);
            console.log(`  Pixel at (50,75) - Blue stroke 0.5px: B=${bluePixel75}`);
        } catch (e) {
            console.log('Could not sample pixels (security restriction)');
        }
    }
});