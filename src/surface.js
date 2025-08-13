function createSurface(width, height) {
    if (width <= 0 || height <= 0) {
        throw new Error('Surface dimensions must be positive');
    }
    
    if (width * height > 268435456) { // 16384 * 16384
        throw new Error('SurfaceTooLarge');
    }
    
    const stride = width * 4;
    const data = new Uint8ClampedArray(stride * height);
    
    return {
        width: width,
        height: height,
        stride: stride,
        data: data
    };
}

function Surface(width, height) {
    return createSurface(width, height);
}