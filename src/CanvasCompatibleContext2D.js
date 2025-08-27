/**
 * CanvasCompatibleContext2D
 * 
 * HTML5 Canvas 2D Context-compatible wrapper around SWCanvas Core Context2D.
 * Provides the standard HTML5 Canvas API with property setters/getters and
 * CSS color support while delegating actual rendering to the Core implementation.
 */
class CanvasCompatibleContext2D {
    constructor(surface) {
        this._core = new Context2D(surface);
        this._colorParser = new ColorParser();
        
        // Property state (mirroring HTML5 Canvas behavior)
        this._fillStyle = '#000000';
        this._strokeStyle = '#000000';
    }
    
    /**
     * Update the underlying surface (called when canvas is resized)
     * @param {Surface} newSurface - New surface instance
     * @private
     */
    _updateSurface(newSurface) {
        this._core = new Context2D(newSurface);
        
        // Reapply current styles to new context
        this._applyFillStyle();
        this._applyStrokeStyle();
    }
    
    // ===== STYLE PROPERTIES =====
    
    /**
     * Get fill style
     * @returns {string} Current fill style as CSS color
     */
    get fillStyle() {
        return this._fillStyle;
    }
    
    /**
     * Set fill style
     * @param {string|Gradient|Pattern} value - CSS color string or paint source
     */
    set fillStyle(value) {
        this._fillStyle = value;
        this._applyFillStyle();
    }
    
    /**
     * Get stroke style
     * @returns {string} Current stroke style as CSS color
     */
    get strokeStyle() {
        return this._strokeStyle;
    }
    
    /**
     * Set stroke style
     * @param {string|Gradient|Pattern} value - CSS color string or paint source
     */
    set strokeStyle(value) {
        this._strokeStyle = value;
        this._applyStrokeStyle();
    }
    
    /**
     * Apply current fill style to core context
     * @private
     */
    _applyFillStyle() {
        if (this._fillStyle instanceof Gradient || 
            this._fillStyle instanceof LinearGradient ||
            this._fillStyle instanceof RadialGradient ||
            this._fillStyle instanceof ConicGradient ||
            this._fillStyle instanceof Pattern) {
            // Pass gradient/pattern directly to core
            this._core.setFillStyle(this._fillStyle);
        } else {
            // Parse CSS color string
            const rgba = this._colorParser.parse(this._fillStyle);
            this._core.setFillStyle(rgba.r, rgba.g, rgba.b, rgba.a);
        }
    }
    
    /**
     * Apply current stroke style to core context
     * @private
     */
    _applyStrokeStyle() {
        if (this._strokeStyle instanceof Gradient || 
            this._strokeStyle instanceof LinearGradient ||
            this._strokeStyle instanceof RadialGradient ||
            this._strokeStyle instanceof ConicGradient ||
            this._strokeStyle instanceof Pattern) {
            // Pass gradient/pattern directly to core
            this._core.setStrokeStyle(this._strokeStyle);
        } else {
            // Parse CSS color string
            const rgba = this._colorParser.parse(this._strokeStyle);
            this._core.setStrokeStyle(rgba.r, rgba.g, rgba.b, rgba.a);
        }
    }
    
    // ===== DIRECT PROPERTY DELEGATION =====
    
    get globalAlpha() { return this._core.globalAlpha; }
    set globalAlpha(value) { this._core.globalAlpha = value; }
    
    get globalCompositeOperation() { return this._core.globalCompositeOperation; }
    set globalCompositeOperation(value) { this._core.globalCompositeOperation = value; }
    
    get lineWidth() { return this._core.lineWidth; }
    set lineWidth(value) { this._core.lineWidth = value; }
    
    get lineJoin() { return this._core.lineJoin; }
    set lineJoin(value) { this._core.lineJoin = value; }
    
    get lineCap() { return this._core.lineCap; }
    set lineCap(value) { this._core.lineCap = value; }
    
    get miterLimit() { return this._core.miterLimit; }
    set miterLimit(value) { this._core.miterLimit = value; }
    
    get lineDashOffset() { return this._core.lineDashOffset; }
    set lineDashOffset(value) { this._core.lineDashOffset = value; }
    
    // ===== STATE MANAGEMENT =====
    
    save() {
        this._core.save();
    }
    
    restore() {
        this._core.restore();
    }
    
    // ===== TRANSFORMS =====
    
    transform(a, b, c, d, e, f) {
        this._core.transform(a, b, c, d, e, f);
    }
    
    setTransform(a, b, c, d, e, f) {
        this._core.setTransform(a, b, c, d, e, f);
    }
    
    resetTransform() {
        this._core.resetTransform();
    }
    
    translate(x, y) {
        this._core.translate(x, y);
    }
    
    scale(sx, sy) {
        this._core.scale(sx, sy);
    }
    
    rotate(angleInRadians) {
        this._core.rotate(angleInRadians);
    }
    
    // ===== PATH METHODS =====
    
