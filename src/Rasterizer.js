// Helper function for clipMask bit checking (duplicated from context2d.js for standalone use)
function getBit(buffer, pixelIndex) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
}

// ImageLike interface validation and RGB→RGBA conversion
function validateAndConvertImageLike(imageLike) {
    if (!imageLike || typeof imageLike !== 'object') {
        throw new Error('ImageLike must be an object');
    }
    
    if (typeof imageLike.width !== 'number' || imageLike.width <= 0 || !Number.isInteger(imageLike.width)) {
        throw new Error('ImageLike width must be a positive integer');
    }
    
    if (typeof imageLike.height !== 'number' || imageLike.height <= 0 || !Number.isInteger(imageLike.height)) {
        throw new Error('ImageLike height must be a positive integer');
    }
    
    if (!(imageLike.data instanceof Uint8ClampedArray)) {
        throw new Error('ImageLike data must be a Uint8ClampedArray');
    }
    
    const expectedRGBLength = imageLike.width * imageLike.height * 3;
    const expectedRGBALength = imageLike.width * imageLike.height * 4;
    
    if (imageLike.data.length === expectedRGBLength) {
        // RGB to RGBA conversion - append alpha = 255 to each pixel
        const rgbaData = new Uint8ClampedArray(expectedRGBALength);
        for (let i = 0; i < imageLike.width * imageLike.height; i++) {
            rgbaData[i * 4] = imageLike.data[i * 3];     // R
            rgbaData[i * 4 + 1] = imageLike.data[i * 3 + 1]; // G
            rgbaData[i * 4 + 2] = imageLike.data[i * 3 + 2]; // B
            rgbaData[i * 4 + 3] = 255;                   // A = fully opaque
        }
        
        return {
            width: imageLike.width,
            height: imageLike.height,
            data: rgbaData
        };
    } else if (imageLike.data.length === expectedRGBALength) {
        // Already RGBA - use as-is
        return imageLike;
    } else {
        throw new Error(`ImageLike data length (${imageLike.data.length}) must match width*height*3 (${expectedRGBLength}) for RGB or width*height*4 (${expectedRGBALength}) for RGBA`);
    }
}

function Rasterizer(surface) {
    this.surface = surface;
    this.currentOp = null;
}

Rasterizer.prototype.beginOp = function(params) {
    this.currentOp = {
        composite: params.composite || 'source-over',
        globalAlpha: params.globalAlpha !== undefined ? params.globalAlpha : 1.0,
        transform: params.transform || new Matrix(),
        clipMask: params.clipMask || null,  // Stencil-based clipping (only clipping mechanism)
        fillStyle: params.fillStyle || null,
        strokeStyle: params.strokeStyle || null
    };
};

Rasterizer.prototype.endOp = function() {
    this.currentOp = null;
};

// Helper method to check if a pixel should be clipped by stencil buffer
Rasterizer.prototype._isPixelClipped = function(x, y) {
    if (!this.currentOp.clipMask) return false; // No clipping active
    const pixelIndex = y * this.surface.width + x;
    return getBit(this.currentOp.clipMask, pixelIndex) === 0; // 0 means clipped out
};

