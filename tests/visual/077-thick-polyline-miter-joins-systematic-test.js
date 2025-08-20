// Test: Thick Polyline Miter Joins - Systematic Angle and Dash Combinations
// This file will be concatenated into the main visual test suite

registerVisualTest('thick-polyline-miter-joins-systematic', {
    name: 'Thick Polyline - Miter Joins with Angles and Dash Patterns',
    width: 600, height: 500,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 600, 500);
        
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 12;  // Thick lines to show joins clearly
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.miterLimit = 10;  // Standard miter limit
        
        // Test different angles and dash patterns
        const angles = [30, 60, 90, 120]; // Different angles - some will show miter limits
        const dashPatterns = [
            { name: 'No Dash', pattern: [] },
            { name: 'Thin Dash', pattern: [4, 4] },
            { name: 'Medium Dash', pattern: [10, 7] },
            { name: 'Thick Dash', pattern: [18, 12] }
        ];
        
        let yOffset = 40;
        
        // Draw each angle with each dash pattern
        for (let angleIndex = 0; angleIndex < angles.length; angleIndex++) {
            const angle = angles[angleIndex];
            let xOffset = 50;
            
            for (let dashIndex = 0; dashIndex < dashPatterns.length; dashIndex++) {
                const dash = dashPatterns[dashIndex];
                
                // Set dash pattern
                ctx.setLineDash(dash.pattern);
                ctx.lineDashOffset = 0;
                
                // Calculate line segments based on angle
                const segmentLength = 55;
                const startX = xOffset;
                const startY = yOffset;
                const midX = startX + segmentLength;
                const midY = startY;
                
                // Calculate end point based on angle
                const angleRad = (angle * Math.PI) / 180;
                const endX = midX + segmentLength * Math.cos(angleRad);
                const endY = midY + segmentLength * Math.sin(angleRad);
                
                // Draw the polyline
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Label the test (skip fillText for Core API compatibility)
                ctx.save();
                ctx.setLineDash([]);
                ctx.fillStyle = 'black';
                // Note: Using small marker dots instead of text for Core API compatibility
                ctx.fillRect(startX + segmentLength/2 - 2, startY - 20, 4, 4);
                ctx.restore();
                
                xOffset += 130;
            }
            
            yOffset += 90;
        }
        
        // Add sharp angle tests to show miter limit behavior
        yOffset += 15;
        ctx.strokeStyle = 'darkred';
        
        // Very sharp angles that should hit miter limit
        const sharpAngles = [15, 10, 5]; // Very sharp angles
        let xStart = 80;
        
        for (let i = 0; i < sharpAngles.length; i++) {
            const angle = sharpAngles[i];
            const dashPattern = i === 0 ? [] : i === 1 ? [6, 6] : [12, 8];
            
            ctx.setLineDash(dashPattern);
            
            const segmentLength = 50;
            const angleRad = (angle * Math.PI) / 180;
            
            ctx.beginPath();
            ctx.moveTo(xStart, yOffset);
            ctx.lineTo(xStart + segmentLength, yOffset);
            ctx.lineTo(xStart + segmentLength + segmentLength * Math.cos(angleRad), 
                      yOffset + segmentLength * Math.sin(angleRad));
            ctx.stroke();
            
            // Label sharp angle test (skip fillText for Core API compatibility)
            ctx.save();
            ctx.setLineDash([]);
            ctx.fillStyle = 'red';
            // Note: Using colored marker dots to distinguish sharp angle tests
            ctx.fillRect(xStart + segmentLength/2 - 2, yOffset - 20, 4, 4);
            ctx.restore();
            
            xStart += 160;
        }
        
        // Reset line dash for any subsequent drawing
        ctx.setLineDash([]);
    }
});