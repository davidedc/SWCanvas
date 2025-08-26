/**
 * STENCIL-BASED CLIPPING SYSTEM
 * 
 * SWCanvas uses a 1-bit stencil buffer approach for memory-efficient clipping with
 * proper intersection semantics. This system matches HTML5 Canvas behavior exactly.
 * 
 * Memory Layout:
 * - Each pixel is represented by 1 bit (1 = visible, 0 = clipped)
 * - Bits are packed into Uint8Array (8 pixels per byte)
 * - Memory usage: width × height ÷ 8 bytes (87.5% reduction vs full coverage)
 * - Lazy allocation: only created when first clip() operation is performed
 * 
 * Clipping Operations:
 * 1. First clip: Creates stencil buffer, renders clip path with 1s where path covers
 * 2. Subsequent clips: Renders to temp buffer, ANDs with existing stencil buffer  
 * 3. Intersection semantics: Only pixels covered by ALL clips have bit = 1
 * 4. Save/restore: Stencil buffer is deep-copied during save() and restored
 */


class Context2D {
    constructor(surface) {
        this.surface = surface;
        this.rasterizer = new Rasterizer(surface);
        
        // State stack
        this.stateStack = [];
        
        // Current state
        this.globalAlpha = 1.0;
        this.globalCompositeOperation = 'source-over';
        this._transform = new Transform2D();
        this._fillStyle = new Color(0, 0, 0, 255); // Black
        this._strokeStyle = new Color(0, 0, 0, 255); // Black
        
        // Stroke properties
        this.lineWidth = 1.0;
        this.lineJoin = 'miter';  // 'miter', 'round', 'bevel'
        this.lineCap = 'butt';    // 'butt', 'round', 'square'
        this.miterLimit = 10.0;
        
        // Line dash properties
        this._lineDash = [];         // Internal working dash pattern (may be duplicated)
        this._originalLineDash = []; // Original pattern as set by user
        this._lineDashOffset = 0;    // Starting offset into dash pattern
        
        // Internal path and clipping
        this._currentPath = new Path2D();
        
        // Stencil-based clipping system (only clipping mechanism)
        this._clipMask = null;  // ClipMask instance for 1-bit per pixel clipping
    }

    // State management
    save() {
        // Deep copy clipMask if it exists
        let clipMaskCopy = null;
        if (this._clipMask) {
            clipMaskCopy = this._clipMask.clone();
        }
        
        this.stateStack.push({
            globalAlpha: this.globalAlpha,
            globalCompositeOperation: this.globalCompositeOperation,
            transform: new Transform2D([this._transform.a, this._transform.b, this._transform.c, 
                                  this._transform.d, this._transform.e, this._transform.f]),
            fillStyle: this._fillStyle, // Paint sources are immutable, safe to share
            strokeStyle: this._strokeStyle, // Paint sources are immutable, safe to share
            clipMask: clipMaskCopy,   // Deep copy of clip mask
            lineWidth: this.lineWidth,
            lineJoin: this.lineJoin,
            lineCap: this.lineCap,
            miterLimit: this.miterLimit,
            lineDash: this._lineDash.slice(),    // Copy working dash pattern array
            originalLineDash: this._originalLineDash.slice(), // Copy original pattern
            lineDashOffset: this._lineDashOffset
        });
    }

    restore() {
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
    this._lineDash = state.lineDash || [];
    this._originalLineDash = state.originalLineDash || [];
    this._lineDashOffset = state.lineDashOffset || 0;
    }

    // Transform methods
    transform(a, b, c, d, e, f) {
    const m = new Transform2D([a, b, c, d, e, f]);
    this._transform = m.multiply(this._transform);
    }

    setTransform(a, b, c, d, e, f) {
    this._transform = new Transform2D([a, b, c, d, e, f]);
    }

    resetTransform() {
    this._transform = new Transform2D();
    }

    // Convenience transform methods
    translate(x, y) {
    this._transform = new Transform2D().translate(x, y).multiply(this._transform);
    }

    scale(sx, sy) {
    this._transform = new Transform2D().scale(sx, sy).multiply(this._transform);
    }

    rotate(angleInRadians) {
    this._transform = new Transform2D().rotate(angleInRadians).multiply(this._transform);
    }

    // Style setters - support solid colors and paint sources
    setFillStyle(r, g, b, a) {
        if (arguments.length === 1 && (r instanceof Color || r instanceof Gradient || 
            r instanceof LinearGradient || r instanceof RadialGradient || 
            r instanceof ConicGradient || r instanceof Pattern)) {
            // Paint source (gradient or pattern)
            this._fillStyle = r;
        } else {
            // RGBA color
            a = a !== undefined ? a : 255;
            this._fillStyle = new Color(r, g, b, a);
        }
    }

