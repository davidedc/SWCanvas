// Test: isPointInPath fill rule comparison
// This file will be concatenated into the main visual test suite

registerVisualTest('ispointinpath-fillrule', {
    name: 'isPointInPath evenodd vs nonzero fill rules',
    width: 500, height: 180,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 180);
        
        // Create current path with hole (outer rectangle + inner rectangle)  
        ctx.beginPath();
        // Outer rectangle
        ctx.rect(50, 50, 150, 100);
        // Inner rectangle (hole) - same winding direction
        ctx.rect(75, 75, 100, 50);
        
        // Draw the shapes for reference
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill the path with nonzero rule first (left side)
        ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.fill('nonzero');
        
        // Create offset path for evenodd visualization (right side)
        ctx.beginPath();
        ctx.rect(280, 50, 150, 100);
        ctx.rect(305, 75, 100, 50);
        
        // Draw the offset shapes for reference
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill with evenodd to show hole
        ctx.fillStyle = 'rgba(255, 200, 200, 0.3)';
        ctx.fill('evenodd');
        
        // Test points in different regions
        const testPoints = [
            // Points in outer area (between outer and inner rectangles)
            {x: 60, y: 80, label: 'Outer area'},
            {x: 180, y: 100, label: 'Outer area'}, 
            {x: 100, y: 60, label: 'Outer area'},
            {x: 150, y: 130, label: 'Outer area'},
            
            // Points in hole area (inside inner rectangle)
            {x: 100, y: 100, label: 'Hole area'},
            {x: 125, y: 90, label: 'Hole area'},
            {x: 150, y: 110, label: 'Hole area'},
            
            // Points completely outside
            {x: 30, y: 80, label: 'Outside'},
            {x: 220, y: 100, label: 'Outside'},
        ];
        
        // Test with nonzero rule (left side) - overlay dots on the shape
        testPoints.forEach((point, i) => {
            // Recreate the same path for testing
            ctx.beginPath();
            ctx.rect(50, 50, 150, 100);
            ctx.rect(75, 75, 100, 50);
            
            const isInside = ctx.isPointInPath(point.x, point.y, 'nonzero');
            
            // Draw indicator dot directly on the shape
            ctx.fillStyle = isInside ? 'blue' : 'gray';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Add black border for visibility
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Test with evenodd rule (right side) - overlay dots on the shape
        testPoints.forEach((point, i) => {
            const offsetX = point.x + 230; // Offset for right side
            
            // Recreate the offset path for testing
            ctx.beginPath();
            ctx.rect(280, 50, 150, 100);
            ctx.rect(305, 75, 100, 50);
            
            const isInside = ctx.isPointInPath(offsetX, point.y, 'evenodd');
            
            // Draw indicator dot directly on the shape
            ctx.fillStyle = isInside ? 'red' : 'gray';
            ctx.beginPath();
            ctx.arc(offsetX, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Add black border for visibility
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(offsetX, point.y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Simple visual legend at bottom
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(65, 165, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(130, 165, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(195, 165, 6, 0, Math.PI * 2);
        ctx.fill();
    }
});