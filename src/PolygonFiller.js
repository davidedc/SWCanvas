/**
 * PolygonFiller class for SWCanvas
 * 
 * Implements scanline polygon filling with nonzero and evenodd winding rules.
 * Handles stencil-based clipping integration and premultiplied alpha blending.
 * 
 * Converted from functional to class-based approach following OO best practices:
 * - Static methods for stateless operations 
 * - Clear separation of scanline logic from pixel blending
 * - Immutable color handling with Color class integration
 */
class PolygonFiller {
    /**
     * Fill polygons using scanline algorithm with stencil-based clipping
     * 
     * @param {Surface} surface - Target surface to render to
     * @param {Array} polygons - Array of polygons (each polygon is array of {x,y} points)  
     * @param {Color} color - Color to fill with
     * @param {string} fillRule - 'nonzero' or 'evenodd' winding rule
     * @param {Matrix} transform - Transformation matrix to apply to polygons
     * @param {Uint8Array|null} clipMask - Optional 1-bit stencil buffer for clipping
     */
    static fillPolygons(surface, polygons, color, fillRule, transform, clipMask) {
        if (polygons.length === 0) return;
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        // Transform all polygon vertices
        const transformedPolygons = polygons.map(poly => 
            poly.map(point => transform.transformPoint(point))
        );
        
        // Find bounding box for optimization
        const bounds = PolygonFiller._calculateBounds(transformedPolygons, surface);
        
        // Process each scanline
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            PolygonFiller._fillScanline(
                surface, y, transformedPolygons, color, fillRule, clipMask
            );
        }
    }
    
    /**
     * Calculate bounding box for transformed polygons
     * @param {Array} polygons - Transformed polygons
     * @param {Surface} surface - Target surface for bounds clamping
     * @returns {Object} {minY, maxY} bounds
     * @private
     */
    static _calculateBounds(polygons, surface) {
        let minY = Infinity, maxY = -Infinity;
        
        for (const poly of polygons) {
            for (const point of poly) {
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        // Clamp to surface bounds
        return {
            minY: Math.max(0, Math.floor(minY)),
            maxY: Math.min(surface.height - 1, Math.ceil(maxY))
        };
    }
    
    /**
     * Fill a single scanline using polygon intersection and winding rules
     * @param {Surface} surface - Target surface
     * @param {number} y - Scanline y coordinate
     * @param {Array} polygons - Transformed polygons
     * @param {Color} color - Fill color
     * @param {string} fillRule - Winding rule
     * @param {Uint8Array|null} clipMask - Clipping mask
     * @private
     */
    static _fillScanline(surface, y, polygons, color, fillRule, clipMask) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of polygons) {
            PolygonFiller._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        PolygonFiller._fillSpans(surface, y, intersections, color, fillRule, clipMask);
    }
    
    /**
     * Find intersections between a polygon and a horizontal scanline
     * @param {Array} polygon - Array of {x, y} points
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Array to append intersections to
     * @private
     */
    static _findPolygonIntersections(polygon, y, intersections) {
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            
            // Skip horizontal edges (avoid division by zero)
            if (Math.abs(p1.y - p2.y) < 1e-10) continue;
            
            // Check if scanline crosses this edge
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            
            if (y >= minY && y < maxY) { // Note: < maxY to avoid double-counting vertices
                // Calculate intersection point using linear interpolation
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                
                // Determine winding direction
                const winding = p2.y > p1.y ? 1 : -1;
                
                intersections.push({ x: x, winding: winding });
            }
        }
    }
    
    /**
     * Fill spans on a scanline based on winding rule
     * @param {Surface} surface - Target surface
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Sorted intersections with winding info
     * @param {Color} color - Fill color
     * @param {string} fillRule - 'evenodd' or 'nonzero'
     * @param {Uint8Array|null} clipMask - Stencil clipping mask
     * @private
     */
    static _fillSpans(surface, y, intersections, color, fillRule, clipMask) {
        if (intersections.length === 0) return;
        
        let windingNumber = 0;
        let inside = false;
        
        for (let i = 0; i < intersections.length; i++) {
            const intersection = intersections[i];
            const nextIntersection = intersections[i + 1];
            
            // Update winding number
            windingNumber += intersection.winding;
            
            // Determine if we're inside based on fill rule
            if (fillRule === 'evenodd') {
                inside = (windingNumber % 2) !== 0;
            } else { // nonzero
                inside = windingNumber !== 0;
            }
            
            // Fill span if we're inside
            if (inside && nextIntersection) {
                const startX = Math.max(0, Math.ceil(intersection.x));
                const endX = Math.min(surface.width - 1, Math.floor(nextIntersection.x));
                
                PolygonFiller._fillPixelSpan(
                    surface, y, startX, endX, color, clipMask
                );
            }
        }
    }
    
    /**
     * Fill a horizontal span of pixels with color and alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} y - Y coordinate
     * @param {number} startX - Start X coordinate (inclusive)
     * @param {number} endX - End X coordinate (inclusive)
     * @param {Color} color - Fill color (with alpha)
     * @param {Uint8Array|null} clipMask - Stencil clipping mask
     * @private
     */
    static _fillPixelSpan(surface, y, startX, endX, color, clipMask) {
        for (let x = startX; x <= endX; x++) {
            // Check stencil buffer clipping
            if (PolygonFiller._isPixelClipped(clipMask, x, y, surface.width)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
            const offset = y * surface.stride + x * 4;
            PolygonFiller._blendPixel(surface, offset, color);
        }
    }
    
    /**
     * Check if a pixel is clipped by the stencil buffer
     * @param {Uint8Array|null} clipMask - 1-bit stencil buffer
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate  
     * @param {number} width - Surface width for indexing
     * @returns {boolean} True if pixel should be clipped
     * @private
     */
    static _isPixelClipped(clipMask, x, y, width) {
        if (!clipMask) return false; // No clipping active
        
        const pixelIndex = y * width + x;
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        return (clipMask[byteIndex] & (1 << bitIndex)) === 0; // 0 means clipped out
    }
    
    /**
     * Blend a color into a surface pixel using proper alpha compositing
     * @param {Surface} surface - Target surface
     * @param {number} offset - Byte offset in surface data
     * @param {Color} color - Source color to blend
     * @private
     */
    static _blendPixel(surface, offset, color) {
        // Fast paths for common cases
        if (color.isTransparent) {
            return; // No change needed
        }
        
        if (color.isOpaque) {
            // Opaque source - copy non-premultiplied values (surface stores non-premultiplied)
            surface.data[offset] = color.r;
            surface.data[offset + 1] = color.g;
            surface.data[offset + 2] = color.b;
            surface.data[offset + 3] = color.a;
            return;
        }
        
        // Alpha blending required (source-over composition)
        // Surface stores non-premultiplied RGBA, use standard blending formula
        const dstR = surface.data[offset];
        const dstG = surface.data[offset + 1];
        const dstB = surface.data[offset + 2];
        const dstA = surface.data[offset + 3];
        
        const srcR = color.r;
        const srcG = color.g;
        const srcB = color.b;
        const srcA = color.a;
        
        const srcAlpha = srcA / 255;
        const invSrcAlpha = 1 - srcAlpha;
        
        // Use original non-premultiplied blending formula (matches original implementation)
        const newR = Math.round(srcR * srcAlpha + dstR * invSrcAlpha);
        const newG = Math.round(srcG * srcAlpha + dstG * invSrcAlpha);
        const newB = Math.round(srcB * srcAlpha + dstB * invSrcAlpha);
        const newA = Math.round(srcA + dstA * invSrcAlpha);
        
        surface.data[offset] = newR;
        surface.data[offset + 1] = newG;
        surface.data[offset + 2] = newB;
        surface.data[offset + 3] = newA;
    }
    
    /**
     * Utility method to convert old-style RGBA array to Color instance
     * Maintains backward compatibility during transition
     * @param {Array} rgba - [r, g, b, a] array (0-255, non-premultiplied)
     * @returns {Color} Color instance
     */
    static colorFromRGBA(rgba) {
        return new Color(rgba[0], rgba[1], rgba[2], rgba[3], false);
    }
    
    /**
     * Debug method to visualize polygon bounds
     * @param {Array} polygons - Polygons to analyze
     * @returns {Object} Bounding box information
     */
    static getPolygonBounds(polygons) {
        if (polygons.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        const points = polygons.flat();
        return Rectangle.boundingBox(points.map(p => new Point(p.x, p.y)));
    }
    
    /**
     * Performance utility to count total vertices in polygon set
     * @param {Array} polygons - Polygons to count
     * @returns {number} Total vertex count
     */
    static countVertices(polygons) {
        return polygons.reduce((total, poly) => total + poly.length, 0);
    }
}