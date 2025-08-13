/**
 * Surface class for SWCanvas
 * 
 * Represents a 2D pixel surface with RGBA data storage.
 * Following Joshua Bloch's principle of proper class design with validation,
 * clear error messages, and immutable properties where sensible.
 */
class SurfaceClass {
    /**
     * Create a Surface
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // Validate parameters with descriptive error messages
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('Surface width must be a positive integer');
        }
        
        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('Surface height must be a positive integer');
        }
        
        // Check area first (SurfaceTooLarge takes precedence for test compatibility)
        if (width * height > 268435456) { // 16384 * 16384
            throw new Error('SurfaceTooLarge');
        }
        
        // Prevent memory issues with reasonable individual dimension limits
        const maxDimension = 16384;
        if (width > maxDimension || height > maxDimension) {
            throw new Error(`Surface dimensions must be ≤ ${maxDimension}x${maxDimension}`);
        }
        
        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
        Object.defineProperty(this, 'stride', { value: width * 4, writable: false });
        
        // Allocate pixel data (RGBA, non-premultiplied)
        this.data = new Uint8ClampedArray(this.stride * height);
    }
    
    /**
     * Create a copy of this surface
     * @returns {SurfaceClass} New surface with copied data
     */
    clone() {
        const clone = new SurfaceClass(this.width, this.height);
        clone.data.set(this.data);
        return clone;
    }
    
    /**
     * Get pixel color at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Color|null} Color at position, or null if out of bounds
     */
    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        
        const offset = y * this.stride + x * 4;
        return new Color(
            this.data[offset],
            this.data[offset + 1], 
            this.data[offset + 2],
            this.data[offset + 3],
            false // Non-premultiplied
        );
    }
    
    /**
     * Set pixel color at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Color} color - Color to set
     */
    setPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return; // Silently ignore out-of-bounds writes
        }
        
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        const offset = y * this.stride + x * 4;
        this.data[offset] = color.r;
        this.data[offset + 1] = color.g;
        this.data[offset + 2] = color.b;
        this.data[offset + 3] = color.a;
    }
    
    /**
     * Clear surface to specified color
     * @param {Color} color - Color to clear to (defaults to transparent)
     */
    clear(color = Color.transparent()) {
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        const rgba = color.toRGBA();
        
        for (let i = 0; i < this.data.length; i += 4) {
            this.data[i] = rgba[0];
            this.data[i + 1] = rgba[1];
            this.data[i + 2] = rgba[2];
            this.data[i + 3] = rgba[3];
        }
    }
    
    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage
     */
    getMemoryUsage() {
        return this.data.byteLength;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Surface description
     */
    toString() {
        const memoryMB = (this.getMemoryUsage() / (1024 * 1024)).toFixed(2);
        return `Surface(${this.width}×${this.height}, ${memoryMB}MB)`;
    }
}

// Factory function that can be called with or without 'new' (maintains backward compatibility)
function Surface(width, height) {
    return new SurfaceClass(width, height);
}

// Copy all prototype methods from SurfaceClass to Surface for proper inheritance-like behavior
Object.setPrototypeOf(Surface.prototype, SurfaceClass.prototype);

// Keep legacy factory function for backward compatibility
function createSurface(width, height) {
    return new SurfaceClass(width, height);
}
