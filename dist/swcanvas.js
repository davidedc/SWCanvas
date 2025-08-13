(function() {
'use strict';

/**
 * Color class for SWCanvas
 * 
 * Encapsulates color operations, conversions, and alpha blending math.
 * Follows Joshua Bloch's principle of making classes immutable where practical.
 * 
 * Internally uses premultiplied sRGB for consistency with HTML5 Canvas behavior.
 * Provides methods for converting between premultiplied and non-premultiplied forms.
 */
class Color {
    /**
     * Create a Color instance
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)  
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-255)
     * @param {boolean} isPremultiplied - Whether values are already premultiplied
     */
    constructor(r, g, b, a = 255, isPremultiplied = false) {
        // Validate input ranges
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) {
            throw new Error('Color components must be in range 0-255');
        }
        
        if (isPremultiplied) {
            this._r = Math.round(r);
            this._g = Math.round(g);
            this._b = Math.round(b);
            this._a = Math.round(a);
        } else {
            // Convert to premultiplied form
            const alpha = a / 255;
            this._r = Math.round(r * alpha);
            this._g = Math.round(g * alpha);
            this._b = Math.round(b * alpha);
            this._a = Math.round(a);
        }
    }
    
    /**
     * Create Color from non-premultiplied RGBA array
     * @param {number[]} rgba - [r, g, b, a] array (0-255 each)
     * @returns {Color} New Color instance
     */
    static fromRGBA(rgba) {
        return new Color(rgba[0], rgba[1], rgba[2], rgba[3], false);
    }
    
    /**
     * Create Color from premultiplied RGBA array
     * @param {number[]} rgba - [r, g, b, a] array (0-255 each, RGB premultiplied)
     * @returns {Color} New Color instance
     */
    static fromPremultipliedRGBA(rgba) {
        return new Color(rgba[0], rgba[1], rgba[2], rgba[3], true);
    }
    
    /**
     * Create transparent black color
     * @returns {Color} Transparent color
     */
    static transparent() {
        return new Color(0, 0, 0, 0);
    }
    
    /**
     * Create opaque black color
     * @returns {Color} Black color
     */
    static black() {
        return new Color(0, 0, 0, 255);
    }
    
    /**
     * Create opaque white color
     * @returns {Color} White color
     */
    static white() {
        return new Color(255, 255, 255, 255);
    }
    
    // Getters for premultiplied components (internal storage format)
    get premultipliedR() { return this._r; }
    get premultipliedG() { return this._g; }
    get premultipliedB() { return this._b; }
    get premultipliedA() { return this._a; }
    
    // Getters for non-premultiplied components (API-friendly)
    get r() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._r;
        return Math.round((this._r * 255) / this._a);
    }
    
    get g() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._g;
        return Math.round((this._g * 255) / this._a);
    }
    
    get b() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._b;
        return Math.round((this._b * 255) / this._a);
    }
    
    get a() {
        return this._a;
    }
    
    /**
     * Get non-premultiplied RGBA array
     * @returns {number[]} [r, g, b, a] array
     */
    toRGBA() {
        return [this.r, this.g, this.b, this.a];
    }
    
    /**
     * Get premultiplied RGBA array (internal storage format)
     * @returns {number[]} [r, g, b, a] array with RGB premultiplied
     */
    toPremultipliedRGBA() {
        return [this._r, this._g, this._b, this._a];
    }
    
    /**
     * Get alpha as normalized value (0-1)
     * @returns {number} Alpha in 0-1 range
     */
    get normalizedAlpha() {
        return this._a / 255;
    }
    
    /**
     * Check if color is fully transparent
     * @returns {boolean} True if alpha is 0
     */
    get isTransparent() {
        return this._a === 0;
    }
    
    /**
     * Check if color is fully opaque
     * @returns {boolean} True if alpha is 255
     */
    get isOpaque() {
        return this._a === 255;
    }
    
    /**
     * Apply global alpha to this color (immutable operation)
     * @param {number} globalAlpha - Alpha multiplier (0-1)
     * @returns {Color} New Color with applied global alpha
     */
    withGlobalAlpha(globalAlpha) {
        if (globalAlpha < 0 || globalAlpha > 1) {
            throw new Error('Global alpha must be in range 0-1');
        }
        
        const newAlpha = Math.round(this._a * globalAlpha);
        return new Color(this._r, this._g, this._b, newAlpha, true);
    }
    
    /**
     * Blend this color over another color using source-over composition
     * @param {Color} background - Background color to blend over
     * @returns {Color} New Color representing the blended result
     */
    blendOver(background) {
        if (this._a === 255) {
            // Source is opaque - return source
            return this;
        }
        
        if (this._a === 0) {
            // Source is transparent - return background
            return background;
        }
        
        // Standard premultiplied alpha blending
        const srcAlpha = this.normalizedAlpha;
        const invSrcAlpha = 1 - srcAlpha;
        
        const newR = Math.round(this._r + background._r * invSrcAlpha);
        const newG = Math.round(this._g + background._g * invSrcAlpha);
        const newB = Math.round(this._b + background._b * invSrcAlpha);
        const newA = Math.round(this._a + background._a * invSrcAlpha);
        
        return new Color(newR, newG, newB, newA, true);
    }
    
    /**
     * Convert color for BMP output (non-premultiplied RGB)
     * @returns {Object} {r, g, b} object for BMP encoding
     */
    toBMP() {
        return {
            r: this.r,
            g: this.g,
            b: this.b
        };
    }
    
    /**
     * String representation for debugging
     * @returns {string} Color description
     */
    toString() {
        return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
    
    /**
     * Check equality with another Color
     * @param {Color} other - Color to compare with
     * @returns {boolean} True if colors are equal
     */
    equals(other) {
        return other instanceof Color &&
               this._r === other._r &&
               this._g === other._g &&
               this._b === other._b &&
               this._a === other._a;
    }
}
/**
 * Geometry classes for SWCanvas
 * 
 * Provides Point and Rectangle value objects to encapsulate geometric operations.
 * Following Joshua Bloch's principle of making small, focused, immutable classes.
 */

/**
 * Immutable Point class representing a 2D coordinate
 */
class Point {
    /**
     * Create a Point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    
    get x() { return this._x; }
    get y() { return this._y; }
    
    /**
     * Create Point from object with x,y properties
     * @param {Object} obj - Object with x and y properties
     * @returns {Point} New Point instance
     */
    static from(obj) {
        return new Point(obj.x, obj.y);
    }
    
    /**
     * Create origin point (0, 0)
     * @returns {Point} Origin point
     */
    static origin() {
        return new Point(0, 0);
    }
    
