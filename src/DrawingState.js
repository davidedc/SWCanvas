/**
 * DrawingState class for SWCanvas
 * 
 * Encapsulates drawing state management with save/restore stack functionality.
 * Extracted from Context2D to follow Single Responsibility Principle and
 * improve testability of state management logic.
 * 
 * Following Joshua Bloch's principles:
 * - Small, focused class with clear responsibility
 * - Immutable state snapshots
 * - Fail-fast validation
 */
class DrawingState {
    /**
     * Create a DrawingState manager
     * @param {number} surfaceWidth - Surface width for stencil buffer sizing
     * @param {number} surfaceHeight - Surface height for stencil buffer sizing
     */
    constructor(surfaceWidth, surfaceHeight) {
        this._surfaceWidth = surfaceWidth;
        this._surfaceHeight = surfaceHeight;
        
        // State stack for save/restore
        this._stateStack = [];
        
        // Current state (mutable)
        this._currentState = this._createDefaultState();
    }
    
    /**
     * Create default drawing state
     * @returns {Object} Default state object
     * @private
     */
    _createDefaultState() {
        return {
            globalAlpha: 1.0,
            globalCompositeOperation: 'source-over',
            transform: new Transform2D(),
            fillStyle: new Color(0, 0, 0, 255), // Black
            strokeStyle: new Color(0, 0, 0, 255), // Black
            lineWidth: 1.0,
            lineJoin: 'miter',
            lineCap: 'butt',
            miterLimit: 10.0,
            clipMask: null // Lazy-allocated
        };
    }
    
    // Getters for current state
    get globalAlpha() { return this._currentState.globalAlpha; }
    get globalCompositeOperation() { return this._currentState.globalCompositeOperation; }
    get transform() { return this._currentState.transform; }
    get fillStyle() { return this._currentState.fillStyle; }
    get strokeStyle() { return this._currentState.strokeStyle; }
    get lineWidth() { return this._currentState.lineWidth; }
    get lineJoin() { return this._currentState.lineJoin; }
    get lineCap() { return this._currentState.lineCap; }
    get miterLimit() { return this._currentState.miterLimit; }
    get clipMask() { return this._currentState.clipMask; }
    
