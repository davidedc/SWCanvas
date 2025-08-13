// Path flattening utilities for converting curves to line segments
// Implements deterministic curve flattening with 0.25px tolerance

// Flatten a Path2D into a list of polygons (each polygon is an array of {x, y} points)
function flattenPath(path2d) {
    const polygons = [];
    let currentPoly = [];
    let currentPoint = {x: 0, y: 0};
    let subpathStart = {x: 0, y: 0};
    
    
    for (const cmd of path2d.commands) {
        switch (cmd.type) {
            case 'moveTo':
                // Start new subpath
                if (currentPoly.length > 0) {
                    polygons.push(currentPoly);
                }
                currentPoly = [];
                currentPoint = {x: cmd.x, y: cmd.y};
                subpathStart = {x: cmd.x, y: cmd.y};
                currentPoly.push(currentPoint);
                break;
                
            case 'lineTo':
                currentPoint = {x: cmd.x, y: cmd.y};
                currentPoly.push(currentPoint);
                break;
                
            case 'closePath':
                if (currentPoly.length > 0) {
                    // Close the polygon by adding the start point if not already there
                    const last = currentPoly[currentPoly.length - 1];
                    if (last.x !== subpathStart.x || last.y !== subpathStart.y) {
                        currentPoly.push({x: subpathStart.x, y: subpathStart.y});
                    }
                    polygons.push(currentPoly);
                    currentPoly = [];
                }
                break;
                
            case 'quadraticCurveTo':
                const quadPoints = flattenQuadraticBezier(
                    currentPoint.x, currentPoint.y,
                    cmd.cpx, cmd.cpy,
                    cmd.x, cmd.y
                );
                // Add all points except the first (which is currentPoint)
                for (let i = 1; i < quadPoints.length; i++) {
                    currentPoly.push(quadPoints[i]);
                }
                currentPoint = {x: cmd.x, y: cmd.y};
                break;
                
            case 'bezierCurveTo':
                const cubicPoints = flattenCubicBezier(
                    currentPoint.x, currentPoint.y,
                    cmd.cp1x, cmd.cp1y,
                    cmd.cp2x, cmd.cp2y,
                    cmd.x, cmd.y
                );
                // Add all points except the first (which is currentPoint)
                for (let i = 1; i < cubicPoints.length; i++) {
                    currentPoly.push(cubicPoints[i]);
                }
                currentPoint = {x: cmd.x, y: cmd.y};
                break;
                
            case 'arc':
                const arcPoints = flattenArc(
                    cmd.x, cmd.y, cmd.radius,
                    cmd.startAngle, cmd.endAngle,
                    cmd.counterclockwise
                );
                if (arcPoints.length > 0) {
                    const arcStart = arcPoints[0];
                    
                    // If this is the first command in the subpath, start at arc start
                    if (currentPoly.length === 0) {
                        currentPoly.push(arcStart);
                        currentPoint = arcStart;
                        subpathStart = arcStart;
                    } else {
                        // Move to arc start if we're not already there
                        const distance = Math.sqrt((currentPoint.x - arcStart.x) ** 2 + (currentPoint.y - arcStart.y) ** 2);
                        if (distance > 0.01) {  // Add line to arc start if not already there
                            currentPoly.push(arcStart);
                        }
                    }
                    
                    // Add all arc points except the first
                    for (let i = 1; i < arcPoints.length; i++) {
                        currentPoly.push(arcPoints[i]);
                    }
                    currentPoint = arcPoints[arcPoints.length - 1];
                }
                break;
                
            case 'ellipse':
                const ellipsePoints = flattenEllipse(
                    cmd.x, cmd.y, cmd.radiusX, cmd.radiusY, cmd.rotation,
                    cmd.startAngle, cmd.endAngle, cmd.counterclockwise
                );
                if (ellipsePoints.length > 0) {
                    // Move to ellipse start if we're not already there
                    const ellipseStart = ellipsePoints[0];
                    const distance = Math.sqrt((currentPoint.x - ellipseStart.x) ** 2 + (currentPoint.y - ellipseStart.y) ** 2);
                    if (distance > 0.01) {  // Add line to ellipse start if not already there
                        currentPoly.push(ellipseStart);
                    }
                    // Add all ellipse points except the first
                    for (let i = 1; i < ellipsePoints.length; i++) {
                        currentPoly.push(ellipsePoints[i]);
                    }
                    currentPoint = ellipsePoints[ellipsePoints.length - 1];
                }
                break;
        }
    }
    
    // Add final polygon if exists
    if (currentPoly.length > 0) {
        polygons.push(currentPoly);
    }
    
    return polygons;
}

// Flatten quadratic Bézier curve with 0.25px tolerance
function flattenQuadraticBezier(x0, y0, x1, y1, x2, y2) {
    const points = [{x: x0, y: y0}];
    flattenQuadraticBezierRecursive(x0, y0, x1, y1, x2, y2, points, 0.25);
    return points;
}