    beginPath() {
        this._core.beginPath();
    }
    
    closePath() {
        this._core.closePath();
    }
    
    moveTo(x, y) {
        this._core.moveTo(x, y);
    }
    
    lineTo(x, y) {
        this._core.lineTo(x, y);
    }
    
    rect(x, y, w, h) {
        this._core.rect(x, y, w, h);
    }
    
    arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        this._core.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }
    
    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise = false) {
        this._core.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }
    
    arcTo(x1, y1, x2, y2, radius) {
        this._core.arcTo(x1, y1, x2, y2, radius);
    }
    
    quadraticCurveTo(cpx, cpy, x, y) {
        this._core.quadraticCurveTo(cpx, cpy, x, y);
    }
    
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this._core.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    
    // ===== DRAWING METHODS =====
    
    fillRect(x, y, width, height) {
        this._core.fillRect(x, y, width, height);
    }
    
    strokeRect(x, y, width, height) {
        this._core.strokeRect(x, y, width, height);
    }
    
    clearRect(x, y, width, height) {
        this._core.clearRect(x, y, width, height);
    }
    
    fill(pathOrFillRule, fillRule) {
        if (typeof pathOrFillRule === 'string') {
            // fill(fillRule)
            this._core.fill(pathOrFillRule);
        } else if (pathOrFillRule && pathOrFillRule instanceof SWPath2D) {
            // fill(path, fillRule)
            this._core.fill(pathOrFillRule, fillRule);
        } else {
            // fill()
            this._core.fill();
        }
    }
    
    stroke(path) {
        if (path && path instanceof SWPath2D) {
            this._core.stroke(path);
        } else {
            this._core.stroke();
        }
    }
    
    isPointInPath() {
        return this._core.isPointInPath.apply(this._core, arguments);
    }
    
    isPointInStroke() {
        return this._core.isPointInStroke.apply(this._core, arguments);
    }
    
    // Line dash methods
    setLineDash(segments) {
        this._core.setLineDash(segments);
    }
    
    getLineDash() {
        return this._core.getLineDash();
    }
    
    clip(pathOrFillRule, fillRule) {
        if (typeof pathOrFillRule === 'string') {
            // clip(fillRule)
            this._core.clip(pathOrFillRule);
        } else if (pathOrFillRule && pathOrFillRule instanceof SWPath2D) {
            // clip(path, fillRule)
            this._core.clip(pathOrFillRule, fillRule);
        } else {
            // clip()
            this._core.clip();
        }
    }
    
    // ===== IMAGE DRAWING =====
    
    drawImage(image, ...args) {
        // Debug logging for browser troubleshooting
        if (typeof console !== 'undefined' && console.log) {
            console.log('CanvasCompatibleContext2D.drawImage called with:', {
                imageType: image ? image.constructor.name : 'null',
                hasGetContext: image && typeof image.getContext === 'function',
                hasWidth: image ? typeof image.width : 'N/A',
                hasHeight: image ? typeof image.height : 'N/A', 
                hasData: image ? !!image.data : 'N/A',
                isSWCanvasElement: image instanceof SWCanvasElement,
                argsLength: args.length
            });
        }
        
        // Handle SWCanvasElement specially
        if (image && image instanceof SWCanvasElement) {
            this._core.drawImage(image._imageData, ...args);
        } else if (image && typeof image === 'object' && image.getContext && typeof image.getContext === 'function') {
            // Handle HTMLCanvasElement (has getContext method)
            const ctx = image.getContext('2d');
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            this._core.drawImage(imageData, ...args);
        } else if (image && typeof image === 'object' && image.width && image.height && image.data) {
            // Handle ImageLike objects (duck typing)
            this._core.drawImage(image, ...args);
        } else {
            // Fallback to core implementation (includes HTMLImageElement and other types)
            this._core.drawImage(image, ...args);
        }
    }
    
    // ===== IMAGE DATA API =====
    
    /**
     * Create new ImageData object with specified dimensions
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {Object} ImageData-like object
     */
    createImageData(width, height) {
        if (typeof width !== 'number' || width <= 0 || !Number.isInteger(width)) {
            throw new Error('Width must be a positive integer');
        }
        if (typeof height !== 'number' || height <= 0 || !Number.isInteger(height)) {
            throw new Error('Height must be a positive integer');
        }
        
        return {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 4)
        };
    }
    
    /**
     * Get ImageData from a rectangular region
     * @param {number} x - X coordinate of rectangle
     * @param {number} y - Y coordinate of rectangle  
     * @param {number} width - Width of rectangle
     * @param {number} height - Height of rectangle
     * @returns {Object} ImageData-like object
     */
    getImageData(x, y, width, height) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Coordinates must be numbers');
        }
        if (typeof width !== 'number' || width <= 0 || !Number.isInteger(width)) {
            throw new Error('Width must be a positive integer');
        }
        if (typeof height !== 'number' || height <= 0 || !Number.isInteger(height)) {
            throw new Error('Height must be a positive integer');
        }
        
        // Create ImageData object
        const imageData = this.createImageData(width, height);
        const surface = this._core.surface;
        
        // Copy pixel data from surface to ImageData
        for (let row = 0; row < height; row++) {
            const surfaceRow = Math.floor(y) + row;
            const imageRow = row;
            
            if (surfaceRow >= 0 && surfaceRow < surface.height) {
                for (let col = 0; col < width; col++) {
                    const surfaceCol = Math.floor(x) + col;
                    const imageCol = col;
                    
                    if (surfaceCol >= 0 && surfaceCol < surface.width) {
                        const surfaceOffset = surfaceRow * surface.stride + surfaceCol * 4;
                        const imageOffset = imageRow * width * 4 + imageCol * 4;
                        
                        imageData.data[imageOffset] = surface.data[surfaceOffset];
                        imageData.data[imageOffset + 1] = surface.data[surfaceOffset + 1];
                        imageData.data[imageOffset + 2] = surface.data[surfaceOffset + 2];
                        imageData.data[imageOffset + 3] = surface.data[surfaceOffset + 3];
                    }
                }
            }
        }
        
        return imageData;
    }
    
    /**
     * Put ImageData onto the canvas at specified position
     * @param {Object} imageData - ImageData-like object
     * @param {number} dx - Destination x coordinate
     * @param {number} dy - Destination y coordinate
     */
    putImageData(imageData, dx, dy) {
        if (!imageData || typeof imageData !== 'object') {
            throw new Error('ImageData must be an object');
        }
        if (typeof imageData.width !== 'number' || typeof imageData.height !== 'number') {
            throw new Error('ImageData must have numeric width and height');
        }
        if (!(imageData.data instanceof Uint8ClampedArray)) {
            throw new Error('ImageData data must be a Uint8ClampedArray');
        }
        if (typeof dx !== 'number' || typeof dy !== 'number') {
            throw new Error('Destination coordinates must be numbers');
        }
        
        const surface = this._core.surface;
        
        // Copy pixel data from ImageData to surface
        for (let row = 0; row < imageData.height; row++) {
            const surfaceRow = Math.floor(dy) + row;
            const imageRow = row;
            
            if (surfaceRow >= 0 && surfaceRow < surface.height) {
                for (let col = 0; col < imageData.width; col++) {
                    const surfaceCol = Math.floor(dx) + col;
                    const imageCol = col;
                    
                    if (surfaceCol >= 0 && surfaceCol < surface.width) {
                        const surfaceOffset = surfaceRow * surface.stride + surfaceCol * 4;
                        const imageOffset = imageRow * imageData.width * 4 + imageCol * 4;
                        
                        surface.data[surfaceOffset] = imageData.data[imageOffset];
                        surface.data[surfaceOffset + 1] = imageData.data[imageOffset + 1];
                        surface.data[surfaceOffset + 2] = imageData.data[imageOffset + 2];
                        surface.data[surfaceOffset + 3] = imageData.data[imageOffset + 3];
                    }
                }
            }
        }
    }
    
    // ===== GRADIENT AND PATTERN METHODS =====
    
    /**
     * Create a linear gradient
     * @param {number} x0 - Start point x coordinate
     * @param {number} y0 - Start point y coordinate
     * @param {number} x1 - End point x coordinate
     * @param {number} y1 - End point y coordinate
     * @returns {LinearGradient} New linear gradient object
     */
    createLinearGradient(x0, y0, x1, y1) {
        return this._core.createLinearGradient(x0, y0, x1, y1);
    }
    
    /**
     * Create a radial gradient
     * @param {number} x0 - Inner circle center x
     * @param {number} y0 - Inner circle center y
     * @param {number} r0 - Inner circle radius
     * @param {number} x1 - Outer circle center x
     * @param {number} y1 - Outer circle center y
     * @param {number} r1 - Outer circle radius
     * @returns {RadialGradient} New radial gradient object
     */
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
        return this._core.createRadialGradient(x0, y0, r0, x1, y1, r1);
    }
    
    /**
     * Create a conic gradient
     * @param {number} angle - Starting angle in radians
     * @param {number} x - Center point x coordinate
     * @param {number} y - Center point y coordinate
     * @returns {ConicGradient} New conic gradient object
     */
    createConicGradient(angle, x, y) {
        return this._core.createConicGradient(angle, x, y);
    }
    
    /**
     * Create a pattern from an image
     * @param {Object} image - ImageLike object (canvas, surface, imagedata)
     * @param {string} repetition - Repetition mode: 'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
     * @returns {Pattern} New pattern object
     */
    createPattern(image, repetition) {
        return this._core.createPattern(image, repetition);
    }
    
    // ===== CORE ACCESS FOR ADVANCED USERS =====
    
    /**
     * Get the underlying Core Context2D for advanced operations
     * @returns {Context2D} The Core Context2D instance
     */
    get _coreContext() {
        return this._core;
    }
}