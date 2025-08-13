function Rasterizer(surface) {
    this.surface = surface;
    this.currentOp = null;
}

Rasterizer.prototype.beginOp = function(params) {
    this.currentOp = {
        composite: params.composite || 'source-over',
        globalAlpha: params.globalAlpha !== undefined ? params.globalAlpha : 1.0,
        transform: params.transform || new Matrix(),
        clipPath: params.clipPath || null
    };
};

Rasterizer.prototype.endOp = function() {
    this.currentOp = null;
};

// Simple solid rectangle fill for M1
Rasterizer.prototype.fillRect = function(x, y, width, height, color) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
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
    
    // For M1, we'll do axis-aligned rectangles only (no rotation support yet)
    if (this.currentOp.transform.b === 0 && this.currentOp.transform.c === 0) {
        this._fillAxisAlignedRect(minX, minY, maxX - minX + 1, maxY - minY + 1, color);
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

// Placeholder implementations for later milestones
Rasterizer.prototype.fill = function(path, rule) {
    throw new Error('Path filling not implemented in M1');
};

Rasterizer.prototype.stroke = function(path) {
    throw new Error('Path stroking not implemented in M1');
};

Rasterizer.prototype.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    throw new Error('Image drawing not implemented in M1');
};