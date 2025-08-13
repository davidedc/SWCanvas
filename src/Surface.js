class SurfaceClass {
    constructor(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('Surface dimensions must be positive');
        }
        
        if (width * height > 268435456) { // 16384 * 16384
            throw new Error('SurfaceTooLarge');
        }
        
        this.width = width;
        this.height = height;
        this.stride = width * 4;
        this.data = new Uint8ClampedArray(this.stride * height);
    }
}

// Factory function that can be called with or without 'new' (maintains backward compatibility)
function Surface(width, height) {
    return new SurfaceClass(width, height);
}

// Keep legacy factory function for backward compatibility
function createSurface(width, height) {
    return new SurfaceClass(width, height);
}