// Simple solid rectangle fill for M1
Rasterizer.prototype.fillRect = function(x, y, width, height, color) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // If there's stencil clipping, convert the rectangle to a path and use path filling
    if (this.currentOp.clipMask) {
        // Create a path for the rectangle
        const rectPath = new Path2D();
        rectPath.rect(x, y, width, height);
        
        // Use the existing path filling logic which handles stencil clipping properly
        this.fill(rectPath, 'nonzero');
        return;
    }
    
    // No clipping - use optimized direct rectangle filling
    // Transform rectangle corners
    const transform = this.currentOp.transform;
    const topLeft = transform.transformPoint({x: x, y: y});
    const topRight = transform.transformPoint({x: x + width, y: y});
    const bottomLeft = transform.transformPoint({x: x, y: y + height});
    const bottomRight = transform.transformPoint({x: x + width, y: y + height});
    
    // Find bounding box in device space
    const minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const maxX = Math.min(this.surface.width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    const maxY = Math.min(this.surface.height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    
    // Optimized path for axis-aligned rectangles
    if (this.currentOp.transform.b === 0 && this.currentOp.transform.c === 0) {
        this._fillAxisAlignedRect(minX, minY, maxX - minX + 1, maxY - minY + 1, color);
    } else {
        // Handle rotated rectangles by converting to polygon
        const rectPolygon = [
            {x: x, y: y},
            {x: x + width, y: y}, 
            {x: x + width, y: y + height},
            {x: x, y: y + height}
        ];
        
        // Use existing polygon filling system which handles transforms and stencil clipping
        const rectColor = PolygonFiller.colorFromRGBA(color);
        PolygonFiller.fillPolygons(this.surface, [rectPolygon], rectColor, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
    }
};

Rasterizer.prototype._fillAxisAlignedRect = function(x, y, width, height, color) {
    const surface = this.surface;
    const globalAlpha = this.currentOp.globalAlpha;
    
    // Apply global alpha to source color, then premultiply
    const effectiveAlpha = (color[3] / 255) * globalAlpha; // Normalize to 0-1 range
    const srcA = Math.round(effectiveAlpha * 255);
    const srcR = Math.round(color[0] * effectiveAlpha);
    const srcG = Math.round(color[1] * effectiveAlpha);
    const srcB = Math.round(color[2] * effectiveAlpha);
    
    
    for (let py = y; py < y + height; py++) {
        if (py < 0 || py >= surface.height) continue;
        
        for (let px = x; px < x + width; px++) {
            if (px < 0 || px >= surface.width) continue;
            
            // Check stencil buffer clipping
            if (this.currentOp.clipMask && this._isPixelClipped(px, py)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
            const offset = py * surface.stride + px * 4;
            
            if (this.currentOp.composite === 'copy') {
                // Copy mode
                surface.data[offset] = srcR;
                surface.data[offset + 1] = srcG;
                surface.data[offset + 2] = srcB;
                surface.data[offset + 3] = srcA;
            } else {
                // Source-over mode (premultiplied alpha blending)
                const dstR = surface.data[offset];
                const dstG = surface.data[offset + 1];
                const dstB = surface.data[offset + 2];
                const dstA = surface.data[offset + 3];
                
                const invSrcA = (255 - srcA) / 255;
                
                
                surface.data[offset] = Math.round(srcR + dstR * invSrcA);
                surface.data[offset + 1] = Math.round(srcG + dstG * invSrcA);
                surface.data[offset + 2] = Math.round(srcB + dstB * invSrcA);
                surface.data[offset + 3] = Math.round(srcA + dstA * invSrcA);
            }
        }
    }
};

// M2: Path filling implementation
Rasterizer.prototype.fill = function(path, rule) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to fill color
    const colorData = this.currentOp.fillStyle || [0, 0, 0, 255];
    const color = Array.isArray(colorData) ? 
        new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
    const fillColor = color.withGlobalAlpha(this.currentOp.globalAlpha);
    const fillRule = rule || 'nonzero';
    
    // Flatten path to polygons
    const polygons = PathFlattener.flattenPath(path);
    // Fill polygons with current transform and stencil clipping
    PolygonFiller.fillPolygons(this.surface, polygons, fillColor, fillRule, this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.stroke = function(path, strokeProps) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to stroke color
    const colorData = this.currentOp.strokeStyle || [0, 0, 0, 255];
    const color = Array.isArray(colorData) ? 
        new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
    const strokeColor = color.withGlobalAlpha(this.currentOp.globalAlpha);
    
    // Generate stroke polygons using geometric approach
    const strokePolygons = StrokeGenerator.generateStrokePolygons(path, strokeProps);
    
    // Fill stroke polygons with current transform and stencil clipping
    PolygonFiller.fillPolygons(this.surface, strokePolygons, strokeColor, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Validate and convert ImageLike (handles RGB→RGBA conversion)
    const imageData = validateAndConvertImageLike(img);
    
    // Handle different parameter combinations
    let sourceX, sourceY, sourceWidth, sourceHeight;
    let destX, destY, destWidth, destHeight;
    
    if (arguments.length === 3) {
        // drawImage(image, dx, dy)
        sourceX = 0;
        sourceY = 0; 
        sourceWidth = imageData.width;
        sourceHeight = imageData.height;
        destX = sx; // Actually dx
        destY = sy; // Actually dy
        destWidth = sourceWidth;
        destHeight = sourceHeight;
    } else if (arguments.length === 5) {
        // drawImage(image, dx, dy, dw, dh)
        sourceX = 0;
        sourceY = 0;
        sourceWidth = imageData.width;
        sourceHeight = imageData.height;
        destX = sx; // Actually dx
        destY = sy; // Actually dy  
        destWidth = sw; // Actually dw
        destHeight = sh; // Actually dh
    } else if (arguments.length === 9) {
        // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
        sourceX = sx;
        sourceY = sy;
        sourceWidth = sw;
        sourceHeight = sh;
        destX = dx;
        destY = dy;
        destWidth = dw;
        destHeight = dh;
    } else {
        throw new Error('Invalid number of arguments for drawImage');
    }
    
    // Validate source rectangle bounds
    if (sourceX < 0 || sourceY < 0 || sourceX + sourceWidth > imageData.width || sourceY + sourceHeight > imageData.height) {
        throw new Error('Source rectangle is outside image bounds');
    }
    
    // Apply transform to destination rectangle corners  
    const transform = this.currentOp.transform;
    const topLeft = transform.transformPoint({x: destX, y: destY});
    const topRight = transform.transformPoint({x: destX + destWidth, y: destY});
    const bottomLeft = transform.transformPoint({x: destX, y: destY + destHeight});
    const bottomRight = transform.transformPoint({x: destX + destWidth, y: destY + destHeight});
    
    // Find bounding box in device space
    const minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const maxX = Math.min(this.surface.width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    const maxY = Math.min(this.surface.height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    
    // Get inverse transform for mapping device pixels back to source  
    const inverseTransform = transform.invert();
    
    const globalAlpha = this.currentOp.globalAlpha;
    
    // Render each pixel in the bounding box
    for (let deviceY = minY; deviceY <= maxY; deviceY++) {
        for (let deviceX = minX; deviceX <= maxX; deviceX++) {
            // Check stencil clipping
            if (this.currentOp.clipMask && this._isPixelClipped(deviceX, deviceY)) {
                continue;
            }
            
            // Transform device pixel back to destination space
            const destPoint = inverseTransform.transformPoint({x: deviceX, y: deviceY});
            
            // Check if we're inside the destination rectangle
            if (destPoint.x < destX || destPoint.x >= destX + destWidth || 
                destPoint.y < destY || destPoint.y >= destY + destHeight) {
                continue;
            }
            
            // Map destination coordinates to source coordinates
            const sourceXf = sourceX + (destPoint.x - destX) / destWidth * sourceWidth;
            const sourceYf = sourceY + (destPoint.y - destY) / destHeight * sourceHeight;
            
            // Nearest-neighbor sampling
            const sourcePX = Math.floor(sourceXf);
            const sourcePY = Math.floor(sourceYf);
            
            // Bounds check for source coordinates
            if (sourcePX < 0 || sourcePY < 0 || sourcePX >= imageData.width || sourcePY >= imageData.height) {
                continue;
            }
            
            // Sample source pixel
            const sourceOffset = (sourcePY * imageData.width + sourcePX) * 4;
            const srcR = imageData.data[sourceOffset];
            const srcG = imageData.data[sourceOffset + 1]; 
            const srcB = imageData.data[sourceOffset + 2];
            const srcA = imageData.data[sourceOffset + 3];
            
            // Apply global alpha
            const effectiveAlpha = (srcA / 255) * globalAlpha;
            const finalSrcA = Math.round(effectiveAlpha * 255);
            
            // Skip transparent pixels
            if (finalSrcA === 0) continue;
            
            // Get destination pixel for blending
            const destOffset = deviceY * this.surface.stride + deviceX * 4;
            
            if (this.currentOp.composite === 'copy' || finalSrcA === 255) {
                // Direct copy (no blending needed)
                const premultR = Math.round(srcR * effectiveAlpha);
                const premultG = Math.round(srcG * effectiveAlpha);
                const premultB = Math.round(srcB * effectiveAlpha);
                
                this.surface.data[destOffset] = premultR;
                this.surface.data[destOffset + 1] = premultG;
                this.surface.data[destOffset + 2] = premultB;
                this.surface.data[destOffset + 3] = finalSrcA;
            } else {
                // Alpha blending (source-over)
                const dstR = this.surface.data[destOffset];
                const dstG = this.surface.data[destOffset + 1];
                const dstB = this.surface.data[destOffset + 2];
                const dstA = this.surface.data[destOffset + 3];
                
                const srcAlpha = effectiveAlpha;
                const invSrcAlpha = 1 - srcAlpha;
                const dstAlpha = dstA / 255;
                
                // Premultiplied source colors
                const premultSrcR = srcR * srcAlpha;
                const premultSrcG = srcG * srcAlpha; 
                const premultSrcB = srcB * srcAlpha;
                
                // Blend with destination (assuming destination is already premultiplied)
                const newR = Math.round(premultSrcR + dstR * invSrcAlpha);
                const newG = Math.round(premultSrcG + dstG * invSrcAlpha);
                const newB = Math.round(premultSrcB + dstB * invSrcAlpha);
                const newA = Math.round(finalSrcA + dstA * invSrcAlpha);
                
                this.surface.data[destOffset] = newR;
                this.surface.data[destOffset + 1] = newG;
                this.surface.data[destOffset + 2] = newB;
                this.surface.data[destOffset + 3] = newA;
            }
        }
    }
};