    /**
     * Calculate distance to another point
     * @param {Point} other - Other point
     * @returns {number} Euclidean distance
     */
    distanceTo(other) {
        const dx = this._x - other._x;
        const dy = this._y - other._y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate Manhattan distance to another point
     * @param {Point} other - Other point
     * @returns {number} Manhattan distance
     */
    manhattanDistanceTo(other) {
        return Math.abs(this._x - other._x) + Math.abs(this._y - other._y);
    }
    
    /**
     * Add vector to this point (immutable)
     * @param {number} dx - X offset
     * @param {number} dy - Y offset
     * @returns {Point} New translated point
     */
    translate(dx, dy) {
        return new Point(this._x + dx, this._y + dy);
    }
    
    /**
     * Add another point to this point (immutable)
     * @param {Point} other - Other point to add
     * @returns {Point} New point representing sum
     */
    add(other) {
        return new Point(this._x + other._x, this._y + other._y);
    }
    
    /**
     * Subtract another point from this point (immutable)
     * @param {Point} other - Other point to subtract
     * @returns {Point} New point representing difference
     */
    subtract(other) {
        return new Point(this._x - other._x, this._y - other._y);
    }
    
    /**
     * Scale this point by a factor (immutable)
     * @param {number} factor - Scale factor
     * @returns {Point} New scaled point
     */
    scale(factor) {
        return new Point(this._x * factor, this._y * factor);
    }
    
    /**
     * Scale this point by separate X and Y factors (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Point} New scaled point
     */
    scaleXY(sx, sy) {
        return new Point(this._x * sx, this._y * sy);
    }
    
    /**
     * Rotate this point around origin (immutable)
     * @param {number} angle - Rotation angle in radians
     * @returns {Point} New rotated point
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point(
            this._x * cos - this._y * sin,
            this._x * sin + this._y * cos
        );
    }
    
    /**
     * Get magnitude (distance from origin)
     * @returns {number} Vector magnitude
     */
    get magnitude() {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    }
    
    /**
     * Normalize to unit vector (immutable)
     * @returns {Point} New normalized point
     */
    normalize() {
        const mag = this.magnitude;
        if (mag === 0) return new Point(0, 0);
        return new Point(this._x / mag, this._y / mag);
    }
    
    /**
     * Calculate dot product with another point
     * @param {Point} other - Other point/vector
     * @returns {number} Dot product
     */
    dot(other) {
        return this._x * other._x + this._y * other._y;
    }
    
    /**
     * Calculate cross product with another point (2D cross returns scalar)
     * @param {Point} other - Other point/vector
     * @returns {number} Cross product magnitude
     */
    cross(other) {
        return this._x * other._y - this._y * other._x;
    }
    
    /**
     * Round coordinates to integers (immutable)
     * @returns {Point} New point with rounded coordinates
     */
    round() {
        return new Point(Math.round(this._x), Math.round(this._y));
    }
    
    /**
     * Floor coordinates to integers (immutable)
     * @returns {Point} New point with floored coordinates
     */
    floor() {
        return new Point(Math.floor(this._x), Math.floor(this._y));
    }
    
    /**
     * Convert to plain object
     * @returns {Object} {x, y} object
     */
    toObject() {
        return { x: this._x, y: this._y };
    }
    
    /**
     * Check equality with another point
     * @param {Point} other - Other point
     * @param {number} tolerance - Tolerance for floating point comparison
     * @returns {boolean} True if points are equal within tolerance
     */
    equals(other, tolerance = 1e-10) {
        return other instanceof Point &&
               Math.abs(this._x - other._x) < tolerance &&
               Math.abs(this._y - other._y) < tolerance;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Point description
     */
    toString() {
        return `Point(${this._x}, ${this._y})`;
    }
}

/**
 * Immutable Rectangle class representing an axis-aligned bounding box
 */
class Rectangle {
    /**
     * Create a Rectangle
     * @param {number} x - Left coordinate
     * @param {number} y - Top coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     */
    constructor(x, y, width, height) {
        if (width < 0 || height < 0) {
            throw new Error('Rectangle dimensions must be non-negative');
        }
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
    
    get x() { return this._x; }
    get y() { return this._y; }
    get width() { return this._width; }
    get height() { return this._height; }
    
    get left() { return this._x; }
    get top() { return this._y; }
    get right() { return this._x + this._width; }
    get bottom() { return this._y + this._height; }
    
    /**
     * Create rectangle from two corner points
     * @param {Point} topLeft - Top-left corner
     * @param {Point} bottomRight - Bottom-right corner
     * @returns {Rectangle} New Rectangle
     */
    static fromCorners(topLeft, bottomRight) {
        return new Rectangle(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }
    
    /**
     * Create rectangle that bounds a set of points
     * @param {Point[]} points - Array of points
     * @returns {Rectangle} Bounding rectangle
     */
    static boundingBox(points) {
        if (points.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const point of points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }
    
    /**
     * Get center point of rectangle
     * @returns {Point} Center point
     */
    get center() {
        return new Point(
            this._x + this._width / 2,
            this._y + this._height / 2
        );
    }
    
    /**
     * Get area of rectangle
     * @returns {number} Area
     */
    get area() {
        return this._width * this._height;
    }
    
    /**
     * Check if rectangle is empty (zero area)
     * @returns {boolean} True if empty
     */
    get isEmpty() {
        return this._width === 0 || this._height === 0;
    }
    
    /**
     * Check if point is inside rectangle
     * @param {Point} point - Point to test
     * @returns {boolean} True if point is inside
     */
    contains(point) {
        return point.x >= this._x && point.x < this._x + this._width &&
               point.y >= this._y && point.y < this._y + this._height;
    }
    
    /**
     * Check if another rectangle is completely inside this rectangle
     * @param {Rectangle} other - Rectangle to test
     * @returns {boolean} True if other is completely inside
     */
    containsRectangle(other) {
        return other._x >= this._x &&
               other._y >= this._y &&
               other._x + other._width <= this._x + this._width &&
               other._y + other._height <= this._y + this._height;
    }
    
    /**
     * Check if this rectangle intersects with another
     * @param {Rectangle} other - Other rectangle
     * @returns {boolean} True if rectangles intersect
     */
    intersects(other) {
        return !(other._x >= this._x + this._width ||
                other._x + other._width <= this._x ||
                other._y >= this._y + this._height ||
                other._y + other._height <= this._y);
    }
    
    /**
     * Calculate intersection with another rectangle (immutable)
     * @param {Rectangle} other - Other rectangle
     * @returns {Rectangle|null} Intersection rectangle or null if no intersection
     */
    intersection(other) {
        const left = Math.max(this._x, other._x);
        const top = Math.max(this._y, other._y);
        const right = Math.min(this._x + this._width, other._x + other._width);
        const bottom = Math.min(this._y + this._height, other._y + other._height);
        
        if (left >= right || top >= bottom) {
            return null; // No intersection
        }
        
        return new Rectangle(left, top, right - left, bottom - top);
    }
    
    /**
     * Calculate union with another rectangle (immutable)
     * @param {Rectangle} other - Other rectangle
     * @returns {Rectangle} Union rectangle
     */
    union(other) {
        const left = Math.min(this._x, other._x);
        const top = Math.min(this._y, other._y);
        const right = Math.max(this._x + this._width, other._x + other._width);
        const bottom = Math.max(this._y + this._height, other._y + other._height);
        
        return new Rectangle(left, top, right - left, bottom - top);
    }
    
    /**
     * Translate rectangle by offset (immutable)
     * @param {number} dx - X offset
     * @param {number} dy - Y offset
     * @returns {Rectangle} New translated rectangle
     */
    translate(dx, dy) {
        return new Rectangle(this._x + dx, this._y + dy, this._width, this._height);
    }
    
    /**
     * Scale rectangle by factors (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Rectangle} New scaled rectangle
     */
    scale(sx, sy) {
        return new Rectangle(
            this._x * sx,
            this._y * sy,
            this._width * sx,
            this._height * sy
        );
    }
    
    /**
     * Expand rectangle by margin (immutable)
     * @param {number} margin - Margin to add on all sides
     * @returns {Rectangle} New expanded rectangle
     */
    expand(margin) {
        return new Rectangle(
            this._x - margin,
            this._y - margin,
            this._width + 2 * margin,
            this._height + 2 * margin
        );
    }
    
    /**
     * Clamp rectangle to fit within bounds (immutable)
     * @param {Rectangle} bounds - Bounding rectangle
     * @returns {Rectangle} New clamped rectangle
     */
    clamp(bounds) {
        const left = Math.max(this._x, bounds._x);
        const top = Math.max(this._y, bounds._y);
        const right = Math.min(this._x + this._width, bounds._x + bounds._width);
        const bottom = Math.min(this._y + this._height, bounds._y + bounds._height);
        
        return new Rectangle(
            left,
            top,
            Math.max(0, right - left),
            Math.max(0, bottom - top)
        );
    }
    
    /**
     * Get corner points
     * @returns {Object} {topLeft, topRight, bottomLeft, bottomRight}
     */
    get corners() {
        return {
            topLeft: new Point(this._x, this._y),
            topRight: new Point(this._x + this._width, this._y),
            bottomLeft: new Point(this._x, this._y + this._height),
            bottomRight: new Point(this._x + this._width, this._y + this._height)
        };
    }
    
    /**
     * Check equality with another rectangle
     * @param {Rectangle} other - Other rectangle
     * @returns {boolean} True if rectangles are equal
     */
    equals(other) {
        return other instanceof Rectangle &&
               this._x === other._x &&
               this._y === other._y &&
               this._width === other._width &&
               this._height === other._height;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Rectangle description
     */
    toString() {
        return `Rectangle(${this._x}, ${this._y}, ${this._width}, ${this._height})`;
    }
}
class Matrix {
    constructor(init) {
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

    multiply(other) {
        const result = new Matrix();
        result.a = this.a * other.a + this.b * other.c;
        result.b = this.a * other.b + this.b * other.d;
        result.c = this.c * other.a + this.d * other.c;
        result.d = this.c * other.b + this.d * other.d;
        result.e = this.e * other.a + this.f * other.c + other.e;
        result.f = this.e * other.b + this.f * other.d + other.f;
        return result;
    }

    translate(x, y) {
        const t = new Matrix([1, 0, 0, 1, x, y]);
        return this.multiply(t);
    }

    scale(sx, sy) {
        const s = new Matrix([sx, 0, 0, sy, 0, 0]);
        return this.multiply(s);
    }

    rotate(angleInRadians) {
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        const r = new Matrix([cos, sin, -sin, cos, 0, 0]);
        return this.multiply(r);
    }

    invert() {
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
    }

    transformPoint(point) {
        return {
            x: this.a * point.x + this.c * point.y + this.e,
            y: this.b * point.x + this.d * point.y + this.f
        };
    }
}

class Path2D {
    constructor() {
        this.commands = [];
    }

    closePath() {
        this.commands.push({type: 'closePath'});
    }

    moveTo(x, y) {
        this.commands.push({type: 'moveTo', x: x, y: y});
    }

    lineTo(x, y) {
        this.commands.push({type: 'lineTo', x: x, y: y});
    }

    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.commands.push({
            type: 'bezierCurveTo',
            cp1x: cp1x, cp1y: cp1y,
            cp2x: cp2x, cp2y: cp2y,
            x: x, y: y
        });
    }

    quadraticCurveTo(cpx, cpy, x, y) {
        this.commands.push({
            type: 'quadraticCurveTo',
            cpx: cpx, cpy: cpy,
            x: x, y: y
        });
    }

    rect(x, y, w, h) {
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.closePath();
    }

    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
        this.commands.push({
            type: 'arc',
            x: x, y: y,
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            counterclockwise: !!counterclockwise
        });
    }

    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
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
    }
}
class SurfaceClass {
    constructor(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('Surface dimensions must be positive');
        }
        
        if (width * height > 268435456) { // 16384 * 16384
            throw new Error('SurfaceTooLarge');
        }
        
        this.width = width;
        this.height = height;
        this.stride = width * 4;
        this.data = new Uint8ClampedArray(this.stride * height);
    }
}

// Factory function that can be called with or without 'new' (maintains backward compatibility)
function Surface(width, height) {
    return new SurfaceClass(width, height);
}

// Keep legacy factory function for backward compatibility
function createSurface(width, height) {
    return new SurfaceClass(width, height);
}

/**
 * BitmapEncoder class for SWCanvas
 * 
 * Handles encoding of Surface data to BMP (Windows Bitmap) format.
 * Provides static methods for encoding with proper premultiplied alpha handling
 * and BMP format compliance.
 * 
 * Converted from functional to class-based approach following OO best practices:
 * - Static methods for stateless encoding operations
 * - Clear separation of header generation and pixel processing
 * - Proper error handling and validation
 */
class BitmapEncoder {
    /**
     * Encode a surface to BMP format
     * @param {Surface} surface - Surface to encode
     * @returns {ArrayBuffer} BMP file data
     */
    static encodeBMP(surface) {
        if (!surface || typeof surface !== 'object') {
            throw new Error('Surface must be a valid Surface object');
        }
        
        if (!surface.width || !surface.height || !surface.data) {
            throw new Error('Surface must have width, height, and data properties');
        }
        
        const width = surface.width;
        const height = surface.height;
        const data = surface.data;
        
        // Validate surface data
        const expectedSize = width * height * 4;
        if (data.length !== expectedSize) {
            throw new Error(`Surface data size mismatch. Expected ${expectedSize}, got ${data.length}`);
        }
        
        // Calculate BMP dimensions and sizes
        const dimensions = BitmapEncoder._calculateDimensions(width, height);
        
        // Create output buffer
        const buffer = new ArrayBuffer(dimensions.fileSize);
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);
        
        // Write BMP headers
        BitmapEncoder._writeBMPHeaders(view, dimensions);
        
        // Convert and write pixel data
        BitmapEncoder._writePixelData(bytes, data, surface, dimensions);
        
        return buffer;
    }
    
    /**
     * Calculate BMP dimensions and file size
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {Object} Dimension information
     * @private
     */
    static _calculateDimensions(width, height) {
        // BMP row padding (each row must be aligned to 4-byte boundary)
        const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
        const imageSize = rowSize * height;
        const fileSize = BitmapEncoder.BMP_HEADER_SIZE + imageSize;
        
        return {
            width,
            height,
            rowSize,
            imageSize,
            fileSize
        };
    }
    
    /**
     * Write BMP file header and info header
     * @param {DataView} view - DataView for writing binary data
     * @param {Object} dimensions - Dimension information
     * @private
     */
    static _writeBMPHeaders(view, dimensions) {
        // BMP File Header (14 bytes)
        BitmapEncoder._writeBMPFileHeader(view, dimensions.fileSize);
        
        // BMP Info Header (40 bytes) 
        BitmapEncoder._writeBMPInfoHeader(view, dimensions);
    }
    
    /**
     * Write BMP file header
     * @param {DataView} view - DataView for writing
     * @param {number} fileSize - Total file size
     * @private
     */
    static _writeBMPFileHeader(view, fileSize) {
        const bytes = new Uint8Array(view.buffer);
        
        // BMP signature "BM"
        bytes[0] = 0x42; // 'B'
        bytes[1] = 0x4D; // 'M'
        
        // File size
        view.setUint32(2, fileSize, true);
        
        // Reserved fields (must be 0)
        view.setUint32(6, 0, true);
        
        // Offset to pixel data
        view.setUint32(10, BitmapEncoder.BMP_HEADER_SIZE, true);
    }
    
    /**
     * Write BMP info header (BITMAPINFOHEADER)
     * @param {DataView} view - DataView for writing
     * @param {Object} dimensions - Dimension information
     * @private
     */
    static _writeBMPInfoHeader(view, dimensions) {
        const offset = 14; // After file header
        
        // Header size (40 bytes for BITMAPINFOHEADER)
        view.setUint32(offset + 0, 40, true);
        
        // Width and height
        view.setInt32(offset + 4, dimensions.width, true);
        view.setInt32(offset + 8, -dimensions.height, true); // Negative for top-down
        
        // Color planes (must be 1)
        view.setUint16(offset + 12, 1, true);
        
        // Bits per pixel (24-bit RGB)
        view.setUint16(offset + 14, 24, true);
        
        // Compression method (0 = uncompressed)
        view.setUint32(offset + 16, 0, true);
        
        // Image size
        view.setUint32(offset + 20, dimensions.imageSize, true);
        
        // Pixels per meter (approximately 72 DPI)
        const ppm = 2835; // 72 DPI * 39.3701 inches/meter
        view.setInt32(offset + 24, ppm, true); // X resolution
        view.setInt32(offset + 28, ppm, true); // Y resolution
        
        // Colors in palette (0 for true color)
        view.setUint32(offset + 32, 0, true);
        
        // Important colors (0 = all colors are important)
        view.setUint32(offset + 36, 0, true);
    }
    
    /**
     * Convert RGBA surface data to BMP pixel format and write to buffer
     * @param {Uint8Array} bytes - Byte array for writing
     * @param {Uint8ClampedArray} data - Surface RGBA data (premultiplied)
     * @param {Surface} surface - Original surface for stride info
     * @param {Object} dimensions - Dimension information
     * @private
     */
    static _writePixelData(bytes, data, surface, dimensions) {
        let pixelOffset = BitmapEncoder.BMP_HEADER_SIZE;
        
        for (let y = 0; y < dimensions.height; y++) {
            let rowOffset = pixelOffset;
            
            for (let x = 0; x < dimensions.width; x++) {
                const srcOffset = (y * surface.stride) + (x * 4);
                
                // Get RGBA values (premultiplied from surface)
                const r = data[srcOffset];
                const g = data[srcOffset + 1];
                const b = data[srcOffset + 2];
                const a = data[srcOffset + 3];
                
                // Convert premultiplied RGBA to non-premultiplied RGB
                const rgb = BitmapEncoder._unpremultiplyAlpha(r, g, b, a);
                
                // BMP stores pixels as BGR (not RGB)
                bytes[rowOffset] = rgb.b;
                bytes[rowOffset + 1] = rgb.g;
                bytes[rowOffset + 2] = rgb.r;
                rowOffset += 3;
            }
            
            // Apply row padding to align to 4-byte boundary
            while ((rowOffset - pixelOffset) < dimensions.rowSize) {
                bytes[rowOffset] = 0;
                rowOffset++;
            }
            
            pixelOffset += dimensions.rowSize;
        }
    }
    
    /**
     * Convert premultiplied RGBA to non-premultiplied RGB
     * @param {number} r - Red component (0-255, premultiplied)
     * @param {number} g - Green component (0-255, premultiplied)
     * @param {number} b - Blue component (0-255, premultiplied)
     * @param {number} a - Alpha component (0-255)
     * @returns {Object} {r, g, b} non-premultiplied RGB values
     * @private
     */
    static _unpremultiplyAlpha(r, g, b, a) {
        if (a === 0) {
            // Fully transparent - RGB values don't matter
            return { r: 0, g: 0, b: 0 };
        }
        
        if (a === 255) {
            // Fully opaque - no unpremultiplication needed
            return { r: r, g: g, b: b };
        }
        
        // Unpremultiply: color_unpremult = color_premult * 255 / alpha
        return {
            r: Math.round((r * 255) / a),
            g: Math.round((g * 255) / a), 
            b: Math.round((b * 255) / a)
        };
    }
    
    /**
     * Get BMP file information without encoding (for debugging/info)
     * @param {Surface} surface - Surface to analyze
     * @returns {Object} BMP file information
     */
    static getBMPInfo(surface) {
        if (!surface || !surface.width || !surface.height) {
            throw new Error('Invalid surface');
        }
        
        const dimensions = BitmapEncoder._calculateDimensions(surface.width, surface.height);
        
        return {
            width: dimensions.width,
            height: dimensions.height,
            bitsPerPixel: 24,
            compression: 'None',
            rowSize: dimensions.rowSize,
            imageSize: dimensions.imageSize,
            fileSize: dimensions.fileSize,
            headerSize: BitmapEncoder.BMP_HEADER_SIZE
        };
    }
    
    /**
     * Validate that a surface can be encoded to BMP
     * @param {Surface} surface - Surface to validate
     * @returns {boolean} True if surface can be encoded
     */
    static canEncode(surface) {
        try {
            if (!surface || typeof surface !== 'object') return false;
            if (!surface.width || !surface.height || !surface.data) return false;
            if (surface.width <= 0 || surface.height <= 0) return false;
            if (surface.width > BitmapEncoder.MAX_DIMENSION || 
                surface.height > BitmapEncoder.MAX_DIMENSION) return false;
                
            const expectedSize = surface.width * surface.height * 4;
            return surface.data.length === expectedSize;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Calculate memory usage for BMP encoding
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {number} Memory usage in bytes
     */
    static calculateMemoryUsage(width, height) {
        if (width <= 0 || height <= 0) return 0;
        
        const dimensions = BitmapEncoder._calculateDimensions(width, height);
        return dimensions.fileSize;
    }
}

// Class constants
BitmapEncoder.BMP_HEADER_SIZE = 54; // 14 bytes file header + 40 bytes info header
BitmapEncoder.MAX_DIMENSION = 65535; // Reasonable maximum to prevent memory issues

// Legacy function for backward compatibility
function encodeBMP(surface) {
    return BitmapEncoder.encodeBMP(surface);
}
/**
 * PathFlattener class for SWCanvas
 * 
 * Converts Path2D curves and arcs into line segments (polygons) for rendering.
 * Implements deterministic curve flattening with 0.25px tolerance to ensure
 * visual consistency across platforms.
 * 
 * Converted from functional to class-based approach following OO best practices:
 * - Static methods for stateless operations
 * - Immutable parameters and predictable behavior
 * - Clear separation of concerns
 */
class PathFlattener {
    /**
     * Flatten a Path2D into a list of polygons
     * @param {Path2D} path2d - Path to flatten
     * @returns {Array<Array<Point>>} Array of polygons, each polygon is an array of Point objects
     */
    static flattenPath(path2d) {
        const polygons = [];
        let currentPoly = [];
        let currentPoint = new Point(0, 0);
        let subpathStart = new Point(0, 0);
        
        for (const cmd of path2d.commands) {
            switch (cmd.type) {
                case 'moveTo':
                    PathFlattener._handleMoveTo(cmd, polygons, currentPoly);
                    currentPoint = new Point(cmd.x, cmd.y);
                    subpathStart = new Point(cmd.x, cmd.y);
                    currentPoly = [currentPoint.toObject()]; // Convert to plain object for compatibility
                    break;
                    
                case 'lineTo':
                    currentPoint = new Point(cmd.x, cmd.y);
                    currentPoly.push(currentPoint.toObject());
                    break;
                    
                case 'closePath':
                    PathFlattener._handleClosePath(currentPoly, subpathStart, polygons);
                    currentPoly = [];
                    break;
                    
                case 'quadraticCurveTo':
                    const quadPoints = PathFlattener._flattenQuadraticBezier(
                        currentPoint.x, currentPoint.y,
                        cmd.cpx, cmd.cpy,
                        cmd.x, cmd.y
                    );
                    PathFlattener._appendPoints(currentPoly, quadPoints, 1); // Skip first point
                    currentPoint = new Point(cmd.x, cmd.y);
                    break;
                    
                case 'bezierCurveTo':
                    const cubicPoints = PathFlattener._flattenCubicBezier(
                        currentPoint.x, currentPoint.y,
                        cmd.cp1x, cmd.cp1y,
                        cmd.cp2x, cmd.cp2y,
                        cmd.x, cmd.y
                    );
                    PathFlattener._appendPoints(currentPoly, cubicPoints, 1); // Skip first point
                    currentPoint = new Point(cmd.x, cmd.y);
                    break;
                    
                case 'arc':
                    const arcResult = PathFlattener._handleArc(
                        cmd, currentPoly, currentPoint, subpathStart
                    );
                    currentPoint = arcResult.currentPoint;
                    currentPoly = arcResult.currentPoly;
                    if (arcResult.subpathStart) {
                        subpathStart = arcResult.subpathStart;
                    }
                    break;
                    
                case 'ellipse':
                    const ellipsePoints = PathFlattener._flattenEllipse(
                        cmd.x, cmd.y, cmd.radiusX, cmd.radiusY, cmd.rotation,
                        cmd.startAngle, cmd.endAngle, cmd.counterclockwise
                    );
                    PathFlattener._handleEllipsePoints(ellipsePoints, currentPoly, currentPoint);
                    if (ellipsePoints.length > 0) {
                        currentPoint = new Point(
                            ellipsePoints[ellipsePoints.length - 1].x,
                            ellipsePoints[ellipsePoints.length - 1].y
                        );
                    }
                    break;
            }
        }
        
        // Add final polygon if exists
        if (currentPoly.length > 0) {
            polygons.push(currentPoly);
        }
        
        return polygons;
    }
    
    /**
     * Handle moveTo command
     * @param {Object} cmd - MoveTo command
     * @param {Array} polygons - Polygon array to update
     * @param {Array} currentPoly - Current polygon to finalize
     * @private
     */
    static _handleMoveTo(cmd, polygons, currentPoly) {
        // Start new subpath
        if (currentPoly.length > 0) {
            polygons.push(currentPoly);
        }
    }
    
    /**
     * Handle closePath command
     * @param {Array} currentPoly - Current polygon
     * @param {Point} subpathStart - Start point of subpath
     * @param {Array} polygons - Polygon array to update
     * @private
     */
    static _handleClosePath(currentPoly, subpathStart, polygons) {
        if (currentPoly.length > 0) {
            // Close the polygon by adding the start point if not already there
            const last = currentPoly[currentPoly.length - 1];
            if (last.x !== subpathStart.x || last.y !== subpathStart.y) {
                currentPoly.push(subpathStart.toObject());
            }
            polygons.push(currentPoly);
        }
    }
    
    /**
     * Append points to polygon, skipping the first N points
     * @param {Array} currentPoly - Current polygon
     * @param {Array} points - Points to append
     * @param {number} skipCount - Number of points to skip at start
     * @private
     */
    static _appendPoints(currentPoly, points, skipCount) {
        for (let i = skipCount; i < points.length; i++) {
            currentPoly.push(points[i]);
        }
    }
    
    /**
     * Handle arc command with path continuity logic
     * @param {Object} cmd - Arc command
     * @param {Array} currentPoly - Current polygon
     * @param {Point} currentPoint - Current point
     * @param {Point} subpathStart - Subpath start point
     * @returns {Object} {currentPoint, currentPoly, subpathStart}
     * @private
     */
    static _handleArc(cmd, currentPoly, currentPoint, subpathStart) {
        const arcPoints = PathFlattener._flattenArc(
            cmd.x, cmd.y, cmd.radius,
            cmd.startAngle, cmd.endAngle,
            cmd.counterclockwise
        );
        
        if (arcPoints.length === 0) {
            return { currentPoint, currentPoly, subpathStart: null };
        }
        
        const arcStart = new Point(arcPoints[0].x, arcPoints[0].y);
        
        // If this is the first command in the subpath, start at arc start
        if (currentPoly.length === 0) {
            currentPoly.push(arcStart.toObject());
            const newCurrentPoint = arcStart;
            const newSubpathStart = arcStart;
            
            // Add remaining arc points
            PathFlattener._appendPoints(currentPoly, arcPoints, 1);
            
            return {
                currentPoint: arcPoints.length > 1 ? 
                    new Point(arcPoints[arcPoints.length - 1].x, arcPoints[arcPoints.length - 1].y) : newCurrentPoint,
                currentPoly,
                subpathStart: newSubpathStart
            };
        } else {
            // Move to arc start if we're not already there
            const distance = currentPoint.distanceTo(arcStart);
            if (distance > 0.01) {  // Add line to arc start if not already there
                currentPoly.push(arcStart.toObject());
            }
            
            // Add all arc points except the first
            PathFlattener._appendPoints(currentPoly, arcPoints, 1);
            
            return {
                currentPoint: new Point(arcPoints[arcPoints.length - 1].x, arcPoints[arcPoints.length - 1].y),
                currentPoly,
                subpathStart: null
            };
        }
    }
    
    /**
     * Handle ellipse points
     * @param {Array} ellipsePoints - Ellipse points
     * @param {Array} currentPoly - Current polygon
     * @param {Point} currentPoint - Current point
     * @private
     */
    static _handleEllipsePoints(ellipsePoints, currentPoly, currentPoint) {
        if (ellipsePoints.length > 0) {
            // Move to ellipse start if we're not already there
            const ellipseStart = new Point(ellipsePoints[0].x, ellipsePoints[0].y);
            const distance = currentPoint.distanceTo(ellipseStart);
            if (distance > 0.01) {  // Add line to ellipse start if not already there
                currentPoly.push(ellipseStart.toObject());
            }
            // Add all ellipse points except the first
            PathFlattener._appendPoints(currentPoly, ellipsePoints, 1);
        }
    }
    
    /**
     * Flatten quadratic Bézier curve with fixed tolerance
     * @param {number} x0 - Start x
     * @param {number} y0 - Start y
     * @param {number} x1 - Control point x
     * @param {number} y1 - Control point y
     * @param {number} x2 - End x
     * @param {number} y2 - End y
     * @returns {Array<Object>} Array of {x, y} points
     * @private
     */
    static _flattenQuadraticBezier(x0, y0, x1, y1, x2, y2) {
        const points = [{x: x0, y: y0}];
        PathFlattener._flattenQuadraticBezierRecursive(
            x0, y0, x1, y1, x2, y2, points, PathFlattener.TOLERANCE
        );
        return points;
    }
    
    /**
     * Recursive quadratic Bézier flattening
     * @param {number} x0 - Start x
     * @param {number} y0 - Start y
     * @param {number} x1 - Control x
     * @param {number} y1 - Control y
     * @param {number} x2 - End x
     * @param {number} y2 - End y
     * @param {Array} points - Points array to append to
     * @param {number} tolerance - Flattening tolerance
     * @private
     */
    static _flattenQuadraticBezierRecursive(x0, y0, x1, y1, x2, y2, points, tolerance) {
        // Check if curve is flat enough
        const dx = x2 - x0;
        const dy = y2 - y0;
        const d = Math.abs((x1 - x0) * dy - (y1 - y0) * dx) / Math.sqrt(dx * dx + dy * dy);
        
        if (d <= tolerance || points.length > 1000) { // Safety limit
            points.push({x: x2, y: y2});
            return;
        }
        
        // Split curve at t=0.5
        const x01 = (x0 + x1) / 2;
        const y01 = (y0 + y1) / 2;
        const x12 = (x1 + x2) / 2;
        const y12 = (y1 + y2) / 2;
        const x012 = (x01 + x12) / 2;
        const y012 = (y01 + y12) / 2;
        
        // Recursively flatten both halves
        PathFlattener._flattenQuadraticBezierRecursive(x0, y0, x01, y01, x012, y012, points, tolerance);
        PathFlattener._flattenQuadraticBezierRecursive(x012, y012, x12, y12, x2, y2, points, tolerance);
    }
    
    /**
     * Flatten cubic Bézier curve with fixed tolerance
     * @param {number} x0 - Start x
     * @param {number} y0 - Start y
     * @param {number} x1 - Control point 1 x
     * @param {number} y1 - Control point 1 y
     * @param {number} x2 - Control point 2 x
     * @param {number} y2 - Control point 2 y
     * @param {number} x3 - End x
     * @param {number} y3 - End y
     * @returns {Array<Object>} Array of {x, y} points
     * @private
     */
    static _flattenCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
        const points = [{x: x0, y: y0}];
        PathFlattener._flattenCubicBezierRecursive(
            x0, y0, x1, y1, x2, y2, x3, y3, points, PathFlattener.TOLERANCE
        );
        return points;
    }
    
    /**
     * Recursive cubic Bézier flattening using de Casteljau's algorithm
     * @param {number} x0 - Start x
     * @param {number} y0 - Start y
     * @param {number} x1 - Control 1 x
     * @param {number} y1 - Control 1 y
     * @param {number} x2 - Control 2 x
     * @param {number} y2 - Control 2 y
     * @param {number} x3 - End x
     * @param {number} y3 - End y
     * @param {Array} points - Points array
     * @param {number} tolerance - Tolerance
     * @private
     */
    static _flattenCubicBezierRecursive(x0, y0, x1, y1, x2, y2, x3, y3, points, tolerance) {
        // Simplified flatness test - check distance from control points to line
        const dx = x3 - x0;
        const dy = y3 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) {
            points.push({x: x3, y: y3});
            return;
        }
        
        const d1 = Math.abs((x1 - x0) * dy - (y1 - y0) * dx) / len;
        const d2 = Math.abs((x2 - x0) * dy - (y2 - y0) * dx) / len;
        
        if ((d1 + d2) <= tolerance || points.length > 1000) { // Safety limit
            points.push({x: x3, y: y3});
            return;
        }
        
        // Split curve at t=0.5 using de Casteljau's algorithm
        const x01 = (x0 + x1) / 2;
        const y01 = (y0 + y1) / 2;
        const x12 = (x1 + x2) / 2;
        const y12 = (y1 + y2) / 2;
        const x23 = (x2 + x3) / 2;
        const y23 = (y2 + y3) / 2;
        
        const x012 = (x01 + x12) / 2;
        const y012 = (y01 + y12) / 2;
        const x123 = (x12 + x23) / 2;
        const y123 = (y12 + y23) / 2;
        
        const x0123 = (x012 + x123) / 2;
        const y0123 = (y012 + y123) / 2;
        
        // Recursively flatten both halves
        PathFlattener._flattenCubicBezierRecursive(x0, y0, x01, y01, x012, y012, x0123, y0123, points, tolerance);
        PathFlattener._flattenCubicBezierRecursive(x0123, y0123, x123, y123, x23, y23, x3, y3, points, tolerance);
    }
    
    /**
     * Flatten arc to line segments
     * @param {number} cx - Center x
     * @param {number} cy - Center y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {boolean} counterclockwise - Direction flag
     * @returns {Array<Object>} Array of {x, y} points
     * @private
     */
    static _flattenArc(cx, cy, radius, startAngle, endAngle, counterclockwise) {
        if (radius <= 0) return [];
        
        // Normalize angles
        let start = startAngle;
        let end = endAngle;
        
        if (!counterclockwise && end < start) {
            end += 2 * Math.PI;
        } else if (counterclockwise && start < end) {
            start += 2 * Math.PI;
        }
        
        const totalAngle = Math.abs(end - start);
        
        // Calculate number of segments needed for tolerance
        const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - PathFlattener.TOLERANCE / radius));
        const segments = Math.max(1, Math.ceil(totalAngle / maxAngleStep));
        
        const points = [];
        const angleStep = (end - start) / segments;
        
        for (let i = 0; i <= segments; i++) {
            const angle = start + i * angleStep;
            points.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }
        
        return points;
    }
    