function flattenQuadraticBezierRecursive(x0, y0, x1, y1, x2, y2, points, tolerance) {
    // Check if curve is flat enough
    const dx = x2 - x0;
    const dy = y2 - y0;
    const d = Math.abs((x1 - x0) * dy - (y1 - y0) * dx) / Math.sqrt(dx * dx + dy * dy);
    
    if (d <= tolerance || points.length > 1000) { // Safety limit
        points.push({x: x2, y: y2});
        return;
    }
    
    // Split curve at t=0.5
    const x01 = (x0 + x1) / 2;
    const y01 = (y0 + y1) / 2;
    const x12 = (x1 + x2) / 2;
    const y12 = (y1 + y2) / 2;
    const x012 = (x01 + x12) / 2;
    const y012 = (y01 + y12) / 2;
    
    // Recursively flatten both halves
    flattenQuadraticBezierRecursive(x0, y0, x01, y01, x012, y012, points, tolerance);
    flattenQuadraticBezierRecursive(x012, y012, x12, y12, x2, y2, points, tolerance);
}

// Flatten cubic Bézier curve with 0.25px tolerance  
function flattenCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
    const points = [{x: x0, y: y0}];
    flattenCubicBezierRecursive(x0, y0, x1, y1, x2, y2, x3, y3, points, 0.25);
    return points;
}

function flattenCubicBezierRecursive(x0, y0, x1, y1, x2, y2, x3, y3, points, tolerance) {
    // Simplified flatness test - check distance from control points to line
    const dx = x3 - x0;
    const dy = y3 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) {
        points.push({x: x3, y: y3});
        return;
    }
    
    const d1 = Math.abs((x1 - x0) * dy - (y1 - y0) * dx) / len;
    const d2 = Math.abs((x2 - x0) * dy - (y2 - y0) * dx) / len;
    
    if ((d1 + d2) <= tolerance || points.length > 1000) { // Safety limit
        points.push({x: x3, y: y3});
        return;
    }
    
    // Split curve at t=0.5 using de Casteljau's algorithm
    const x01 = (x0 + x1) / 2;
    const y01 = (y0 + y1) / 2;
    const x12 = (x1 + x2) / 2;
    const y12 = (y1 + y2) / 2;
    const x23 = (x2 + x3) / 2;
    const y23 = (y2 + y3) / 2;
    
    const x012 = (x01 + x12) / 2;
    const y012 = (y01 + y12) / 2;
    const x123 = (x12 + x23) / 2;
    const y123 = (y12 + y23) / 2;
    
    const x0123 = (x012 + x123) / 2;
    const y0123 = (y012 + y123) / 2;
    
    // Recursively flatten both halves
    flattenCubicBezierRecursive(x0, y0, x01, y01, x012, y012, x0123, y0123, points, tolerance);
    flattenCubicBezierRecursive(x0123, y0123, x123, y123, x23, y23, x3, y3, points, tolerance);
}

// Flatten arc to line segments
function flattenArc(cx, cy, radius, startAngle, endAngle, counterclockwise) {
    if (radius <= 0) return [];
    
    // Normalize angles
    let start = startAngle;
    let end = endAngle;
    
    if (!counterclockwise && end < start) {
        end += 2 * Math.PI;
    } else if (counterclockwise && start < end) {
        start += 2 * Math.PI;
    }
    
    const totalAngle = Math.abs(end - start);
    
    // Calculate number of segments needed for 0.25px tolerance
    // Use the formula: segments = ceil(totalAngle / (2 * acos(1 - tolerance/radius)))
    const tolerance = 0.25;
    const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - tolerance / radius));
    const segments = Math.max(1, Math.ceil(totalAngle / maxAngleStep));
    
    const points = [];
    const angleStep = (end - start) / segments;
    
    for (let i = 0; i <= segments; i++) {
        const angle = start + i * angleStep;
        points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        });
    }
    
    return points;
}

// Flatten ellipse to line segments
function flattenEllipse(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
    if (radiusX <= 0 || radiusY <= 0) return [];
    
    // Normalize angles
    let start = startAngle;
    let end = endAngle;
    
    if (!counterclockwise && end < start) {
        end += 2 * Math.PI;
    } else if (counterclockwise && start < end) {
        start += 2 * Math.PI;
    }
    
    const totalAngle = Math.abs(end - start);
    
    // Calculate number of segments - use smaller radius for tolerance calculation
    const minRadius = Math.min(radiusX, radiusY);
    const tolerance = 0.25;
    const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - tolerance / minRadius));
    const segments = Math.max(1, Math.ceil(totalAngle / maxAngleStep));
    
    const points = [];
    const angleStep = (end - start) / segments;
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);
    
    for (let i = 0; i <= segments; i++) {
        const angle = start + i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Unrotated ellipse point
        const x = radiusX * cos;
        const y = radiusY * sin;
        
        // Apply rotation and translation
        points.push({
            x: cx + x * cosRot - y * sinRot,
            y: cy + x * sinRot + y * cosRot
        });
    }
    
    return points;
}