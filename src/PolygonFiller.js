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
     * @param {Color|Gradient|Pattern} paintSource - Paint source to fill with
     * @param {string} fillRule - 'nonzero' or 'evenodd' winding rule
     * @param {Transform2D} transform - Transformation matrix to apply to polygons
     * @param {Uint8Array|null} clipMask - Optional 1-bit stencil buffer for clipping
     * @param {number} globalAlpha - Global alpha value (0-1) for rendering operation
     * @param {number} subPixelOpacity - Sub-pixel opacity for thin strokes (0-1)
     */
    static fillPolygons(surface, polygons, paintSource, fillRule, transform, clipMask, globalAlpha = 1.0, subPixelOpacity = 1.0) {
        if (polygons.length === 0) return;
        if (!PolygonFiller._isValidPaintSource(paintSource)) {
            throw new Error('Paint source must be a Color, Gradient, or Pattern instance');
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
                surface, y, transformedPolygons, paintSource, fillRule, clipMask, transform, globalAlpha, subPixelOpacity
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
     * @param {Color|Gradient|Pattern} paintSource - Paint source
     * @param {string} fillRule - Winding rule
     * @param {Uint8Array|null} clipMask - Clipping mask
     * @param {Transform2D} transform - Canvas transform (for gradients/patterns)
     * @param {number} globalAlpha - Global alpha value (0-1)
     * @param {number} subPixelOpacity - Sub-pixel opacity for thin strokes (0-1)
     * @private
     */
    static _fillScanline(surface, y, polygons, paintSource, fillRule, clipMask, transform, globalAlpha, subPixelOpacity = 1.0) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of polygons) {
            PolygonFiller._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        PolygonFiller._fillSpans(surface, y, intersections, paintSource, fillRule, clipMask, transform, globalAlpha, subPixelOpacity);
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
     * @param {Color|Gradient|Pattern} paintSource - Paint source
     * @param {string} fillRule - 'evenodd' or 'nonzero'
     * @param {ClipMask|null} clipMask - Stencil clipping mask
     * @param {Transform2D} transform - Canvas transform (for gradients/patterns)
     * @param {number} globalAlpha - Global alpha value (0-1)
     * @param {number} subPixelOpacity - Sub-pixel opacity for thin strokes (0-1)
     * @private
     */
    static _fillSpans(surface, y, intersections, paintSource, fillRule, clipMask, transform, globalAlpha, subPixelOpacity = 1.0) {
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
                    surface, y, startX, endX, paintSource, clipMask, transform, globalAlpha, subPixelOpacity
                );
            }
        }
    }
    
    /**
     * Fill a horizontal span of pixels with paint source and alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} y - Y coordinate
     * @param {number} startX - Start X coordinate (inclusive)
     * @param {number} endX - End X coordinate (inclusive)
     * @param {Color|Gradient|Pattern} paintSource - Paint source
     * @param {ClipMask|null} clipMask - Stencil clipping mask
     * @param {Transform2D} transform - Canvas transform (for gradients/patterns)
     * @param {number} globalAlpha - Global alpha value (0-1)
     * @param {number} subPixelOpacity - Sub-pixel opacity for thin strokes (0-1)
     * @private
     */
    static _fillPixelSpan(surface, y, startX, endX, paintSource, clipMask, transform, globalAlpha, subPixelOpacity = 1.0) {
        for (let x = startX; x <= endX; x++) {
            // Check stencil buffer clipping
            if (clipMask && clipMask.isPixelClipped(x, y)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
            // Evaluate paint source at pixel position
            const pixelColor = PolygonFiller._evaluatePaintSource(paintSource, x, y, transform, globalAlpha, subPixelOpacity);
            
            const offset = y * surface.stride + x * 4;
            PolygonFiller._blendPixel(surface, offset, pixelColor);
        }
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
    
    /**
     * Validate paint source type
     * @param {*} paintSource - Object to validate
     * @returns {boolean} True if valid paint source
     * @private
     */
    static _isValidPaintSource(paintSource) {
        return paintSource instanceof Color ||
               paintSource instanceof Gradient ||
               paintSource instanceof LinearGradient ||
               paintSource instanceof RadialGradient ||
               paintSource instanceof ConicGradient ||
               paintSource instanceof Pattern;
    }
    
    /**
     * Evaluate paint source at a pixel position
     * @param {Color|Gradient|Pattern} paintSource - Paint source to evaluate
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @param {Transform2D} transform - Current canvas transform
     * @param {number} globalAlpha - Global alpha value (0-1)
     * @param {number} subPixelOpacity - Sub-pixel opacity for thin strokes (0-1)
     * @returns {Color} Color for this pixel
     * @private
     */
    static _evaluatePaintSource(paintSource, x, y, transform, globalAlpha, subPixelOpacity = 1.0) {
        let color;
        if (paintSource instanceof Color) {
            color = paintSource;
        } else if (paintSource instanceof Gradient ||
                   paintSource instanceof LinearGradient ||
                   paintSource instanceof RadialGradient ||
                   paintSource instanceof ConicGradient) {
            color = paintSource.getColorForPixel(x, y, transform);
        } else if (paintSource instanceof Pattern) {
            color = paintSource.getColorForPixel(x, y, transform);
        } else {
            // Fallback to transparent black
            color = new Color(0, 0, 0, 0);
        }
        
        // Apply global alpha and sub-pixel opacity
        let resultColor = color.withGlobalAlpha(globalAlpha);
        
        // Apply sub-pixel opacity for thin strokes
        if (subPixelOpacity < 1.0) {
            const adjustedAlpha = Math.round(resultColor.a * subPixelOpacity);
            resultColor = new Color(resultColor.r, resultColor.g, resultColor.b, adjustedAlpha, resultColor.premultiplied);
        }
        
        return resultColor;
    }
}