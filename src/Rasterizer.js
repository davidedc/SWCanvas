/**
 * Rasterizer class for SWCanvas
 * 
 * Handles low-level pixel operations and rendering pipeline.
 * Converted to ES6 class following Joshua Bloch's effective OO principles.
 * Encapsulates rendering state and provides clear separation of concerns.
 */
class Rasterizer {
    /**
     * Create a Rasterizer
     * @param {Surface} surface - Target surface for rendering
     */
    constructor(surface) {
        if (!surface || typeof surface !== 'object') {
            throw new Error('Rasterizer requires a valid Surface object');
        }
        
        if (!surface.width || !surface.height || !surface.data) {
            throw new Error('Surface must have width, height, and data properties');
        }
        
        this._surface = surface;
        this._currentOp = null;
    }
    
    /**
     * Get the target surface
     * @returns {Surface} Target surface
     */
    get surface() {
        return this._surface;
    }
    
    /**
     * Get current operation state
     * @returns {Object|null} Current operation state
     */
    get currentOp() {
        return this._currentOp;
    }

    /**
     * Begin a rendering operation
     * @param {Object} params - Operation parameters
     */
    beginOp(params = {}) {
        this._validateParams(params);
        
        this._currentOp = {
            composite: params.composite || 'source-over',
            globalAlpha: params.globalAlpha !== undefined ? params.globalAlpha : 1.0,
            transform: params.transform || new Transform2D(),
            clipMask: params.clipMask || null,  // Stencil-based clipping
            fillStyle: params.fillStyle || null,
            strokeStyle: params.strokeStyle || null
        };
    }
    
    /**
     * End the current rendering operation
     */
    endOp() {
        this._currentOp = null;
    }
    
    /**
     * Validate operation parameters
     * @param {Object} params - Parameters to validate
     * @private
     */
    _validateParams(params) {
        if (params.globalAlpha !== undefined) {
            if (typeof params.globalAlpha !== 'number' || params.globalAlpha < 0 || params.globalAlpha > 1) {
                throw new Error('globalAlpha must be a number between 0 and 1');
            }
        }
        
        if (params.composite && !['source-over', 'copy'].includes(params.composite)) {
            throw new Error('Invalid composite operation. Supported: source-over, copy');
        }
        
        if (params.transform && !(params.transform instanceof Transform2D)) {
            throw new Error('transform must be a Transform2D instance');
        }
    }

    /**
     * Ensure an operation is active
     * @private
     */
    _requireActiveOp() {
        if (!this._currentOp) {
            throw new Error('Must call beginOp() before drawing operations');
        }
    }

    /**
     * Check if a pixel should be clipped by stencil buffer
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @returns {boolean} True if pixel should be clipped
     * @private
     */
    _isPixelClipped(x, y) {
        if (!this._currentOp?.clipMask) return false; // No clipping active
        return this._currentOp.clipMask.isPixelClipped(x, y);
    }

    /**
     * Fill a rectangle with solid color
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Array|Color} color - Fill color (RGBA array or Color instance)
     */
    fillRect(x, y, width, height, color) {
        this._requireActiveOp();
        
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' || 
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }
        
        if (width < 0 || height < 0) {
            throw new Error('Rectangle dimensions must be non-negative');
        }
        
        if (width === 0 || height === 0) return; // Nothing to draw
        
        // If there's stencil clipping, convert the rectangle to a path and use path filling
        if (this._currentOp.clipMask) {
            // Create a path for the rectangle
            const rectPath = new Path2D();
            rectPath.rect(x, y, width, height);
            
            // Use the existing path filling logic which handles stencil clipping properly
            this.fill(rectPath, 'nonzero');
            return;
        }
        
        // No clipping - use optimized direct rectangle filling
        // Transform rectangle corners
        const transform = this._currentOp.transform;
        const topLeft = transform.transformPoint({x: x, y: y});
        const topRight = transform.transformPoint({x: x + width, y: y});
        const bottomLeft = transform.transformPoint({x: x, y: y + height});
        const bottomRight = transform.transformPoint({x: x + width, y: y + height});
        