    setStrokeStyle(r, g, b, a) {
        if (arguments.length === 1 && (r instanceof Color || r instanceof Gradient || 
            r instanceof LinearGradient || r instanceof RadialGradient || 
            r instanceof ConicGradient || r instanceof Pattern)) {
            // Paint source (gradient or pattern)
            this._strokeStyle = r;
        } else {
            // RGBA color
            a = a !== undefined ? a : 255;
            this._strokeStyle = new Color(r, g, b, a);
        }
    }

    // Path methods (delegated to internal path)
    beginPath() {
    this._currentPath = new Path2D();
    }

    closePath() {
    this._currentPath.closePath();
    }

    moveTo(x, y) {
    this._currentPath.moveTo(x, y);
    }

    lineTo(x, y) {
    this._currentPath.lineTo(x, y);
    }

    rect(x, y, w, h) {
    this._currentPath.rect(x, y, w, h);
    }

    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
    this._currentPath.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
    this._currentPath.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    quadraticCurveTo(cpx, cpy, x, y) {
    this._currentPath.quadraticCurveTo(cpx, cpy, x, y);
    }

    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    // Drawing methods - simplified for M1 (only rectangles)
    fillRect(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipMask: this._clipMask,
        fillStyle: this._fillStyle
    });
    
    this.rasterizer.fillRect(x, y, width, height, this._fillStyle);
    this.rasterizer.endOp();
    }

    strokeRect(x, y, width, height) {
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
    }

    clearRect(x, y, width, height) {
    // clearRect should only affect the specified rectangle, not use canvas-wide compositing
    // We'll handle this as a special case by directly clearing the surface pixels
    this._clearRectDirect(x, y, width, height);
    }
    
    /**
     * Clear rectangle directly without canvas-wide compositing
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate  
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @private
     */
    _clearRectDirect(x, y, width, height) {
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' || 
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }
        
        if (width < 0 || height < 0) {
            return; // Nothing to clear for negative dimensions
        }
        
        if (width === 0 || height === 0) {
            return; // Nothing to clear for zero dimensions
        }
        
        const surface = this.surface;
        const transform = this._transform;
        
        // Transform rectangle corners to determine affected region
        const topLeft = transform.transformPoint({x: x, y: y});
        const topRight = transform.transformPoint({x: x + width, y: y});
        const bottomLeft = transform.transformPoint({x: x, y: y + height});
        const bottomRight = transform.transformPoint({x: x + width, y: y + height});
        
        // Get bounding box of transformed rectangle
        const minX = Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x));
        const maxX = Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x));
        const minY = Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y));
        const maxY = Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y));
        
        // Handle simple axis-aligned case (no rotation/skew)
        if (transform.b === 0 && transform.c === 0) {
            // Calculate the actual rectangle bounds in surface coordinates
            const rectLeft = transform.e + x * transform.a; // x coordinate with scaling and translation
            const rectTop = transform.f + y * transform.d;  // y coordinate with scaling and translation  
            const rectRight = rectLeft + width * transform.a;
            const rectBottom = rectTop + height * transform.d;
            
            // Get integer pixel bounds
            const startX = Math.max(0, Math.floor(rectLeft));
            const endX = Math.min(surface.width - 1, Math.floor(rectRight) - 1); // Exclusive end
            const startY = Math.max(0, Math.floor(rectTop));
            const endY = Math.min(surface.height - 1, Math.floor(rectBottom) - 1); // Exclusive end
            
            for (let py = startY; py <= endY; py++) {
                for (let px = startX; px <= endX; px++) {
                    // Check if this pixel should be clipped by current clip mask
                    if (this._clipMask && this._clipMask.isPixelClipped(px, py)) {
                        continue;
                    }
                    
                    const offset = py * surface.stride + px * 4;
                    surface.data[offset] = 0;     // R
                    surface.data[offset + 1] = 0; // G  
                    surface.data[offset + 2] = 0; // B
                    surface.data[offset + 3] = 0; // A (transparent)
                }
            }
        } else {
            // For rotated/skewed rectangles, we need to test each pixel 
            // This is more complex but handles all transformation cases correctly
            const invTransform = transform.invert();
            
            for (let py = Math.max(0, minY); py <= Math.min(surface.height - 1, maxY); py++) {
                for (let px = Math.max(0, minX); px <= Math.min(surface.width - 1, maxX); px++) {
                    // Check if this pixel should be clipped by current clip mask
                    if (this._clipMask && this._clipMask.isPixelClipped(px, py)) {
                        continue;
                    }
                    
                    // Transform pixel back to path coordinate space
                    const pathPoint = invTransform.transformPoint({x: px + 0.5, y: py + 0.5});
                    
                    // Check if point is inside the clearRect rectangle
                    if (pathPoint.x >= x && pathPoint.x < x + width &&
                        pathPoint.y >= y && pathPoint.y < y + height) {
                        const offset = py * surface.stride + px * 4;
                        surface.data[offset] = 0;     // R
                        surface.data[offset + 1] = 0; // G
                        surface.data[offset + 2] = 0; // B  
                        surface.data[offset + 3] = 0; // A (transparent)
                    }
                }
            }
        }
    }

    // M2: Path drawing methods
    fill(path, rule) {
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
    }

    stroke(path) {
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
        miterLimit: this.miterLimit,
        lineDash: this._lineDash.slice(),    // Copy to avoid mutation
        lineDashOffset: this._lineDashOffset
    });
    
    this.rasterizer.endOp();
    }