    /**
     * Flatten ellipse to line segments
     * @param {number} cx - Center x
     * @param {number} cy - Center y
     * @param {number} radiusX - X radius
     * @param {number} radiusY - Y radius
     * @param {number} rotation - Rotation angle
     * @param {number} startAngle - Start angle
     * @param {number} endAngle - End angle
     * @param {boolean} counterclockwise - Direction flag
     * @returns {Array<Object>} Array of {x, y} points
     * @private
     */
    static _flattenEllipse(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
        if (radiusX <= 0 || radiusY <= 0) return [];
        
        // Normalize angles
        let start = startAngle;
        let end = endAngle;
        
        if (!counterclockwise && end < start) {
            end += 2 * Math.PI;
        } else if (counterclockwise && start < end) {
            start += 2 * Math.PI;
        }
        
        const totalAngle = Math.abs(end - start);
        
        // Calculate number of segments - use smaller radius for tolerance calculation
        const minRadius = Math.min(radiusX, radiusY);
        const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - PathFlattener.TOLERANCE / minRadius));
        const segments = Math.max(1, Math.ceil(totalAngle / maxAngleStep));
        
        const points = [];
        const angleStep = (end - start) / segments;
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);
        
        for (let i = 0; i <= segments; i++) {
            const angle = start + i * angleStep;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            // Unrotated ellipse point
            const x = radiusX * cos;
            const y = radiusY * sin;
            
            // Apply rotation and translation
            points.push({
                x: cx + x * cosRot - y * sinRot,
                y: cy + x * sinRot + y * cosRot
            });
        }
        
        return points;
    }
}

