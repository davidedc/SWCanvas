// Geometric stroke generation implementation
// Converts paths into filled polygons representing stroke geometry

// Generate stroke polygons for a path with given stroke properties
function generateStrokePolygons(path, strokeProps) {
    const { lineWidth, lineJoin, lineCap, miterLimit } = strokeProps;
    
    if (lineWidth <= 0) return [];
    
    // Flatten path to get line segments
    const pathPolygons = flattenPath(path);
    const strokePolygons = [];
    
    for (const polygon of pathPolygons) {
        if (polygon.length < 2) continue;
        
        const strokeParts = generateStrokeForPolygon(polygon, lineWidth, lineJoin, lineCap, miterLimit);
        strokePolygons.push(...strokeParts);
    }
    
    return strokePolygons;
}

// Generate stroke geometry for a single polygon (subpath)
function generateStrokeForPolygon(points, lineWidth, lineJoin, lineCap, miterLimit) {
    if (points.length < 2) return [];
    
    const strokeParts = [];
    const halfWidth = lineWidth / 2;
    
    // Determine if this is a closed path
    const isClosed = points.length > 2 && 
                     Math.abs(points[0].x - points[points.length - 1].x) < 1e-10 &&
                     Math.abs(points[0].y - points[points.length - 1].y) < 1e-10;
    
    // Generate segment bodies
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Skip zero-length segments
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length < 1e-10) continue;
        
        const segment = generateSegmentBody(p1, p2, halfWidth);
        segments.push({
            body: segment,
            p1, p2,
            tangent: { x: dx / length, y: dy / length },
            normal: { x: -dy / length, y: dx / length },
            length
        });
    }
    
    if (segments.length === 0) return [];
    
    // Add segment bodies to stroke parts
    for (const segment of segments) {
        strokeParts.push(segment.body);
    }
    
    // Generate joins
    for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i];
        const seg2 = segments[i + 1];
        const joinPolygons = generateJoin(seg1, seg2, lineJoin, miterLimit);
        strokeParts.push(...joinPolygons);
    }
    
    // Handle closed path joining
    if (isClosed && segments.length > 1) {
        const lastSeg = segments[segments.length - 1];
        const firstSeg = segments[0];
        const joinPolygons = generateJoin(lastSeg, firstSeg, lineJoin, miterLimit);
        strokeParts.push(...joinPolygons);
    }
    
    // Generate caps for open paths
    if (!isClosed && segments.length > 0) {
        // Start cap
        const startCaps = generateCap(segments[0].p1, segments[0].tangent, halfWidth, lineCap, true);
        if (startCaps) {
            if (Array.isArray(startCaps[0])) {
                // Multiple triangles (round cap)
                strokeParts.push(...startCaps);
            } else {
                // Single polygon (square cap)
                strokeParts.push(startCaps);
            }
        }
        
        // End cap
        const lastSeg = segments[segments.length - 1];
        const endCaps = generateCap(lastSeg.p2, lastSeg.tangent, halfWidth, lineCap, false);
        if (endCaps) {
            if (Array.isArray(endCaps[0])) {
                // Multiple triangles (round cap)
                strokeParts.push(...endCaps);
            } else {
                // Single polygon (square cap)
                strokeParts.push(endCaps);
            }
        }
    }
    
    return strokeParts;
}

// Generate rectangular body for a single segment
function generateSegmentBody(p1, p2, halfWidth) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 1e-10) return [];
    
    // Unit tangent and normal vectors
    const tx = dx / length;
    const ty = dy / length;
    const nx = -ty;  // Normal is perpendicular to tangent
    const ny = tx;
    
    // Four corners of the rectangle
    return [
        { x: p1.x + nx * halfWidth, y: p1.y + ny * halfWidth },
        { x: p2.x + nx * halfWidth, y: p2.y + ny * halfWidth },
        { x: p2.x - nx * halfWidth, y: p2.y - ny * halfWidth },
        { x: p1.x - nx * halfWidth, y: p1.y - ny * halfWidth }
    ];
}

