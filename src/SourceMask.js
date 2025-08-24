/**
 * SourceMask class for SWCanvas
 * 
 * Represents a 1-bit source coverage mask for canvas-wide composite operations.
 * Tracks which pixels are covered by the current drawing operation and provides
 * efficient bounds for iteration during canvas-wide compositing passes.
 * 
 * Optimizations:
 * - 1-bit per pixel memory efficiency (same as ClipMask)
 * - Automatic bounds tracking to minimize iteration area
 * - Fast clear and isEmpty operations
 * - Optimized for: build once during rendering, read many times during compositing
 */
class SourceMask {
    /**
     * Create a SourceMask
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // Validate parameters
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('SourceMask width must be a positive integer');
        }
        
        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('SourceMask height must be a positive integer');
        }
        
        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        
        // Initialize to all 0s (no coverage by default)
        this._buffer = new Uint8Array(this._numBytes);
        
        // Bounds tracking for optimization
        this._bounds = {
            minX: Infinity,
            minY: Infinity, 
            maxX: -Infinity,
            maxY: -Infinity,
            isEmpty: true
        };
        
        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
    }
    
    /**
     * Get coverage state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @returns {boolean} True if pixel is covered by source
     */
    getPixel(x, y) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return false; // Out of bounds pixels are not covered
        }
        
        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 1;
    }
    
    /**
     * Set coverage state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} covered - True if pixel should be marked as covered
     */
    setPixel(x, y, covered) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return; // Ignore out of bounds
        }
        
        const pixelIndex = y * this._width + x;
        const wasCovered = this._getBit(pixelIndex) === 1;
        
        // Update pixel state
        this._setBit(pixelIndex, covered ? 1 : 0);
        
        // Update bounds if pixel became covered
        if (covered && !wasCovered) {
            if (this._bounds.isEmpty) {
                this._bounds.minX = x;
                this._bounds.minY = y;
                this._bounds.maxX = x;
                this._bounds.maxY = y;
                this._bounds.isEmpty = false;
            } else {
                this._bounds.minX = Math.min(this._bounds.minX, x);
                this._bounds.minY = Math.min(this._bounds.minY, y);
                this._bounds.maxX = Math.max(this._bounds.maxX, x);
                this._bounds.maxY = Math.max(this._bounds.maxY, y);
            }
        }
        // Note: We don't shrink bounds when pixels are uncovered for performance
        // Clear() resets bounds completely
    }
    
    /**
     * Clear all coverage (set all pixels to not covered)
     */
    clear() {
        this._buffer.fill(0);
        this._bounds = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity, 
            maxY: -Infinity,
            isEmpty: true
        };
    }
    
    /**
     * Check if mask has any coverage
     * @returns {boolean} True if no pixels are covered
     */
    isEmpty() {
        return this._bounds.isEmpty;
    }
    
    /**
     * Get bounding box of covered pixels
     * @returns {Object} {minX, minY, maxX, maxY, isEmpty} bounds
     */
    getBounds() {
        return {
            minX: this._bounds.minX,
            minY: this._bounds.minY,
            maxX: this._bounds.maxX,
            maxY: this._bounds.maxY,
            isEmpty: this._bounds.isEmpty
        };
    }
    
    /**
     * Get optimized iteration bounds clamped to surface and intersected with clipMask bounds if provided
     * @param {ClipMask|null} clipMask - Optional clip mask to intersect with  
     * @param {boolean} isCanvasWideCompositing - True if this is for canvas-wide compositing operations
     * @returns {Object} {minX, minY, maxX, maxY, isEmpty} optimized iteration bounds
     */
    getIterationBounds(clipMask = null, isCanvasWideCompositing = false) {
        if (this._bounds.isEmpty) {
            return { minX: 0, minY: 0, maxX: -1, maxY: -1, isEmpty: true };
        }
        
        // For canvas-wide compositing operations, we need to process the entire surface
        // because destination pixels anywhere could be affected
        if (isCanvasWideCompositing) {
            if (clipMask && clipMask.hasClipping()) {
                // With clipping: process entire surface (clipping will filter pixels)
                return {
                    minX: 0,
                    minY: 0,
                    maxX: this._width - 1,
                    maxY: this._height - 1,
                    isEmpty: false
                };
            } else {
                // No clipping: process entire surface for canvas-wide operations
                return {
                    minX: 0,
                    minY: 0,
                    maxX: this._width - 1,
                    maxY: this._height - 1,
                    isEmpty: false
                };
            }
        }
        
        // For local compositing operations, use source bounds only
        let bounds = {
            minX: Math.max(0, this._bounds.minX),
            minY: Math.max(0, this._bounds.minY),
            maxX: Math.min(this._width - 1, this._bounds.maxX),
            maxY: Math.min(this._height - 1, this._bounds.maxY),
            isEmpty: false
        };
        
        return bounds;
    }
    
    /**
     * Create a pixel writer function for filling operations
     * @returns {Function} setPixel function optimized for coverage tracking
     */
    createPixelWriter() {
        return (x, y, coverage) => {
            // Bounds checking
            if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;
            
            // Convert coverage to binary: >0.5 means covered, <=0.5 means not covered
            const isCovered = coverage > 0.5;
            this.setPixel(x, y, isCovered);
        };
    }
    
    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage of the source mask
     */
    getMemoryUsage() {
        return this._buffer.byteLength;
    }
    
    /**
     * Get bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     * @private
     */
    _getBit(pixelIndex) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (byteIndex >= this._buffer.length) {
            return 0; // Out of bounds pixels are not covered
        }
        
        return (this._buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }
    
    /**
     * Set bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     * @private
     */
    _setBit(pixelIndex, value) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (byteIndex >= this._buffer.length) {
            return; // Ignore out of bounds
        }
        
        if (value) {
            this._buffer[byteIndex] |= (1 << bitIndex);
        } else {
            this._buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }
    
    /**
     * String representation for debugging
     * @returns {string} SourceMask description
     */
    toString() {
        const memoryKB = (this.getMemoryUsage() / 1024).toFixed(2);
        const boundsStr = this._bounds.isEmpty ? 'empty' : 
            `(${this._bounds.minX},${this._bounds.minY})-(${this._bounds.maxX},${this._bounds.maxY})`;
        return `SourceMask(${this._width}×${this._height}, ${memoryKB}KB, bounds: ${boundsStr})`;
    }
}