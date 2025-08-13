// Polygon filling implementation with nonzero and evenodd winding rules
// Uses scanline algorithm for efficient aliased filling

// Bit manipulation helpers for clipMask (duplicated from context2d.js for standalone use)
function getBit(buffer, pixelIndex) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
}

/**
 * Check if a pixel is clipped by the stencil buffer
 * 
 * @param {Uint8Array} clipMask - 1-bit stencil buffer (null if no clipping)
 * @param {number} x - Pixel x coordinate
 * @param {number} y - Pixel y coordinate  
 * @param {number} width - Surface width for indexing
 * @returns {boolean} True if pixel should be clipped (not rendered)
 */
function isPixelClipped(clipMask, x, y, width) {
    if (!clipMask) return false; // No clipping active
    const pixelIndex = y * width + x;
    return getBit(clipMask, pixelIndex) === 0; // 0 means clipped out
}

/**
 * Fill polygons using scanline algorithm with stencil-based clipping
 * 
 * Renders polygons to the surface using a scanline approach with proper
 * winding rule evaluation. Integrates with the stencil clipping system
 * for memory-efficient clipping support.
 * 
 * @param {Surface} surface - Target surface to render to
 * @param {Array} polygons - Array of polygons (each polygon is array of {x,y} points)  
 * @param {Array} color - RGBA color [r,g,b,a] (0-255, non-premultiplied)
 * @param {string} fillRule - 'nonzero' or 'evenodd' winding rule
 * @param {Matrix} transform - Transformation matrix to apply to polygons
 * @param {Uint8Array} clipMask - Optional 1-bit stencil buffer for clipping
 */
function fillPolygons(surface, polygons, color, fillRule, transform, clipMask) {
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
        fillScanlineSpans(surface, y, intersections, color, fillRule, clipMask);
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
function fillScanlineSpans(surface, y, intersections, color, fillRule, clipMask) {
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
                // Check stencil buffer clipping
                if (isPixelClipped(clipMask, x, y, surface.width)) {
                    continue; // Skip pixels clipped by stencil buffer
                }
                
                const offset = y * surface.stride + x * 4;
                
                // Proper alpha blending (source-over)
                const srcR = color[0];
                const srcG = color[1];
                const srcB = color[2];
                const srcA = color[3];
                
                
                if (srcA === 255) {
                    // Opaque source - simple copy
                    surface.data[offset] = srcR;
                    surface.data[offset + 1] = srcG;
                    surface.data[offset + 2] = srcB;
                    surface.data[offset + 3] = srcA;
                } else if (srcA === 0) {
                    // Transparent source - no change
                    continue;
                } else {
                    // Alpha blending required
                    const dstR = surface.data[offset];
                    const dstG = surface.data[offset + 1];
                    const dstB = surface.data[offset + 2];
                    const dstA = surface.data[offset + 3];
                    
                    const srcAlpha = srcA / 255;
                    const invSrcA = 1 - srcAlpha;
                    
                    const newR = Math.round(srcR * srcAlpha + dstR * invSrcA);
                    const newG = Math.round(srcG * srcAlpha + dstG * invSrcA);
                    const newB = Math.round(srcB * srcAlpha + dstB * invSrcA);
                    const newA = Math.round(srcA + dstA * invSrcA);
                    
                    surface.data[offset] = newR;
                    surface.data[offset + 1] = newG;
                    surface.data[offset + 2] = newB;
                    surface.data[offset + 3] = newA;
                }
            }
        }
    }
}

