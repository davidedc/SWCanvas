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
    // Static flag to track slow path usage (for testing)
    // Reset before each test, check after to verify fast paths were used
    static _slowPathUsed = false;

    /**
     * Reset the slow path tracking flag
     * Call before running tests that should use fast paths
     */
    static resetSlowPathFlag() {
        Context2D._slowPathUsed = false;
    }

    /**
     * Check if slow path was used since last reset
     * @returns {boolean} True if slow path was used
     */
    static wasSlowPathUsed() {
        return Context2D._slowPathUsed;
    }

    /**
     * Mark that slow path was used (called internally)
     * @private
     */
    static _markSlowPath() {
        Context2D._slowPathUsed = true;
    }

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
        this._lineWidth = 1.0;
        this.lineJoin = 'miter';  // 'miter', 'round', 'bevel'
        this.lineCap = 'butt';    // 'butt', 'round', 'square'
        this.miterLimit = 10.0;

        // Line dash properties
        this._lineDash = [];         // Internal working dash pattern (may be duplicated)
        this._originalLineDash = []; // Original pattern as set by user
        this._lineDashOffset = 0;    // Starting offset into dash pattern

        // Shadow properties - HTML5 Canvas compatible defaults
        this.shadowColor = Color.transparent; // Transparent black (no shadow)
        this.shadowBlur = 0;       // No blur
        this.shadowOffsetX = 0;    // No horizontal offset
        this.shadowOffsetY = 0;    // No vertical offset

        // Internal path and clipping
        this._currentPath = new SWPath2D();

        // Stencil-based clipping system (only clipping mechanism)
        this._clipMask = null;  // ClipMask instance for 1-bit per pixel clipping
    }

    // HTML5 Canvas-compatible lineWidth property with validation
    get lineWidth() {
        return this._lineWidth;
    }

    set lineWidth(value) {
        // HTML5 Canvas spec: ignore zero, negative, Infinity, and NaN values
        if (typeof value === 'number' &&
            value > 0 &&
            isFinite(value)) {
            this._lineWidth = value;
        }
        // Otherwise, keep the current value unchanged (ignore invalid input)
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
            lineWidth: this._lineWidth,
            lineJoin: this.lineJoin,
            lineCap: this.lineCap,
            miterLimit: this.miterLimit,
            lineDash: this._lineDash.slice(),    // Copy working dash pattern array
            originalLineDash: this._originalLineDash.slice(), // Copy original pattern
            lineDashOffset: this._lineDashOffset,
            // Shadow properties
            shadowColor: this.shadowColor, // Color is immutable, safe to share
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
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

        this._lineWidth = state.lineWidth;
        this.lineJoin = state.lineJoin;
        this.lineCap = state.lineCap;
        this.miterLimit = state.miterLimit;
        this._lineDash = state.lineDash || [];
        this._originalLineDash = state.originalLineDash || [];
        this._lineDashOffset = state.lineDashOffset || 0;

        // Restore shadow properties
        this.shadowColor = state.shadowColor || Color.transparent;
        this.shadowBlur = state.shadowBlur || 0;
        this.shadowOffsetX = state.shadowOffsetX || 0;
        this.shadowOffsetY = state.shadowOffsetY || 0;
    }

    // Transform methods
    // HTML5 Canvas spec: transformations POST-multiply (current * new)
    transform(a, b, c, d, e, f) {
        const m = new Transform2D([a, b, c, d, e, f]);
        this._transform = this._transform.multiply(m);
    }

    setTransform(a, b, c, d, e, f) {
        this._transform = new Transform2D([a, b, c, d, e, f]);
    }

    resetTransform() {
        this._transform = new Transform2D();
    }

    // Convenience transform methods - all post-multiply per HTML5 Canvas spec
    translate(x, y) {
        this._transform = this._transform.translate(x, y);
    }

    scale(sx, sy) {
        this._transform = this._transform.scale(sx, sy);
    }

    rotate(angleInRadians) {
        this._transform = this._transform.rotate(angleInRadians);
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

    // Shadow property setters with validation
    setShadowColor(r, g, b, a) {
        if (arguments.length === 1 && r instanceof Color) {
            this.shadowColor = r;
        } else {
            a = a !== undefined ? a : 255;
            this.shadowColor = new Color(r, g, b, a);
        }
    }

    setShadowBlur(blur) {
        if (typeof blur !== 'number' || isNaN(blur)) {
            throw new Error('Shadow blur must be a number');
        }
        if (blur < 0) {
            throw new Error('Shadow blur must be non-negative');
        }
        this.shadowBlur = blur;
    }

    setShadowOffsetX(offset) {
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new Error('Shadow offsetX must be a number');
        }
        this.shadowOffsetX = offset;
    }

    setShadowOffsetY(offset) {
        if (typeof offset !== 'number' || isNaN(offset)) {
            throw new Error('Shadow offsetY must be a number');
        }
        this.shadowOffsetY = offset;
    }

    // Path methods (delegated to internal path)
    beginPath() {
        this._currentPath = new SWPath2D();
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

    arcTo(x1, y1, x2, y2, radius) {
        this._currentPath.arcTo(x1, y1, x2, y2, radius);
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
            fillStyle: this._fillStyle,
            // Shadow properties
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
        });

        this.rasterizer.fillRect(x, y, width, height, this._fillStyle);
        this.rasterizer.endOp();
    }

    strokeRect(x, y, width, height) {
        // Fast path: 1px stroke, no transform, simple color, source-over
        const is1pxStroke = Math.abs(this._lineWidth - 1) < 0.001;
        const isColor = this._strokeStyle instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noTransform = this._transform.isIdentity;
        const noClip = !this._clipMask;
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);

        if (is1pxStroke && isColor && isSourceOver && noTransform && noClip && noShadow) {
            const isOpaque = this._strokeStyle.a === 255 && this.globalAlpha >= 1.0;
            if (isOpaque) {
                this._strokeRect1pxOpaque(x, y, width, height, this._strokeStyle);
                return;
            } else if (this._strokeStyle.a > 0) {
                this._strokeRect1pxAlpha(x, y, width, height, this._strokeStyle);
                return;
            }
        }

        // Slow path: Create a rectangular path
        const rectPath = new SWPath2D();
        rectPath.rect(x, y, width, height);
        rectPath.closePath();

        // Stroke the path using existing stroke infrastructure
        this.rasterizer.beginOp({
            composite: this.globalCompositeOperation,
            globalAlpha: this.globalAlpha,
            transform: this._transform,
            clipMask: this._clipMask,
            strokeStyle: this._strokeStyle,
            // Shadow properties
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
        });

        this.rasterizer.stroke(rectPath, {
            lineWidth: this._lineWidth,
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
        const topLeft = transform.transformPoint({ x: x, y: y });
        const topRight = transform.transformPoint({ x: x + width, y: y });
        const bottomLeft = transform.transformPoint({ x: x, y: y + height });
        const bottomRight = transform.transformPoint({ x: x + width, y: y + height });

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
                    const pathPoint = invTransform.transformPoint({ x: px + 0.5, y: py + 0.5 });

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
            fillStyle: this._fillStyle,
            // Shadow properties
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
        });

        this.rasterizer.fill(pathToFill, fillRule);
        this.rasterizer.endOp();
    }

    stroke(path) {
        // Use specified path or current internal path
        const pathToStroke = path || this._currentPath;

        // Fast path: detect single full circle and use Bresenham
        const circleInfo = this._isFullCirclePath(pathToStroke);
        if (circleInfo) {
            const paintSource = this._strokeStyle;
            const isColor = paintSource instanceof Color;
            const is1pxStroke = Math.abs(this._lineWidth - 1) < 0.001;
            const isSourceOver = this.globalCompositeOperation === 'source-over';
            const noTransform = this._transform.isIdentity;
            const noClip = !this._clipMask;
            const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                            (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);

            if (isColor && is1pxStroke && isSourceOver && noTransform && noClip && noShadow) {
                const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
                if (isOpaque) {
                    this._strokeCircle1pxOpaque(circleInfo.cx, circleInfo.cy, circleInfo.radius, paintSource);
                    return;
                } else if (paintSource.a > 0) {
                    this._strokeCircle1pxAlpha(circleInfo.cx, circleInfo.cy, circleInfo.radius, paintSource);
                    return;
                }
            }
        }

        this.rasterizer.beginOp({
            composite: this.globalCompositeOperation,
            globalAlpha: this.globalAlpha,
            transform: this._transform,
            clipMask: this._clipMask,
            strokeStyle: this._strokeStyle,
            // Shadow properties
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
        });

        this.rasterizer.stroke(pathToStroke, {
            lineWidth: this._lineWidth,
            lineJoin: this.lineJoin,
            lineCap: this.lineCap,
            miterLimit: this.miterLimit,
            lineDash: this._lineDash.slice(),    // Copy to avoid mutation
            lineDashOffset: this._lineDashOffset
        });

        this.rasterizer.endOp();
    }

    /**
     * Test if a point is inside the current path or specified path
     * Supports all HTML5 Canvas API overloads:
     * - isPointInPath(x, y)
     * - isPointInPath(x, y, fillRule)
     * - isPointInPath(path, x, y)
     * - isPointInPath(path, x, y, fillRule)
     * @param {...} arguments - Variable arguments depending on overload
     * @returns {boolean} True if point is inside the path
     */
    isPointInPath() {
        let path, x, y, fillRule;

        if (arguments.length < 2) {
            const error = new TypeError('Invalid number of arguments for isPointInPath');
            error.message = 'TypeError: ' + error.message;
            throw error;
        } else if (arguments.length === 2) {
            // isPointInPath(x, y)
            [x, y] = arguments;
            path = this._currentPath;
            fillRule = 'nonzero';
        } else if (arguments.length === 3) {
            if (typeof arguments[2] === 'string') {
                // isPointInPath(x, y, fillRule)
                [x, y, fillRule] = arguments;
                path = this._currentPath;
            } else {
                // isPointInPath(path, x, y)
                [path, x, y] = arguments;
                if (!path || typeof path !== 'object' || !path.commands) {
                    const error = new TypeError('First argument must be a Path2D object');
                    error.message = 'TypeError: ' + error.message;
                    throw error;
                }
                fillRule = 'nonzero';
            }
        } else if (arguments.length === 4) {
            // isPointInPath(path, x, y, fillRule)
            [path, x, y, fillRule] = arguments;
            if (!path || typeof path !== 'object' || !path.commands) {
                const error = new TypeError('First argument must be a Path2D object');
                error.message = 'TypeError: ' + error.message;
                throw error;
            }
        } else if (arguments.length > 4) {
            const error = new TypeError('Invalid number of arguments for isPointInPath');
            error.message = 'TypeError: ' + error.message;
            throw error;
        }

        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number') {
            return false;
        }

        if (!path || !path.commands || path.commands.length === 0) {
            return false;
        }

        fillRule = fillRule || 'nonzero';

        // Note: isPointInPath uses untransformed coordinates per HTML5 Canvas spec
        // The point coordinates are in canvas coordinate space, not transform-adjusted space

        // Flatten the path to polygons
        const polygons = PathFlattener.flattenPath(path);

        if (polygons.length === 0) {
            return false;
        }

        // Transform polygons to match current canvas transform
        const transformedPolygons = polygons.map(poly =>
            poly.map(point => this._transform.transformPoint(point))
        );

        // Test point against transformed polygons
        return PolygonFiller.isPointInPolygons(x, y, transformedPolygons, fillRule);
    }

    /**
     * Test if a point is inside the stroke of current path or specified path
     * Supports all HTML5 Canvas API overloads:
     * - isPointInStroke(x, y)
     * - isPointInStroke(path, x, y)
     * @param {...} arguments - Variable arguments depending on overload
     * @returns {boolean} True if point is inside the stroke
     */
    isPointInStroke() {
        let path, x, y;

        if (arguments.length < 2) {
            const error = new TypeError('Invalid number of arguments for isPointInStroke');
            error.message = 'TypeError: ' + error.message;
            throw error;
        } else if (arguments.length === 2) {
            // isPointInStroke(x, y)
            [x, y] = arguments;
            path = this._currentPath;
        } else if (arguments.length === 3) {
            // isPointInStroke(path, x, y)
            [path, x, y] = arguments;
            if (!path || typeof path !== 'object' || !path.commands) {
                const error = new TypeError('First argument must be a Path2D object');
                error.message = 'TypeError: ' + error.message;
                throw error;
            }
        } else if (arguments.length > 3) {
            const error = new TypeError('Invalid number of arguments for isPointInStroke');
            error.message = 'TypeError: ' + error.message;
            throw error;
        }

        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number') {
            return false;
        }

        if (!path || !path.commands || path.commands.length === 0) {
            return false;
        }

        // Note: isPointInStroke uses untransformed coordinates per HTML5 Canvas spec
        // The point coordinates are in canvas coordinate space, not transform-adjusted space

        // Create stroke properties object from current context state
        const strokeProps = {
            lineWidth: this._lineWidth,
            lineJoin: this.lineJoin,
            lineCap: this.lineCap,
            miterLimit: this.miterLimit,
            lineDash: this._lineDash,
            lineDashOffset: this._lineDashOffset
        };


        // Generate stroke polygons using StrokeGenerator
        const strokePolygons = StrokeGenerator.generateStrokePolygons(path, strokeProps);

        if (strokePolygons.length === 0) {
            return false;
        }

        // Transform stroke polygons to match current canvas transform
        const transformedPolygons = strokePolygons.map(poly =>
            poly.map(point => this._transform.transformPoint(point))
        );

        // Test point against transformed stroke polygons using nonzero winding rule
        // (stroke hit testing doesn't use fill rules like path filling does)
        return PolygonFiller.isPointInPolygons(x, y, transformedPolygons, 'nonzero');
    }

    /**
     * Calculate distance from a point to a line segment
     * @param {number} px - Point x coordinate
     * @param {number} py - Point y coordinate
     * @param {number} x1 - Line segment start x
     * @param {number} y1 - Line segment start y
     * @param {number} x2 - Line segment end x
     * @param {number} y2 - Line segment end y
     * @returns {number} Shortest distance from point to line segment
     * @private
     */
    _distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        // If line segment is actually a point
        if (dx === 0 && dy === 0) {
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }

        // Calculate parameter t for closest point on line
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

        // Find closest point on line segment
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        // Return distance from point to closest point on segment
        return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
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

                intersections.push({ x: x, winding: winding });
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
            clipMask: this._clipMask,
            // Shadow properties
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY
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

    // ========================================================================
    // DIRECT SHAPE APIs (CrispSwCanvas compatibility)
    // These methods bypass the path system for maximum performance
    // ========================================================================

    /**
     * Fill a circle directly without using the path system
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     */
    fillCircle(centerX, centerY, radius) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius considering non-uniform scaling
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;

        // Get paint source
        const paintSource = this._fillStyle;

        // Use optimized circle renderer
        this._fillCircleDirect(center.x, center.y, scaledRadius, paintSource);
    }

    /**
     * Stroke a circle directly without using the path system
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     */
    strokeCircle(centerX, centerY, radius) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius and line width
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;
        const scaledLineWidth = this._lineWidth * scale;

        // Get paint source
        const paintSource = this._strokeStyle;

        // Use optimized circle stroke renderer
        this._strokeCircleDirect(center.x, center.y, scaledRadius, scaledLineWidth, paintSource);
    }

    /**
     * Fill and stroke a circle in one operation
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     */
    fillAndStrokeCircle(centerX, centerY, radius) {
        this.fillCircle(centerX, centerY, radius);
        this.strokeCircle(centerX, centerY, radius);
    }

    /**
     * Stroke a line directly without using the path system
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     */
    strokeLine(x1, y1, x2, y2) {
        // Transform endpoints
        const start = this._transform.transformPoint({ x: x1, y: y1 });
        const end = this._transform.transformPoint({ x: x2, y: y2 });

        // Calculate effective line width
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledLineWidth = this._lineWidth * scale;

        // Get paint source
        const paintSource = this._strokeStyle;

        // Use optimized line renderer
        this._strokeLineDirect(start.x, start.y, end.x, end.y, scaledLineWidth, paintSource);
    }

    // ========================================================================
    // Private optimized shape renderers
    // ========================================================================

    /**
     * Optimized circle fill using midpoint algorithm with horizontal spans
     * @private
     */
    _fillCircleDirect(cx, cy, radius, paintSource) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Check for solid color fast paths
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';

        const isOpaqueColor = isColor &&
            paintSource.a === 255 &&
            this.globalAlpha >= 1.0 &&
            isSourceOver;

        const isSemiTransparentColor = isColor &&
            paintSource.a < 255 &&
            isSourceOver;

        if (isOpaqueColor) {
            // Fast path 1: 32-bit packed writes for opaque colors
            const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);
            const data32 = surface.data32;

            // Detect if center is at grid intersection (integer) or pixel center (half-integer)
            // Grid-centered: diameter = 2*radius, symmetric about grid intersection
            // Pixel-centered: diameter = 2*radius + 1, symmetric about pixel center
            const isGridCenteredX = Number.isInteger(cx);
            const isGridCenteredY = Number.isInteger(cy);
            const intRadius = Math.floor(radius);

            let bx = intRadius;
            let by = 0;
            let err = 1 - intRadius;

            while (bx >= by) {
                // Calculate span parameters based on center type
                // For grid-centered: leftX = center - extent, width = 2*extent
                // For pixel-centered: leftX = floor(center) - extent, width = 2*extent + 1
                const spanWidthBx = isGridCenteredX ? bx * 2 : bx * 2 + 1;
                const spanWidthBy = isGridCenteredX ? by * 2 : by * 2 + 1;
                const leftBx = isGridCenteredX ? cx - bx : Math.floor(cx) - bx;
                const leftBy = isGridCenteredX ? cx - by : Math.floor(cx) - by;

                // For grid-centered circles:
                //   Top half: y from cy-radius to cy-1 (radius rows above center)
                //   Bottom half: y from cy to cy+radius-1 (radius rows below center)
                //   Total: 2*radius rows
                // For pixel-centered circles:
                //   y from floor(cy)-radius to floor(cy)+radius (2*radius+1 rows)

                if (isGridCenteredY) {
                    // Grid-centered Y: bottom at cy+by, top at cy-by-1
                    // Skip if by >= intRadius (would be outside diameter)
                    if (by < intRadius) {
                        const bottomY = cy + by;
                        const topY = cy - by - 1;
                        this._fillSpanFast(data32, width, height, leftBx, bottomY, spanWidthBx, packedColor, clipBuffer);
                        this._fillSpanFast(data32, width, height, leftBx, topY, spanWidthBx, packedColor, clipBuffer);
                    }
                    if (bx !== by && bx < intRadius) {
                        const bottomY = cy + bx;
                        const topY = cy - bx - 1;
                        this._fillSpanFast(data32, width, height, leftBy, bottomY, spanWidthBy, packedColor, clipBuffer);
                        this._fillSpanFast(data32, width, height, leftBy, topY, spanWidthBy, packedColor, clipBuffer);
                    }
                } else {
                    // Pixel-centered Y: bottom at floor(cy)+by, top at floor(cy)-by
                    const floorCy = Math.floor(cy);
                    const bottomY = floorCy + by;
                    const topY = floorCy - by;
                    this._fillSpanFast(data32, width, height, leftBx, bottomY, spanWidthBx, packedColor, clipBuffer);
                    if (by > 0) {
                        this._fillSpanFast(data32, width, height, leftBx, topY, spanWidthBx, packedColor, clipBuffer);
                    }
                    if (bx !== by) {
                        const bottomYx = floorCy + bx;
                        const topYx = floorCy - bx;
                        this._fillSpanFast(data32, width, height, leftBy, bottomYx, spanWidthBy, packedColor, clipBuffer);
                        this._fillSpanFast(data32, width, height, leftBy, topYx, spanWidthBy, packedColor, clipBuffer);
                    }
                }

                by++;
                if (err < 0) {
                    err += 2 * by + 1;
                } else {
                    bx--;
                    err += 2 * (by - bx + 1);
                }
            }
        } else if (isSemiTransparentColor) {
            // Fast path 2: Bresenham scanlines with per-pixel alpha blending
            this._fillCircleAlphaBlend(cx, cy, radius, paintSource, clipBuffer);
        } else {
            // Standard path: use path system for gradients/patterns/non-source-over compositing
            Context2D._markSlowPath(); // Mark slow path for testing
            this.beginPath();
            this.arc(cx, cy, radius, 0, Math.PI * 2);
            // Temporarily set identity transform since we already transformed
            const savedTransform = this._transform;
            this._transform = new Transform2D();
            this.fill();
            this._transform = savedTransform;
        }
    }

    /**
     * Generate horizontal extents for each scanline of a circle using Bresenham
     * @private
     * @returns {number[]} Array where extents[y] = x extent at that y offset from center
     */
    _generateCircleExtents(radius) {
        const extents = new Array(radius + 1);
        let x = radius;
        let y = 0;
        let err = 1 - radius;

        while (x >= y) {
            // Record the x extent at this y position
            extents[y] = x;
            if (x !== y) {
                extents[x] = y;  // Mirror for the other octant
            }

            y++;
            if (err < 0) {
                err += 2 * y + 1;
            } else {
                x--;
                err += 2 * (y - x) + 1;
            }
        }

        return extents;
    }

    /**
     * Optimized circle fill with alpha blending using Bresenham scanlines
     * Uses top/bottom symmetry with grid/pixel center detection
     * @private
     */
    _fillCircleAlphaBlend(cx, cy, radius, color, clipBuffer) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;

        // Calculate effective alpha (color alpha * global alpha)
        const effectiveAlpha = (color.a / 255) * this.globalAlpha;
        if (effectiveAlpha <= 0) return;

        const invAlpha = 1 - effectiveAlpha;
        const r = color.r;
        const g = color.g;
        const b = color.b;

        // Detect if center is at grid intersection (integer) or pixel center (half-integer)
        const isGridCenteredX = Number.isInteger(cx);
        const isGridCenteredY = Number.isInteger(cy);
        const intRadius = Math.floor(radius);

        // Generate horizontal extents using Bresenham
        const extents = this._generateCircleExtents(intRadius);

        // Fill scanlines using top/bottom symmetry
        // Loop includes intRadius for pixel-centered circles to draw cap pixels
        for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
            const xExtent = extents[rel_y];
            if (xExtent === undefined) continue;

            // Calculate span parameters based on center type
            const leftX = isGridCenteredX ? cx - xExtent : Math.floor(cx) - xExtent;
            const spanWidth = isGridCenteredX ? xExtent * 2 : xExtent * 2 + 1;

            if (isGridCenteredY) {
                // Grid-centered circles have even diameter - skip cap row at rel_y=intRadius
                if (rel_y >= intRadius) continue;

                // Grid-centered Y: bottom at cy+rel_y, top at cy-rel_y-1
                const bottomY = cy + rel_y;
                const topY = cy - rel_y - 1;

                if (bottomY >= 0 && bottomY < height) {
                    this._fillSpanAlpha(data, width, height, leftX, bottomY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
                if (topY >= 0 && topY < height) {
                    this._fillSpanAlpha(data, width, height, leftX, topY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            } else {
                // Pixel-centered Y: bottom at floor(cy)+rel_y, top at floor(cy)-rel_y
                const floorCy = Math.floor(cy);
                const bottomY = floorCy + rel_y;
                const topY = floorCy - rel_y;

                if (bottomY >= 0 && bottomY < height) {
                    this._fillSpanAlpha(data, width, height, leftX, bottomY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
                // Skip top span at rel_y=0 to prevent overdraw at center pixel
                if (rel_y > 0 && topY >= 0 && topY < height) {
                    this._fillSpanAlpha(data, width, height, leftX, topY, spanWidth,
                                       r, g, b, effectiveAlpha, invAlpha, clipBuffer);
                }
            }
        }
    }

    /**
     * Check if path is a single full circle (0 to 2π arc)
     * Used for fast path detection in stroke()
     * @param {SWPath2D} pathToCheck - The path to analyze
     * @returns {object|null} Circle info {cx, cy, radius} or null if not a full circle
     * @private
     */
    _isFullCirclePath(pathToCheck) {
        const commands = pathToCheck.commands;

        // Must be exactly 1 command (arc only, no moveTo after beginPath())
        if (commands.length !== 1) return null;

        // Must be an arc command
        if (commands[0].type !== 'arc') return null;

        const arc = commands[0];
        const startAngle = arc.startAngle;
        const endAngle = arc.endAngle;

        // Check if it's a full circle (2π difference)
        const angleDiff = Math.abs(endAngle - startAngle);
        const isFullCircle = Math.abs(angleDiff - 2 * Math.PI) < 1e-9;

        if (!isFullCircle) return null;

        return {
            cx: arc.x,
            cy: arc.y,
            radius: arc.radius
        };
    }

    /**
     * Optimized circle stroke - dispatches to fast paths when possible
     * @private
     */
    _strokeCircleDirect(cx, cy, radius, lineWidth, paintSource) {
        const isColor = paintSource instanceof Color;
        const is1pxStroke = Math.abs(lineWidth - 1) < 0.001;
        const isSourceOver = this.globalCompositeOperation === 'source-over';

        // Fast path 1: 1px strokes using Bresenham algorithm
        if (isColor && is1pxStroke && isSourceOver) {
            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            if (isOpaque) {
                this._strokeCircle1pxOpaque(cx, cy, radius, paintSource);
                return;
            } else if (paintSource.a > 0) {
                this._strokeCircle1pxAlpha(cx, cy, radius, paintSource);
                return;
            }
        }

        // Fast path 2: Thick strokes using scanline annulus algorithm
        if (isColor && isSourceOver && lineWidth > 1 && paintSource.a > 0) {
            this._strokeCircleThick(cx, cy, radius, lineWidth, paintSource);
            return;
        }

        // Fallback to path system for gradients, patterns, or non-source-over compositing
        Context2D._markSlowPath();
        this.beginPath();
        this.arc(cx, cy, radius, 0, Math.PI * 2);
        const savedTransform = this._transform;
        this._transform = new Transform2D();
        const savedLineWidth = this._lineWidth;
        this._lineWidth = lineWidth;
        this.stroke();
        this._lineWidth = savedLineWidth;
        this._transform = savedTransform;
    }

    /**
     * Optimized 1px opaque circle stroke using Bresenham's algorithm
     * Ported from CrispSwCanvas's draw1PxStrokeFullCircleBresenhamOpaque
     * @private
     */
    _strokeCircle1pxOpaque(cx, cy, radius, color) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Center calculation using floor (like CrispSwCanvas)
        const cX = Math.floor(cx);
        const cY = Math.floor(cy);
        const intRadius = Math.floor(radius);

        if (intRadius < 0) return;

        // Handle zero radius (single pixel)
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        data32[pos] = packedColor;
                    }
                }
            }
            return;
        }

        // Determine offsets for .5 radius case
        // When radius has .5 fractional part, shift top/left halves
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        // Bresenham circle algorithm
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (x <= y) {
            // Calculate 8 symmetric points with offsets for top/left halves
            const p1x = cX + x, p1y = cY + y;                    // bottom-right
            const p2x = cX + y, p2y = cY + x;                    // bottom-right
            const p3x = cX + y, p3y = cY - x - yOffset;          // top-right
            const p4x = cX + x, p4y = cY - y - yOffset;          // top-right
            const p5x = cX - x - xOffset, p5y = cY - y - yOffset; // top-left
            const p6x = cX - y - xOffset, p6y = cY - x - yOffset; // top-left
            const p7x = cX - y - xOffset, p7y = cY + x;          // bottom-left
            const p8x = cX - x - xOffset, p8y = cY + y;          // bottom-left

            // Plot points with bounds checking
            if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) {
                const pos = p1y * width + p1x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (x !== y && p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) {
                const pos = p2y * width + p2x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) {
                const pos = p3y * width + p3x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) {
                const pos = p4y * width + p4x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) {
                const pos = p5y * width + p5x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (x !== y && p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) {
                const pos = p6y * width + p6x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) {
                const pos = p7y * width + p7x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }
            if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) {
                const pos = p8y * width + p8x;
                if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                    data32[pos] = packedColor;
                }
            }

            // Update Bresenham state
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        }
    }

    /**
     * Optimized 1px semi-transparent circle stroke using Bresenham's algorithm
     * Uses Set to prevent overdraw for semi-transparent colors
     * @private
     */
    _strokeCircle1pxAlpha(cx, cy, radius, color) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Calculate effective alpha
        const effectiveAlpha = (color.a / 255) * this.globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Center calculation
        const cX = Math.floor(cx);
        const cY = Math.floor(cy);
        const intRadius = Math.floor(radius);

        if (intRadius < 0) return;

        // Handle zero radius (single pixel)
        if (intRadius === 0) {
            if (radius >= 0) {
                const px = Math.round(cx);
                const py = Math.round(cy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pos = py * width + px;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * invAlpha;
                        const newAlpha = effectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }
            }
            return;
        }

        // Determine offsets for .5 radius case
        let xOffset = 0, yOffset = 0;
        if (radius > 0 && (radius * 2) % 2 === 1) {
            xOffset = 1;
            yOffset = 1;
        }

        // Use Set to collect unique pixel positions (prevents overdraw)
        const uniquePixels = new Set();

        // Bresenham circle algorithm
        let x = 0;
        let y = intRadius;
        let d = 3 - 2 * intRadius;

        while (x <= y) {
            // Calculate 8 symmetric points
            const points = [
                [cX + x, cY + y],
                [cX + y, cY + x],
                [cX + y, cY - x - yOffset],
                [cX + x, cY - y - yOffset],
                [cX - x - xOffset, cY - y - yOffset],
                [cX - y - xOffset, cY - x - yOffset],
                [cX - y - xOffset, cY + x],
                [cX - x - xOffset, cY + y]
            ];

            for (const [px, py] of points) {
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    uniquePixels.add(py * width + px);
                }
            }

            // Update Bresenham state
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        }

        // Render unique pixels with alpha blending
        for (const pos of uniquePixels) {
            if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                const idx = pos * 4;
                const oldAlpha = data[idx + 3] / 255;
                const oldAlphaScaled = oldAlpha * invAlpha;
                const newAlpha = effectiveAlpha + oldAlphaScaled;
                if (newAlpha > 0) {
                    const blendFactor = 1 / newAlpha;
                    data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                    data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                    data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                    data[idx + 3] = newAlpha * 255;
                }
            }
        }
    }

    /**
     * Optimized 1px opaque rectangle stroke using direct pixel drawing
     * Matches Canvas grid-line to pixel-coordinate conversion
     * @private
     */
    _strokeRect1pxOpaque(x, y, width, height, color) {
        const surface = this.surface;
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data32 = surface.data32;

        const packedColor = Surface.packColor(color.r, color.g, color.b, 255);

        // Calculate rectangle pixel bounds
        // For strokeRect(132.5, 126.5, 135, 47):
        // - Path spans (132.5, 126.5) to (267.5, 173.5)
        // - 1px stroke renders at: left=132, right=267, top=126, bottom=173
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.floor(x + width);
        const bottom = Math.floor(y + height);

        // Draw top edge (horizontal): pixels from left to right (inclusive)
        if (top >= 0 && top < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                data32[top * surfaceWidth + px] = packedColor;
            }
        }

        // Draw bottom edge (horizontal): pixels from left to right (inclusive)
        if (bottom >= 0 && bottom < surfaceHeight) {
            for (let px = Math.max(0, left); px <= Math.min(right, surfaceWidth - 1); px++) {
                data32[bottom * surfaceWidth + px] = packedColor;
            }
        }

        // Draw left edge (vertical): skip corners (already drawn)
        if (left >= 0 && left < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                data32[py * surfaceWidth + left] = packedColor;
            }
        }

        // Draw right edge (vertical): skip corners (already drawn)
        if (right >= 0 && right < surfaceWidth) {
            for (let py = Math.max(0, top + 1); py < Math.min(bottom, surfaceHeight); py++) {
                data32[py * surfaceWidth + right] = packedColor;
            }
        }
    }

    /**
     * Optimized 1px semi-transparent rectangle stroke using direct pixel drawing
     * Matches Canvas grid-line to pixel-coordinate conversion
     * @private
     */
    _strokeRect1pxAlpha(x, y, width, height, color) {
        const surface = this.surface;
        const surfaceWidth = surface.width;
        const surfaceHeight = surface.height;
        const data = surface.data;

        // Calculate effective alpha
        const effectiveAlpha = (color.a / 255) * this.globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        // Calculate rectangle pixel bounds
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.floor(x + width);
        const bottom = Math.floor(y + height);

        // Helper function to blend a pixel
        const blendPixel = (px, py) => {
            if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return;
            const idx = (py * surfaceWidth + px) * 4;
            const oldAlpha = data[idx + 3] / 255;
            const oldAlphaScaled = oldAlpha * invAlpha;
            const newAlpha = effectiveAlpha + oldAlphaScaled;
            if (newAlpha > 0) {
                const blendFactor = 1 / newAlpha;
                data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                data[idx + 3] = newAlpha * 255;
            }
        };

        // Draw top edge (horizontal): pixels from left to right (inclusive)
        for (let px = left; px <= right; px++) {
            blendPixel(px, top);
        }

        // Draw bottom edge (horizontal): pixels from left to right (inclusive)
        for (let px = left; px <= right; px++) {
            blendPixel(px, bottom);
        }

        // Draw left edge (vertical): skip corners (already drawn)
        for (let py = top + 1; py < bottom; py++) {
            blendPixel(left, py);
        }

        // Draw right edge (vertical): skip corners (already drawn)
        for (let py = top + 1; py < bottom; py++) {
            blendPixel(right, py);
        }
    }

    /**
     * Optimized thick stroke circle using scanline-based annulus rendering
     * Ported from CrispSwCanvas's drawFullCircleFast() method (stroke-only case)
     * @private
     */
    _strokeCircleThick(cx, cy, radius, lineWidth, color) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Calculate inner and outer radii for the stroke annulus
        const innerRadius = radius - lineWidth / 2;
        const outerRadius = radius + lineWidth / 2;

        // Use exact centers for Canvas coordinate alignment (same as CrispSwCanvas)
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        // Calculate bounds with safety margin
        const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius + 1));
        const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
        const maxX = Math.min(width - 1, Math.ceil(cX + outerRadius + 1));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius > 0 ? innerRadius * innerRadius : 0;

        // Determine if opaque or needs alpha blending
        const isOpaque = color.a === 255 && this.globalAlpha >= 1.0;

        if (isOpaque) {
            const packedColor = Surface.packColor(color.r, color.g, color.b, 255);
            const data32 = surface.data32;

            // Process each scanline
            for (let y = minY; y <= maxY; y++) {
                const dy = y - cY;
                const dySquared = dy * dy;

                // Skip if outside outer circle
                if (dySquared > outerRadiusSquared) continue;

                // Calculate outer circle X intersections
                const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
                const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
                const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));

                // Case: No inner circle intersection (draw full span)
                if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
                    for (let x = outerLeftX; x <= outerRightX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }
                } else {
                    // Case: Intersects both circles - draw left and right segments
                    const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                    const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
                    const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));

                    // Left segment
                    for (let x = outerLeftX; x <= innerLeftX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }

                    // Right segment
                    for (let x = innerRightX; x <= outerRightX; x++) {
                        const pos = y * width + x;
                        if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                            data32[pos] = packedColor;
                        }
                    }
                }
            }
        } else {
            // Semi-transparent: use alpha blending path
            this._strokeCircleThickAlpha(cx, cy, radius, lineWidth, color);
        }
    }

    /**
     * Thick stroke circle with alpha blending
     * @private
     */
    _strokeCircleThickAlpha(cx, cy, radius, lineWidth, color) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        const effectiveAlpha = (color.a / 255) * this.globalAlpha;
        if (effectiveAlpha <= 0) return;
        const invAlpha = 1 - effectiveAlpha;
        const r = color.r, g = color.g, b = color.b;

        const innerRadius = radius - lineWidth / 2;
        const outerRadius = radius + lineWidth / 2;
        const cX = cx - 0.5;
        const cY = cy - 0.5;

        const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
        const maxY = Math.min(height - 1, Math.ceil(cY + outerRadius + 1));
        const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
        const maxX = Math.min(width - 1, Math.ceil(cX + outerRadius + 1));

        const outerRadiusSquared = outerRadius * outerRadius;
        const innerRadiusSquared = innerRadius > 0 ? innerRadius * innerRadius : 0;

        for (let y = minY; y <= maxY; y++) {
            const dy = y - cY;
            const dySquared = dy * dy;

            if (dySquared > outerRadiusSquared) continue;

            const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
            const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
            const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));

            if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
                for (let x = outerLeftX; x <= outerRightX; x++) {
                    const pos = y * width + x;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * invAlpha;
                        const newAlpha = effectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }
            } else {
                const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
                const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
                const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));

                // Left segment
                for (let x = outerLeftX; x <= innerLeftX; x++) {
                    const pos = y * width + x;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * invAlpha;
                        const newAlpha = effectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }

                // Right segment
                for (let x = innerRightX; x <= outerRightX; x++) {
                    const pos = y * width + x;
                    if (!clipBuffer || (clipBuffer[pos >> 3] & (1 << (7 - (pos & 7))))) {
                        const idx = pos * 4;
                        const oldAlpha = data[idx + 3] / 255;
                        const oldAlphaScaled = oldAlpha * invAlpha;
                        const newAlpha = effectiveAlpha + oldAlphaScaled;
                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[idx] = (r * effectiveAlpha + data[idx] * oldAlphaScaled) * blendFactor;
                            data[idx + 1] = (g * effectiveAlpha + data[idx + 1] * oldAlphaScaled) * blendFactor;
                            data[idx + 2] = (b * effectiveAlpha + data[idx + 2] * oldAlphaScaled) * blendFactor;
                            data[idx + 3] = newAlpha * 255;
                        }
                    }
                }
            }
        }
    }

    /**
     * Optimized line stroke
     * @private
     */
    _strokeLineDirect(x1, y1, x2, y2, lineWidth, paintSource) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Get color for solid color fast path
        const isOpaqueColor = paintSource instanceof Color &&
            paintSource.a === 255 &&
            this.globalAlpha >= 1.0 &&
            this.globalCompositeOperation === 'source-over';

        // Check for semitransparent color fast path (Color with alpha blending)
        const isSemiTransparentColor = paintSource instanceof Color &&
            !isOpaqueColor &&
            this.globalCompositeOperation === 'source-over';

        if (isOpaqueColor && lineWidth <= 1.5) {
            // Fast path for thin lines: Bresenham algorithm
            const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);
            const data32 = surface.data32;

            let x1i = Math.floor(x1);
            let y1i = Math.floor(y1);
            let x2i = Math.floor(x2);
            let y2i = Math.floor(y2);

            // Shorten horizontal/vertical lines by 1 pixel to match HTML5 Canvas
            // This accounts for the fact that a line from (0,0) to (10,0) in canvas
            // draws 10 pixels, not 11 (the endpoint is exclusive)
            if (x1i === x2i) {
                // Vertical line: shorten in Y direction
                if (y2i > y1i) y2i--; else y1i--;
            }
            if (y1i === y2i) {
                // Horizontal line: shorten in X direction
                if (x2i > x1i) x2i--; else x1i--;
            }

            let dx = Math.abs(x2i - x1i);
            let dy = Math.abs(y2i - y1i);
            const sx = x1i < x2i ? 1 : -1;
            const sy = y1i < y2i ? 1 : -1;
            let err = dx - dy;

            let x = x1i;
            let y = y1i;

            while (true) {
                // Set pixel if in bounds
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const pixelIndex = y * width + x;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                            data32[pixelIndex] = packedColor;
                        }
                    } else {
                        data32[pixelIndex] = packedColor;
                    }
                }

                if (x === x2i && y === y2i) break;

                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
        } else if (isOpaqueColor) {
            // Fast path for thick axis-aligned lines: render as rectangle
            const x1i = Math.floor(x1);
            const y1i = Math.floor(y1);
            const x2i = Math.floor(x2);
            const y2i = Math.floor(y2);
            const data32 = surface.data32;

            if (y1i === y2i) {
                // Horizontal thick line - render as filled rectangle
                const halfWidth = lineWidth / 2;
                const topY = Math.floor(y1 - halfWidth);
                const bottomY = Math.floor(y1 + halfWidth);
                const leftX = Math.min(x1i, x2i);
                const rightX = Math.max(x1i, x2i);
                const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);

                // Fill rectangle as horizontal spans
                for (let y = topY; y < bottomY; y++) {
                    this._fillSpanFast(data32, width, height, leftX, y, rightX - leftX, packedColor, clipBuffer);
                }
            } else if (x1i === x2i) {
                // Vertical thick line - render as filled rectangle
                const halfWidth = lineWidth / 2;
                const leftX = Math.floor(x1 - halfWidth);
                const rightX = Math.floor(x1 + halfWidth);
                const topY = Math.min(y1i, y2i);
                const bottomY = Math.max(y1i, y2i);
                const packedColor = Surface.packColor(paintSource.r, paintSource.g, paintSource.b, 255);

                // Fill rectangle as horizontal spans
                for (let y = topY; y < bottomY; y++) {
                    this._fillSpanFast(data32, width, height, leftX, y, rightX - leftX, packedColor, clipBuffer);
                }
            } else {
                // Non-axis-aligned thick line - use polygon scan algorithm (fast path)
                this._strokeLineThickPolygonScan(x1, y1, x2, y2, lineWidth, paintSource, false);
            }
        } else if (isSemiTransparentColor && lineWidth <= 1.5) {
            // Fast path for thin semitransparent lines: Bresenham with alpha blending
            const data = surface.data;
            const data32 = surface.data32;
            const r = paintSource.r;
            const g = paintSource.g;
            const b = paintSource.b;
            const a = paintSource.a;

            // Pre-compute alpha values for blending
            const incomingAlpha = (a / 255) * this.globalAlpha;
            const inverseIncomingAlpha = 1 - incomingAlpha;

            let x1i = Math.floor(x1);
            let y1i = Math.floor(y1);
            let x2i = Math.floor(x2);
            let y2i = Math.floor(y2);

            // Shorten horizontal/vertical lines by 1 pixel to match HTML5 Canvas
            if (x1i === x2i) {
                if (y2i > y1i) y2i--; else y1i--;
            }
            if (y1i === y2i) {
                if (x2i > x1i) x2i--; else x1i--;
            }

            let dx = Math.abs(x2i - x1i);
            let dy = Math.abs(y2i - y1i);
            const sx = x1i < x2i ? 1 : -1;
            const sy = y1i < y2i ? 1 : -1;
            let err = dx - dy;

            let x = x1i;
            let y = y1i;

            while (true) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const pixelIndex = y * width + x;
                    let drawPixel = true;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (!(clipBuffer[byteIndex] & (1 << bitIndex))) {
                            drawPixel = false;
                        }
                    }

                    if (drawPixel) {
                        // Alpha blending (source-over composition)
                        const index = pixelIndex * 4;
                        const oldAlpha = data[index + 3] / 255;
                        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
                        const newAlpha = incomingAlpha + oldAlphaScaled;

                        if (newAlpha > 0) {
                            const blendFactor = 1 / newAlpha;
                            data[index] = (r * incomingAlpha + data[index] * oldAlphaScaled) * blendFactor;
                            data[index + 1] = (g * incomingAlpha + data[index + 1] * oldAlphaScaled) * blendFactor;
                            data[index + 2] = (b * incomingAlpha + data[index + 2] * oldAlphaScaled) * blendFactor;
                            data[index + 3] = newAlpha * 255;
                        }
                    }
                }

                if (x === x2i && y === y2i) break;

                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
        } else if (isSemiTransparentColor) {
            // Fast path for thick semitransparent lines: polygon scan with alpha blending
            this._strokeLineThickPolygonScan(x1, y1, x2, y2, lineWidth, paintSource, true);
        } else {
            // Standard path for non-Color paint sources (gradients, patterns)
            Context2D._markSlowPath();
            this.beginPath();
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            const savedTransform = this._transform;
            this._transform = new Transform2D();
            const savedLineWidth = this._lineWidth;
            this._lineWidth = lineWidth;
            this.stroke();
            this._lineWidth = savedLineWidth;
            this._transform = savedTransform;
        }
    }

    /**
     * Fast thick line rendering using polygon scanline algorithm
     * Treats the thick line as a quadrilateral and fills it using scanline rendering.
     * Adapted from CrispSwCanvas's _drawLineThickPolygonScan algorithm.
     * @private
     * @param {boolean} useSemiTransparent - If true, use alpha blending for semitransparent colors
     */
    _strokeLineThickPolygonScan(x1, y1, x2, y2, lineWidth, paintSource, useSemiTransparent = false) {
        const surface = this.surface;
        const width = surface.width;
        const height = surface.height;
        const data32 = surface.data32;
        const data = surface.data;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Get color components
        const r = paintSource.r;
        const g = paintSource.g;
        const b = paintSource.b;
        const a = paintSource.a;

        // Get packed color for opaque rendering
        const packedColor = useSemiTransparent ? 0 : Surface.packColor(r, g, b, 255);

        // Pre-compute alpha values for semitransparent rendering
        const incomingAlpha = useSemiTransparent ? (a / 255) * this.globalAlpha : 0;
        const inverseIncomingAlpha = useSemiTransparent ? 1 - incomingAlpha : 0;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (lineLength === 0) {
            // Handle zero-length line case - draw a square
            const radius = (lineWidth / 2) | 0;
            const centerX = x1 | 0;
            const centerY = y1 | 0;

            for (let py = -radius; py <= radius; py++) {
                const y = centerY + py;
                if (y < 0 || y >= height) continue;
                const leftX = Math.max(0, centerX - radius);
                const rightX = Math.min(width - 1, centerX + radius);
                if (useSemiTransparent) {
                    this._fillSpanAlpha(data, width, height, leftX, y, rightX - leftX + 1, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                } else {
                    this._fillSpanFast(data32, width, height, leftX, y, rightX - leftX + 1, packedColor, clipBuffer);
                }
            }
            return;
        }

        // Calculate perpendicular vector
        const invLineLength = 1 / lineLength;
        const perpX = -dy * invLineLength;
        const perpY = dx * invLineLength;
        const halfThick = lineWidth * 0.5;

        // Calculate perpendicular offsets for corner calculations
        const perpXHalfThick = perpX * halfThick;
        const perpYHalfThick = perpY * halfThick;

        // Calculate 4 corners of the thick line rectangle
        const corners = [
            { x: x1 + perpXHalfThick, y: y1 + perpYHalfThick },  // top-left
            { x: x1 - perpXHalfThick, y: y1 - perpYHalfThick },  // bottom-left
            { x: x2 - perpXHalfThick, y: y2 - perpYHalfThick },  // bottom-right
            { x: x2 + perpXHalfThick, y: y2 + perpYHalfThick }   // top-right
        ];

        // Find bounding box
        const minY = Math.max(0, Math.floor(Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));
        const maxY = Math.min(height - 1, Math.ceil(Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)));

        // Pre-compute edge data for faster intersection calculation
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];

            if (p1.y !== p2.y) {
                edges.push({
                    p1: p1,
                    p2: p2,
                    invDeltaY: 1 / (p2.y - p1.y),
                    deltaX: p2.x - p1.x
                });
            }
        }

        // Pre-allocate intersections array
        const intersections = [];

        // Scanline fill
        for (let y = minY; y <= maxY; y++) {
            intersections.length = 0;

            // Find x-intersections with polygon edges
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                const p1 = edge.p1;
                const p2 = edge.p2;

                // Check if scanline intersects this edge
                if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
                    const t = (y - p1.y) * edge.invDeltaY;
                    intersections.push(p1.x + t * edge.deltaX);
                }
            }

            if (intersections.length === 1) {
                // Single intersection - draw one pixel
                const x = intersections[0] | 0;
                if (x >= 0 && x < width) {
                    const pixelIndex = y * width + x;
                    let drawPixel = true;

                    if (clipBuffer) {
                        const byteIndex = pixelIndex >> 3;
                        const bitIndex = pixelIndex & 7;
                        if (!(clipBuffer[byteIndex] & (1 << bitIndex))) {
                            drawPixel = false;
                        }
                    }

                    if (drawPixel) {
                        if (useSemiTransparent) {
                            // Alpha blending for single pixel
                            const index = pixelIndex * 4;
                            const oldAlpha = data[index + 3] / 255;
                            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
                            const newAlpha = incomingAlpha + oldAlphaScaled;

                            if (newAlpha > 0) {
                                const blendFactor = 1 / newAlpha;
                                data[index] = (r * incomingAlpha + data[index] * oldAlphaScaled) * blendFactor;
                                data[index + 1] = (g * incomingAlpha + data[index + 1] * oldAlphaScaled) * blendFactor;
                                data[index + 2] = (b * incomingAlpha + data[index + 2] * oldAlphaScaled) * blendFactor;
                                data[index + 3] = newAlpha * 255;
                            }
                        } else {
                            data32[pixelIndex] = packedColor;
                        }
                    }
                }
            } else if (intersections.length >= 2) {
                // Two or more intersections - draw span between min and max
                const x1i = intersections[0];
                const x2i = intersections[1];
                const leftX = Math.max(0, Math.floor(Math.min(x1i, x2i)));
                const rightX = Math.min(width - 1, Math.ceil(Math.max(x1i, x2i)));
                const spanLength = rightX - leftX + 1;

                if (spanLength > 0) {
                    if (useSemiTransparent) {
                        this._fillSpanAlpha(data, width, height, leftX, y, spanLength, r, g, b, incomingAlpha, inverseIncomingAlpha, clipBuffer);
                    } else {
                        this._fillSpanFast(data32, width, height, leftX, y, spanLength, packedColor, clipBuffer);
                    }
                }
            }
        }
    }

    /**
     * Fast horizontal span fill with 32-bit writes
     * @private
     */
    _fillSpanFast(data32, surfaceWidth, surfaceHeight, startX, y, length, packedColor, clipBuffer) {
        // Y bounds check - use floor for consistent pixel alignment
        const yi = Math.floor(y);
        if (yi < 0 || yi >= surfaceHeight) return;

        // X clipping to surface bounds - use floor for consistent pixel alignment
        let x = Math.floor(startX);
        let len = length;
        if (x < 0) {
            len += x;
            x = 0;
        }
        if (x + len > surfaceWidth) {
            len = surfaceWidth - x;
        }
        if (len <= 0) return;

        let pixelIndex = yi * surfaceWidth + x;
        const endIndex = pixelIndex + len;

        if (clipBuffer) {
            // With clipping
            while (pixelIndex < endIndex) {
                const byteIndex = pixelIndex >> 3;

                // Skip fully clipped bytes
                if (clipBuffer[byteIndex] === 0) {
                    const nextByteBoundary = (byteIndex + 1) << 3;
                    pixelIndex = Math.min(nextByteBoundary, endIndex);
                    continue;
                }

                const bitIndex = pixelIndex & 7;
                if (clipBuffer[byteIndex] & (1 << bitIndex)) {
                    data32[pixelIndex] = packedColor;
                }
                pixelIndex++;
            }
        } else {
            // No clipping - fastest path
            for (; pixelIndex < endIndex; pixelIndex++) {
                data32[pixelIndex] = packedColor;
            }
        }
    }

    /**
     * Horizontal span fill with alpha blending (source-over)
     * @private
     */
    _fillSpanAlpha(data, surfaceWidth, surfaceHeight, startX, y, length, r, g, b, alpha, invAlpha, clipBuffer) {
        // Y bounds check - use floor for consistent pixel alignment
        const yi = Math.floor(y);
        if (yi < 0 || yi >= surfaceHeight) return;

        // X clipping to surface bounds - use floor for consistent pixel alignment
        let x = Math.floor(startX);
        let len = length;
        if (x < 0) {
            len += x;
            x = 0;
        }
        if (x + len > surfaceWidth) {
            len = surfaceWidth - x;
        }
        if (len <= 0) return;

        const endX = x + len;
        const rowOffset = yi * surfaceWidth * 4;

        if (clipBuffer) {
            // With clipping
            for (let px = x; px < endX; px++) {
                const bitIndex = yi * surfaceWidth + px;
                const byteIndex = bitIndex >> 3;
                const bitOffset = bitIndex & 7;
                if ((clipBuffer[byteIndex] & (1 << bitOffset)) === 0) continue;

                const offset = rowOffset + px * 4;
                this._blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha);
            }
        } else {
            // No clipping
            for (let px = x; px < endX; px++) {
                const offset = rowOffset + px * 4;
                this._blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha);
            }
        }
    }

    /**
     * Blend a single pixel with source-over alpha compositing
     * @private
     */
    _blendPixelAlpha(data, offset, r, g, b, alpha, invAlpha) {
        // Source-over alpha blending formula
        const dstA = data[offset + 3] / 255;
        const dstAScaled = dstA * invAlpha;
        const outA = alpha + dstAScaled;

        if (outA > 0) {
            const blendFactor = 1 / outA;
            data[offset]     = (r * alpha + data[offset] * dstAScaled) * blendFactor;
            data[offset + 1] = (g * alpha + data[offset + 1] * dstAScaled) * blendFactor;
            data[offset + 2] = (b * alpha + data[offset + 2] * dstAScaled) * blendFactor;
            data[offset + 3] = outA * 255;
        }
    }
}