        // Find bounding box in device space
        const minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
        const maxX = Math.min(this._surface.width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
        const minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
        const maxY = Math.min(this._surface.height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
        
        // Optimized path for axis-aligned rectangles
        if (this._currentOp.transform.b === 0 && this._currentOp.transform.c === 0) {
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
            const rectColor = Array.isArray(color) ? PolygonFiller.colorFromRGBA(color) : color;
            PolygonFiller.fillPolygons(this._surface, [rectPolygon], rectColor, 'nonzero', this._currentOp.transform, this._currentOp.clipMask);
        }
    }

    /**
     * Fill axis-aligned rectangle (optimized path)
     * @param {number} x - Rectangle x
     * @param {number} y - Rectangle y 
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Array|Color} color - Fill color
     * @private
     */
    _fillAxisAlignedRect(x, y, width, height, color) {
        const surface = this._surface;
        const globalAlpha = this._currentOp.globalAlpha;
        
        // Apply global alpha to source color (keep non-premultiplied to match surface format)
        const effectiveAlpha = (color[3] / 255) * globalAlpha; // Normalize to 0-1 range
        const srcA = Math.round(effectiveAlpha * 255);
        const srcR = color[0];
        const srcG = color[1];
        const srcB = color[2];
        
        for (let py = y; py < y + height; py++) {
            if (py < 0 || py >= surface.height) continue;
            
            for (let px = x; px < x + width; px++) {
                if (px < 0 || px >= surface.width) continue;
                
                // Check stencil buffer clipping
                if (this._currentOp.clipMask && this._isPixelClipped(px, py)) {
                    continue; // Skip pixels clipped by stencil buffer
                }
                
                const offset = py * surface.stride + px * 4;
                
                if (this._currentOp.composite === 'copy') {
                    // Copy mode
                    surface.data[offset] = srcR;
                    surface.data[offset + 1] = srcG;
                    surface.data[offset + 2] = srcB;
                    surface.data[offset + 3] = srcA;
                } else {
                    // Source-over mode (non-premultiplied alpha blending to match surface format)
                    const dstR = surface.data[offset];
                    const dstG = surface.data[offset + 1];
                    const dstB = surface.data[offset + 2];
                    const dstA = surface.data[offset + 3];
                    
                    const srcAlpha = srcA / 255;
                    const invSrcAlpha = 1 - srcAlpha;
                    
                    // Use non-premultiplied formula (matches original and PolygonFiller)
                    surface.data[offset] = Math.round(srcR * srcAlpha + dstR * invSrcAlpha);
                    surface.data[offset + 1] = Math.round(srcG * srcAlpha + dstG * invSrcAlpha);
                    surface.data[offset + 2] = Math.round(srcB * srcAlpha + dstB * invSrcAlpha);
                    surface.data[offset + 3] = Math.round(srcA + dstA * invSrcAlpha);
                }
            }
        }
    }

    /**
     * Fill a path using the current fill style
     * @param {Path2D} path - Path to fill
     * @param {string} rule - Fill rule ('nonzero' or 'evenodd')
     */
    fill(path, rule) {
        this._requireActiveOp();
        
        // Apply global alpha to fill color
        const colorData = this._currentOp.fillStyle || [0, 0, 0, 255];
        const color = Array.isArray(colorData) ? 
            new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
        const fillColor = color.withGlobalAlpha(this._currentOp.globalAlpha);
        const fillRule = rule || 'nonzero';
        
        // Flatten path to polygons
        const polygons = PathFlattener.flattenPath(path);
        // Fill polygons with current transform and stencil clipping
        PolygonFiller.fillPolygons(this._surface, polygons, fillColor, fillRule, this._currentOp.transform, this._currentOp.clipMask);
    }

    /**
     * Stroke a path using the current stroke style
     * @param {Path2D} path - Path to stroke
     * @param {Object} strokeProps - Stroke properties
     */
    stroke(path, strokeProps) {
        this._requireActiveOp();
        
        // Apply global alpha to stroke color
        const colorData = this._currentOp.strokeStyle || [0, 0, 0, 255];
        const color = Array.isArray(colorData) ? 
            new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
        const strokeColor = color.withGlobalAlpha(this._currentOp.globalAlpha);
        
        // Generate stroke polygons using geometric approach
        const strokePolygons = StrokeGenerator.generateStrokePolygons(path, strokeProps);
        
        // Fill stroke polygons with current transform and stencil clipping
        PolygonFiller.fillPolygons(this._surface, strokePolygons, strokeColor, 'nonzero', this._currentOp.transform, this._currentOp.clipMask);
    }

    /**
     * Draw an image to the surface
     * @param {Object} img - ImageLike object to draw
     * @param {number} sx - Source x (optional)
     * @param {number} sy - Source y (optional)
     * @param {number} sw - Source width (optional)
     * @param {number} sh - Source height (optional)
     * @param {number} dx - Destination x
     * @param {number} dy - Destination y
     * @param {number} dw - Destination width (optional)
     * @param {number} dh - Destination height (optional)
     */
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
        this._requireActiveOp();
        
        // Validate and convert ImageLike (handles RGB→RGBA conversion)
        const imageData = ImageProcessor.validateAndConvert(img);
        
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
        const transform = this._currentOp.transform;
        const topLeft = transform.transformPoint({x: destX, y: destY});
        const topRight = transform.transformPoint({x: destX + destWidth, y: destY});
        const bottomLeft = transform.transformPoint({x: destX, y: destY + destHeight});
        const bottomRight = transform.transformPoint({x: destX + destWidth, y: destY + destHeight});
        
        // Find bounding box in device space
        const minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
        const maxX = Math.min(this._surface.width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
        const minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
        const maxY = Math.min(this._surface.height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
        
        // Get inverse transform for mapping device pixels back to source  
        const inverseTransform = transform.invert();
        
        const globalAlpha = this._currentOp.globalAlpha;
        
        // Render each pixel in the bounding box
        for (let deviceY = minY; deviceY <= maxY; deviceY++) {
            for (let deviceX = minX; deviceX <= maxX; deviceX++) {
                // Check stencil clipping
                if (this._currentOp.clipMask && this._isPixelClipped(deviceX, deviceY)) {
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
                const destOffset = deviceY * this._surface.stride + deviceX * 4;
                
                if (this._currentOp.composite === 'copy' || finalSrcA === 255) {
                    // Direct copy (no blending needed) - store non-premultiplied
                    this._surface.data[destOffset] = srcR;
                    this._surface.data[destOffset + 1] = srcG;
                    this._surface.data[destOffset + 2] = srcB;
                    this._surface.data[destOffset + 3] = finalSrcA;
                } else {
                    // Alpha blending (source-over) - non-premultiplied formula
                    const dstR = this._surface.data[destOffset];
                    const dstG = this._surface.data[destOffset + 1];
                    const dstB = this._surface.data[destOffset + 2];
                    const dstA = this._surface.data[destOffset + 3];
                    
                    const srcAlpha = effectiveAlpha;
                    const invSrcAlpha = 1 - srcAlpha;
                    
                    // Use non-premultiplied formula (consistent with rest of codebase)
                    const newR = Math.round(srcR * srcAlpha + dstR * invSrcAlpha);
                    const newG = Math.round(srcG * srcAlpha + dstG * invSrcAlpha);
                    const newB = Math.round(srcB * srcAlpha + dstB * invSrcAlpha);
                    const newA = Math.round(finalSrcA + dstA * invSrcAlpha);
                    
                    this._surface.data[destOffset] = newR;
                    this._surface.data[destOffset + 1] = newG;
                    this._surface.data[destOffset + 2] = newB;
                    this._surface.data[destOffset + 3] = newA;
                }
            }
        }
    }

}