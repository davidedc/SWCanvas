/**
 * StencilBuffer class for SWCanvas clipping system
 * 
 * Encapsulates the 1-bit stencil buffer implementation for memory-efficient clipping
 * with proper intersection semantics. Extracted from Context2D to follow Single
 * Responsibility Principle.
 * 
 * This implementation matches HTML5 Canvas behavior exactly while using only
 * 1 bit per pixel (87.5% memory reduction compared to full coverage buffers).
 */
class StencilBuffer {
    /**
     * Create a StencilBuffer
     * @param {number} width - Buffer width in pixels
     * @param {number} height - Buffer height in pixels
     */
    constructor(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('StencilBuffer dimensions must be positive');
        }
        
        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        
        // Initialize stencil buffer to "no clipping" (all 1s)
        this._buffer = new Uint8Array(this._numBytes);
        this._initializeToNoClipping();
    }
    
    get width() { return this._width; }
    get height() { return this._height; }
    
    /**
     * Initialize buffer to "no clipping" state (all pixels visible)
     * @private
     */
    _initializeToNoClipping() {
        this._buffer.fill(0xFF);
        
        // Handle partial last byte if width*height is not divisible by 8
        const remainderBits = this._numPixels % 8;
        if (remainderBits !== 0) {
            const lastByteIndex = this._numBytes - 1;
            const lastByteMask = (1 << remainderBits) - 1;
            this._buffer[lastByteIndex] = lastByteMask;
        }
    }
    
    /**
     * Create a copy of this stencil buffer
     * @returns {StencilBuffer} New StencilBuffer with identical content
     */
    clone() {
        const clone = new StencilBuffer(this._width, this._height);
        clone._buffer.set(this._buffer);
        return clone;
    }
    
    /**
     * Check if a pixel is clipped (not visible)
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @returns {boolean} True if pixel is clipped out
     */
    isPixelClipped(x, y) {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return true; // Out of bounds pixels are clipped
        }
        
        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 0;
    }
    
    /**
     * Get bit value at pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     * @private
     */
    _getBit(pixelIndex) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        return (this._buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }
    
    /**
     * Set bit value at pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     * @private
     */
    _setBit(pixelIndex, value) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (value) {
            this._buffer[byteIndex] |= (1 << bitIndex);
        } else {
            this._buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }
    
    /**
     * Clear buffer to all clipped (all 0s)
     * @private
     */
    _clearToAllClipped() {
        this._buffer.fill(0);
    }
    
    /**
     * Apply a new clipping path using intersection semantics
     * This method renders a path to a temporary buffer, then ANDs it with
     * the existing stencil buffer to create proper clip intersections.
     * 
     * @param {Path2D} path - Path to use for clipping
     * @param {string} fillRule - Fill rule: 'nonzero' or 'evenodd'
     * @param {Matrix} transform - Transform to apply to path
     */
    applyClip(path, fillRule = 'nonzero', transform) {
        // Create temporary buffer for new clip path
        const tempBuffer = new StencilBuffer(this._width, this._height);
        tempBuffer._clearToAllClipped(); // Start with all clipped
        
        // Render the clip path to temporary buffer
        tempBuffer._renderPathToBuffer(path, fillRule, transform);
        
        // Intersect with existing buffer (AND operation)
        for (let i = 0; i < this._buffer.length; i++) {
            this._buffer[i] &= tempBuffer._buffer[i];
        }
    }
    
    /**
     * Render a path directly to this stencil buffer
     * @param {Path2D} path - Path to render
     * @param {string} fillRule - Fill rule: 'nonzero' or 'evenodd'
     * @param {Matrix} transform - Transform to apply to path
     * @private
     */
    _renderPathToBuffer(path, fillRule, transform) {
        // Flatten path to polygons
        const polygons = PathFlattener.flattenPath(path);
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
        
        // Clamp to buffer bounds
        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(this._height - 1, Math.ceil(maxY));
        
        // Process each scanline
        for (let y = minY; y <= maxY; y++) {
            this._fillScanline(y, transformedPolygons, fillRule);
        }
    }
    
    /**
     * Fill a single scanline using winding rule
     * @param {number} y - Scanline y coordinate
     * @param {Array} polygons - Transformed polygons
     * @param {string} fillRule - Fill rule
     * @private
     */
    _fillScanline(y, polygons, fillRule) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of polygons) {
            this._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        this._fillSpans(y, intersections, fillRule);
    }
    
    /**
     * Find intersections between a polygon and a horizontal scanline
     * @param {Array} polygon - Array of {x, y} points
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Array to append intersections to
     * @private
     */
    _findPolygonIntersections(polygon, y, intersections) {
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
    
    /**
     * Fill spans on a scanline based on winding rule
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Sorted intersections
     * @param {string} fillRule - Fill rule
     * @private
     */
    _fillSpans(y, intersections, fillRule) {
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
                const endX = Math.min(this._width - 1, Math.floor(nextIntersection.x));
                
                for (let x = startX; x <= endX; x++) {
                    const pixelIndex = y * this._width + x;
                    this._setBit(pixelIndex, 1); // Set bit to 1 (inside clip region)
                }
            }
        }
    }
    
    /**
     * Check if buffer represents "no clipping" state
     * @returns {boolean} True if no pixels are clipped
     */
    isNoClipping() {
        // Check if all bits are set to 1
        for (let i = 0; i < this._numBytes - 1; i++) {
            if (this._buffer[i] !== 0xFF) return false;
        }
        
        // Check last byte (may be partial)
        const remainderBits = this._numPixels % 8;
        if (remainderBits === 0) {
            return this._buffer[this._numBytes - 1] === 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return this._buffer[this._numBytes - 1] === lastByteMask;
        }
    }
    
    /**
     * Reset to no clipping state
     */
    resetToNoClipping() {
        this._initializeToNoClipping();
    }
    
    /**
     * Get raw buffer for integration with rasterizer
     * @returns {Uint8Array} Raw stencil buffer
     */
    getRawBuffer() {
        return this._buffer;
    }
    
    /**
     * Calculate memory usage in bytes
     * @returns {number} Memory usage
     */
    getMemoryUsage() {
        return this._numBytes;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Buffer description
     */
    toString() {
        const clippedPixels = this._countClippedPixels();
        const percentClipped = ((clippedPixels / this._numPixels) * 100).toFixed(1);
        return `StencilBuffer(${this._width}×${this._height}, ${clippedPixels}/${this._numPixels} clipped [${percentClipped}%])`;
    }
    
    /**
     * Count number of clipped pixels (for debugging)
     * @returns {number} Number of clipped pixels
     * @private
     */
    _countClippedPixels() {
        let count = 0;
        for (let i = 0; i < this._numPixels; i++) {
            if (this._getBit(i) === 0) {
                count++;
            }
        }
        return count;
    }
}