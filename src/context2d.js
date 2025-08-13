// Bit manipulation helpers for 1-bit stencil buffer
function getBit(buffer, pixelIndex) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
}

function setBit(buffer, pixelIndex, value) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    if (value) {
        buffer[byteIndex] |= (1 << bitIndex);
    } else {
        buffer[byteIndex] &= ~(1 << bitIndex);
    }
}

function clearMask(buffer) {
    buffer.fill(0);
}

function createClipMask(width, height) {
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

// Memory management helpers for Context2D
function ensureClipMask(context) {
    if (!context._clipMask) {
        context._clipMask = createClipMask(context.surface.width, context.surface.height);
    }
    return context._clipMask;
}

function releaseClipMask(context) {
    // For now, we don't auto-release clipMask to keep implementation simple
    // In a full implementation, we might check if the mask is "all 1s" and release it
    // context._clipMask = null;
}

// Phase B: Clip pixel writer for temporary clip buffer
function createClipPixelWriter(tempClipBuffer, width, height) {
    return function clipPixel(x, y, coverage) {
        // Bounds checking
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        
        // Convert coverage to binary (1 bit): >0.5 means inside, <=0.5 means outside
        const pixelIndex = y * width + x;
        const isInside = coverage > 0.5;
        setBit(tempClipBuffer, pixelIndex, isInside);
    };
}

// Helper to check if a pixel should be clipped
function isPixelClipped(clipMask, x, y, width) {
    if (!clipMask) return false; // No clipping active
    const pixelIndex = y * width + x;
    return getBit(clipMask, pixelIndex) === 0; // 0 means clipped out
}

function Context2D(surface) {
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
    
    // Stroke properties
    this.lineWidth = 1.0;
    this.lineJoin = 'miter';  // 'miter', 'round', 'bevel'
    this.lineCap = 'butt';    // 'butt', 'round', 'square'
    this.miterLimit = 10.0;
    
    // Internal path and clipping
    this._currentPath = new Path2D();
    
    // Stencil-based clipping system (only clipping mechanism)
    this._clipMask = null;  // Uint8Array with 1 bit per pixel for clipping
}

// State management
Context2D.prototype.save = function() {
    // Deep copy clipMask if it exists
    let clipMaskCopy = null;
    if (this._clipMask) {
        clipMaskCopy = new Uint8Array(this._clipMask);
    }
    
    this.stateStack.push({
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        transform: new Matrix([this._transform.a, this._transform.b, this._transform.c, 
                              this._transform.d, this._transform.e, this._transform.f]),
        fillStyle: this._fillStyle.slice(),
        strokeStyle: this._strokeStyle.slice(),
        clipMask: clipMaskCopy,   // Deep copy of stencil buffer
        lineWidth: this.lineWidth,
        lineJoin: this.lineJoin,
        lineCap: this.lineCap,
        miterLimit: this.miterLimit
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
    
    // Restore clipMask (may be null)
    this._clipMask = state.clipMask;
    
    this.lineWidth = state.lineWidth;
    this.lineJoin = state.lineJoin;
    this.lineCap = state.lineCap;
    this.miterLimit = state.miterLimit;
};

// Transform methods
Context2D.prototype.transform = function(a, b, c, d, e, f) {
    const m = new Matrix([a, b, c, d, e, f]);
    this._transform = m.multiply(this._transform);
};

Context2D.prototype.setTransform = function(a, b, c, d, e, f) {
    this._transform = new Matrix([a, b, c, d, e, f]);
};

Context2D.prototype.resetTransform = function() {
    this._transform = new Matrix();
};

// Convenience transform methods
Context2D.prototype.translate = function(x, y) {
    this._transform = new Matrix().translate(x, y).multiply(this._transform);
};

Context2D.prototype.scale = function(sx, sy) {
    this._transform = new Matrix().scale(sx, sy).multiply(this._transform);
};

Context2D.prototype.rotate = function(angleInRadians) {
    this._transform = new Matrix().rotate(angleInRadians).multiply(this._transform);
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

Context2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
    this._currentPath.arc(x, y, radius, startAngle, endAngle, counterclockwise);
};

Context2D.prototype.quadraticCurveTo = function(cpx, cpy, x, y) {
    this._currentPath.quadraticCurveTo(cpx, cpy, x, y);
};

Context2D.prototype.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
};

// Drawing methods - simplified for M1 (only rectangles)
Context2D.prototype.fillRect = function(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipMask: this._clipMask,
        fillStyle: this._fillStyle
    });
    
    this.rasterizer.fillRect(x, y, width, height, this._fillStyle);
    this.rasterizer.endOp();
};

Context2D.prototype.strokeRect = function(x, y, width, height) {
    // Create a rectangular path
    const rectPath = new Path2D();
    rectPath.rect(x, y, width, height);
    rectPath.closePath();
    
    // Stroke the path using existing stroke infrastructure
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipMask: this._clipMask,
        strokeStyle: this._strokeStyle
    });
    
    this.rasterizer.stroke(rectPath, {
        lineWidth: this.lineWidth,
        lineJoin: this.lineJoin,
        lineCap: this.lineCap,
        miterLimit: this.miterLimit
    });
    
    this.rasterizer.endOp();
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

