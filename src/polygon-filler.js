// Polygon filling implementation with nonzero and evenodd winding rules
// Uses scanline algorithm for efficient aliased filling

// Fill polygons using scanline algorithm with specified winding rule
function fillPolygons(surface, polygons, color, fillRule, transform) {
    if (polygons.length === 0) return;
    
    // Transform all polygon vertices
    const transformedPolygons = polygons.map(poly => 
        poly.map(point => transform.transformPoint(point))
    );
    
    // Find bounding box
    let minY = Infinity, maxY = -Infinity;
    for (const poly of transformedPolygons) {
        for (const point of poly) {
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
    }
    
    // Clamp to surface bounds
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(surface.height - 1, Math.ceil(maxY));
    
    // Process each scanline
    for (let y = minY; y <= maxY; y++) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of transformedPolygons) {
            findPolygonIntersections(poly, y + 0.5, intersections); // Use pixel center
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        fillScanlineSpans(surface, y, intersections, color, fillRule);
    }
}

// Find intersections between a polygon and a horizontal scanline
function findPolygonIntersections(polygon, y, intersections) {
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        // Skip horizontal edges
        if (Math.abs(p1.y - p2.y) < 1e-10) continue;
        
        // Check if scanline crosses this edge
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        
        if (y >= minY && y < maxY) { // Note: < maxY to avoid double-counting vertices
            // Calculate intersection point
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            // Determine winding direction
            const winding = p2.y > p1.y ? 1 : -1;
            
            intersections.push({x: x, winding: winding});
        }
    }
}

// Fill spans on a scanline based on winding rule
function fillScanlineSpans(surface, y, intersections, color, fillRule) {
    if (intersections.length === 0) return;
    
    let windingNumber = 0;
    let inside = false;
    
    for (let i = 0; i < intersections.length; i++) {
        const intersection = intersections[i];
        const nextIntersection = intersections[i + 1];
        
        // Update winding number
        windingNumber += intersection.winding;
        
        // Determine if we're inside based on fill rule
        const wasInside = inside;
        if (fillRule === 'evenodd') {
            inside = (windingNumber % 2) !== 0;
        } else { // nonzero
            inside = windingNumber !== 0;
        }
        
        // Fill span if we're inside
        if (inside && nextIntersection) {
            const startX = Math.max(0, Math.ceil(intersection.x));
            const endX = Math.min(surface.width - 1, Math.floor(nextIntersection.x));
            
            for (let x = startX; x <= endX; x++) {
                const offset = y * surface.stride + x * 4;
                
                // Simple copy for now (will be enhanced with proper blending later)
                surface.data[offset] = color[0];     // R
                surface.data[offset + 1] = color[1]; // G  
                surface.data[offset + 2] = color[2]; // B
                surface.data[offset + 3] = color[3]; // A
            }
        }
    }
}

// Test if a point is inside polygons using winding rule
function pointInPolygons(x, y, polygons, fillRule) {
    let windingNumber = 0;
    
    for (const polygon of polygons) {
        windingNumber += pointInPolygon(x, y, polygon);
    }
    
    if (fillRule === 'evenodd') {
        return (windingNumber % 2) !== 0;
    } else { // nonzero
        return windingNumber !== 0;
    }
}

// Calculate winding number for a point relative to a polygon
function pointInPolygon(x, y, polygon) {
    let winding = 0;
    
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        if (p1.y <= y) {
            if (p2.y > y) { // Upward crossing
                if (isLeft(p1, p2, {x, y}) > 0) {
                    winding++;
                }
            }
        } else {
            if (p2.y <= y) { // Downward crossing
                if (isLeft(p1, p2, {x, y}) < 0) {
                    winding--;
                }
            }
        }
    }
    
    return winding;
}

// Test if point P2 is left of the line P0P1
function isLeft(P0, P1, P2) {
    return ((P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y));
}