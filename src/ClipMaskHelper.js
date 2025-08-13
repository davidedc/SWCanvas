/**
 * ClipMaskHelper class for SWCanvas
 * 
 * Encapsulates bit manipulation operations for 1-bit stencil buffer clipping.
 * Provides static methods for efficient bit manipulation following Joshua Bloch's
 * principle of using static methods for stateless utility operations.
 */
class ClipMaskHelper {
    /**
     * Get bit value at pixel index in a 1-bit buffer
     * @param {Uint8Array} buffer - 1-bit stencil buffer
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     */
    static getBit(buffer, pixelIndex) {
        if (!buffer || !(buffer instanceof Uint8Array)) {
            throw new Error('Buffer must be a Uint8Array');
        }
        
        if (pixelIndex < 0 || !Number.isInteger(pixelIndex)) {
            throw new Error('Pixel index must be a non-negative integer');
        }
        
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        // Bounds check
        if (byteIndex >= buffer.length) {
            return 0; // Out of bounds pixels are considered clipped
        }
        
        return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }
    
    /**
     * Set bit value at pixel index in a 1-bit buffer
     * @param {Uint8Array} buffer - 1-bit stencil buffer
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     */
    static setBit(buffer, pixelIndex, value) {
        if (!buffer || !(buffer instanceof Uint8Array)) {
            throw new Error('Buffer must be a Uint8Array');
        }
        
        if (pixelIndex < 0 || !Number.isInteger(pixelIndex)) {
            throw new Error('Pixel index must be a non-negative integer');
        }
        
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        // Bounds check
        if (byteIndex >= buffer.length) {
            return; // Ignore out-of-bounds writes
        }
        
        if (value) {
            buffer[byteIndex] |= (1 << bitIndex);
        } else {
            buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }
    
    /**
     * Create a new 1-bit stencil buffer initialized to "no clipping" (all 1s)
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels  
     * @returns {Uint8Array} Stencil buffer with 1 bit per pixel, packed into bytes
     */
    static createClipMask(width, height) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            throw new Error('Width and height must be positive integers');
        }
        
        const numPixels = width * height;
        const numBytes = Math.ceil(numPixels / 8);
        const mask = new Uint8Array(numBytes);
        
        // Initialize to all 1s (no clipping)
        mask.fill(0xFF);
        
        // Handle partial last byte if width*height is not divisible by 8
        const remainderBits = numPixels % 8;
        if (remainderBits !== 0) {
            const lastByteIndex = numBytes - 1;
            const lastByteMask = (1 << remainderBits) - 1;
            mask[lastByteIndex] = lastByteMask;
        }
        
        return mask;
    }
    
    /**
     * Clear a stencil buffer to "all clipped" state (all 0s)
     * @param {Uint8Array} buffer - Buffer to clear
     */
    static clearMask(buffer) {
        if (!buffer || !(buffer instanceof Uint8Array)) {
            throw new Error('Buffer must be a Uint8Array');
        }
        
        buffer.fill(0);
    }
    
    /**
     * Check if a pixel is clipped by the stencil buffer
     * @param {Uint8Array|null} clipMask - 1-bit stencil buffer
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate  
     * @param {number} width - Surface width for indexing
     * @returns {boolean} True if pixel should be clipped
     */
    static isPixelClipped(clipMask, x, y, width) {
        if (!clipMask) return false; // No clipping active
        
        if (x < 0 || y < 0) return true; // Out of bounds pixels are clipped
        
        const pixelIndex = y * width + x;
        return ClipMaskHelper.getBit(clipMask, pixelIndex) === 0; // 0 means clipped out
    }
    
    /**
     * Copy a stencil buffer (deep copy)
     * @param {Uint8Array} source - Source buffer
     * @returns {Uint8Array} Deep copy of source buffer
     */
    static copyMask(source) {
        if (!source || !(source instanceof Uint8Array)) {
            throw new Error('Source must be a Uint8Array');
        }
        
        return new Uint8Array(source);
    }
    
    /**
     * Perform bitwise AND operation between two stencil buffers
     * Result = buffer1 AND buffer2 (intersection of clip regions)
     * @param {Uint8Array} buffer1 - First buffer (modified in place)
     * @param {Uint8Array} buffer2 - Second buffer
     */
    static intersectMasks(buffer1, buffer2) {
        if (!buffer1 || !buffer2 || !(buffer1 instanceof Uint8Array) || !(buffer2 instanceof Uint8Array)) {
            throw new Error('Both buffers must be Uint8Arrays');
        }
        
        if (buffer1.length !== buffer2.length) {
            throw new Error('Buffers must have the same length');
        }
        
        for (let i = 0; i < buffer1.length; i++) {
            buffer1[i] &= buffer2[i];
        }
    }
    
    /**
     * Check if mask represents "no clipping" state (all 1s)
     * @param {Uint8Array} buffer - Buffer to check
     * @param {number} numPixels - Total number of pixels
     * @returns {boolean} True if no pixels are clipped
     */
    static isNoClipping(buffer, numPixels) {
        if (!buffer || !(buffer instanceof Uint8Array)) {
            return false;
        }
        
        const numBytes = buffer.length;
        
        // Check if all bits are set to 1
        for (let i = 0; i < numBytes - 1; i++) {
            if (buffer[i] !== 0xFF) return false;
        }
        
        // Check last byte (may be partial)
        const remainderBits = numPixels % 8;
        if (remainderBits === 0) {
            return buffer[numBytes - 1] === 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return buffer[numBytes - 1] === lastByteMask;
        }
    }
    
    /**
     * Count number of clipped pixels (for debugging)
     * @param {Uint8Array} buffer - Buffer to analyze
     * @param {number} numPixels - Total number of pixels
     * @returns {number} Number of clipped pixels
     */
    static countClippedPixels(buffer, numPixels) {
        if (!buffer || !(buffer instanceof Uint8Array)) {
            return numPixels; // All pixels clipped if no buffer
        }
        
        let count = 0;
        for (let i = 0; i < numPixels; i++) {
            if (ClipMaskHelper.getBit(buffer, i) === 0) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Get memory usage of a stencil buffer
     * @param {number} width - Surface width
     * @param {number} height - Surface height
     * @returns {number} Memory usage in bytes
     */
    static getMemoryUsage(width, height) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            return 0;
        }
        
        const numPixels = width * height;
        return Math.ceil(numPixels / 8);
    }
    
    /**
     * Create a pixel writer function for temporary clip buffers
     * @param {Uint8Array} tempClipBuffer - Temporary clip buffer
     * @param {number} width - Buffer width
     * @param {number} height - Buffer height
     * @returns {Function} Pixel writer function
     */
    static createClipPixelWriter(tempClipBuffer, width, height) {
        return function clipPixel(x, y, coverage) {
            // Bounds checking
            if (x < 0 || x >= width || y < 0 || y >= height) return;
            
            // Convert coverage to binary (1 bit): >0.5 means inside, <=0.5 means outside
            const pixelIndex = y * width + x;
            const isInside = coverage > 0.5;
            ClipMaskHelper.setBit(tempClipBuffer, pixelIndex, isInside ? 1 : 0);
        };
    }
}