// M2: Path drawing methods
Context2D.prototype.fill = function(path, rule) {
    let pathToFill, fillRule;
    
    // Handle different argument combinations:
    // fill() -> path = undefined, rule = undefined
    // fill('evenodd') -> path = 'evenodd', rule = undefined  
    // fill(path2d) -> path = path2d object, rule = undefined
    // fill(path2d, 'evenodd') -> path = path2d object, rule = 'evenodd'
    
    if (arguments.length === 0) {
        // fill() - use current path, nonzero rule
        pathToFill = this._currentPath;
        fillRule = 'nonzero';
    } else if (arguments.length === 1) {
        if (typeof path === 'string') {
            // fill('evenodd') - use current path, specified rule
            pathToFill = this._currentPath;
            fillRule = path;
        } else {
            // fill(path2d) - use specified path, nonzero rule
            pathToFill = path;
            fillRule = 'nonzero';
        }
    } else {
        // fill(path2d, 'evenodd') - use specified path and rule
        pathToFill = path;
        fillRule = rule;
    }
    
    fillRule = fillRule || 'nonzero';
    
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipMask: this._clipMask,
        fillStyle: this._fillStyle
    });
    
    this.rasterizer.fill(pathToFill, fillRule);
    this.rasterizer.endOp();
};

Context2D.prototype.stroke = function(path) {
    // Use specified path or current internal path
    const pathToStroke = path || this._currentPath;
    
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipMask: this._clipMask,
        strokeStyle: this._strokeStyle
    });
    
    this.rasterizer.stroke(pathToStroke, {
        lineWidth: this.lineWidth,
        lineJoin: this.lineJoin,
        lineCap: this.lineCap,
        miterLimit: this.miterLimit
    });
    
    this.rasterizer.endOp();
};

// Enhanced clipping support with stencil buffer intersection
Context2D.prototype.clip = function(path, rule) {
    // If no path provided, use current internal path
    const pathToClip = path || this._currentPath;
    const clipRule = rule || 'nonzero';
    
    // Create temporary clip buffer to render this clip path
    const tempClipBuffer = createClipMask(this.surface.width, this.surface.height);
    clearMask(tempClipBuffer); // Start with all 0s (all clipped)
    
    // Create clip pixel writer that writes to the temporary buffer
    const clipPixelWriter = createClipPixelWriter(tempClipBuffer, this.surface.width, this.surface.height);
    
    // Render the clip path to the temporary buffer using fill logic
    // We need to temporarily set up a "fake" rendering operation
    const originalFillStyle = this._fillStyle;
    this._fillStyle = [255, 255, 255, 255]; // White (doesn't matter for clipping)
    
    // Flatten path and fill to temporary clip buffer
    const polygons = flattenPath(pathToClip);
    
    // Use a modified version of fillPolygons that writes to our clip buffer
    this._fillPolygonsToClipBuffer(polygons, clipRule, tempClipBuffer);
    
    // Restore original fill style
    this._fillStyle = originalFillStyle;
    
    // Intersect with existing clip mask (if any)
    if (this._clipMask) {
        // AND operation: existing mask & new mask
        for (let i = 0; i < tempClipBuffer.length; i++) {
            this._clipMask[i] &= tempClipBuffer[i];
        }
    } else {
        // First clip - use the temporary buffer as the new clip mask
        this._clipMask = tempClipBuffer;
    }
};

// Helper method to fill polygons directly to a clip buffer
Context2D.prototype._fillPolygonsToClipBuffer = function(polygons, fillRule, clipBuffer) {
    if (polygons.length === 0) return;
    
    const surface = this.surface;  // Need width/height for bounds
    
    // Transform all polygon vertices
    const transformedPolygons = polygons.map(poly => 
        poly.map(point => this._transform.transformPoint(point))
    );
    
    // Find bounding box
    let minY = Infinity, maxY = -Infinity;
    for (const poly of transformedPolygons) {
        for (const point of poly) {
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
    }
    
    // Clamp to surface bounds
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(surface.height - 1, Math.ceil(maxY));
    
    // Process each scanline (similar to fillPolygons but writes to clip buffer)
    for (let y = minY; y <= maxY; y++) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of transformedPolygons) {
            this._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        this._fillClipSpans(y, intersections, fillRule, clipBuffer);
    }
};

// Helper method to find polygon intersections (copied from polygon-filler.js)
Context2D.prototype._findPolygonIntersections = function(polygon, y, intersections) {
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        // Skip horizontal edges
        if (Math.abs(p1.y - p2.y) < 1e-10) continue;
        
        // Check if scanline crosses this edge
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        
        if (y >= minY && y < maxY) { // Note: < maxY to avoid double-counting vertices
            // Calculate intersection point
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            // Determine winding direction
            const winding = p2.y > p1.y ? 1 : -1;
            
            intersections.push({x: x, winding: winding});
        }
    }
};

// Helper method to fill clip spans (writes to clip buffer instead of surface)
Context2D.prototype._fillClipSpans = function(y, intersections, fillRule, clipBuffer) {
    if (intersections.length === 0) return;
    
    let windingNumber = 0;
    let inside = false;
    
    for (let i = 0; i < intersections.length; i++) {
        const intersection = intersections[i];
        const nextIntersection = intersections[i + 1];
        
        // Update winding number
        windingNumber += intersection.winding;
        
        // Determine if we're inside based on fill rule
        const wasInside = inside;
        if (fillRule === 'evenodd') {
            inside = (windingNumber % 2) !== 0;
        } else { // nonzero
            inside = windingNumber !== 0;
        }
        
        // Fill span if we're inside
        if (inside && nextIntersection) {
            const startX = Math.max(0, Math.ceil(intersection.x));
            const endX = Math.min(this.surface.width - 1, Math.floor(nextIntersection.x));
            
            for (let x = startX; x <= endX; x++) {
                const pixelIndex = y * this.surface.width + x;
                setBit(clipBuffer, pixelIndex, 1); // Set bit to 1 (inside clip region)
            }
        }
    }
};