// Test: isPointInPath basic functionality
// This file will be concatenated into the main visual test suite

registerVisualTest('ispointinpath-basic', {
    name: 'isPointInPath basic point testing with visual indicators',
    width: 400, height: 300,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        // Create test shapes
        // Shape 1: Rectangle
        ctx.fillStyle = 'lightblue';
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(50, 50, 100, 80);
        ctx.fill();
        ctx.stroke();
        
        // Shape 2: Circle
        ctx.fillStyle = 'lightgreen';
        ctx.strokeStyle = 'darkgreen';
        ctx.beginPath();
        ctx.arc(250, 90, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Shape 3: Complex path with curves
        ctx.fillStyle = 'lightcoral';
        ctx.strokeStyle = 'darkred';
        ctx.beginPath();
        ctx.moveTo(50, 180);
        ctx.lineTo(120, 160);
        ctx.quadraticCurveTo(150, 180, 120, 220);
        ctx.lineTo(80, 240);
        ctx.bezierCurveTo(60, 250, 40, 230, 50, 200);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Shape 4: Triangle
        ctx.fillStyle = 'lightyellow';
        ctx.strokeStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(250, 180);
        ctx.lineTo(320, 220);
        ctx.lineTo(280, 260);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Test points and draw indicators - comprehensive coverage showing both inside and outside points
        const testPoints = [
            // Rectangle tests (rect: 50,50,100,80 -> bounds x:50-150, y:50-130)
            // Edge points (all edges inclusive)
            {x: 50, y: 60, shape: 'rect', expected: true},     // Left edge (top)
            {x: 50, y: 90, shape: 'rect', expected: true},     // Left edge (middle)
            {x: 50, y: 120, shape: 'rect', expected: true},    // Left edge (bottom)
            {x: 150, y: 60, shape: 'rect', expected: true},    // Right edge (top)
            {x: 150, y: 90, shape: 'rect', expected: true},    // Right edge (middle)
            {x: 150, y: 120, shape: 'rect', expected: true},   // Right edge (bottom)
            {x: 70, y: 50, shape: 'rect', expected: true},     // Top edge (left)
            {x: 100, y: 50, shape: 'rect', expected: true},    // Top edge (center)
            {x: 130, y: 50, shape: 'rect', expected: true},    // Top edge (right)
            {x: 70, y: 130, shape: 'rect', expected: true},    // Bottom edge (left)
            {x: 100, y: 130, shape: 'rect', expected: true},   // Bottom edge (center)
            {x: 130, y: 130, shape: 'rect', expected: true},   // Bottom edge (right)
            // Interior points
            {x: 100, y: 90, shape: 'rect', expected: true},    // Center
            {x: 75, y: 70, shape: 'rect', expected: true},     // Upper-left interior
            {x: 125, y: 110, shape: 'rect', expected: true},   // Lower-right interior
            // Outside points
            {x: 30, y: 90, shape: 'rect', expected: false},    // Outside left
            {x: 170, y: 90, shape: 'rect', expected: false},   // Outside right
            {x: 100, y: 30, shape: 'rect', expected: false},   // Outside top
            {x: 100, y: 150, shape: 'rect', expected: false},  // Outside bottom
            
            // Circle tests (center: 250,90, radius: 40)
            // Center and interior
            {x: 250, y: 90, shape: 'circle', expected: true},  // Center
            {x: 240, y: 90, shape: 'circle', expected: true},  // Inside (left)
            {x: 260, y: 90, shape: 'circle', expected: true},  // Inside (right)
            {x: 250, y: 80, shape: 'circle', expected: true},  // Inside (top)
            {x: 250, y: 100, shape: 'circle', expected: true}, // Inside (bottom)
            {x: 235, y: 75, shape: 'circle', expected: true},  // Inside (upper-left)
            {x: 265, y: 105, shape: 'circle', expected: true}, // Inside (lower-right)
            // Near edge points (just inside circle edge)
            {x: 215, y: 90, shape: 'circle', expected: true},  // Near left edge
            {x: 285, y: 90, shape: 'circle', expected: true},  // Near right edge
            {x: 250, y: 55, shape: 'circle', expected: true},  // Near top edge
            {x: 250, y: 125, shape: 'circle', expected: true}, // Near bottom edge
            // Outside points
            {x: 200, y: 90, shape: 'circle', expected: false}, // Outside left
            {x: 300, y: 90, shape: 'circle', expected: false}, // Outside right
            {x: 250, y: 40, shape: 'circle', expected: false}, // Outside top
            {x: 250, y: 140, shape: 'circle', expected: false}, // Outside bottom
            
            // Complex path tests - irregular shape with curves
            // Interior points in different regions
            {x: 70, y: 190, shape: 'complex', expected: true}, // Left region
            {x: 85, y: 200, shape: 'complex', expected: true}, // Central region
            {x: 100, y: 185, shape: 'complex', expected: true}, // Upper region
            {x: 90, y: 215, shape: 'complex', expected: true}, // Lower region
            {x: 110, y: 200, shape: 'complex', expected: true}, // Right region
            // Edge points
            {x: 50, y: 190, shape: 'complex', expected: true}, // Left edge (approximate)
            {x: 120, y: 170, shape: 'complex', expected: true}, // Top edge (approximate)
            // Outside points
            {x: 30, y: 200, shape: 'complex', expected: false}, // Outside left
            {x: 140, y: 190, shape: 'complex', expected: false}, // Outside right
            {x: 85, y: 150, shape: 'complex', expected: false}, // Outside top
            {x: 85, y: 260, shape: 'complex', expected: false}, // Outside bottom
            
            // Triangle tests (vertices: 250,180 -> 320,220 -> 280,260)
            // Interior points
            {x: 280, y: 200, shape: 'triangle', expected: true}, // Upper interior
            {x: 285, y: 220, shape: 'triangle', expected: true}, // Central interior
            {x: 290, y: 240, shape: 'triangle', expected: true}, // Lower interior
            {x: 270, y: 210, shape: 'triangle', expected: true}, // Left interior
            {x: 300, y: 230, shape: 'triangle', expected: true}, // Right interior
            // Edge points (approximate)
            {x: 285, y: 190, shape: 'triangle', expected: true}, // Top edge
            {x: 265, y: 220, shape: 'triangle', expected: true}, // Left edge
            {x: 300, y: 240, shape: 'triangle', expected: true}, // Right edge
            // Outside points
            {x: 240, y: 200, shape: 'triangle', expected: false}, // Outside left
            {x: 330, y: 220, shape: 'triangle', expected: false}, // Outside right
            {x: 280, y: 170, shape: 'triangle', expected: false}, // Outside top
            {x: 280, y: 270, shape: 'triangle', expected: false}, // Outside bottom
        ];
        
        // Test points using current path (since we can't rely on Path2D constructor in all browsers)
        // We'll test by setting the current path and using isPointInPath(x, y)
        
        // Test each point and collect results first (separate testing from drawing)
        const results = testPoints.map(point => {
            // Set up current path based on shape for testing
            ctx.beginPath();
            switch(point.shape) {
                case 'rect': 
                    ctx.rect(50, 50, 100, 80);
                    break;
                case 'circle':
                    ctx.arc(250, 90, 40, 0, Math.PI * 2);
                    break;
                case 'complex':
                    ctx.moveTo(50, 180);
                    ctx.lineTo(120, 160);
                    ctx.quadraticCurveTo(150, 180, 120, 220);
                    ctx.lineTo(80, 240);
                    ctx.bezierCurveTo(60, 250, 40, 230, 50, 200);
                    ctx.closePath();
                    break;
                case 'triangle':
                    ctx.moveTo(250, 180);
                    ctx.lineTo(320, 220);
                    ctx.lineTo(280, 260);
                    ctx.closePath();
                    break;
            }
            
            const isInside = ctx.isPointInPath(point.x, point.y);
            const isCorrect = isInside === point.expected;
            
            return {
                x: point.x,
                y: point.y,
                isCorrect: isCorrect,
                expected: point.expected,
                actual: isInside
            };
        });
        
        // Now draw all the indicators without interfering with paths
        // Color encoding: GREEN = inside path (true), RED = outside path (false)
        results.forEach(result => {
            // Draw point indicator circle
            ctx.beginPath();
            ctx.arc(result.x, result.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = result.actual ? 'green' : 'red'; // Green = inside, Red = outside
            ctx.fill();
            
            // Draw black border for visibility
            ctx.beginPath();
            ctx.arc(result.x, result.y, 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw small cross for additional indicator
            ctx.beginPath();
            ctx.moveTo(result.x - 2, result.y);
            ctx.lineTo(result.x + 2, result.y);
            ctx.moveTo(result.x, result.y - 2);
            ctx.lineTo(result.x, result.y + 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        
        // Add legend showing color encoding
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(330, 65, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(330, 85, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Legend: Green circle = inside path, Red circle = outside path
    }
});