    // Setters with validation
    set globalAlpha(value) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
            throw new Error('globalAlpha must be a number between 0 and 1');
        }
        this._currentState.globalAlpha = value;
    }
    
    set globalCompositeOperation(value) {
        const validModes = ['source-over', 'copy'];
        if (!validModes.includes(value)) {
            throw new Error(`Invalid composite operation: ${value}. Valid values: ${validModes.join(', ')}`);
        }
        this._currentState.globalCompositeOperation = value;
    }
    
    set transform(value) {
        if (!(value instanceof Transform2D)) {
            throw new Error('transform must be a Transform2D instance');
        }
        this._currentState.transform = value;
    }
    
    set fillStyle(value) {
        if (!(value instanceof Color)) {
            throw new Error('fillStyle must be a Color instance');
        }
        this._currentState.fillStyle = value;
    }
    
    set strokeStyle(value) {
        if (!(value instanceof Color)) {
            throw new Error('strokeStyle must be a Color instance');
        }
        this._currentState.strokeStyle = value;
    }
    
    set lineWidth(value) {
        if (typeof value !== 'number' || value <= 0) {
            throw new Error('lineWidth must be a positive number');
        }
        this._currentState.lineWidth = value;
    }
    
    set lineJoin(value) {
        const validJoins = ['miter', 'round', 'bevel'];
        if (!validJoins.includes(value)) {
            throw new Error(`Invalid line join: ${value}. Valid values: ${validJoins.join(', ')}`);
        }
        this._currentState.lineJoin = value;
    }
    
    set lineCap(value) {
        const validCaps = ['butt', 'round', 'square'];
        if (!validCaps.includes(value)) {
            throw new Error(`Invalid line cap: ${value}. Valid values: ${validCaps.join(', ')}`);
        }
        this._currentState.lineCap = value;
    }
    
    set miterLimit(value) {
        if (typeof value !== 'number' || value <= 0) {
            throw new Error('miterLimit must be a positive number');
        }
        this._currentState.miterLimit = value;
    }
    
    /**
     * Save current state to stack
     * Creates immutable snapshot of current state
     */
    save() {
        // Create deep copy of current state
        const snapshot = {
            globalAlpha: this._currentState.globalAlpha,
            globalCompositeOperation: this._currentState.globalCompositeOperation,
            transform: new Transform2D([
                this._currentState.transform.a, this._currentState.transform.b,
                this._currentState.transform.c, this._currentState.transform.d,
                this._currentState.transform.e, this._currentState.transform.f
            ]),
            fillStyle: this._currentState.fillStyle, // Color is immutable
            strokeStyle: this._currentState.strokeStyle, // Color is immutable
            lineWidth: this._currentState.lineWidth,
            lineJoin: this._currentState.lineJoin,
            lineCap: this._currentState.lineCap,
            miterLimit: this._currentState.miterLimit,
            clipMask: this._currentState.clipMask ? 
                     this._currentState.clipMask.clone() : null
        };
        
        this._stateStack.push(snapshot);
    }
    
    /**
     * Restore state from stack
     * @returns {boolean} True if state was restored, false if stack was empty
     */
    restore() {
        if (this._stateStack.length === 0) {
            return false;
        }
        
        this._currentState = this._stateStack.pop();
        return true;
    }
    
    /**
     * Get current stack depth (for debugging)
     * @returns {number} Number of saved states
     */
    get stackDepth() {
        return this._stateStack.length;
    }
    
    /**
     * Transform operations (convenience methods that update current transform)
     */
    
    /**
     * Apply transform matrix to current transform
     * @param {number} a - Transform2D a component
     * @param {number} b - Transform2D b component
     * @param {number} c - Transform2D c component
     * @param {number} d - Transform2D d component
     * @param {number} e - Transform2D e component
     * @param {number} f - Transform2D f component
     */
    transform(a, b, c, d, e, f) {
        const m = new Transform2D([a, b, c, d, e, f]);
        this._currentState.transform = m.multiply(this._currentState.transform);
    }
    
    /**
     * Set transform matrix (replaces current transform)
     * @param {number} a - Transform2D a component
     * @param {number} b - Transform2D b component
     * @param {number} c - Transform2D c component
     * @param {number} d - Transform2D d component
     * @param {number} e - Transform2D e component
     * @param {number} f - Transform2D f component
     */
    setTransform(a, b, c, d, e, f) {
        this._currentState.transform = new Transform2D([a, b, c, d, e, f]);
    }
    
    /**
     * Reset transform to identity matrix
     */
    resetTransform() {
        this._currentState.transform = new Transform2D();
    }
    
    /**
     * Translate coordinate system
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    translate(x, y) {
        this._currentState.transform = new Transform2D().translate(x, y).multiply(this._currentState.transform);
    }
    
    /**
     * Scale coordinate system
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     */
    scale(sx, sy) {
        this._currentState.transform = new Transform2D().scale(sx, sy).multiply(this._currentState.transform);
    }
    
    /**
     * Rotate coordinate system
     * @param {number} angleInRadians - Rotation angle in radians
     */
    rotate(angleInRadians) {
        this._currentState.transform = new Transform2D().rotate(angleInRadians).multiply(this._currentState.transform);
    }
    
    /**
     * Color style management with type safety
     */
    
    /**
     * Set fill style from RGBA values
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @param {number} a - Alpha (0-255)
     */
    setFillStyleRGBA(r, g, b, a = 255) {
        this._currentState.fillStyle = new Color(r, g, b, a);
    }
    
    /**
     * Set stroke style from RGBA values
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @param {number} a - Alpha (0-255)
     */
    setStrokeStyleRGBA(r, g, b, a = 255) {
        this._currentState.strokeStyle = new Color(r, g, b, a);
    }
    
    /**
     * Clipping management
     */
    
    /**
     * Apply a clipping path
     * @param {Path2D} path - Path to clip with
     * @param {string} fillRule - Fill rule ('nonzero' or 'evenodd')
     */
    applyClip(path, fillRule = 'nonzero') {
        // Lazy-allocate clip mask
        if (!this._currentState.clipMask) {
            this._currentState.clipMask = new ClipMask(
                this._surfaceWidth, 
                this._surfaceHeight
            );
        }
        
        // Note: applyClip method needs to be implemented in ClipMask or handled differently
        // For now, this will need to be refactored to use the path rendering approach
        // from Context2D's clip() method
        throw new Error('DrawingState clipping needs to be refactored to use ClipMask');
    }
    
    /**
     * Check if a pixel is clipped
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @returns {boolean} True if pixel is clipped
     */
    isPixelClipped(x, y) {
        if (!this._currentState.clipMask) {
            return false; // No clipping active
        }
        return this._currentState.clipMask.isPixelClipped(x, y);
    }
    
    /**
     * Get current effective fill color with global alpha applied
     * @returns {Color} Fill color with global alpha
     */
    getEffectiveFillColor() {
        return this._currentState.fillStyle.withGlobalAlpha(this._currentState.globalAlpha);
    }
    
    /**
     * Get current effective stroke color with global alpha applied
     * @returns {Color} Stroke color with global alpha
     */
    getEffectiveStrokeColor() {
        return this._currentState.strokeStyle.withGlobalAlpha(this._currentState.globalAlpha);
    }
    
    /**
     * Get stroke properties object for stroke generator
     * @returns {Object} Stroke properties
     */
    getStrokeProperties() {
        return {
            lineWidth: this._currentState.lineWidth,
            lineJoin: this._currentState.lineJoin,
            lineCap: this._currentState.lineCap,
            miterLimit: this._currentState.miterLimit
        };
    }
    
    /**
     * Get rasterizer parameters for current state
     * @returns {Object} Parameters for Rasterizer.beginOp()
     */
    getRasterizerParams() {
        return {
            composite: this._currentState.globalCompositeOperation,
            globalAlpha: this._currentState.globalAlpha,
            transform: this._currentState.transform,
            clipMask: this._currentState.clipMask
        };
    }
    
    /**
     * Reset all state to defaults (useful for testing)
     */
    reset() {
        this._stateStack = [];
        this._currentState = this._createDefaultState();
    }
    
    /**
     * String representation for debugging
     * @returns {string} State description
     */
    toString() {
        const clipInfo = this._currentState.clipMask ? 
                        this._currentState.clipMask.toString() : 'no clipping';
        return `DrawingState(alpha=${this._currentState.globalAlpha}, stack=${this._stateStack.length}, ${clipInfo})`;
    }
}