// Class constants
PathFlattener.TOLERANCE = 0.25; // Fixed tolerance for deterministic behavior
/**
 * PolygonFiller class for SWCanvas
 * 
 * Implements scanline polygon filling with nonzero and evenodd winding rules.
 * Handles stencil-based clipping integration and premultiplied alpha blending.
 * 
 * Converted from functional to class-based approach following OO best practices:
 * - Static methods for stateless operations 
 * - Clear separation of scanline logic from pixel blending
 * - Immutable color handling with Color class integration
 */
class PolygonFiller {
    /**
     * Fill polygons using scanline algorithm with stencil-based clipping
     * 
     * @param {Surface} surface - Target surface to render to
     * @param {Array} polygons - Array of polygons (each polygon is array of {x,y} points)  
     * @param {Color} color - Color to fill with
     * @param {string} fillRule - 'nonzero' or 'evenodd' winding rule
     * @param {Matrix} transform - Transformation matrix to apply to polygons
     * @param {Uint8Array|null} clipMask - Optional 1-bit stencil buffer for clipping
     */
    static fillPolygons(surface, polygons, color, fillRule, transform, clipMask) {
        if (polygons.length === 0) return;
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        // Transform all polygon vertices
        const transformedPolygons = polygons.map(poly => 
            poly.map(point => transform.transformPoint(point))
        );
        
        // Find bounding box for optimization
        const bounds = PolygonFiller._calculateBounds(transformedPolygons, surface);
        
        // Process each scanline
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            PolygonFiller._fillScanline(
                surface, y, transformedPolygons, color, fillRule, clipMask
            );
        }
    }
    
    /**
     * Calculate bounding box for transformed polygons
     * @param {Array} polygons - Transformed polygons
     * @param {Surface} surface - Target surface for bounds clamping
     * @returns {Object} {minY, maxY} bounds
     * @private
     */
    static _calculateBounds(polygons, surface) {
        let minY = Infinity, maxY = -Infinity;
        
        for (const poly of polygons) {
            for (const point of poly) {
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        // Clamp to surface bounds
        return {
            minY: Math.max(0, Math.floor(minY)),
            maxY: Math.min(surface.height - 1, Math.ceil(maxY))
        };
    }
    
    /**
     * Fill a single scanline using polygon intersection and winding rules
     * @param {Surface} surface - Target surface
     * @param {number} y - Scanline y coordinate
     * @param {Array} polygons - Transformed polygons
     * @param {Color} color - Fill color
     * @param {string} fillRule - Winding rule
     * @param {Uint8Array|null} clipMask - Clipping mask
     * @private
     */
    static _fillScanline(surface, y, polygons, color, fillRule, clipMask) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of polygons) {
            PolygonFiller._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        PolygonFiller._fillSpans(surface, y, intersections, color, fillRule, clipMask);
    }
    
    /**
     * Find intersections between a polygon and a horizontal scanline
     * @param {Array} polygon - Array of {x, y} points
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Array to append intersections to
     * @private
     */
    static _findPolygonIntersections(polygon, y, intersections) {
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            
            // Skip horizontal edges (avoid division by zero)
            if (Math.abs(p1.y - p2.y) < 1e-10) continue;
            
            // Check if scanline crosses this edge
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            
            if (y >= minY && y < maxY) { // Note: < maxY to avoid double-counting vertices
                // Calculate intersection point using linear interpolation
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                
                // Determine winding direction
                const winding = p2.y > p1.y ? 1 : -1;
                
                intersections.push({ x: x, winding: winding });
            }
        }
    }
    
    /**
     * Fill spans on a scanline based on winding rule
     * @param {Surface} surface - Target surface
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Sorted intersections with winding info
     * @param {Color} color - Fill color
     * @param {string} fillRule - 'evenodd' or 'nonzero'
     * @param {Uint8Array|null} clipMask - Stencil clipping mask
     * @private
     */
    static _fillSpans(surface, y, intersections, color, fillRule, clipMask) {
        if (intersections.length === 0) return;
        
        let windingNumber = 0;
        let inside = false;
        
        for (let i = 0; i < intersections.length; i++) {
            const intersection = intersections[i];
            const nextIntersection = intersections[i + 1];
            
            // Update winding number
            windingNumber += intersection.winding;
            
            // Determine if we're inside based on fill rule
            if (fillRule === 'evenodd') {
                inside = (windingNumber % 2) !== 0;
            } else { // nonzero
                inside = windingNumber !== 0;
            }
            
            // Fill span if we're inside
            if (inside && nextIntersection) {
                const startX = Math.max(0, Math.ceil(intersection.x));
                const endX = Math.min(surface.width - 1, Math.floor(nextIntersection.x));
                
                PolygonFiller._fillPixelSpan(
                    surface, y, startX, endX, color, clipMask
                );
            }
        }
    }
    
    /**
     * Fill a horizontal span of pixels with color and alpha blending
     * @param {Surface} surface - Target surface
     * @param {number} y - Y coordinate
     * @param {number} startX - Start X coordinate (inclusive)
     * @param {number} endX - End X coordinate (inclusive)
     * @param {Color} color - Fill color (with alpha)
     * @param {Uint8Array|null} clipMask - Stencil clipping mask
     * @private
     */
    static _fillPixelSpan(surface, y, startX, endX, color, clipMask) {
        for (let x = startX; x <= endX; x++) {
            // Check stencil buffer clipping
            if (PolygonFiller._isPixelClipped(clipMask, x, y, surface.width)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
            const offset = y * surface.stride + x * 4;
            PolygonFiller._blendPixel(surface, offset, color);
        }
    }
    
    /**
     * Check if a pixel is clipped by the stencil buffer
     * @param {Uint8Array|null} clipMask - 1-bit stencil buffer
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate  
     * @param {number} width - Surface width for indexing
     * @returns {boolean} True if pixel should be clipped
     * @private
     */
    static _isPixelClipped(clipMask, x, y, width) {
        if (!clipMask) return false; // No clipping active
        
        const pixelIndex = y * width + x;
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        return (clipMask[byteIndex] & (1 << bitIndex)) === 0; // 0 means clipped out
    }
    
    /**
     * Blend a color into a surface pixel using proper alpha compositing
     * @param {Surface} surface - Target surface
     * @param {number} offset - Byte offset in surface data
     * @param {Color} color - Source color to blend
     * @private
     */
    static _blendPixel(surface, offset, color) {
        // Fast paths for common cases
        if (color.isTransparent) {
            return; // No change needed
        }
        
        if (color.isOpaque) {
            // Opaque source - simple copy (premultiplied)
            surface.data[offset] = color.premultipliedR;
            surface.data[offset + 1] = color.premultipliedG;
            surface.data[offset + 2] = color.premultipliedB;
            surface.data[offset + 3] = color.premultipliedA;
            return;
        }
        
        // Alpha blending required (source-over composition)
        const dstR = surface.data[offset];
        const dstG = surface.data[offset + 1];
        const dstB = surface.data[offset + 2];
        const dstA = surface.data[offset + 3];
        
        const srcAlpha = color.normalizedAlpha;
        const invSrcAlpha = 1 - srcAlpha;
        
        // Blend using premultiplied alpha math
        const newR = Math.round(color.premultipliedR + dstR * invSrcAlpha);
        const newG = Math.round(color.premultipliedG + dstG * invSrcAlpha);
        const newB = Math.round(color.premultipliedB + dstB * invSrcAlpha);
        const newA = Math.round(color.premultipliedA + dstA * invSrcAlpha);
        
        surface.data[offset] = newR;
        surface.data[offset + 1] = newG;
        surface.data[offset + 2] = newB;
        surface.data[offset + 3] = newA;
    }
    
    /**
     * Utility method to convert old-style RGBA array to Color instance
     * Maintains backward compatibility during transition
     * @param {Array} rgba - [r, g, b, a] array (0-255, non-premultiplied)
     * @returns {Color} Color instance
     */
    static colorFromRGBA(rgba) {
        return new Color(rgba[0], rgba[1], rgba[2], rgba[3], false);
    }
    
    /**
     * Debug method to visualize polygon bounds
     * @param {Array} polygons - Polygons to analyze
     * @returns {Object} Bounding box information
     */
    static getPolygonBounds(polygons) {
        if (polygons.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        const points = polygons.flat();
        return Rectangle.boundingBox(points.map(p => new Point(p.x, p.y)));
    }
    
    /**
     * Performance utility to count total vertices in polygon set
     * @param {Array} polygons - Polygons to count
     * @returns {number} Total vertex count
     */
    static countVertices(polygons) {
        return polygons.reduce((total, poly) => total + poly.length, 0);
    }
}
/**
 * StrokeGenerator class for SWCanvas
 * 
 * Implements geometric stroke generation that converts paths into filled polygons
 * representing stroke geometry. Handles all join types (miter, round, bevel) and
 * cap types (butt, round, square) with proper miter limit handling.
 * 
 * Converted from functional to class-based approach following OO best practices:
 * - Static methods for stateless stroke generation
 * - Clear separation of segment, join, and cap generation
 * - Immutable stroke properties with validation
 */
class StrokeGenerator {
    /**
     * Generate stroke polygons for a path with given stroke properties
     * @param {Path2D} path - Path to stroke
     * @param {Object} strokeProps - Stroke properties
     * @returns {Array<Array<Point>>} Array of stroke polygons
     */
    static generateStrokePolygons(path, strokeProps) {
        const validatedProps = StrokeGenerator._validateStrokeProperties(strokeProps);
        
        if (validatedProps.lineWidth <= 0) return [];
        
        // Flatten path to get line segments
        const pathPolygons = PathFlattener.flattenPath(path);
        const strokePolygons = [];
        
        for (const polygon of pathPolygons) {
            if (polygon.length < 2) continue;
            
            const strokeParts = StrokeGenerator._generateStrokeForPolygon(
                polygon, validatedProps
            );
            strokePolygons.push(...strokeParts);
        }
        
        return strokePolygons;
    }
    
    /**
     * Validate and normalize stroke properties
     * @param {Object} props - Stroke properties to validate
     * @returns {Object} Validated properties
     * @private
     */
    static _validateStrokeProperties(props) {
        const defaults = {
            lineWidth: 1.0,
            lineJoin: 'miter',
            lineCap: 'butt',
            miterLimit: 10.0
        };
        
        const validated = { ...defaults, ...props };
        
        if (validated.lineWidth <= 0) {
            throw new Error('lineWidth must be positive');
        }
        
        const validJoins = ['miter', 'round', 'bevel'];
        if (!validJoins.includes(validated.lineJoin)) {
            throw new Error(`Invalid lineJoin: ${validated.lineJoin}`);
        }
        
        const validCaps = ['butt', 'round', 'square'];
        if (!validCaps.includes(validated.lineCap)) {
            throw new Error(`Invalid lineCap: ${validated.lineCap}`);
        }
        
        if (validated.miterLimit <= 0) {
            throw new Error('miterLimit must be positive');
        }
        
        return validated;
    }
    
    /**
     * Generate stroke geometry for a single polygon (subpath)
     * @param {Array} points - Array of {x, y} points
     * @param {Object} strokeProps - Validated stroke properties
     * @returns {Array} Array of stroke polygon parts
     * @private
     */
    static _generateStrokeForPolygon(points, strokeProps) {
        if (points.length < 2) return [];
        
        const strokeParts = [];
        const halfWidth = strokeProps.lineWidth / 2;
        
        // Determine if this is a closed path
        const isClosed = StrokeGenerator._isPathClosed(points);
        
        // Generate segment bodies with geometric info
        const segments = StrokeGenerator._generateSegments(points, halfWidth);
        if (segments.length === 0) return [];
        
        // Add segment bodies to stroke parts
        for (const segment of segments) {
            strokeParts.push(segment.body);
        }
        
        // Generate joins between adjacent segments
        StrokeGenerator._generateJoins(segments, strokeParts, strokeProps, isClosed);
        
        // Generate caps for open paths
        if (!isClosed && segments.length > 0) {
            StrokeGenerator._generateCaps(segments, strokeParts, strokeProps, halfWidth);
        }
        
        return strokeParts;
    }
    
    /**
     * Check if path is closed (first and last points are very close)
     * @param {Array} points - Path points
     * @returns {boolean} True if path is closed
     * @private
     */
    static _isPathClosed(points) {
        return points.length > 2 && 
               Math.abs(points[0].x - points[points.length - 1].x) < 1e-10 &&
               Math.abs(points[0].y - points[points.length - 1].y) < 1e-10;
    }
    
    /**
     * Generate segment data with geometric information
     * @param {Array} points - Path points
     * @param {number} halfWidth - Half of line width
     * @returns {Array} Array of segment objects with body and geometry
     * @private
     */
    static _generateSegments(points, halfWidth) {
        const segments = [];
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = new Point(points[i].x, points[i].y);
            const p2 = new Point(points[i + 1].x, points[i + 1].y);
            
            // Skip zero-length segments
            const length = p1.distanceTo(p2);
            if (length < 1e-10) continue;
            
            const segment = StrokeGenerator._createSegment(p1, p2, halfWidth, length);
            segments.push(segment);
        }
        
        return segments;
    }
    
    /**
     * Create a segment object with body and geometry
     * @param {Point} p1 - Start point
     * @param {Point} p2 - End point
     * @param {number} halfWidth - Half line width
     * @param {number} length - Segment length
     * @returns {Object} Segment object
     * @private
     */
    static _createSegment(p1, p2, halfWidth, length) {
        // Calculate unit vectors
        const direction = p2.subtract(p1).scale(1 / length);
        const normal = new Point(-direction.y, direction.x); // Perpendicular
        
        // Generate rectangular body for segment
        const body = [
            p1.add(normal.scale(halfWidth)).toObject(),
            p2.add(normal.scale(halfWidth)).toObject(),
            p2.add(normal.scale(-halfWidth)).toObject(),
            p1.add(normal.scale(-halfWidth)).toObject()
        ];
        
        return {
            body: body,
            p1: p1,
            p2: p2,
            tangent: direction,
            normal: normal,
            length: length
        };
    }
    
    /**
     * Generate joins between segments
     * @param {Array} segments - Array of segments
     * @param {Array} strokeParts - Array to append join polygons to
     * @param {Object} strokeProps - Stroke properties
     * @param {boolean} isClosed - Whether path is closed
     * @private
     */
    static _generateJoins(segments, strokeParts, strokeProps, isClosed) {
        // Joins between adjacent segments
        for (let i = 0; i < segments.length - 1; i++) {
            const seg1 = segments[i];
            const seg2 = segments[i + 1];
            const joinPolygons = StrokeGenerator._generateJoin(seg1, seg2, strokeProps);
            strokeParts.push(...joinPolygons);
        }
        
        // Handle closed path joining (last segment to first segment)
        if (isClosed && segments.length > 1) {
            const lastSeg = segments[segments.length - 1];
            const firstSeg = segments[0];
            const joinPolygons = StrokeGenerator._generateJoin(lastSeg, firstSeg, strokeProps);
            strokeParts.push(...joinPolygons);
        }
    }
    
    /**
     * Generate join geometry between two segments
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {Object} strokeProps - Stroke properties
     * @returns {Array} Array of join polygons
     * @private
     */
    static _generateJoin(seg1, seg2, strokeProps) {
        const joinPoint = seg2.p1; // Connection point
        
        // Calculate cross product to determine turn direction
        const cross = seg1.tangent.cross(seg2.tangent);
        
        // Check for 180-degree turn (parallel segments)
        if (Math.abs(cross) < 1e-10) {
            return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
        
        // Generate appropriate join type
        switch (strokeProps.lineJoin) {
            case 'miter':
                return StrokeGenerator._generateMiterJoin(seg1, seg2, joinPoint, strokeProps.miterLimit);
            case 'round':
                return StrokeGenerator._generateRoundJoin(seg1, seg2, joinPoint);
            case 'bevel':
            default:
                return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
    }
    
    /**
     * Generate miter join with miter limit checking
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {Point} joinPoint - Join point
     * @param {number} miterLimit - Miter limit
     * @returns {Array} Array of join polygons
     * @private
     */
    static _generateMiterJoin(seg1, seg2, joinPoint, miterLimit) {
        const halfWidth = seg1.normal.magnitude * (seg1.body[0].y - seg1.body[3].y) / 2;
        
        // Determine which sides are outer
        const cross = seg1.tangent.cross(seg2.tangent);
        const outerSides = StrokeGenerator._getOuterSides(seg1, seg2, cross);
        
        // Calculate miter point
        const miterPoint = StrokeGenerator._calculateMiterPoint(
            outerSides.outer1, seg1.tangent, outerSides.outer2, seg2.tangent
        );
        
        if (!miterPoint) {
            return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
        
        // Check miter limit
        const miterLength = new Point(miterPoint.x, miterPoint.y).distanceTo(joinPoint);
        const miterRatio = miterLength / halfWidth;
        
        if (miterRatio > miterLimit) {
            return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
        
        const innerSides = StrokeGenerator._getInnerSides(seg1, seg2, cross);
        
        // Return miter triangle and connecting area
        return [
            [outerSides.outer1, miterPoint, outerSides.outer2],  // Miter triangle
            [outerSides.outer1, outerSides.outer2, innerSides.inner2, innerSides.inner1]  // Connecting area
        ];
    }
    
    /**
     * Generate bevel join
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {Point} joinPoint - Join point
     * @returns {Array} Array containing single bevel polygon
     * @private
     */
    static _generateBevelJoin(seg1, seg2, joinPoint) {
        const cross = seg1.tangent.cross(seg2.tangent);
        const outerSides = StrokeGenerator._getOuterSides(seg1, seg2, cross);
        const innerSides = StrokeGenerator._getInnerSides(seg1, seg2, cross);
        
        return [[
            outerSides.outer1, outerSides.outer2, 
            innerSides.inner2, innerSides.inner1
        ]];
    }
    
    /**
     * Generate round join
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {Point} joinPoint - Join point
     * @returns {Array} Array of triangular fan polygons
     * @private
     */
    static _generateRoundJoin(seg1, seg2, joinPoint) {
        const halfWidth = seg1.normal.magnitude * (seg1.body[0].y - seg1.body[3].y) / 2;
        const cross = seg1.tangent.cross(seg2.tangent);
        const outerSides = StrokeGenerator._getOuterSides(seg1, seg2, cross);
        
        // Calculate angles for the arc
        const angle1 = Math.atan2(
            outerSides.outer1.y - joinPoint.y, 
            outerSides.outer1.x - joinPoint.x
        );
        const angle2 = Math.atan2(
            outerSides.outer2.y - joinPoint.y, 
            outerSides.outer2.x - joinPoint.x
        );
        
        return StrokeGenerator._generateArcFan(joinPoint, halfWidth, angle1, angle2);
    }
    
    /**
     * Generate caps for open paths
     * @param {Array} segments - Array of segments
     * @param {Array} strokeParts - Array to append cap polygons to
     * @param {Object} strokeProps - Stroke properties
     * @param {number} halfWidth - Half line width
     * @private
     */
    static _generateCaps(segments, strokeParts, strokeProps, halfWidth) {
        // Start cap
        const startCaps = StrokeGenerator._generateCap(
            segments[0].p1, segments[0].tangent, halfWidth, strokeProps.lineCap, true
        );
        if (startCaps) {
            strokeParts.push(...(Array.isArray(startCaps[0]) ? startCaps : [startCaps]));
        }
        
        // End cap
        const lastSeg = segments[segments.length - 1];
        const endCaps = StrokeGenerator._generateCap(
            lastSeg.p2, lastSeg.tangent, halfWidth, strokeProps.lineCap, false
        );
        if (endCaps) {
            strokeParts.push(...(Array.isArray(endCaps[0]) ? endCaps : [endCaps]));
        }
    }
    
    /**
     * Generate cap geometry
     * @param {Point} point - Cap point
     * @param {Point} tangent - Tangent direction
     * @param {number} halfWidth - Half line width
     * @param {string} lineCap - Cap type
     * @param {boolean} isStart - Whether this is start cap
     * @returns {Array|null} Cap polygons or null for butt caps
     * @private
     */
    static _generateCap(point, tangent, halfWidth, lineCap, isStart) {
        const normal = new Point(-tangent.y, tangent.x);
        
        switch (lineCap) {
            case 'square':
                return StrokeGenerator._generateSquareCap(point, tangent, normal, halfWidth, isStart);
            case 'round':
                return StrokeGenerator._generateRoundCap(point, normal, halfWidth, isStart);
            case 'butt':
            default:
                return null; // No cap geometry needed
        }
    }
    
    /**
     * Generate square cap
     * @param {Point} point - Cap center point
     * @param {Point} tangent - Tangent direction
     * @param {Point} normal - Normal direction
     * @param {number} halfWidth - Half line width
     * @param {boolean} isStart - Whether this is start cap
     * @returns {Array} Square cap polygon
     * @private
     */
    static _generateSquareCap(point, tangent, normal, halfWidth, isStart) {
        const extension = isStart ? 
            point.subtract(tangent.scale(halfWidth)) :
            point.add(tangent.scale(halfWidth));
        
        return [[
            extension.add(normal.scale(halfWidth)).toObject(),
            extension.subtract(normal.scale(halfWidth)).toObject(),
            point.subtract(normal.scale(halfWidth)).toObject(),
            point.add(normal.scale(halfWidth)).toObject()
        ]];
    }
    
    /**
     * Generate round cap as semicircular fan
     * @param {Point} point - Cap center point
     * @param {Point} normal - Normal direction
     * @param {number} halfWidth - Half line width
     * @param {boolean} isStart - Whether this is start cap
     * @returns {Array} Array of triangular fan segments
     * @private
     */
    static _generateRoundCap(point, normal, halfWidth, isStart) {
        const startAngle = Math.atan2(normal.y, normal.x);
        return StrokeGenerator._generateArcFan(
            point, halfWidth, startAngle, startAngle + Math.PI * (isStart ? 1 : -1)
        );
    }
    
    // Helper methods
    
    /**
     * Get outer edge points for join calculation
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {number} cross - Cross product
     * @returns {Object} {outer1, outer2}
     * @private
     */
    static _getOuterSides(seg1, seg2, cross) {
        if (cross > 0) {
            // Left turn - right sides are outer
            return {
                outer1: seg1.body[2], // Right side of seg1 end
                outer2: seg2.body[3]  // Right side of seg2 start
            };
        } else {
            // Right turn - left sides are outer
            return {
                outer1: seg1.body[1], // Left side of seg1 end
                outer2: seg2.body[0]  // Left side of seg2 start
            };
        }
    }
    
    /**
     * Get inner edge points for join calculation
     * @param {Object} seg1 - First segment
     * @param {Object} seg2 - Second segment
     * @param {number} cross - Cross product
     * @returns {Object} {inner1, inner2}
     * @private
     */
    static _getInnerSides(seg1, seg2, cross) {
        if (cross > 0) {
            // Left turn - left sides are inner
            return {
                inner1: seg1.body[1], // Left side of seg1 end
                inner2: seg2.body[0]  // Left side of seg2 start
            };
        } else {
            // Right turn - right sides are inner
            return {
                inner1: seg1.body[2], // Right side of seg1 end
                inner2: seg2.body[3]  // Right side of seg2 start
            };
        }
    }
    
    /**
     * Calculate intersection point of two lines (for miter joins)
     * @param {Object} p1 - First line point 1
     * @param {Point} dir1 - First line direction
     * @param {Object} p2 - Second line point 1
     * @param {Point} dir2 - Second line direction
     * @returns {Object|null} Intersection point or null if parallel
     * @private
     */
    static _calculateMiterPoint(p1, dir1, p2, dir2) {
        const denom = dir1.cross(dir2);
        if (Math.abs(denom) < 1e-10) return null; // Parallel lines
        
        const dp = new Point(p2.x - p1.x, p2.y - p1.y);
        const t = dp.cross(dir2) / denom;
        
        return {
            x: p1.x + t * dir1.x,
            y: p1.y + t * dir1.y
        };
    }
    
    /**
     * Generate triangular fan for arcs (used by round joins and caps)
     * @param {Point} center - Arc center
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @returns {Array} Array of triangles
     * @private
     */
    static _generateArcFan(center, radius, startAngle, endAngle) {
        let angleDiff = endAngle - startAngle;
        
        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const absAngle = Math.abs(angleDiff);
        const segments = Math.max(2, Math.ceil(absAngle / (Math.PI / 4)));
        const angleStep = angleDiff / segments;
        
        const triangles = [];
        for (let i = 0; i < segments; i++) {
            const a1 = startAngle + i * angleStep;
            const a2 = startAngle + (i + 1) * angleStep;
            
            const p1 = {
                x: center.x + radius * Math.cos(a1),
                y: center.y + radius * Math.sin(a1)
            };
            const p2 = {
                x: center.x + radius * Math.cos(a2),
                y: center.y + radius * Math.sin(a2)
            };
            
            triangles.push([center.toObject(), p1, p2]);
        }
        
        return triangles;
    }
}
/**
 * StencilBuffer class for SWCanvas clipping system
 * 
 * Encapsulates the 1-bit stencil buffer implementation for memory-efficient clipping
 * with proper intersection semantics. Extracted from Context2D to follow Single
 * Responsibility Principle.
 * 
 * This implementation matches HTML5 Canvas behavior exactly while using only
 * 1 bit per pixel (87.5% memory reduction compared to full coverage buffers).
 */
class StencilBuffer {
    /**
     * Create a StencilBuffer
     * @param {number} width - Buffer width in pixels
     * @param {number} height - Buffer height in pixels
     */
    constructor(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('StencilBuffer dimensions must be positive');
        }
        
        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        
        // Initialize stencil buffer to "no clipping" (all 1s)
        this._buffer = new Uint8Array(this._numBytes);
        this._initializeToNoClipping();
    }
    
    get width() { return this._width; }
    get height() { return this._height; }
    
    /**
     * Initialize buffer to "no clipping" state (all pixels visible)
     * @private
     */
    _initializeToNoClipping() {
        this._buffer.fill(0xFF);
        
        // Handle partial last byte if width*height is not divisible by 8
        const remainderBits = this._numPixels % 8;
        if (remainderBits !== 0) {
            const lastByteIndex = this._numBytes - 1;
            const lastByteMask = (1 << remainderBits) - 1;
            this._buffer[lastByteIndex] = lastByteMask;
        }
    }
    
    /**
     * Create a copy of this stencil buffer
     * @returns {StencilBuffer} New StencilBuffer with identical content
     */
    clone() {
        const clone = new StencilBuffer(this._width, this._height);
        clone._buffer.set(this._buffer);
        return clone;
    }
    
    /**
     * Check if a pixel is clipped (not visible)
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @returns {boolean} True if pixel is clipped out
     */
    isPixelClipped(x, y) {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return true; // Out of bounds pixels are clipped
        }
        
        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 0;
    }
    
    /**
     * Get bit value at pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     * @private
     */
    _getBit(pixelIndex) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        return (this._buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }
    
    /**
     * Set bit value at pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     * @private
     */
    _setBit(pixelIndex, value) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (value) {
            this._buffer[byteIndex] |= (1 << bitIndex);
        } else {
            this._buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }
    
    /**
     * Clear buffer to all clipped (all 0s)
     * @private
     */
    _clearToAllClipped() {
        this._buffer.fill(0);
    }
    
    /**
     * Apply a new clipping path using intersection semantics
     * This method renders a path to a temporary buffer, then ANDs it with
     * the existing stencil buffer to create proper clip intersections.
     * 
     * @param {Path2D} path - Path to use for clipping
     * @param {string} fillRule - Fill rule: 'nonzero' or 'evenodd'
     * @param {Matrix} transform - Transform to apply to path
     */
    applyClip(path, fillRule = 'nonzero', transform) {
        // Create temporary buffer for new clip path
        const tempBuffer = new StencilBuffer(this._width, this._height);
        tempBuffer._clearToAllClipped(); // Start with all clipped
        
        // Render the clip path to temporary buffer
        tempBuffer._renderPathToBuffer(path, fillRule, transform);
        
        // Intersect with existing buffer (AND operation)
        for (let i = 0; i < this._buffer.length; i++) {
            this._buffer[i] &= tempBuffer._buffer[i];
        }
    }
    
    /**
     * Render a path directly to this stencil buffer
     * @param {Path2D} path - Path to render
     * @param {string} fillRule - Fill rule: 'nonzero' or 'evenodd'
     * @param {Matrix} transform - Transform to apply to path
     * @private
     */
    _renderPathToBuffer(path, fillRule, transform) {
        // Flatten path to polygons
        const polygons = PathFlattener.flattenPath(path);
        if (polygons.length === 0) return;
        
        // Transform all polygon vertices
        const transformedPolygons = polygons.map(poly => 
            poly.map(point => transform.transformPoint(point))
        );
        
        // Find bounding box
        let minY = Infinity, maxY = -Infinity;
        for (const poly of transformedPolygons) {
            for (const point of poly) {
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        // Clamp to buffer bounds
        minY = Math.max(0, Math.floor(minY));
        maxY = Math.min(this._height - 1, Math.ceil(maxY));
        
        // Process each scanline
        for (let y = minY; y <= maxY; y++) {
            this._fillScanline(y, transformedPolygons, fillRule);
        }
    }
    
    /**
     * Fill a single scanline using winding rule
     * @param {number} y - Scanline y coordinate
     * @param {Array} polygons - Transformed polygons
     * @param {string} fillRule - Fill rule
     * @private
     */
    _fillScanline(y, polygons, fillRule) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of polygons) {
            this._findPolygonIntersections(poly, y + 0.5, intersections);
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        this._fillSpans(y, intersections, fillRule);
    }
    
    /**
     * Find intersections between a polygon and a horizontal scanline
     * @param {Array} polygon - Array of {x, y} points
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Array to append intersections to
     * @private
     */
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
    
    /**
     * Fill spans on a scanline based on winding rule
     * @param {number} y - Scanline y coordinate
     * @param {Array} intersections - Sorted intersections
     * @param {string} fillRule - Fill rule
     * @private
     */
    _fillSpans(y, intersections, fillRule) {
        if (intersections.length === 0) return;
        
        let windingNumber = 0;
        let inside = false;
        
        for (let i = 0; i < intersections.length; i++) {
            const intersection = intersections[i];
            const nextIntersection = intersections[i + 1];
            
            // Update winding number
            windingNumber += intersection.winding;
            
            // Determine if we're inside based on fill rule
            if (fillRule === 'evenodd') {
                inside = (windingNumber % 2) !== 0;
            } else { // nonzero
                inside = windingNumber !== 0;
            }
            
            // Fill span if we're inside
            if (inside && nextIntersection) {
                const startX = Math.max(0, Math.ceil(intersection.x));
                const endX = Math.min(this._width - 1, Math.floor(nextIntersection.x));
                
                for (let x = startX; x <= endX; x++) {
                    const pixelIndex = y * this._width + x;
                    this._setBit(pixelIndex, 1); // Set bit to 1 (inside clip region)
                }
            }
        }
    }
    
    /**
     * Check if buffer represents "no clipping" state
     * @returns {boolean} True if no pixels are clipped
     */
    isNoClipping() {
        // Check if all bits are set to 1
        for (let i = 0; i < this._numBytes - 1; i++) {
            if (this._buffer[i] !== 0xFF) return false;
        }
        
        // Check last byte (may be partial)
        const remainderBits = this._numPixels % 8;
        if (remainderBits === 0) {
            return this._buffer[this._numBytes - 1] === 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return this._buffer[this._numBytes - 1] === lastByteMask;
        }
    }
    
    /**
     * Reset to no clipping state
     */
    resetToNoClipping() {
        this._initializeToNoClipping();
    }
    
    /**
     * Get raw buffer for integration with rasterizer
     * @returns {Uint8Array} Raw stencil buffer
     */
    getRawBuffer() {
        return this._buffer;
    }
    
    /**
     * Calculate memory usage in bytes
     * @returns {number} Memory usage
     */
    getMemoryUsage() {
        return this._numBytes;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Buffer description
     */
    toString() {
        const clippedPixels = this._countClippedPixels();
        const percentClipped = ((clippedPixels / this._numPixels) * 100).toFixed(1);
        return `StencilBuffer(${this._width}×${this._height}, ${clippedPixels}/${this._numPixels} clipped [${percentClipped}%])`;
    }
    
    /**
     * Count number of clipped pixels (for debugging)
     * @returns {number} Number of clipped pixels
     * @private
     */
    _countClippedPixels() {
        let count = 0;
        for (let i = 0; i < this._numPixels; i++) {
            if (this._getBit(i) === 0) {
                count++;
            }
        }
        return count;
    }
}
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
            transform: new Matrix(),
            fillStyle: new Color(0, 0, 0, 255), // Black
            strokeStyle: new Color(0, 0, 0, 255), // Black
            lineWidth: 1.0,
            lineJoin: 'miter',
            lineCap: 'butt',
            miterLimit: 10.0,
            stencilBuffer: null // Lazy-allocated
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
    get stencilBuffer() { return this._currentState.stencilBuffer; }
    
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
        if (!(value instanceof Matrix)) {
            throw new Error('transform must be a Matrix instance');
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
            transform: new Matrix([
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
            stencilBuffer: this._currentState.stencilBuffer ? 
                          this._currentState.stencilBuffer.clone() : null
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
     * @param {number} a - Matrix a component
     * @param {number} b - Matrix b component
     * @param {number} c - Matrix c component
     * @param {number} d - Matrix d component
     * @param {number} e - Matrix e component
     * @param {number} f - Matrix f component
     */
    transform(a, b, c, d, e, f) {
        const m = new Matrix([a, b, c, d, e, f]);
        this._currentState.transform = m.multiply(this._currentState.transform);
    }
    
    /**
     * Set transform matrix (replaces current transform)
     * @param {number} a - Matrix a component
     * @param {number} b - Matrix b component
     * @param {number} c - Matrix c component
     * @param {number} d - Matrix d component
     * @param {number} e - Matrix e component
     * @param {number} f - Matrix f component
     */
    setTransform(a, b, c, d, e, f) {
        this._currentState.transform = new Matrix([a, b, c, d, e, f]);
    }
    
    /**
     * Reset transform to identity matrix
     */
    resetTransform() {
        this._currentState.transform = new Matrix();
    }
    
    /**
     * Translate coordinate system
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    translate(x, y) {
        this._currentState.transform = new Matrix().translate(x, y).multiply(this._currentState.transform);
    }
    
    /**
     * Scale coordinate system
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     */
    scale(sx, sy) {
        this._currentState.transform = new Matrix().scale(sx, sy).multiply(this._currentState.transform);
    }
    
    /**
     * Rotate coordinate system
     * @param {number} angleInRadians - Rotation angle in radians
     */
    rotate(angleInRadians) {
        this._currentState.transform = new Matrix().rotate(angleInRadians).multiply(this._currentState.transform);
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
        // Lazy-allocate stencil buffer
        if (!this._currentState.stencilBuffer) {
            this._currentState.stencilBuffer = new StencilBuffer(
                this._surfaceWidth, 
                this._surfaceHeight
            );
        }
        
        this._currentState.stencilBuffer.applyClip(
            path, 
            fillRule, 
            this._currentState.transform
        );
    }
    
    /**
     * Check if a pixel is clipped
     * @param {number} x - Pixel x coordinate
     * @param {number} y - Pixel y coordinate
     * @returns {boolean} True if pixel is clipped
     */
    isPixelClipped(x, y) {
        if (!this._currentState.stencilBuffer) {
            return false; // No clipping active
        }
        return this._currentState.stencilBuffer.isPixelClipped(x, y);
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
            clipMask: this._currentState.stencilBuffer ? 
                     this._currentState.stencilBuffer.getRawBuffer() : null
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
        const clipInfo = this._currentState.stencilBuffer ? 
                        this._currentState.stencilBuffer.toString() : 'no clipping';
        return `DrawingState(alpha=${this._currentState.globalAlpha}, stack=${this._stateStack.length}, ${clipInfo})`;
    }
}
// Helper function for clipMask bit checking (duplicated from context2d.js for standalone use)
function getBit(buffer, pixelIndex) {
    const byteIndex = Math.floor(pixelIndex / 8);
    const bitIndex = pixelIndex % 8;
    return (buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
}

// ImageLike interface validation and RGB→RGBA conversion
function validateAndConvertImageLike(imageLike) {
    if (!imageLike || typeof imageLike !== 'object') {
        throw new Error('ImageLike must be an object');
    }
    
    if (typeof imageLike.width !== 'number' || imageLike.width <= 0 || !Number.isInteger(imageLike.width)) {
        throw new Error('ImageLike width must be a positive integer');
    }
    
    if (typeof imageLike.height !== 'number' || imageLike.height <= 0 || !Number.isInteger(imageLike.height)) {
        throw new Error('ImageLike height must be a positive integer');
    }
    
    if (!(imageLike.data instanceof Uint8ClampedArray)) {
        throw new Error('ImageLike data must be a Uint8ClampedArray');
    }
    
    const expectedRGBLength = imageLike.width * imageLike.height * 3;
    const expectedRGBALength = imageLike.width * imageLike.height * 4;
    
    if (imageLike.data.length === expectedRGBLength) {
        // RGB to RGBA conversion - append alpha = 255 to each pixel
        const rgbaData = new Uint8ClampedArray(expectedRGBALength);
        for (let i = 0; i < imageLike.width * imageLike.height; i++) {
            rgbaData[i * 4] = imageLike.data[i * 3];     // R
            rgbaData[i * 4 + 1] = imageLike.data[i * 3 + 1]; // G
            rgbaData[i * 4 + 2] = imageLike.data[i * 3 + 2]; // B
            rgbaData[i * 4 + 3] = 255;                   // A = fully opaque
        }
        
        return {
            width: imageLike.width,
            height: imageLike.height,
            data: rgbaData
        };
    } else if (imageLike.data.length === expectedRGBALength) {
        // Already RGBA - use as-is
        return imageLike;
    } else {
        throw new Error(`ImageLike data length (${imageLike.data.length}) must match width*height*3 (${expectedRGBLength}) for RGB or width*height*4 (${expectedRGBALength}) for RGBA`);
    }
}

function Rasterizer(surface) {
    this.surface = surface;
    this.currentOp = null;
}

Rasterizer.prototype.beginOp = function(params) {
    this.currentOp = {
        composite: params.composite || 'source-over',
        globalAlpha: params.globalAlpha !== undefined ? params.globalAlpha : 1.0,
        transform: params.transform || new Matrix(),
        clipMask: params.clipMask || null,  // Stencil-based clipping (only clipping mechanism)
        fillStyle: params.fillStyle || null,
        strokeStyle: params.strokeStyle || null
    };
};

Rasterizer.prototype.endOp = function() {
    this.currentOp = null;
};

// Helper method to check if a pixel should be clipped by stencil buffer
Rasterizer.prototype._isPixelClipped = function(x, y) {
    if (!this.currentOp.clipMask) return false; // No clipping active
    const pixelIndex = y * this.surface.width + x;
    return getBit(this.currentOp.clipMask, pixelIndex) === 0; // 0 means clipped out
};

// Simple solid rectangle fill for M1
Rasterizer.prototype.fillRect = function(x, y, width, height, color) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // If there's stencil clipping, convert the rectangle to a path and use path filling
    if (this.currentOp.clipMask) {
        // Create a path for the rectangle
        const rectPath = new Path2D();
        rectPath.rect(x, y, width, height);
        
        // Use the existing path filling logic which handles stencil clipping properly
        this.fill(rectPath, 'nonzero');
        return;
    }
    
    // No clipping - use optimized direct rectangle filling
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
    
    // Optimized path for axis-aligned rectangles
    if (this.currentOp.transform.b === 0 && this.currentOp.transform.c === 0) {
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
        const rectColor = PolygonFiller.colorFromRGBA(color);
        PolygonFiller.fillPolygons(this.surface, [rectPolygon], rectColor, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
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
            
            // Check stencil buffer clipping
            if (this.currentOp.clipMask && this._isPixelClipped(px, py)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
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

// M2: Path filling implementation
Rasterizer.prototype.fill = function(path, rule) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to fill color
    const colorData = this.currentOp.fillStyle || [0, 0, 0, 255];
    const color = Array.isArray(colorData) ? 
        new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
    const fillColor = color.withGlobalAlpha(this.currentOp.globalAlpha);
    const fillRule = rule || 'nonzero';
    
    // Flatten path to polygons
    const polygons = PathFlattener.flattenPath(path);
    // Fill polygons with current transform and stencil clipping
    PolygonFiller.fillPolygons(this.surface, polygons, fillColor, fillRule, this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.stroke = function(path, strokeProps) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to stroke color
    const colorData = this.currentOp.strokeStyle || [0, 0, 0, 255];
    const color = Array.isArray(colorData) ? 
        new Color(colorData[0], colorData[1], colorData[2], colorData[3]) : colorData;
    const strokeColor = color.withGlobalAlpha(this.currentOp.globalAlpha);
    
    // Generate stroke polygons using geometric approach
    const strokePolygons = StrokeGenerator.generateStrokePolygons(path, strokeProps);
    
    // Fill stroke polygons with current transform and stencil clipping
    PolygonFiller.fillPolygons(this.surface, strokePolygons, strokeColor, 'nonzero', this.currentOp.transform, this.currentOp.clipMask);
};

Rasterizer.prototype.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Validate and convert ImageLike (handles RGB→RGBA conversion)
    const imageData = validateAndConvertImageLike(img);
    
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
    const transform = this.currentOp.transform;
    const topLeft = transform.transformPoint({x: destX, y: destY});
    const topRight = transform.transformPoint({x: destX + destWidth, y: destY});
    const bottomLeft = transform.transformPoint({x: destX, y: destY + destHeight});
    const bottomRight = transform.transformPoint({x: destX + destWidth, y: destY + destHeight});
    
    // Find bounding box in device space
    const minX = Math.max(0, Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const maxX = Math.min(this.surface.width - 1, Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)));
    const minY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    const maxY = Math.min(this.surface.height - 1, Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)));
    
    // Get inverse transform for mapping device pixels back to source  
    const inverseTransform = transform.invert();
    
    const globalAlpha = this.currentOp.globalAlpha;
    
    // Render each pixel in the bounding box
    for (let deviceY = minY; deviceY <= maxY; deviceY++) {
        for (let deviceX = minX; deviceX <= maxX; deviceX++) {
            // Check stencil clipping
            if (this.currentOp.clipMask && this._isPixelClipped(deviceX, deviceY)) {
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
            const destOffset = deviceY * this.surface.stride + deviceX * 4;
            
            if (this.currentOp.composite === 'copy' || finalSrcA === 255) {
                // Direct copy (no blending needed)
                const premultR = Math.round(srcR * effectiveAlpha);
                const premultG = Math.round(srcG * effectiveAlpha);
                const premultB = Math.round(srcB * effectiveAlpha);
                
                this.surface.data[destOffset] = premultR;
                this.surface.data[destOffset + 1] = premultG;
                this.surface.data[destOffset + 2] = premultB;
                this.surface.data[destOffset + 3] = finalSrcA;
            } else {
                // Alpha blending (source-over)
                const dstR = this.surface.data[destOffset];
                const dstG = this.surface.data[destOffset + 1];
                const dstB = this.surface.data[destOffset + 2];
                const dstA = this.surface.data[destOffset + 3];
                
                const srcAlpha = effectiveAlpha;
                const invSrcAlpha = 1 - srcAlpha;
                const dstAlpha = dstA / 255;
                
                // Premultiplied source colors
                const premultSrcR = srcR * srcAlpha;
                const premultSrcG = srcG * srcAlpha; 
                const premultSrcB = srcB * srcAlpha;
                
                // Blend with destination (assuming destination is already premultiplied)
                const newR = Math.round(premultSrcR + dstR * invSrcAlpha);
                const newG = Math.round(premultSrcG + dstG * invSrcAlpha);
                const newB = Math.round(premultSrcB + dstB * invSrcAlpha);
                const newA = Math.round(finalSrcA + dstA * invSrcAlpha);
                
                this.surface.data[destOffset] = newR;
                this.surface.data[destOffset + 1] = newG;
                this.surface.data[destOffset + 2] = newB;
                this.surface.data[destOffset + 3] = newA;
            }
        }
    }
};
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

/**
 * Create a new 1-bit stencil buffer initialized to "no clipping" (all 1s)
 * 
 * @param {number} width - Surface width in pixels
 * @param {number} height - Surface height in pixels  
 * @returns {Uint8Array} Stencil buffer with 1 bit per pixel, packed into bytes
 */
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

/**
 * Memory management helpers for Context2D stencil clipping
 */
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
        }
}

// Helper to check if a pixel should be clipped
function isPixelClipped(clipMask, x, y, width) {
    if (!clipMask) return false; // No clipping active
    const pixelIndex = y * width + x;
    return getBit(clipMask, pixelIndex) === 0; // 0 means clipped out
}

class Context2D {
    constructor(surface) {
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
    save() {
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
    }

    // Transform methods
    transform(a, b, c, d, e, f) {
    const m = new Matrix([a, b, c, d, e, f]);
    this._transform = m.multiply(this._transform);
    }

    setTransform(a, b, c, d, e, f) {
    this._transform = new Matrix([a, b, c, d, e, f]);
    }

    resetTransform() {
    this._transform = new Matrix();
    }

    // Convenience transform methods
    translate(x, y) {
    this._transform = new Matrix().translate(x, y).multiply(this._transform);
    }

    scale(sx, sy) {
    this._transform = new Matrix().scale(sx, sy).multiply(this._transform);
    }

    rotate(angleInRadians) {
    this._transform = new Matrix().rotate(angleInRadians).multiply(this._transform);
    }

    // Style setters (simplified for M1)
    setFillStyle(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form
    this._fillStyle = [r, g, b, a];
    }

    setStrokeStyle(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form  
    this._strokeStyle = [r, g, b, a];
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
    this.rasterizer.beginOp({
        composite: 'copy',
        globalAlpha: 1.0,
        transform: this._transform
    });
    
    this.rasterizer.fillRect(x, y, width, height, [0, 0, 0, 0]); // Transparent
    this.rasterizer.endOp();
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
        miterLimit: this.miterLimit
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
    const polygons = PathFlattener.flattenPath(pathToClip);
    
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
                const pixelIndex = y * this.surface.width + x;
                setBit(clipBuffer, pixelIndex, 1); // Set bit to 1 (inside clip region)
            }
        }
    }
    }

    // Image rendering
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
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
        transform: new Matrix([
            this._transform.a, this._transform.b,
            this._transform.c, this._transform.d, 
            this._transform.e, this._transform.f
        ]),
        clipMask: this.clipMask
    });
    
    // Delegate to rasterizer
    this.rasterizer.drawImage.apply(this.rasterizer, arguments);
    
    // End rasterizer operation
    this.rasterizer.endOp();
    }
}
// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // Core API (public)
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        StencilBuffer: StencilBuffer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // Core API (public)
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        StencilBuffer: StencilBuffer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
}

})();