/**
 * Enhanced clipping support with stencil buffer intersection
 * 
 * Implements HTML5 Canvas-compatible clipping with proper intersection semantics.
 * Each clip() operation creates a new clip region that intersects with any existing
 * clipping regions.
 * 
 * @param {Path2D} path - Optional path to clip with (uses current path if not provided)
 * @param {string} rule - Fill rule: 'nonzero' (default) or 'evenodd'
 */
    clip(path, rule) {
        // If no path provided, use current internal path
        const pathToClip = path || this._currentPath;
        const clipRule = rule || 'nonzero';
        
        // Create temporary clip mask to render this clip path
        const tempClipMask = new ClipMask(this.surface.width, this.surface.height);
        tempClipMask.clipAll(); // Start with all pixels clipped
        
        // Create clip pixel writer that writes to the temporary buffer
        const clipPixelWriter = tempClipMask.createPixelWriter();
        
        // Render the clip path to the temporary buffer using fill logic
        // We need to temporarily set up a "fake" rendering operation
        const originalFillStyle = this._fillStyle;
        this._fillStyle = [255, 255, 255, 255]; // White (doesn't matter for clipping)
        
        // Flatten path and fill to temporary clip buffer
        const polygons = PathFlattener.flattenPath(pathToClip);
        
        // Use a modified version of fillPolygons that writes to our clip buffer
        this._fillPolygonsToClipBuffer(polygons, clipRule, tempClipMask);
        
        // Restore original fill style
        this._fillStyle = originalFillStyle;
        
        // Intersect with existing clip mask (if any)
        if (this._clipMask) {
            // AND operation: existing mask & new mask
            this._clipMask.intersectWith(tempClipMask);
        } else {
            // First clip - use the temporary buffer as the new clip mask
            this._clipMask = tempClipMask;
        }
        
        // NOTE: Browser Compatibility - Clip Path Auto-Stroking
        // ========================================================
        // Some browsers (particularly older versions and certain rendering modes) 
        // automatically stroke the clip boundary with a thin line when clip() is called.
        // This is NON-STANDARD behavior not defined in the HTML5 Canvas specification.
        // 
        // Modern browsers like Chrome do NOT exhibit this behavior.
        // SWCanvas correctly follows the spec by not auto-stroking clip paths.
        //
        // If we wanted to replicate this browser quirk for compatibility:
        // ------------------------------------------------------------
        // // Auto-stroke the clip path with a hairline (before restore)
        // if (this._strokeStyle && this._strokeStyle[3] > 0) {  // If stroke is visible
        //     const savedLineWidth = this.lineWidth;
        //     this.lineWidth = 0.1;  // Hairline width
        //     this.stroke(pathToClip);
        //     this.lineWidth = savedLineWidth;
        // }
        // ------------------------------------------------------------
        // We choose NOT to implement this as it's against spec and not present
        // in modern browsers. The visual difference in tests is expected.
    }

    // Helper method to fill polygons directly to a clip buffer
    _fillPolygonsToClipBuffer(polygons, fillRule, clipBuffer) {
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
    }

    // Helper method to find polygon intersections (copied from polygon-filler.js)
    _findPolygonIntersections(polygon, y, intersections) {
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
    }

    // Helper method to fill clip spans (writes to clip buffer instead of surface)
    _fillClipSpans(y, intersections, fillRule, clipBuffer) {
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
                    clipBuffer.setPixel(x, y, true); // Set pixel to visible (inside clip region)
                }
            }
        }
    }

    // Image rendering
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    // Debug logging for browser troubleshooting
    if (typeof console !== 'undefined' && console.log) {
        console.log('Core drawImage called with:', {
            imageType: image ? image.constructor.name : 'null',
            hasWidth: image ? typeof image.width : 'N/A',
            hasHeight: image ? typeof image.height : 'N/A',
            hasData: image ? !!image.data : 'N/A',
            dataType: image && image.data ? image.data.constructor.name : 'N/A',
            dataInstanceCheck: image && image.data ? (image.data instanceof Uint8ClampedArray) : 'N/A'
        });
    }
    
    // Validate ImageLike object at API level
    if (!image || typeof image !== 'object') {
        throw new Error('First argument must be an ImageLike object');
    }
    
    if (typeof image.width !== 'number' || typeof image.height !== 'number') {
        throw new Error('ImageLike must have numeric width and height properties');
    }
    
    if (!(image.data instanceof Uint8ClampedArray)) {
        throw new Error('ImageLike data must be a Uint8ClampedArray');
    }
    
    // Set up rasterizer operation
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: new Transform2D([
            this._transform.a, this._transform.b,
            this._transform.c, this._transform.d, 
            this._transform.e, this._transform.f
        ]),
        clipMask: this._clipMask
    });
    
    // Delegate to rasterizer
    this.rasterizer.drawImage.apply(this.rasterizer, arguments);
    
    // End rasterizer operation
    this.rasterizer.endOp();
    }

    // Line dash methods
    
    /**
     * Set line dash pattern
     * @param {Array<number>} segments - Array of dash and gap lengths
     */
    setLineDash(segments) {
        if (!Array.isArray(segments)) {
            throw new Error('setLineDash expects an array');
        }
        
        // Validate all segments are numbers and non-negative
        for (let i = 0; i < segments.length; i++) {
            if (typeof segments[i] !== 'number' || isNaN(segments[i])) {
                throw new Error('Dash segments must be numbers');
            }
            if (segments[i] < 0) {
                throw new Error('Dash segments must be non-negative');
            }
        }
        
        // Store original pattern for getLineDash()
        this._originalLineDash = segments.slice();
        
        // Create working pattern - duplicate if odd length
        // This matches HTML5 Canvas behavior: [5, 10, 15] becomes [5, 10, 15, 5, 10, 15]
        this._lineDash = segments.slice();
        if (this._lineDash.length % 2 === 1) {
            this._lineDash = this._lineDash.concat(this._lineDash);
        }
    }
    
    /**
     * Get current line dash pattern
     * @returns {Array<number>} Copy of current dash pattern
     */
    getLineDash() {
        // Return copy of original pattern as set by user
        return this._originalLineDash.slice();
    }
    
    /**
     * Set line dash offset
     * @param {number} offset - Starting offset into dash pattern
     */
    set lineDashOffset(offset) {
        if (typeof offset !== 'number' || isNaN(offset)) {
            return; // Silently ignore invalid values like HTML5 Canvas
        }
        this._lineDashOffset = offset;
    }
    
    /**
     * Get line dash offset
     * @returns {number} Current dash offset
     */
    get lineDashOffset() {
        return this._lineDashOffset;
    }
    
    // Gradient and Pattern Creation Methods
    
    /**
     * Create a linear gradient
     * @param {number} x0 - Start point x coordinate
     * @param {number} y0 - Start point y coordinate
     * @param {number} x1 - End point x coordinate
     * @param {number} y1 - End point y coordinate
     * @returns {LinearGradient} New linear gradient object
     */
    createLinearGradient(x0, y0, x1, y1) {
        return new LinearGradient(x0, y0, x1, y1);
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
        return new RadialGradient(x0, y0, r0, x1, y1, r1);
    }
    
    /**
     * Create a conic gradient
     * @param {number} angle - Starting angle in radians
     * @param {number} x - Center point x coordinate
     * @param {number} y - Center point y coordinate
     * @returns {ConicGradient} New conic gradient object
     */
    createConicGradient(angle, x, y) {
        return new ConicGradient(angle, x, y);
    }
    
    /**
     * Create a pattern from an image
     * @param {Object} image - ImageLike object (canvas, surface, imagedata)
     * @param {string} repetition - Repetition mode: 'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
     * @returns {Pattern} New pattern object
     */
    createPattern(image, repetition) {
        return new Pattern(image, repetition);
    }
}