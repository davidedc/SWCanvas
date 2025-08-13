(function() {
'use strict';

function Matrix(init) {
    if (init && init.length === 6) {
        this.a = init[0];
        this.b = init[1]; 
        this.c = init[2];
        this.d = init[3];
        this.e = init[4];
        this.f = init[5];
    } else {
        // Identity matrix
        this.a = 1; this.b = 0;
        this.c = 0; this.d = 1;
        this.e = 0; this.f = 0;
    }
}

Matrix.prototype.multiply = function(other) {
    const result = new Matrix();
    result.a = this.a * other.a + this.b * other.c;
    result.b = this.a * other.b + this.b * other.d;
    result.c = this.c * other.a + this.d * other.c;
    result.d = this.c * other.b + this.d * other.d;
    result.e = this.e * other.a + this.f * other.c + other.e;
    result.f = this.e * other.b + this.f * other.d + other.f;
    return result;
};

Matrix.prototype.translate = function(x, y) {
    const t = new Matrix([1, 0, 0, 1, x, y]);
    return this.multiply(t);
};

Matrix.prototype.scale = function(sx, sy) {
    const s = new Matrix([sx, 0, 0, sy, 0, 0]);
    return this.multiply(s);
};

Matrix.prototype.rotate = function(angleInRadians) {
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);
    const r = new Matrix([cos, sin, -sin, cos, 0, 0]);
    return this.multiply(r);
};

Matrix.prototype.invert = function() {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) {
        throw new Error('Matrix is not invertible');
    }
    
    const result = new Matrix();
    result.a = this.d / det;
    result.b = -this.b / det;
    result.c = -this.c / det;
    result.d = this.a / det;
    result.e = (this.c * this.f - this.d * this.e) / det;
    result.f = (this.b * this.e - this.a * this.f) / det;
    return result;
};

Matrix.prototype.transformPoint = function(point) {
    return {
        x: this.a * point.x + this.c * point.y + this.e,
        y: this.b * point.x + this.d * point.y + this.f
    };
};function Path2D() {
    this.commands = [];
}

Path2D.prototype.closePath = function() {
    this.commands.push({type: 'closePath'});
};

Path2D.prototype.moveTo = function(x, y) {
    this.commands.push({type: 'moveTo', x: x, y: y});
};

Path2D.prototype.lineTo = function(x, y) {
    this.commands.push({type: 'lineTo', x: x, y: y});
};

Path2D.prototype.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.commands.push({
        type: 'bezierCurveTo',
        cp1x: cp1x, cp1y: cp1y,
        cp2x: cp2x, cp2y: cp2y,
        x: x, y: y
    });
};

Path2D.prototype.quadraticCurveTo = function(cpx, cpy, x, y) {
    this.commands.push({
        type: 'quadraticCurveTo',
        cpx: cpx, cpy: cpy,
        x: x, y: y
    });
};

Path2D.prototype.rect = function(x, y, w, h) {
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
};

Path2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
    this.commands.push({
        type: 'arc',
        x: x, y: y,
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle,
        counterclockwise: !!counterclockwise
    });
};

Path2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
    this.commands.push({
        type: 'ellipse',
        x: x, y: y,
        radiusX: radiusX,
        radiusY: radiusY,
        rotation: rotation,
        startAngle: startAngle,
        endAngle: endAngle,
        counterclockwise: !!counterclockwise
    });
};function createSurface(width, height) {
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
}function encodeBMP(surface) {
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
}function Rasterizer(surface) {
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
};function Context2D(surface) {
    this.surface = surface;
    this.rasterizer = new Rasterizer(surface);
    
    // State stack
    this.stateStack = [];
    
    // Current state
    this.globalAlpha = 1.0;
    this.globalCompositeOperation = 'source-over';
    this._transform = new Matrix();
    this._fillStyle = [0, 0, 0, 255]; // Black, non-premultiplied
    this._strokeStyle = [0, 0, 0, 255]; // Black, non-premultiplied
    
    // Internal path
    this._currentPath = new Path2D();
}

// State management
Context2D.prototype.save = function() {
    this.stateStack.push({
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        transform: new Matrix([this._transform.a, this._transform.b, this._transform.c, 
                              this._transform.d, this._transform.e, this._transform.f]),
        fillStyle: this._fillStyle.slice(),
        strokeStyle: this._strokeStyle.slice()
    });
};

Context2D.prototype.restore = function() {
    if (this.stateStack.length === 0) return;
    
    const state = this.stateStack.pop();
    this.globalAlpha = state.globalAlpha;
    this.globalCompositeOperation = state.globalCompositeOperation;
    this._transform = state.transform;
    this._fillStyle = state.fillStyle;
    this._strokeStyle = state.strokeStyle;
};

// Transform methods
Context2D.prototype.transform = function(a, b, c, d, e, f) {
    const m = new Matrix([a, b, c, d, e, f]);
    this._transform = this._transform.multiply(m);
};

Context2D.prototype.setTransform = function(a, b, c, d, e, f) {
    this._transform = new Matrix([a, b, c, d, e, f]);
};

Context2D.prototype.resetTransform = function() {
    this._transform = new Matrix();
};

// Style setters (simplified for M1)
Context2D.prototype.setFillStyle = function(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form
    this._fillStyle = [r, g, b, a];
};

Context2D.prototype.setStrokeStyle = function(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form  
    this._strokeStyle = [r, g, b, a];
};

// Path methods (delegated to internal path)
Context2D.prototype.beginPath = function() {
    this._currentPath = new Path2D();
};

Context2D.prototype.closePath = function() {
    this._currentPath.closePath();
};

Context2D.prototype.moveTo = function(x, y) {
    this._currentPath.moveTo(x, y);
};

Context2D.prototype.lineTo = function(x, y) {
    this._currentPath.lineTo(x, y);
};

Context2D.prototype.rect = function(x, y, w, h) {
    this._currentPath.rect(x, y, w, h);
};

// Drawing methods - simplified for M1 (only rectangles)
Context2D.prototype.fillRect = function(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform
    });
    
    this.rasterizer.fillRect(x, y, width, height, this._fillStyle);
    this.rasterizer.endOp();
};

Context2D.prototype.strokeRect = function(x, y, width, height) {
    throw new Error('strokeRect not implemented in M1');
};

Context2D.prototype.clearRect = function(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: 'copy',
        globalAlpha: 1.0,
        transform: this._transform
    });
    
    this.rasterizer.fillRect(x, y, width, height, [0, 0, 0, 0]); // Transparent
    this.rasterizer.endOp();
};

// Placeholder methods for later milestones
Context2D.prototype.fill = function(path, rule) {
    throw new Error('Path filling not implemented in M1');
};

Context2D.prototype.stroke = function(path) {
    throw new Error('Path stroking not implemented in M1');
};
// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
}

})();
