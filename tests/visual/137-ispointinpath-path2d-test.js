// Test: isPointInPath with Path2D objects
// This file will be concatenated into the main visual test suite

// Test 137
registerVisualTest('ispointinpath-path2d', {
    name: 'isPointInPath with Path2D objects - external path testing',
    width: 500, height: 400,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 400);
        
        // Test 1: Rectangle Path2D
        const rectPath = createCompatiblePath2D(ctx);
        rectPath.rect(50, 50, 100, 80);
        
        ctx.fillStyle = 'lightblue';
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.fill(rectPath);
        ctx.stroke(rectPath);
        
        // Test points for rectangle path
        const rectTestPoints = [
            {x: 100, y: 90},  // Inside rectangle
            {x: 30, y: 90},   // Outside rectangle (left)
            {x: 170, y: 90},  // Outside rectangle (right)
            {x: 100, y: 30},  // Outside rectangle (top)
            {x: 100, y: 150}, // Outside rectangle (bottom)
            {x: 50, y: 50},   // On rectangle edge
        ];
        
        rectTestPoints.forEach(point => {
            const isInPath = ctx.isPointInPath(rectPath, point.x, point.y);
            ctx.fillStyle = isInPath ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 2: Circle Path2D
        const circlePath = createCompatiblePath2D(ctx);
        circlePath.arc(250, 90, 40, 0, Math.PI * 2);
        
        ctx.fillStyle = 'lightgreen';
        ctx.strokeStyle = 'darkgreen';
        ctx.lineWidth = 2;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.fill(circlePath);
        ctx.stroke(circlePath);
        
        // Test points for circle path
        const circleTestPoints = [
            {x: 250, y: 90},  // Center of circle
            {x: 280, y: 90},  // Inside circle (right)
            {x: 220, y: 90},  // Inside circle (left)
            {x: 250, y: 60},  // Inside circle (top)
            {x: 250, y: 120}, // Inside circle (bottom)
            {x: 300, y: 90},  // Outside circle
            {x: 200, y: 90},  // Outside circle
        ];
        
        circleTestPoints.forEach(point => {
            const isInPath = ctx.isPointInPath(circlePath, point.x, point.y);
            ctx.fillStyle = isInPath ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 3: Complex Path2D with curves
        const complexPath = createCompatiblePath2D(ctx);
        complexPath.moveTo(400, 50);
        complexPath.lineTo(450, 100);
        complexPath.quadraticCurveTo(460, 130, 430, 150);
        complexPath.lineTo(370, 130);
        complexPath.closePath();
        
        ctx.fillStyle = 'lightyellow';
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.fill(complexPath);
        ctx.stroke(complexPath);
        
        // Test points for complex path
        const complexTestPoints = [
            {x: 420, y: 100}, // Inside complex path
            {x: 440, y: 120}, // Inside complex path
            {x: 350, y: 100}, // Outside complex path (left)
            {x: 470, y: 100}, // Outside complex path (right)
            {x: 420, y: 160}, // Outside complex path (below)
            {x: 410, y: 80},  // Inside complex path
        ];
        
        complexTestPoints.forEach(point => {
            const isInPath = ctx.isPointInPath(complexPath, point.x, point.y);
            ctx.fillStyle = isInPath ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 4: Path2D with hole (evenodd fill rule)
        const pathWithHole = createCompatiblePath2D(ctx);
        pathWithHole.rect(50, 220, 120, 100);  // Outer rectangle
        pathWithHole.rect(80, 250, 60, 40);    // Inner rectangle (hole)
        
        ctx.fillStyle = 'lightcoral';
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 2;
        
        // Fill with evenodd rule to create hole using Path2D object
        ctx.fill(pathWithHole, 'evenodd');
        ctx.stroke(pathWithHole);
        
        // Test points for path with hole using evenodd rule
        const holeTestPoints = [
            {x: 110, y: 270}, // In the hole (should be false with evenodd)
            {x: 60, y: 240},  // In outer part (should be true)
            {x: 160, y: 280}, // In outer part (should be true)
            {x: 30, y: 270},  // Outside entirely (should be false)
            {x: 190, y: 270}, // Outside entirely (should be false)
        ];
        
        holeTestPoints.forEach(point => {
            const isInPath = ctx.isPointInPath(pathWithHole, point.x, point.y, 'evenodd');
            ctx.fillStyle = isInPath ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 5: Path2D with nonzero fill rule (same path as above)
        const pathNonzero = createCompatiblePath2D(ctx);
        pathNonzero.rect(250, 220, 120, 100);  // Outer rectangle
        pathNonzero.rect(280, 250, 60, 40);    // Inner rectangle
        
        ctx.fillStyle = 'lightpink';
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 2;
        
        // Fill with nonzero rule using Path2D object
        ctx.fill(pathNonzero, 'nonzero');
        ctx.stroke(pathNonzero);
        
        // Test points for path using nonzero rule
        const nonzeroTestPoints = [
            {x: 310, y: 270}, // In the "hole" area (should be true with nonzero)
            {x: 260, y: 240}, // In outer part (should be true)
            {x: 360, y: 280}, // In outer part (should be true)
            {x: 230, y: 270}, // Outside entirely (should be false)
            {x: 390, y: 270}, // Outside entirely (should be false)
        ];
        
        nonzeroTestPoints.forEach(point => {
            const isInPath = ctx.isPointInPath(pathNonzero, point.x, point.y, 'nonzero');
            ctx.fillStyle = isInPath ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
    }
});