// Generate join geometry between two segments
function generateJoin(seg1, seg2, lineJoin, miterLimit) {
    const joinPoint = seg2.p1; // Connection point
    
    // Calculate angle between segments
    const dot = seg1.tangent.x * seg2.tangent.x + seg1.tangent.y * seg2.tangent.y;
    const cross = seg1.tangent.x * seg2.tangent.y - seg1.tangent.y * seg2.tangent.x;
    
    // Check for 180-degree turn (parallel segments)
    if (Math.abs(cross) < 1e-10) {
        // Parallel segments - use bevel join
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Determine if this is a convex or concave turn
    const isConvex = cross > 0;
    
    if (!isConvex) {
        // Concave turn - no join needed (segments naturally overlap)
        return [];
    }
    
    // Convex turn - generate appropriate join
    switch (lineJoin) {
        case 'miter':
            return generateMiterJoin(seg1, seg2, joinPoint, miterLimit);
        case 'round':
            return generateRoundJoin(seg1, seg2, joinPoint);
        case 'bevel':
        default:
            return generateBevelJoin(seg1, seg2, joinPoint);
    }
}

// Generate miter join with miter limit checking
function generateMiterJoin(seg1, seg2, joinPoint, miterLimit) {
    // Calculate half width from segment body
    const halfWidth = Math.sqrt(
        Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
        Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
    ) / 2;
    
    // Get outer edge points - seg1 end (right) and seg2 start (left)  
    const outer1 = seg1.body[1]; // End right side of seg1
    const outer2 = seg2.body[0]; // Start left side of seg2
    
    // Calculate miter point (intersection of extended outer edges)
    // Extend seg1's right edge forward
    const seg1Extended = {
        x: outer1.x + seg1.tangent.x * 100, 
        y: outer1.y + seg1.tangent.y * 100
    };
    // Extend seg2's left edge backward  
    const seg2Extended = {
        x: outer2.x - seg2.tangent.x * 100,
        y: outer2.y - seg2.tangent.y * 100
    };
    
    const miterPoint = lineIntersection(outer1, seg1Extended, outer2, seg2Extended);
    
    if (!miterPoint) {
        // Fallback to bevel if no intersection
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Check miter limit
    const miterLength = Math.sqrt(
        Math.pow(miterPoint.x - joinPoint.x, 2) + 
        Math.pow(miterPoint.y - joinPoint.y, 2)
    );
    const miterRatio = miterLength / halfWidth;
    
    if (miterRatio > miterLimit) {
        // Exceeds miter limit - use bevel
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Create miter triangle
    return [
        [outer1, miterPoint, outer2]
    ];
}

// Generate bevel join
function generateBevelJoin(seg1, seg2, joinPoint) {
    const outer1 = seg1.body[1]; // Right side of seg1
    const outer2 = seg2.body[0]; // Right side of seg2
    
    return [
        [outer1, outer2, joinPoint]
    ];
}

// Generate round join
function generateRoundJoin(seg1, seg2, joinPoint) {
    const halfWidth = Math.sqrt(
        Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
        Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
    ) / 2;
    
    const outer1 = seg1.body[1]; // End right side of seg1  
    const outer2 = seg2.body[0]; // Start left side of seg2
    
    // Calculate angles
    const angle1 = Math.atan2(outer1.y - joinPoint.y, outer1.x - joinPoint.x);
    const angle2 = Math.atan2(outer2.y - joinPoint.y, outer2.x - joinPoint.x);
    
    let startAngle = angle1;
    let endAngle = angle2;
    
    // Normalize angles to go the correct way around
    let angleDiff = endAngle - startAngle;
    if (angleDiff > Math.PI) {
        angleDiff -= 2 * Math.PI;
    } else if (angleDiff < -Math.PI) {
        angleDiff += 2 * Math.PI;
    }
    
    // We want to go the convex way (positive turn)
    if (angleDiff < 0) {
        // Swap to go positive direction
        const temp = startAngle;
        startAngle = endAngle;
        endAngle = temp;
        angleDiff = -angleDiff;
    }
    
    const segments = Math.max(2, Math.ceil(angleDiff / (Math.PI / 4))); // At least 2 segments
    const angleStep = angleDiff / segments;
    
    const triangles = [];
    for (let i = 0; i < segments; i++) {
        const a1 = startAngle + i * angleStep;
        const a2 = startAngle + (i + 1) * angleStep;
        
        const p1 = {
            x: joinPoint.x + halfWidth * Math.cos(a1),
            y: joinPoint.y + halfWidth * Math.sin(a1)
        };
        const p2 = {
            x: joinPoint.x + halfWidth * Math.cos(a2),
            y: joinPoint.y + halfWidth * Math.sin(a2)
        };
        
        triangles.push([joinPoint, p1, p2]);
    }
    
    return triangles;
}

// Generate cap geometry
function generateCap(point, tangent, halfWidth, lineCap, isStart) {
    const normal = { x: -tangent.y, y: tangent.x };
    
    switch (lineCap) {
        case 'square':
            // Extend by halfWidth in tangent direction
            const extension = isStart ? 
                { x: point.x - tangent.x * halfWidth, y: point.y - tangent.y * halfWidth } :
                { x: point.x + tangent.x * halfWidth, y: point.y + tangent.y * halfWidth };
            
            return [
                { x: extension.x + normal.x * halfWidth, y: extension.y + normal.y * halfWidth },
                { x: extension.x - normal.x * halfWidth, y: extension.y - normal.y * halfWidth },
                { x: point.x - normal.x * halfWidth, y: point.y - normal.y * halfWidth },
                { x: point.x + normal.x * halfWidth, y: point.y + normal.y * halfWidth }
            ];
            
        case 'round':
            // Generate semicircle
            const startAngle = Math.atan2(normal.y, normal.x);
            const segments = Math.max(4, Math.ceil(Math.PI / (Math.PI / 4))); // At least 4 segments for semicircle
            const angleStep = Math.PI / segments;
            
            const triangles = [];
            for (let i = 0; i < segments; i++) {
                const a1 = startAngle + i * angleStep * (isStart ? 1 : -1);
                const a2 = startAngle + (i + 1) * angleStep * (isStart ? 1 : -1);
                
                const p1 = {
                    x: point.x + halfWidth * Math.cos(a1),
                    y: point.y + halfWidth * Math.sin(a1)
                };
                const p2 = {
                    x: point.x + halfWidth * Math.cos(a2),
                    y: point.y + halfWidth * Math.sin(a2)
                };
                
                triangles.push([point, p1, p2]);
            }
            
            // Return multiple triangles as separate polygons (consistent with joins)
            return triangles;
            
        case 'butt':
        default:
            // No cap - stroke ends flush
            return null;
    }
}

// Calculate intersection of two lines defined by points
function lineIntersection(p1, p2, p3, p4) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    
    if (Math.abs(denom) < 1e-10) {
        return null; // Lines are parallel
    }
    
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    
    return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
    };
}