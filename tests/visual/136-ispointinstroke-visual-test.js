// Test: isPointInStroke Visual Test
// This file will be concatenated into the main visual test suite

// Test 136
registerVisualTest('ispointinstroke-visual', {
    name: 'isPointInStroke visual verification - stroke hit testing',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test 1: Basic rectangular stroke with different widths
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.rect(50, 50, 100, 60);
        ctx.stroke();
        
        // Test points around the rectangular stroke
        const testPoints1 = [
            {x: 46, y: 80},   // On left edge of stroke
            {x: 154, y: 80},  // On right edge of stroke  
            {x: 100, y: 46},  // On top edge of stroke
            {x: 100, y: 114}, // On bottom edge of stroke
            {x: 100, y: 80},  // Inside path, not in stroke
            {x: 30, y: 80},   // Outside stroke
        ];
        
        // Draw test points for rectangular stroke
        testPoints1.forEach(point => {
            const isInStroke = ctx.isPointInStroke(point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        
        // Test 2: Line with different caps
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(220, 80);
        ctx.lineTo(320, 80);
        ctx.stroke();
        
        // Test points for line with round caps
        const testPoints2 = [
            {x: 214, y: 80}, // Within round cap
            {x: 326, y: 80}, // Within round cap
            {x: 270, y: 74}, // On line stroke
            {x: 270, y: 70}, // Outside line stroke
        ];
        
        // Draw test points for line stroke
        testPoints2.forEach(point => {
            const isInStroke = ctx.isPointInStroke(point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        
        // Test 3: Dashed line stroke
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 6;
        ctx.setLineDash([15, 10]); // 15px dash, 10px gap
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.moveTo(50, 150);
        ctx.lineTo(200, 150);
        ctx.stroke();
        
        // Test points for dashed line
        const testPoints3 = [
            {x: 60, y: 150}, // In first dash segment
            {x: 75, y: 150}, // In first gap
            {x: 90, y: 150}, // In second dash segment
            {x: 105, y: 150}, // In second gap
        ];
        
        // Draw test points for dashed stroke
        testPoints3.forEach(point => {
            const isInStroke = ctx.isPointInStroke(point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        
        // Test 4: Path with joins
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'miter';
        ctx.setLineDash([]); // Remove dashing
        ctx.beginPath();
        ctx.moveTo(250, 180);
        ctx.lineTo(300, 200);
        ctx.lineTo(350, 180);
        ctx.stroke();
        
        // Test points around the join
        const testPoints4 = [
            {x: 300, y: 196}, // At miter join
            {x: 300, y: 190}, // Inside the angle
            {x: 275, y: 190}, // On left line stroke
            {x: 325, y: 190}, // On right line stroke
        ];
        
        // Draw test points for join stroke
        testPoints4.forEach(point => {
            const isInStroke = ctx.isPointInStroke(point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        
        // Test 5: External path stroke (skip external path test in browser due to Path2D compatibility)
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 5;
        
        // Draw circle stroke using current path method (compatible with both environments)
        ctx.beginPath();
        ctx.arc(100, 230, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        // Test points for circle stroke using current path (2-argument form)
        const testPoints5 = [
            {x: 130, y: 230}, // On circle stroke (right)
            {x: 70, y: 230},  // On circle stroke (left)
            {x: 100, y: 200}, // On circle stroke (top)
            {x: 100, y: 230}, // Inside circle
            {x: 150, y: 230}, // Outside circle
        ];
        
        // Draw test points for circle stroke using 2-argument form
        testPoints5.forEach(point => {
            const isInStroke = ctx.isPointInStroke(point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
    }
});