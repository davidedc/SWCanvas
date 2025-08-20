// Test: Thick Polyline Round Joins - Systematic Angle and Dash Combinations
// This file will be concatenated into the main visual test suite

registerVisualTest('thick-polyline-round-joins-systematic', {
    name: 'Thick Polyline - Round Joins with Angles and Dash Patterns',
    width: 600, height: 500,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 600, 500);
        
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 12;  // Thick lines to show joins clearly
        ctx.lineJoin = 'round';
        ctx.lineCap = 'butt';
        
        // Test different angles and dash patterns
        const angles = [45, 90, 135, 160]; // Different angles to show round join curves
        const dashPatterns = [
            { name: 'No Dash', pattern: [] },
            { name: 'Thin Dash', pattern: [3, 5] },
            { name: 'Medium Dash', pattern: [9, 8] },
            { name: 'Thick Dash', pattern: [16, 11] }
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
        
        // Add complex multi-segment polylines to show multiple round joins
        yOffset += 15;
        ctx.strokeStyle = 'darkorange';
        
        // Complex star-like pattern with round joins
        const dashPatternsComplex = [[], [7, 7], [14, 9]];
        let xStart = 80;
        
        for (let i = 0; i < dashPatternsComplex.length; i++) {
            ctx.setLineDash(dashPatternsComplex[i]);
            
            // Create a star-like pattern with multiple round joins
            const centerX = xStart + 40;
            const centerY = yOffset;
            const points = 5;
            const outerRadius = 35;
            const innerRadius = 15;
            
            ctx.beginPath();
            for (let p = 0; p < points * 2; p++) {
                const angle = (p * Math.PI) / points;
                const radius = p % 2 === 0 ? outerRadius : innerRadius;
                const x = centerX + radius * Math.cos(angle - Math.PI / 2);
                const y = centerY + radius * Math.sin(angle - Math.PI / 2);
                
                if (p === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
            
            // Label complex pattern (skip fillText for Core API compatibility)
            ctx.save();
            ctx.setLineDash([]);
            const colors = ['black', 'blue', 'green'];
            ctx.fillStyle = colors[i];
            // Note: Using colored marker dots to identify different star patterns
            ctx.fillRect(centerX - 2, centerY + 45, 4, 4);
            ctx.restore();
            
            xStart += 160;
        }
        
        // Reset line dash for any subsequent drawing
        ctx.setLineDash([]);
    }
});