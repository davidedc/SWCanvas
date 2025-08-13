function encodeBMP(surface) {
    const width = surface.width;
    const height = surface.height;
    const data = surface.data;
    
    // BMP row padding (each row must be aligned to 4-byte boundary)
    const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
    const imageSize = rowSize * height;
    const fileSize = 54 + imageSize; // 54 = BMP header size
    
    // Create output buffer
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    
    // BMP File Header (14 bytes)
    bytes[0] = 0x42; // 'B'
    bytes[1] = 0x4D; // 'M'
    view.setUint32(2, fileSize, true); // File size
    view.setUint32(6, 0, true); // Reserved
    view.setUint32(10, 54, true); // Pixel data offset
    
    // BMP Info Header (40 bytes)
    view.setUint32(14, 40, true); // Header size
    view.setInt32(18, width, true); // Width
    view.setInt32(22, -height, true); // Height (negative for top-down)
    view.setUint16(26, 1, true); // Planes
    view.setUint16(28, 24, true); // Bits per pixel
    view.setUint32(30, 0, true); // Compression
    view.setUint32(34, imageSize, true); // Image size
    view.setInt32(38, 2835, true); // X pixels per meter (~72 DPI)
    view.setInt32(42, 2835, true); // Y pixels per meter (~72 DPI)
    view.setUint32(46, 0, true); // Colors in palette
    view.setUint32(50, 0, true); // Important colors
    
    // Convert RGBA to BGR and write pixel data
    let pixelOffset = 54;
    for (let y = 0; y < height; y++) {
        let rowOffset = pixelOffset;
        for (let x = 0; x < width; x++) {
            const srcOffset = (y * surface.stride) + (x * 4);
            
            // Get RGBA values (premultiplied)
            const r = data[srcOffset];
            const g = data[srcOffset + 1];
            const b = data[srcOffset + 2];
            const a = data[srcOffset + 3];
            
            // Un-premultiply and convert to RGB
            let finalR, finalG, finalB;
            if (a === 0) {
                finalR = finalG = finalB = 0;
            } else if (a === 255) {
                finalR = r;
                finalG = g;
                finalB = b;
            } else {
                // Un-premultiply: color_unpremult = color_premult * 255 / alpha
                finalR = Math.round((r * 255) / a);
                finalG = Math.round((g * 255) / a);
                finalB = Math.round((b * 255) / a);
            }
            
            // BMP stores as BGR
            bytes[rowOffset] = finalB;
            bytes[rowOffset + 1] = finalG;
            bytes[rowOffset + 2] = finalR;
            rowOffset += 3;
        }
        
        // Apply row padding
        while ((rowOffset - pixelOffset) < rowSize) {
            bytes[rowOffset] = 0;
            rowOffset++;
        }
        
        pixelOffset += rowSize;
    }
    
    return buffer;
}