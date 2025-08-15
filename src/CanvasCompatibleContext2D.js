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
     * @param {string} value - CSS color string
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
     * @param {string} value - CSS color string
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
        const rgba = this._colorParser.parse(this._fillStyle);
        this._core.setFillStyle(rgba.r, rgba.g, rgba.b, rgba.a);
    }
    
    /**
     * Apply current stroke style to core context
     * @private
     */
    _applyStrokeStyle() {
        const rgba = this._colorParser.parse(this._strokeStyle);
        this._core.setStrokeStyle(rgba.r, rgba.g, rgba.b, rgba.a);
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
        } else if (pathOrFillRule && pathOrFillRule instanceof Path2D) {
            // fill(path, fillRule)
            this._core.fill(pathOrFillRule, fillRule);
        } else {
            // fill()
            this._core.fill();
        }
    }
    
    stroke(path) {
        if (path && path instanceof Path2D) {
            this._core.stroke(path);
        } else {
            this._core.stroke();
        }
    }
    
    clip(pathOrFillRule, fillRule) {
        if (typeof pathOrFillRule === 'string') {
            // clip(fillRule)
            this._core.clip(pathOrFillRule);
        } else if (pathOrFillRule && pathOrFillRule instanceof Path2D) {
            // clip(path, fillRule)
            this._core.clip(pathOrFillRule, fillRule);
        } else {
            // clip()
            this._core.clip();
        }
    }
    
    // ===== IMAGE DRAWING =====
    
    drawImage(image, ...args) {
        // Handle SWCanvasElement specially
        if (image && image instanceof SWCanvasElement) {
            this._core.drawImage(image._imageData, ...args);
        } else {
            this._core.drawImage(image, ...args);
        }
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