/**
 * ClipMask class for SWCanvas
 * 
 * Represents a 1-bit stencil buffer for memory-efficient clipping operations.
 * Encapsulates bit manipulation and provides proper domain object interface
 * following Joshua Bloch's principles of clear responsibility and encapsulation.
 * 
 * Memory Layout:
 * - Each pixel is represented by 1 bit (1 = visible, 0 = clipped)
 * - Bits are packed into Uint8Array (8 pixels per byte)
 * - Memory usage: width × height ÷ 8 bytes (87.5% reduction vs full coverage)
 */
class ClipMask {
    /**
     * Create a ClipMask
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // Validate parameters
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('ClipMask width must be a positive integer');
        }
        
        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('ClipMask height must be a positive integer');
        }
        
        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        
        // Initialize to all 1s (no clipping by default)
        this._buffer = new Uint8Array(this._numBytes);
        this._initializeNoClipping();
        
        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
    }
    
    /**
     * Initialize buffer to "no clipping" state (all 1s)
     * @private
     */
    _initializeNoClipping() {
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
     * Get clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is visible (not clipped)
     */
    getPixel(x, y) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return false; // Out of bounds pixels are clipped
        }
        
        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 1;
    }
    
    /**
     * Set clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} visible - True if pixel should be visible
     */
    setPixel(x, y, visible) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return; // Ignore out of bounds
        }
        
        const pixelIndex = y * this._width + x;
        this._setBit(pixelIndex, visible ? 1 : 0);
    }
    
    /**
     * Check if a pixel is clipped (convenience method)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is clipped out
     */
    isPixelClipped(x, y) {
        return !this.getPixel(x, y);
    }
    
    /**
     * Clear all clipping (set all pixels to visible)
     */
    clear() {
        this._initializeNoClipping();
    }
    
    /**
     * Set all pixels to clipped state
     */
    clipAll() {
        this._buffer.fill(0);
    }
    
    /**
     * Intersect this clip mask with another (AND operation)
     * Only pixels visible in BOTH masks will remain visible
     * @param {ClipMask} other - Other clip mask to intersect with
     */
    intersectWith(other) {
        if (!(other instanceof ClipMask)) {
            throw new Error('Argument must be a ClipMask instance');
        }
        
        if (other._width !== this._width || other._height !== this._height) {
            throw new Error('ClipMask dimensions must match for intersection');
        }
        
        // Perform bitwise AND on each byte
        for (let i = 0; i < this._numBytes; i++) {
            this._buffer[i] &= other._buffer[i];
        }
    }
    
    /**
     * Create a deep copy of this clip mask
     * @returns {ClipMask} New ClipMask with copied data
     */
    clone() {
        const clone = new ClipMask(this._width, this._height);
        clone._buffer.set(this._buffer);
        return clone;
    }
    
    /**
     * Create a clip pixel writer function for path rendering
     * @returns {Function} clipPixel function for coverage-based rendering
     */
    createPixelWriter() {
        return (x, y, coverage) => {
            // Bounds checking
            if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;
            
            // Convert coverage to binary: >0.5 means inside, <=0.5 means outside
            const isInside = coverage > 0.5;
            this.setPixel(x, y, isInside);
        };
    }
    
    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage of the clip mask
     */
    getMemoryUsage() {
        return this._buffer.byteLength;
    }
    
    /**
     * Check if mask has any clipping (optimization)
     * @returns {boolean} True if any pixels are clipped
     */
    hasClipping() {
        // Quick check: if all bytes are 0xFF, no clipping
        for (let i = 0; i < this._numBytes - 1; i++) {
            if (this._buffer[i] !== 0xFF) {
                return true;
            }
        }
        
        // Check last byte accounting for partial bits
        const remainderBits = this._numPixels % 8;
        if (remainderBits === 0) {
            return this._buffer[this._numBytes - 1] !== 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return this._buffer[this._numBytes - 1] !== lastByteMask;
        }
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
            return 0; // Out of bounds pixels are clipped
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
     * @returns {string} ClipMask description
     */
    toString() {
        const memoryKB = (this.getMemoryUsage() / 1024).toFixed(2);
        const clippingStatus = this.hasClipping() ? 'with clipping' : 'no clipping';
        return `ClipMask(${this._width}×${this._height}, ${memoryKB}KB, ${clippingStatus})`;
    }
    
    /**
     * Check equality with another ClipMask
     * @param {ClipMask} other - Other ClipMask to compare
     * @returns {boolean} True if masks are identical
     */
    equals(other) {
        if (!(other instanceof ClipMask)) {
            return false;
        }
        
        if (other._width !== this._width || other._height !== this._height) {
            return false;
        }
        
        // Compare buffer contents
        for (let i = 0; i < this._numBytes; i++) {
            if (this._buffer[i] !== other._buffer[i]) {
                return false;
            }
        }
        
        return true;
    }
}