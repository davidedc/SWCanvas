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
    // Static flag to track path-based rendering usage (for testing)
    // Reset before each test, check after to verify direct rendering was used
    static _pathBasedRenderingUsed = false;

    /**
     * Reset the path-based rendering tracking flag
     * Call before running tests that should use direct rendering
     */
    static resetPathBasedFlag() {
        Context2D._pathBasedRenderingUsed = false;
    }

    /**
     * Check if path-based rendering was used since last reset
     * @returns {boolean} True if path-based rendering was used
     */
    static wasPathBasedUsed() {
        return Context2D._pathBasedRenderingUsed;
    }

    /**
     * Mark that path-based rendering was used (called internally)
     * @private
     */
    static _markPathBasedRendering() {
        Context2D._pathBasedRenderingUsed = true;
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

    // Drawing methods - rectangle operations
    fillRect(x, y, width, height) {
        const paintSource = this._fillStyle;
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noClip = !this._clipMask;
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);

        // Direct rendering: Color fill with source-over, no shadows (clipping supported)
        if (isColor && isSourceOver && noShadow) {
            const transform = this._transform;
            const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

            // Decompose transform
            const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
            const rotation = transform.rotationAngle;
            const scaleX = transform.scaleX;
            const scaleY = transform.scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            const isAxisAligned = RectOps.isNearAxisAligned(rotation);
            // Non-uniform scale + rotation produces a parallelogram, not a rotated rectangle
            // Check matrix structure: for uniform scale+rotation, a=d and b=-c
            const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                   Math.abs(transform.b + transform.c) < 0.001;

            if (isAxisAligned) {
                // Axis-aligned: use direct fill (works with non-uniform scale)
                const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                const topLeftX = center.x - adjustedWidth / 2;
                const topLeftY = center.y - adjustedHeight / 2;

                if (isOpaque) {
                    RectOps.fill_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, paintSource, clipBuffer);
                    return;
                } else if (paintSource.a > 0) {
                    RectOps.fill_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, paintSource, this.globalAlpha, clipBuffer);
                    return;
                }
            } else if (isUniformScale) {
                // Rotated with uniform scale: use edge-function algorithm
                if (isOpaque) {
                    RectOps.fill_Rot_Any(this.surface, center.x, center.y, scaledWidth, scaledHeight, rotation, paintSource, 1.0, clipBuffer);
                    return;
                } else if (paintSource.a > 0) {
                    RectOps.fill_Rot_Any(this.surface, center.x, center.y, scaledWidth, scaledHeight, rotation, paintSource, this.globalAlpha, clipBuffer);
                    return;
                }
            }
            // Non-uniform scale + rotation: fall through to path-based rendering (produces parallelogram)
        }

        // Path-based rendering: gradients, patterns, non-source-over, shadows, clipping
        Context2D._markPathBasedRendering();
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
        const paintSource = this._strokeStyle;
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noClip = !this._clipMask;
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);

        // Direct rendering: Color stroke with source-over, no shadows (clipping supported)
        if (isColor && isSourceOver && noShadow) {
            const transform = this._transform;
            const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

            // Decompose transform
            const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
            const rotation = transform.rotationAngle;
            const scaleX = transform.scaleX;
            const scaleY = transform.scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;
            const scaledLineWidth = transform.getScaledLineWidth(this._lineWidth);

            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            const isAxisAligned = RectOps.isNearAxisAligned(rotation);
            // Non-uniform scale + rotation produces a parallelogram, not a rotated rectangle
            // Check matrix structure: for uniform scale+rotation, a=d and b=-c
            const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                   Math.abs(transform.b + transform.c) < 0.001;

            if (isAxisAligned) {
                // Axis-aligned: use direct rendering with adjusted coordinates (works with non-uniform scale)
                const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                const topLeftX = center.x - adjustedWidth / 2;
                const topLeftY = center.y - adjustedHeight / 2;

                const is1pxStroke = Math.abs(scaledLineWidth - 1) < 0.001;
                const isThickStroke = scaledLineWidth > 1;

                if (is1pxStroke) {
                    if (isOpaque) {
                        RectOps.stroke1px_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, paintSource, clipBuffer);
                        return;
                    } else if (paintSource.a > 0) {
                        RectOps.stroke1px_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, paintSource, this.globalAlpha, clipBuffer);
                        return;
                    }
                } else if (isThickStroke) {
                    if (isOpaque) {
                        RectOps.strokeThick_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledLineWidth, paintSource, clipBuffer);
                        return;
                    } else if (paintSource.a > 0) {
                        RectOps.strokeThick_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledLineWidth, paintSource, this.globalAlpha, clipBuffer);
                        return;
                    }
                }
            } else if (isUniformScale) {
                // Rotated with uniform scale: use line-based stroke
                if (paintSource.a > 0) {
                    RectOps.stroke_Rot_Any(this.surface, center.x, center.y, scaledWidth, scaledHeight, rotation, scaledLineWidth, paintSource, this.globalAlpha, clipBuffer);
                    return;
                }
            }
            // Non-uniform scale + rotation: fall through to path-based rendering (produces parallelogram)
        }

        // Path-based rendering: Create a rectangular path
        Context2D._markPathBasedRendering();
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

    /**
     * Fill and stroke a rectangle in a single operation
     * Uses unified rendering when possible to prevent fill/stroke gaps.
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     */
    fillAndStrokeRect(x, y, width, height) {
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' ||
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }

        if (width < 0 || height < 0) {
            return; // Nothing to draw for negative dimensions
        }

        if (width === 0 || height === 0) {
            return; // Nothing to draw for zero dimensions
        }

        // Check for direct rendering conditions
        const fillPaint = this._fillStyle;
        const strokePaint = this._strokeStyle;
        const fillIsColor = fillPaint instanceof Color;
        const strokeIsColor = strokePaint instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Direct rendering: both fill and stroke are solid colors, source-over, no shadows
        if (fillIsColor && strokeIsColor && isSourceOver && noShadow) {
            const hasFill = fillPaint.a > 0;
            const hasStroke = strokePaint.a > 0 && this._lineWidth > 0;

            if (hasFill || hasStroke) {
                const transform = this._transform;

                // Decompose transform
                const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
                const rotation = transform.rotationAngle;
                const scaleX = transform.scaleX;
                const scaleY = transform.scaleY;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;
                const scaledLineWidth = transform.getScaledLineWidth(this._lineWidth);

                const isAxisAligned = RectOps.isNearAxisAligned(rotation);
                // Non-uniform scale + rotation produces a parallelogram, not a rotated rectangle
                // Check matrix structure: for uniform scale+rotation, a=d and b=-c
                const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                       Math.abs(transform.b + transform.c) < 0.001;

                if (isAxisAligned) {
                    // Axis-aligned: use unified fill+stroke (works with non-uniform scale)
                    const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                    const topLeftX = center.x - adjustedWidth / 2;
                    const topLeftY = center.y - adjustedHeight / 2;

                    RectOps.fillStroke_AA_Any(
                        this.surface,
                        topLeftX, topLeftY, adjustedWidth, adjustedHeight,
                        scaledLineWidth,
                        hasFill ? fillPaint : null,
                        hasStroke ? strokePaint : null,
                        this.globalAlpha,
                        clipBuffer
                    );
                    return;
                } else if (isUniformScale) {
                    // Rotated with uniform scale: use rotated fill+stroke wrapper
                    RectOps.fillStroke_Rot_Any(
                        this.surface,
                        center.x, center.y, scaledWidth, scaledHeight, rotation,
                        scaledLineWidth,
                        hasFill ? fillPaint : null,
                        hasStroke ? strokePaint : null,
                        this.globalAlpha,
                        clipBuffer
                    );
                    return;
                }
                // Non-uniform scale + rotation: fall through to path-based rendering (produces parallelogram)
            }
        }

        // Path-based rendering: gradients, patterns, non-source-over, shadows, or parallelograms
        Context2D._markPathBasedRendering();
        this.fillRect(x, y, width, height);
        this.strokeRect(x, y, width, height);
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

    /**
     * Stroke a rounded rectangle.
     * Uses direct rendering for strokes with no transforms/clipping/shadows.
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     */
    strokeRoundRect(x, y, width, height, radii) {
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' ||
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }

        if (width < 0 || height < 0) {
            return; // Nothing to draw for negative dimensions
        }

        if (width === 0 || height === 0) {
            return; // Nothing to draw for zero dimensions
        }

        // Normalize radius to check for zero
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);

        // Fallback to strokeRect for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            this.strokeRect(x, y, width, height);
            return;
        }

        const paintSource = this._strokeStyle;

        // Direct rendering conditions
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        if (isColor && isSourceOver && noShadow && paintSource.a > 0) {
            const transform = this._transform;

            // Decompose transform
            const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
            const rotation = transform.rotationAngle;
            const scaleX = transform.scaleX;
            const scaleY = transform.scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;
            const scaledLineWidth = transform.getScaledLineWidth(this._lineWidth);
            const is1pxStroke = Math.abs(scaledLineWidth - 1) < 0.001;

            // Check matrix structure for uniform scale: a=d and b=-c
            const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                   Math.abs(transform.b + transform.c) < 0.001;

            if (isUniformScale) {
                const scaledRadius = radius * scaleX;
                const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;

                if (transform.isIdentity) {
                    // No transform: use axis-aligned methods with original coordinates
                    if (is1pxStroke) {
                        if (isOpaque) {
                            RoundedRectOps.stroke1px_AA_Opaq(this.surface, x, y, width, height, radii, paintSource, clipBuffer);
                            return;
                        } else {
                            RoundedRectOps.stroke1px_AA_Alpha(this.surface, x, y, width, height, radii, paintSource, this.globalAlpha, clipBuffer);
                            return;
                        }
                    } else {
                        if (isOpaque) {
                            RoundedRectOps.strokeThick_AA_Opaq(this.surface, x, y, width, height, radii, this._lineWidth, paintSource, clipBuffer);
                            return;
                        } else {
                            RoundedRectOps.strokeThick_AA_Alpha(this.surface, x, y, width, height, radii, this._lineWidth, paintSource, this.globalAlpha, clipBuffer);
                            return;
                        }
                    }
                }

                const isAxisAligned = RectOps.isNearAxisAligned(rotation);

                if (isAxisAligned) {
                    // Axis-aligned rotation (90/180/270): adjust dimensions
                    const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                    const topLeftX = center.x - adjustedWidth / 2;
                    const topLeftY = center.y - adjustedHeight / 2;

                    if (is1pxStroke) {
                        if (isOpaque) {
                            RoundedRectOps.stroke1px_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, paintSource, clipBuffer);
                            return;
                        } else {
                            RoundedRectOps.stroke1px_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, paintSource, this.globalAlpha, clipBuffer);
                            return;
                        }
                    } else {
                        if (isOpaque) {
                            RoundedRectOps.strokeThick_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, scaledLineWidth, paintSource, clipBuffer);
                            return;
                        } else {
                            RoundedRectOps.strokeThick_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, scaledLineWidth, paintSource, this.globalAlpha, clipBuffer);
                            return;
                        }
                    }
                } else {
                    // Rotated with uniform scale: use strokeRotated
                    RoundedRectOps.stroke_Rot_Any(
                        this.surface,
                        center.x, center.y, scaledWidth, scaledHeight,
                        scaledRadius,
                        rotation,
                        scaledLineWidth,
                        paintSource,
                        this.globalAlpha,
                        clipBuffer
                    );
                    return;
                }
            }
            // Non-uniform scale: fall through to path-based rendering
        }

        // Path-based rendering: use general path system
        Context2D._markPathBasedRendering();
        this.beginPath();
        this._currentPath.roundRect(x, y, width, height, radii);
        this.stroke();
    }

    /**
     * Fill a rounded rectangle.
     * Uses direct rendering when possible (solid color, source-over, no shadow, uniform scale).
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     */
    fillRoundRect(x, y, width, height, radii) {
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' ||
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }

        if (width < 0 || height < 0) {
            return; // Nothing to draw for negative dimensions
        }

        if (width === 0 || height === 0) {
            return; // Nothing to draw for zero dimensions
        }

        // Normalize radius to check for zero
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);

        // Fallback to fillRect for zero radius (rounded rect becomes regular rect)
        if (radius <= 0) {
            this.fillRect(x, y, width, height);
            return;
        }

        // Check for direct rendering conditions
        const paintSource = this._fillStyle;
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        if (isColor && isSourceOver && noShadow && paintSource.a > 0) {
            const transform = this._transform;

            // Decompose transform
            const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
            const rotation = transform.rotationAngle;
            const scaleX = transform.scaleX;
            const scaleY = transform.scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            // Check matrix structure for uniform scale: a=d and b=-c
            const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                   Math.abs(transform.b + transform.c) < 0.001;

            if (isUniformScale) {
                const scaledRadius = radius * scaleX;
                const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;

                if (transform.isIdentity) {
                    // No transform: use axis-aligned methods with original coordinates
                    if (isOpaque) {
                        RoundedRectOps.fill_AA_Opaq(this.surface, x, y, width, height, radii, paintSource, clipBuffer);
                        return;
                    } else {
                        RoundedRectOps.fill_AA_Alpha(this.surface, x, y, width, height, radii, paintSource, this.globalAlpha, clipBuffer);
                        return;
                    }
                }

                const isAxisAligned = RectOps.isNearAxisAligned(rotation);

                if (isAxisAligned) {
                    // Axis-aligned rotation (90/180/270): adjust dimensions
                    const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                    const topLeftX = center.x - adjustedWidth / 2;
                    const topLeftY = center.y - adjustedHeight / 2;

                    if (isOpaque) {
                        RoundedRectOps.fill_AA_Opaq(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, paintSource, clipBuffer);
                        return;
                    } else {
                        RoundedRectOps.fill_AA_Alpha(this.surface, topLeftX, topLeftY, adjustedWidth, adjustedHeight, scaledRadius, paintSource, this.globalAlpha, clipBuffer);
                        return;
                    }
                } else {
                    // Rotated with uniform scale: use fillRotated
                    RoundedRectOps.fill_Rot_Any(
                        this.surface,
                        center.x, center.y, scaledWidth, scaledHeight,
                        scaledRadius,
                        rotation,
                        paintSource,
                        this.globalAlpha,
                        clipBuffer
                    );
                    return;
                }
            }
            // Non-uniform scale: fall through to path-based rendering
        }

        // Path-based rendering: use general path system
        Context2D._markPathBasedRendering();
        this.beginPath();
        this._currentPath.roundRect(x, y, width, height, radii);
        this.fill();
    }

    /**
     * Fill and stroke a rounded rectangle in a single unified operation.
     * Uses unified direct rendering to prevent fill/stroke boundary speckles.
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number|number[]} radii - Corner radius (single value or array)
     */
    fillAndStrokeRoundRect(x, y, width, height, radii) {
        // Validate parameters
        if (typeof x !== 'number' || typeof y !== 'number' ||
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle coordinates must be numbers');
        }

        if (width < 0 || height < 0) {
            return; // Nothing to draw for negative dimensions
        }

        if (width === 0 || height === 0) {
            return; // Nothing to draw for zero dimensions
        }

        // Normalize radius to check for zero
        let radius = Array.isArray(radii) ? radii[0] : (radii || 0);

        // Fallback to fillAndStrokeRect for zero radius
        if (radius <= 0) {
            this.fillAndStrokeRect(x, y, width, height);
            return;
        }

        // Check for direct rendering conditions
        const fillPaint = this._fillStyle;
        const strokePaint = this._strokeStyle;
        const fillIsColor = fillPaint instanceof Color;
        const strokeIsColor = strokePaint instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const noShadow = !this.shadowColor || this.shadowColor === 'transparent' ||
                        (this.shadowBlur === 0 && this.shadowOffsetX === 0 && this.shadowOffsetY === 0);
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Direct rendering: both fill and stroke are solid colors, source-over, no shadows
        if (fillIsColor && strokeIsColor && isSourceOver && noShadow) {
            const hasFill = fillPaint.a > 0;
            const hasStroke = strokePaint.a > 0 && this._lineWidth > 0;

            if (hasFill || hasStroke) {
                const transform = this._transform;

                // Decompose transform
                const center = transform.transformPoint({x: x + width / 2, y: y + height / 2});
                const rotation = transform.rotationAngle;
                const scaleX = transform.scaleX;
                const scaleY = transform.scaleY;
                const scaledWidth = width * scaleX;
                const scaledHeight = height * scaleY;
                const scaledLineWidth = transform.getScaledLineWidth(this._lineWidth);

                // Check matrix structure for uniform scale: a=d and b=-c
                const isUniformScale = Math.abs(transform.a - transform.d) < 0.001 &&
                                       Math.abs(transform.b + transform.c) < 0.001;

                // For rounded rects, non-uniform scale turns circles into ellipses
                // Only use direct rendering for uniform scale or identity
                if (isUniformScale) {
                    // Scale radius uniformly
                    const scaledRadius = radius * scaleX;

                    if (transform.isIdentity) {
                        // Axis-aligned, no transform: use top-left coordinates
                        RoundedRectOps.fillStroke_AA_Any(
                            this.surface,
                            x, y, width, height,
                            radii,
                            this._lineWidth,
                            hasFill ? fillPaint : null,
                            hasStroke ? strokePaint : null,
                            this.globalAlpha,
                            clipBuffer
                        );
                        return;
                    }

                    const isAxisAligned = RectOps.isNearAxisAligned(rotation);

                    if (isAxisAligned) {
                        // Axis-aligned with uniform scale: adjust for potential 90/180/270 degree rotation
                        const { adjustedWidth, adjustedHeight } = RectOps.getRotatedDimensions(scaledWidth, scaledHeight, rotation);
                        const topLeftX = center.x - adjustedWidth / 2;
                        const topLeftY = center.y - adjustedHeight / 2;

                        RoundedRectOps.fillStroke_AA_Any(
                            this.surface,
                            topLeftX, topLeftY, adjustedWidth, adjustedHeight,
                            scaledRadius,
                            scaledLineWidth,
                            hasFill ? fillPaint : null,
                            hasStroke ? strokePaint : null,
                            this.globalAlpha,
                            clipBuffer
                        );
                        return;
                    } else {
                        // Rotated with uniform scale: use rotated fill+stroke
                        RoundedRectOps.fillStroke_Rot_Any(
                            this.surface,
                            center.x, center.y, scaledWidth, scaledHeight,
                            scaledRadius,
                            rotation,
                            scaledLineWidth,
                            hasFill ? fillPaint : null,
                            hasStroke ? strokePaint : null,
                            this.globalAlpha,
                            clipBuffer
                        );
                        return;
                    }
                }
                // Non-uniform scale: fall through to path-based rendering
            }
        }

        // Path-based rendering: use sequential fill + stroke
        Context2D._markPathBasedRendering();
        this.fillRoundRect(x, y, width, height, radii);
        this.strokeRoundRect(x, y, width, height, radii);
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

        // Mark path-based rendering for testing (fill() has no direct rendering currently)
        Context2D._markPathBasedRendering();

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

        // All path-based strokes use generic pipeline
        // Direct rendering available via dedicated methods: strokeCircle(), strokeRect(), etc.
        Context2D._markPathBasedRendering();

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

        // Mark path-based rendering for testing (drawImage() has no direct rendering currently)
        Context2D._markPathBasedRendering();

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
    // DIRECT SHAPE APIs
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
     * Uses unified rendering when possible to prevent fill/stroke gaps.
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circle radius
     */
    fillAndStrokeCircle(centerX, centerY, radius) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius and line width
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;
        const scaledLineWidth = this._lineWidth * scale;

        // Get paint sources
        const fillPaintSource = this._fillStyle;
        const strokePaintSource = this._strokeStyle;

        // Check if we can use unified direct rendering:
        // - Both fill and stroke are solid Colors
        // - Composite operation is source-over
        const fillIsColor = fillPaintSource instanceof Color;
        const strokeIsColor = strokePaintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const hasFill = fillIsColor && fillPaintSource.a > 0;
        const hasStroke = strokeIsColor && strokePaintSource.a > 0;

        if (fillIsColor && strokeIsColor && isSourceOver && (hasFill || hasStroke)) {
            // Use unified method for coordinated fill+stroke rendering (no gaps)
            const clipBuffer = this._clipMask ? this._clipMask.buffer : null;
            CircleOps.fillStroke_Any(
                this.surface,
                center.x, center.y,
                scaledRadius,
                scaledLineWidth,
                hasFill ? fillPaintSource : null,
                hasStroke ? strokePaintSource : null,
                this.globalAlpha,
                clipBuffer
            );
        } else {
            // Fallback to sequential rendering for gradients, patterns, or non-source-over
            this._fillCircleDirect(center.x, center.y, scaledRadius, fillPaintSource);
            this._strokeCircleDirect(center.x, center.y, scaledRadius, scaledLineWidth, strokePaintSource);
        }
    }

    // ========================================================================
    // Arc rendering methods (partial arcs, not full circles)
    // ========================================================================

    /**
     * Fill an arc (pie slice) directly without using the path system
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {boolean} [anticlockwise=false] - Direction
     */
    fillArc(centerX, centerY, radius, startAngle, endAngle, anticlockwise = false) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;

        // Normalize angles
        const angles = ArcOps.normalizeAngles(startAngle, endAngle, anticlockwise);

        // Get paint source
        const paintSource = this._fillStyle;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Check for direct rendering conditions
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';

        if (isColor && isSourceOver) {
            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            if (isOpaque) {
                ArcOps.fill_Opaq(this.surface, center.x, center.y, scaledRadius,
                    angles.start, angles.end, paintSource, clipBuffer);
            } else if (paintSource.a > 0) {
                ArcOps.fill_Alpha(this.surface, center.x, center.y, scaledRadius,
                    angles.start, angles.end, paintSource, this.globalAlpha, clipBuffer);
            }
            return;
        }

        // Path-based rendering: use path system
        Context2D._markPathBasedRendering();
        this.beginPath();
        this.moveTo(center.x, center.y);
        this.arc(center.x, center.y, scaledRadius, startAngle, endAngle, anticlockwise);
        this.closePath();
        this.fill();
    }

    /**
     * Stroke only the outer arc curve (not the lines to center)
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {boolean} [anticlockwise=false] - Direction
     */
    outerStrokeArc(centerX, centerY, radius, startAngle, endAngle, anticlockwise = false) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius and line width
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;
        const scaledLineWidth = this._lineWidth * scale;

        // Normalize angles
        const angles = ArcOps.normalizeAngles(startAngle, endAngle, anticlockwise);

        // Get paint source
        const paintSource = this._strokeStyle;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Check for direct rendering conditions
        const isColor = paintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        // Direct rendering only supports butt line caps (open arc shapes need cap handling)
        const isButtCap = this.lineCap === 'butt';

        if (isColor && isSourceOver && isButtCap) {
            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            const is1pxStroke = Math.abs(scaledLineWidth - 1) < 0.001;

            if (is1pxStroke) {
                // Optimized 1px stroke path
                if (isOpaque) {
                    ArcOps.stroke1px_Opaq(this.surface, center.x, center.y, scaledRadius,
                        angles.start, angles.end, paintSource, clipBuffer);
                } else if (paintSource.a > 0) {
                    ArcOps.stroke1px_Alpha(this.surface, center.x, center.y, scaledRadius,
                        angles.start, angles.end, paintSource, this.globalAlpha, clipBuffer);
                }
            } else {
                // Thick stroke path
                if (isOpaque) {
                    ArcOps.strokeOuter_Opaq(this.surface, center.x, center.y, scaledRadius,
                        angles.start, angles.end, scaledLineWidth, paintSource, clipBuffer);
                } else if (paintSource.a > 0) {
                    ArcOps.strokeOuter_Alpha(this.surface, center.x, center.y, scaledRadius,
                        angles.start, angles.end, scaledLineWidth, paintSource, this.globalAlpha, clipBuffer);
                }
            }
            return;
        }

        // Path-based rendering: use path system (arc only, not pie slice)
        Context2D._markPathBasedRendering();
        this.beginPath();
        this.arc(center.x, center.y, scaledRadius, startAngle, endAngle, anticlockwise);
        this.stroke();
    }

    /**
     * Fill an arc (pie slice) and stroke only the outer curve in one operation
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {boolean} [anticlockwise=false] - Direction
     */
    fillAndOuterStrokeArc(centerX, centerY, radius, startAngle, endAngle, anticlockwise = false) {
        if (radius <= 0) return;

        // Transform center point
        const center = this._transform.transformPoint({ x: centerX, y: centerY });

        // Calculate effective radius and line width
        const scale = Math.sqrt(
            Math.abs(this._transform.a * this._transform.d - this._transform.b * this._transform.c)
        );
        const scaledRadius = radius * scale;
        const scaledLineWidth = this._lineWidth * scale;

        // Normalize angles
        const angles = ArcOps.normalizeAngles(startAngle, endAngle, anticlockwise);

        // Get paint sources
        const fillPaintSource = this._fillStyle;
        const strokePaintSource = this._strokeStyle;
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Check for unified direct rendering
        const fillIsColor = fillPaintSource instanceof Color;
        const strokeIsColor = strokePaintSource instanceof Color;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const hasFill = fillIsColor && fillPaintSource.a > 0;
        const hasStroke = strokeIsColor && strokePaintSource.a > 0;
        // Direct rendering only supports butt line caps (open arc shapes need cap handling)
        const isButtCap = this.lineCap === 'butt';

        if (fillIsColor && strokeIsColor && isSourceOver && isButtCap && (hasFill || hasStroke)) {
            // Use unified direct rendering
            ArcOps.fillStrokeOuter_Any(
                this.surface,
                center.x, center.y,
                scaledRadius,
                angles.start, angles.end,
                scaledLineWidth,
                hasFill ? fillPaintSource : null,
                hasStroke ? strokePaintSource : null,
                this.globalAlpha,
                clipBuffer
            );
            return;
        }

        // Path-based rendering: sequential rendering
        Context2D._markPathBasedRendering();

        // Fill pie slice
        if (hasFill) {
            this.beginPath();
            this.moveTo(center.x, center.y);
            this.arc(center.x, center.y, scaledRadius, startAngle, endAngle, anticlockwise);
            this.closePath();
            this.fill();
        }

        // Stroke outer arc only
        if (hasStroke) {
            this.beginPath();
            this.arc(center.x, center.y, scaledRadius, startAngle, endAngle, anticlockwise);
            this.stroke();
        }
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
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Check for solid color direct rendering
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
            // Direct rendering 1: 32-bit packed writes for opaque colors
            CircleOps.fill_Opaq(surface, cx, cy, radius, paintSource, clipBuffer);
        } else if (isSemiTransparentColor) {
            // Direct rendering 2: Bresenham scanlines with per-pixel alpha blending
            CircleOps.fill_Alpha(this.surface, cx, cy, radius, paintSource, this.globalAlpha, clipBuffer);
        } else {
            // Path-based rendering: use path system for gradients/patterns/non-source-over compositing
            Context2D._markPathBasedRendering(); // Mark path-based rendering for testing
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
     * Optimized circle stroke - dispatches to direct rendering when possible
     * @private
     */
    _strokeCircleDirect(cx, cy, radius, lineWidth, paintSource) {
        const isColor = paintSource instanceof Color;
        const is1pxStroke = Math.abs(lineWidth - 1) < 0.001;
        const isSourceOver = this.globalCompositeOperation === 'source-over';
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Direct rendering 1: 1px strokes using Bresenham algorithm
        if (isColor && is1pxStroke && isSourceOver) {
            const isOpaque = paintSource.a === 255 && this.globalAlpha >= 1.0;
            if (isOpaque) {
                CircleOps.stroke1px_Opaq(this.surface, cx, cy, radius, paintSource, clipBuffer);
                return;
            } else if (paintSource.a > 0) {
                CircleOps.stroke1px_Alpha(this.surface, cx, cy, radius, paintSource, this.globalAlpha, clipBuffer);
                return;
            }
        }

        // Direct rendering 2: Thick strokes using scanline annulus algorithm
        if (isColor && isSourceOver && lineWidth > 1 && paintSource.a > 0) {
            CircleOps.strokeThick_Any(this.surface, cx, cy, radius, lineWidth, paintSource, this.globalAlpha, clipBuffer);
            return;
        }

        // Fallback to path system for gradients, patterns, or non-source-over compositing
        Context2D._markPathBasedRendering();
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
     * Optimized line stroke
     * @private
     */
    _strokeLineDirect(x1, y1, x2, y2, lineWidth, paintSource) {
        const clipBuffer = this._clipMask ? this._clipMask.buffer : null;

        // Direct rendering only supports butt line caps (open shapes need cap handling)
        const isButtCap = this.lineCap === 'butt';

        // Get color for solid color direct rendering
        const isOpaqueColor = paintSource instanceof Color &&
            paintSource.a === 255 &&
            this.globalAlpha >= 1.0 &&
            this.globalCompositeOperation === 'source-over' &&
            isButtCap;

        // Check for semitransparent color direct rendering (Color with alpha blending)
        const isSemiTransparentColor = paintSource instanceof Color &&
            !isOpaqueColor &&
            this.globalCompositeOperation === 'source-over' &&
            isButtCap;

        // Try direct rendering via LineOps
        const directRenderingUsed = LineOps.stroke_Any(
            this.surface, x1, y1, x2, y2, lineWidth, paintSource,
            this.globalAlpha, clipBuffer, isOpaqueColor, isSemiTransparentColor
        );

        if (!directRenderingUsed) {
            // Path-based rendering for non-Color paint sources (gradients, patterns)
            Context2D._markPathBasedRendering();
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
}