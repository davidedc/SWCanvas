// Helper function for clipMask bit checking (duplicated from context2d.js for standalone use)
function getBit(buffer, pixelIndex) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
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
        fillPolygons(this.surface, [rectPolygon], color, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
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
    
    // Apply global alpha to fill color (non-premultiplied for polygon filler)
    const color = this.currentOp.fillStyle || [0, 0, 0, 255];
    const globalAlpha = this.currentOp.globalAlpha;
    const effectiveAlpha = (color[3] / 255) * globalAlpha;
    const srcA = Math.round(effectiveAlpha * 255);
    const srcR = color[0]; // Keep RGB non-premultiplied
    const srcG = color[1];
    const srcB = color[2];
    
    const fillColor = [srcR, srcG, srcB, srcA];
    const fillRule = rule || 'nonzero';
    
    // Flatten path to polygons
    const polygons = flattenPath(path);
    // Fill polygons with current transform and clipping
    // Use only the new stencil clipping system (clipMask), ignore old clipPath system
    fillPolygons(this.surface, polygons, fillColor, fillRule, this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.stroke = function(path, strokeProps) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to stroke color
    const color = this.currentOp.strokeStyle || [0, 0, 0, 255];
    const globalAlpha = this.currentOp.globalAlpha;
    const effectiveAlpha = (color[3] / 255) * globalAlpha;
    const srcA = Math.round(effectiveAlpha * 255);
    const srcR = color[0]; // Keep RGB non-premultiplied
    const srcG = color[1];
    const srcB = color[2];
    
    const strokeColor = [srcR, srcG, srcB, srcA];
    
    // Generate stroke polygons using geometric approach
    const strokePolygons = generateStrokePolygons(path, strokeProps);
    
    // Fill stroke polygons with current transform and stencil clipping
    fillPolygons(this.surface, strokePolygons, strokeColor, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    throw new Error('Image drawing not implemented in M1');
};