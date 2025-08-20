// Test: Thick Polyline Bevel Joins - Systematic Angle and Dash Combinations
// This file will be concatenated into the main visual test suite

registerVisualTest('thick-polyline-bevel-joins-systematic', {
    name: 'Thick Polyline - Bevel Joins with Angles and Dash Patterns',
    width: 600, height: 550,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 600, 550);
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 12;  // Thick lines to show joins clearly
        ctx.lineJoin = 'bevel';
        ctx.lineCap = 'butt';
        
        // Test different angles and dash patterns
        const angles = [45, 90, 120, 135]; // Different angles between line segments
        const dashPatterns = [
            { name: 'No Dash', pattern: [] },
            { name: 'Thin Dash', pattern: [3, 3] },
            { name: 'Medium Dash', pattern: [8, 6] },
            { name: 'Thick Dash', pattern: [15, 10] }
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
                const segmentLength = 60;
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
        
        // Add additional complex polylines with multiple segments
        yOffset += 20;
        ctx.strokeStyle = 'red';
        
        // Complex zigzag with different dash patterns
        const dashPatternsComplex = [[], [5, 5], [12, 8]];
        let xStart = 50;
        
        for (let i = 0; i < dashPatternsComplex.length; i++) {
            ctx.setLineDash(dashPatternsComplex[i]);
            
            ctx.beginPath();
            ctx.moveTo(xStart, yOffset);
            ctx.lineTo(xStart + 40, yOffset - 30);
            ctx.lineTo(xStart + 80, yOffset);
            ctx.lineTo(xStart + 120, yOffset - 30);
            ctx.lineTo(xStart + 160, yOffset);
            ctx.stroke();
            
            xStart += 180;
        }
        
        // Reset line dash for any subsequent drawing
        ctx.setLineDash([]);
    }
});