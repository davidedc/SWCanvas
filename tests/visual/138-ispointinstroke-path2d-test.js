// Test: isPointInStroke with Path2D objects
// This file will be concatenated into the main visual test suite

// Test 138
registerVisualTest('ispointinstroke-path2d', {
    name: 'isPointInStroke with Path2D objects - external path stroke testing',
    width: 500, height: 400,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 500, 400);
        
        // Test 1: Rectangle stroke with Path2D
        const rectPath = createCompatiblePath2D(ctx);
        rectPath.rect(50, 50, 100, 80);
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 8;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(rectPath);
        
        // Test points for rectangle stroke
        const rectTestPoints = [
            {x: 46, y: 90},   // On left stroke edge
            {x: 154, y: 90},  // On right stroke edge
            {x: 100, y: 46},  // On top stroke edge
            {x: 100, y: 134}, // On bottom stroke edge
            {x: 100, y: 90},  // Inside rectangle (not in stroke)
            {x: 30, y: 90},   // Outside stroke entirely
            {x: 170, y: 90},  // Outside stroke entirely
        ];
        
        rectTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(rectPath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 2: Line path with caps
        const linePath = createCompatiblePath2D(ctx);
        linePath.moveTo(250, 70);
        linePath.lineTo(400, 70);
        
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(linePath);
        
        // Test points for line stroke with round caps
        const lineTestPoints = [
            {x: 244, y: 70},  // Within round cap (left)
            {x: 406, y: 70},  // Within round cap (right)
            {x: 325, y: 70},  // On line stroke center
            {x: 325, y: 64},  // On line stroke edge
            {x: 325, y: 60},  // Outside line stroke
            {x: 200, y: 70},  // Outside stroke entirely
        ];
        
        lineTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(linePath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 3: Complex path with joins
        const complexPath = createCompatiblePath2D(ctx);
        complexPath.moveTo(80, 150);
        complexPath.lineTo(130, 180);
        complexPath.lineTo(180, 150);
        complexPath.lineTo(220, 190);
        
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 10;
        ctx.lineJoin = 'miter';
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(complexPath);
        
        // Test points for complex path with miter joins
        const complexTestPoints = [
            {x: 105, y: 165}, // On first line segment
            {x: 130, y: 175}, // At miter join
            {x: 155, y: 165}, // On second line segment
            {x: 200, y: 170}, // On third line segment
            {x: 130, y: 160}, // Inside the angle (not in stroke)
            {x: 60, y: 160},  // Outside stroke entirely
        ];
        
        complexTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(complexPath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 4: Circle stroke with Path2D
        const circlePath = createCompatiblePath2D(ctx);
        circlePath.arc(350, 180, 35, 0, Math.PI * 2);
        
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 6;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(circlePath);
        
        // Test points for circle stroke
        const circleTestPoints = [
            {x: 385, y: 180}, // On right edge of stroke
            {x: 315, y: 180}, // On left edge of stroke
            {x: 350, y: 145}, // On top edge of stroke
            {x: 350, y: 215}, // On bottom edge of stroke
            {x: 350, y: 180}, // Center of circle (not in stroke)
            {x: 400, y: 180}, // Outside stroke entirely
        ];
        
        circleTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(circlePath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 5: Dashed line stroke with Path2D
        const dashedPath = createCompatiblePath2D(ctx);
        dashedPath.moveTo(50, 280);
        dashedPath.lineTo(250, 280);
        
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 8;
        ctx.setLineDash([20, 15]); // 20px dash, 15px gap
        ctx.lineDashOffset = 0;
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(dashedPath);
        
        // Test points for dashed line stroke
        const dashedTestPoints = [
            {x: 60, y: 280},  // In first dash segment
            {x: 85, y: 280},  // In first gap
            {x: 110, y: 280}, // In second dash segment
            {x: 135, y: 280}, // In second gap
            {x: 160, y: 280}, // In third dash segment
            {x: 180, y: 280}, // In third gap
        ];
        
        dashedTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(dashedPath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 6: Quadratic curve stroke with Path2D
        const curvePath = createCompatiblePath2D(ctx);
        curvePath.moveTo(300, 250);
        curvePath.quadraticCurveTo(400, 300, 450, 250);
        
        ctx.strokeStyle = 'darkblue';
        ctx.lineWidth = 6;
        ctx.setLineDash([]); // Reset dashing
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(curvePath);
        
        // Test points for curved stroke
        const curveTestPoints = [
            {x: 320, y: 260}, // On curve stroke
            {x: 375, y: 285}, // On curve stroke
            {x: 430, y: 260}, // On curve stroke
            {x: 375, y: 250}, // Inside curve area (not on stroke)
            {x: 375, y: 320}, // Outside curve entirely
            {x: 280, y: 250}, // Outside curve entirely
        ];
        
        curveTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(curvePath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
        
        // Test 7: Zero-width stroke with Path2D
        const zeroWidthPath = createCompatiblePath2D(ctx);
        zeroWidthPath.moveTo(50, 350);
        zeroWidthPath.lineTo(200, 350);
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0; // Zero-width stroke
        
        // Use Path2D object directly for rendering (works in both environments)
        ctx.stroke(zeroWidthPath);
        
        // Test points for zero-width stroke
        const zeroWidthTestPoints = [
            {x: 125, y: 350}, // On the path line
            {x: 125, y: 351}, // Off the path line
            {x: 125, y: 349}, // Off the path line
            {x: 30, y: 350},  // Outside path entirely
        ];
        
        zeroWidthTestPoints.forEach(point => {
            const isInStroke = ctx.isPointInStroke(zeroWidthPath, point.x, point.y);
            ctx.fillStyle = isInStroke ? 'red' : 'blue';
            ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
        });
    }
});