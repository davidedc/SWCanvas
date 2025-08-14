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
        
        // Work with non-premultiplied values to apply global alpha correctly
        const nonPremultR = this.r;
        const nonPremultG = this.g;
        const nonPremultB = this.b;
        const nonPremultA = this.a;
        
        const newAlpha = Math.round(nonPremultA * globalAlpha);
        return new Color(nonPremultR, nonPremultG, nonPremultB, newAlpha, false);
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
 * Point class for SWCanvas
 * 
 * Immutable 2D point representing a coordinate pair.
 * Following Joshua Bloch's principle of making small, focused, immutable classes.
 */
class Point {
    /**
     * Create a Point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        // Validate input parameters
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Point coordinates must be numbers');
        }
        
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error('Point coordinates must be finite numbers');
        }
        
        this._x = x;
        this._y = y;
        
        // Make point immutable
        Object.freeze(this);
    }
    
    get x() { return this._x; }
    get y() { return this._y; }
    
    /**
     * Create Point from object with x,y properties
     * @param {Object} obj - Object with x and y properties
     * @returns {Point} New Point instance
     */
    static from(obj) {
        if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') {
            throw new Error('Object must have numeric x and y properties');
        }
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
     * Create array of points from coordinate array
     * @param {number[]} coords - Array of alternating x,y coordinates
     * @returns {Point[]} Array of Point instances
     */
    static fromArray(coords) {
        if (!Array.isArray(coords) || coords.length % 2 !== 0) {
            throw new Error('Coordinates array must have even length');
        }
        
        const points = [];
        for (let i = 0; i < coords.length; i += 2) {
            points.push(new Point(coords[i], coords[i + 1]));
        }
        return points;
    }
    
    /**
     * Calculate distance to another point
     * @param {Point} other - Other point
     * @returns {number} Euclidean distance
     */
    distanceTo(other) {
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
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
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
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
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
        return new Point(this._x + other._x, this._y + other._y);
    }
    
    /**
     * Subtract another point from this point (immutable)
     * @param {Point} other - Other point to subtract
     * @returns {Point} New point representing difference
     */
    subtract(other) {
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
        return new Point(this._x - other._x, this._y - other._y);
    }
    
    /**
     * Scale this point by a factor (immutable)
     * @param {number} factor - Scale factor
     * @returns {Point} New scaled point
     */
    scale(factor) {
        if (typeof factor !== 'number') {
            throw new Error('Scale factor must be a number');
        }
        
        return new Point(this._x * factor, this._y * factor);
    }
    
    /**
     * Scale this point by separate X and Y factors (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Point} New scaled point
     */
    scaleXY(sx, sy) {
        if (typeof sx !== 'number' || typeof sy !== 'number') {
            throw new Error('Scale factors must be numbers');
        }
        
        return new Point(this._x * sx, this._y * sy);
    }
    
    /**
     * Rotate this point around origin (immutable)
     * @param {number} angle - Rotation angle in radians
     * @returns {Point} New rotated point
     */
    rotate(angle) {
        if (typeof angle !== 'number') {
            throw new Error('Angle must be a number');
        }
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point(
            this._x * cos - this._y * sin,
            this._x * sin + this._y * cos
        );
    }
    
    /**
     * Rotate this point around a center point (immutable)
     * @param {Point} center - Center of rotation
     * @param {number} angle - Rotation angle in radians
     * @returns {Point} New rotated point
     */
    rotateAround(center, angle) {
        if (!(center instanceof Point)) {
            throw new Error('Center must be a Point instance');
        }
        
        return this.subtract(center).rotate(angle).add(center);
    }
    
    /**
     * Get magnitude (distance from origin)
     * @returns {number} Vector magnitude
     */
    get magnitude() {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    }
    
    /**
     * Get squared magnitude (avoids sqrt for performance)
     * @returns {number} Squared vector magnitude
     */
    get magnitudeSquared() {
        return this._x * this._x + this._y * this._y;
    }
    
    /**
     * Normalize to unit vector (immutable)
     * @returns {Point} New normalized point
     */
    normalize() {
        const mag = this.magnitude;
        if (mag === 0) {
            return new Point(0, 0);
        }
        return new Point(this._x / mag, this._y / mag);
    }
    
    /**
     * Calculate dot product with another point
     * @param {Point} other - Other point/vector
     * @returns {number} Dot product
     */
    dot(other) {
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
        return this._x * other._x + this._y * other._y;
    }
    
    /**
     * Calculate cross product with another point (2D cross returns scalar)
     * @param {Point} other - Other point/vector
     * @returns {number} Cross product magnitude
     */
    cross(other) {
        if (!(other instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
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
     * Ceiling coordinates to integers (immutable)
     * @returns {Point} New point with ceiling coordinates
     */
    ceil() {
        return new Point(Math.ceil(this._x), Math.ceil(this._y));
    }
    
    /**
     * Clamp coordinates to a range (immutable)
     * @param {number} minX - Minimum X value
     * @param {number} minY - Minimum Y value
     * @param {number} maxX - Maximum X value
     * @param {number} maxY - Maximum Y value
     * @returns {Point} New clamped point
     */
    clamp(minX, minY, maxX, maxY) {
        return new Point(
            Math.max(minX, Math.min(maxX, this._x)),
            Math.max(minY, Math.min(maxY, this._y))
        );
    }
    
    /**
     * Interpolate between this point and another (immutable)
     * @param {Point} other - Target point
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Point} Interpolated point
     */
    lerp(other, t) {
        if (!(other instanceof Point)) {
            throw new Error('Target must be a Point instance');
        }
        
        if (typeof t !== 'number' || t < 0 || t > 1) {
            throw new Error('Interpolation factor must be between 0 and 1');
        }
        
        return new Point(
            this._x + (other._x - this._x) * t,
            this._y + (other._y - this._y) * t
        );
    }
    
    /**
     * Convert to plain object
     * @returns {Object} {x, y} object
     */
    toObject() {
        return { x: this._x, y: this._y };
    }
    
    /**
     * Convert to array
     * @returns {number[]} [x, y] array
     */
    toArray() {
        return [this._x, this._y];
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
     * Check if point is at origin (0, 0)
     * @param {number} tolerance - Tolerance for floating point comparison
     * @returns {boolean} True if point is at origin
     */
    isOrigin(tolerance = 1e-10) {
        return Math.abs(this._x) < tolerance && Math.abs(this._y) < tolerance;
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
 * Rectangle class for SWCanvas
 * 
 * Immutable Rectangle class representing an axis-aligned bounding box.
 * Following Joshua Bloch's principle of making small, focused, immutable classes.
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
        // Validate input parameters
        if (typeof x !== 'number' || typeof y !== 'number' || 
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Rectangle parameters must be numbers');
        }
        
        if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
            throw new Error('Rectangle parameters must be finite numbers');
        }
        
        if (width < 0 || height < 0) {
            throw new Error('Rectangle dimensions must be non-negative');
        }
        
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        
        // Make rectangle immutable
        Object.freeze(this);
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
        if (!(topLeft instanceof Point) || !(bottomRight instanceof Point)) {
            throw new Error('Arguments must be Point instances');
        }
        
        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;
        
        if (width < 0 || height < 0) {
            throw new Error('Bottom-right corner must be below and to the right of top-left corner');
        }
        
        return new Rectangle(topLeft.x, topLeft.y, width, height);
    }
    
    /**
     * Create rectangle from center point and dimensions
     * @param {Point} center - Center point
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @returns {Rectangle} New Rectangle
     */
    static fromCenter(center, width, height) {
        if (!(center instanceof Point)) {
            throw new Error('Center must be a Point instance');
        }
        
        return new Rectangle(
            center.x - width / 2,
            center.y - height / 2,
            width,
            height
        );
    }
    
    /**
     * Create rectangle that bounds a set of points
     * @param {Point[]} points - Array of points
     * @returns {Rectangle} Bounding rectangle
     */
    static boundingBox(points) {
        if (!Array.isArray(points)) {
            throw new Error('Points must be an array');
        }
        
        if (points.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        // Validate all points
        for (const point of points) {
            if (!(point instanceof Point)) {
                throw new Error('All items must be Point instances');
            }
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
     * Create empty rectangle
     * @returns {Rectangle} Empty rectangle at origin
     */
    static empty() {
        return new Rectangle(0, 0, 0, 0);
    }
    
    /**
     * Create unit rectangle (0, 0, 1, 1)
     * @returns {Rectangle} Unit rectangle
     */
    static unit() {
        return new Rectangle(0, 0, 1, 1);
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
     * Get perimeter of rectangle
     * @returns {number} Perimeter
     */
    get perimeter() {
        return 2 * (this._width + this._height);
    }
    
    /**
     * Check if rectangle is empty (zero area)
     * @returns {boolean} True if empty
     */
    get isEmpty() {
        return this._width === 0 || this._height === 0;
    }
    
    /**
     * Check if rectangle is a square
     * @returns {boolean} True if square
     */
    get isSquare() {
        return this._width === this._height && this._width > 0;
    }
    
    /**
     * Check if point is inside rectangle
     * @param {Point} point - Point to test
     * @returns {boolean} True if point is inside
     */
    contains(point) {
        if (!(point instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
        return point.x >= this._x && point.x < this._x + this._width &&
               point.y >= this._y && point.y < this._y + this._height;
    }
    
    /**
     * Check if point is inside rectangle (inclusive of edges)
     * @param {Point} point - Point to test
     * @returns {boolean} True if point is inside or on edge
     */
    containsInclusive(point) {
        if (!(point instanceof Point)) {
            throw new Error('Argument must be a Point instance');
        }
        
        return point.x >= this._x && point.x <= this._x + this._width &&
               point.y >= this._y && point.y <= this._y + this._height;
    }
    
    /**
     * Check if another rectangle is completely inside this rectangle
     * @param {Rectangle} other - Rectangle to test
     * @returns {boolean} True if other is completely inside
     */
    containsRectangle(other) {
        if (!(other instanceof Rectangle)) {
            throw new Error('Argument must be a Rectangle instance');
        }
        
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
        if (!(other instanceof Rectangle)) {
            throw new Error('Argument must be a Rectangle instance');
        }
        
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
        if (!(other instanceof Rectangle)) {
            throw new Error('Argument must be a Rectangle instance');
        }
        
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
        if (!(other instanceof Rectangle)) {
            throw new Error('Argument must be a Rectangle instance');
        }
        
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
        if (typeof dx !== 'number' || typeof dy !== 'number') {
            throw new Error('Translation offsets must be numbers');
        }
        
        return new Rectangle(this._x + dx, this._y + dy, this._width, this._height);
    }
    
    /**
     * Translate rectangle by point (immutable)
     * @param {Point} offset - Translation offset
     * @returns {Rectangle} New translated rectangle
     */
    translateBy(offset) {
        if (!(offset instanceof Point)) {
            throw new Error('Offset must be a Point instance');
        }
        
        return this.translate(offset.x, offset.y);
    }
    
    /**
     * Scale rectangle by factors (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Rectangle} New scaled rectangle
     */
    scale(sx, sy = sx) {
        if (typeof sx !== 'number' || typeof sy !== 'number') {
            throw new Error('Scale factors must be numbers');
        }
        
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
        if (typeof margin !== 'number') {
            throw new Error('Margin must be a number');
        }
        
        return new Rectangle(
            this._x - margin,
            this._y - margin,
            this._width + 2 * margin,
            this._height + 2 * margin
        );
    }
    
    /**
     * Expand rectangle by different margins on each side (immutable)
     * @param {number} left - Left margin
     * @param {number} top - Top margin
     * @param {number} right - Right margin
     * @param {number} bottom - Bottom margin
     * @returns {Rectangle} New expanded rectangle
     */
    expandBy(left, top, right, bottom) {
        return new Rectangle(
            this._x - left,
            this._y - top,
            this._width + left + right,
            this._height + top + bottom
        );
    }
    
    /**
     * Clamp rectangle to fit within bounds (immutable)
     * @param {Rectangle} bounds - Bounding rectangle
     * @returns {Rectangle} New clamped rectangle
     */
    clamp(bounds) {
        if (!(bounds instanceof Rectangle)) {
            throw new Error('Bounds must be a Rectangle instance');
        }
        
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
     * Get all four corner points as array
     * @returns {Point[]} Array of corner points
     */
    getCornerPoints() {
        const c = this.corners;
        return [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft];
    }
    
    /**
     * Convert to object
     * @returns {Object} {x, y, width, height} object
     */
    toObject() {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height
        };
    }
    
    /**
     * Convert to array
     * @returns {number[]} [x, y, width, height] array
     */
    toArray() {
        return [this._x, this._y, this._width, this._height];
    }
    
    /**
     * Check equality with another rectangle
     * @param {Rectangle} other - Other rectangle
     * @param {number} tolerance - Tolerance for floating point comparison
     * @returns {boolean} True if rectangles are equal within tolerance
     */
    equals(other, tolerance = 1e-10) {
        return other instanceof Rectangle &&
               Math.abs(this._x - other._x) < tolerance &&
               Math.abs(this._y - other._y) < tolerance &&
               Math.abs(this._width - other._width) < tolerance &&
               Math.abs(this._height - other._height) < tolerance;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Rectangle description
     */
    toString() {
        return `Rectangle(${this._x}, ${this._y}, ${this._width}, ${this._height})`;
    }
}
/**
 * Transform2D class for SWCanvas
 * 
 * Represents a 2D affine transformation matrix using homogeneous coordinates.
 * Immutable value object following Joshua Bloch's effective design principles.
 * 
 * Transform2D format (2x3 affine transformation):
 * | a  c  e |   | x |   | ax + cy + e |
 * | b  d  f | × | y | = | bx + dy + f |
 * | 0  0  1 |   | 1 |   |      1      |
 */
class Transform2D {
    /**
     * Create a Transform2D matrix
     * @param {number[]|undefined} init - Optional [a, b, c, d, e, f] array
     */
    constructor(init) {
        if (init && Array.isArray(init) && init.length === 6) {
            // Validate input values
            for (let i = 0; i < 6; i++) {
                if (typeof init[i] !== 'number' || !isFinite(init[i])) {
                    throw new Error(`Transform2D component ${i} must be a finite number`);
                }
            }
            
            this.a = init[0];
            this.b = init[1]; 
            this.c = init[2];
            this.d = init[3];
            this.e = init[4];
            this.f = init[5];
        } else if (init && init.length !== undefined) {
            throw new Error('Transform2D initialization array must have exactly 6 elements');
        } else {
            // Identity transformation
            this.a = 1; this.b = 0;
            this.c = 0; this.d = 1;
            this.e = 0; this.f = 0;
        }
        
        // Make transformation immutable
        Object.freeze(this);
    }

    /**
     * Create identity transform
     * @returns {Transform2D} Identity transformation
     */
    static identity() {
        return new Transform2D();
    }
    
    /**
     * Create translation transform
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Transform2D} Translation transformation
     */
    static translation(x, y) {
        return new Transform2D([1, 0, 0, 1, x, y]);
    }
    
    /**
     * Create scaling transform
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor  
     * @returns {Transform2D} Scaling transformation
     */
    static scaling(sx, sy) {
        return new Transform2D([sx, 0, 0, sy, 0, 0]);
    }
    
    /**
     * Create rotation transform
     * @param {number} angleInRadians - Rotation angle in radians
     * @returns {Transform2D} Rotation transformation
     */
    static rotation(angleInRadians) {
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        return new Transform2D([cos, sin, -sin, cos, 0, 0]);
    }

    /**
     * Multiply this transform with another (immutable)
     * @param {Transform2D} other - Transform to multiply with
     * @returns {Transform2D} Result of multiplication
     */
    multiply(other) {
        if (!(other instanceof Transform2D)) {
            throw new Error('Can only multiply with another Transform2D');
        }
        
        return new Transform2D([
            this.a * other.a + this.b * other.c,
            this.a * other.b + this.b * other.d,
            this.c * other.a + this.d * other.c,
            this.c * other.b + this.d * other.d,
            this.e * other.a + this.f * other.c + other.e,
            this.e * other.b + this.f * other.d + other.f
        ]);
    }

    /**
     * Apply translation to this transform (immutable)
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Transform2D} New transformed matrix
     */
    translate(x, y) {
        const t = Transform2D.translation(x, y);
        return this.multiply(t);
    }

    /**
     * Apply scaling to this transform (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Transform2D} New transformed matrix
     */
    scale(sx, sy) {
        const s = Transform2D.scaling(sx, sy);
        return this.multiply(s);
    }

    /**
     * Apply rotation to this transform (immutable)
     * @param {number} angleInRadians - Rotation angle in radians
     * @returns {Transform2D} New transformed matrix
     */
    rotate(angleInRadians) {
        const r = Transform2D.rotation(angleInRadians);
        return this.multiply(r);
    }

    /**
     * Calculate inverse transformation (immutable)
     * @returns {Transform2D} Inverse transformation
     */
    invert() {
        const det = this.a * this.d - this.b * this.c;
        
        if (Math.abs(det) < 1e-10) {
            throw new Error('Transform2D matrix is not invertible (determinant ≈ 0)');
        }
        
        return new Transform2D([
            this.d / det,
            -this.b / det,
            -this.c / det,
            this.a / det,
            (this.c * this.f - this.d * this.e) / det,
            (this.b * this.e - this.a * this.f) / det
        ]);
    }

    /**
     * Transform a point using this matrix
     * @param {Object|Point} point - Point with x,y properties
     * @returns {Object} Transformed point {x, y}
     */
    transformPoint(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            throw new Error('Point must have numeric x and y properties');
        }
        
        return {
            x: this.a * point.x + this.c * point.y + this.e,
            y: this.b * point.x + this.d * point.y + this.f
        };
    }
    
    /**
     * Transform multiple points efficiently
     * @param {Array} points - Array of points to transform
     * @returns {Array} Array of transformed points
     */
    transformPoints(points) {
        return points.map(point => this.transformPoint(point));
    }
    
    /**
     * Get transformation as array
     * @returns {number[]} [a, b, c, d, e, f] array
     */
    toArray() {
        return [this.a, this.b, this.c, this.d, this.e, this.f];
    }
    
    /**
     * Check if this is the identity transformation
     * @returns {boolean} True if identity
     */
    get isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 && 
               this.d === 1 && this.e === 0 && this.f === 0;
    }
    
    /**
     * Get transformation determinant
     * @returns {number} Transform2D determinant
     */
    get determinant() {
        return this.a * this.d - this.b * this.c;
    }
    
    /**
     * Check equality with another transform
     * @param {Transform2D} other - Transform to compare
     * @param {number} tolerance - Floating point tolerance
     * @returns {boolean} True if transforms are equal within tolerance
     */
    equals(other, tolerance = 1e-10) {
        return other instanceof Transform2D &&
               Math.abs(this.a - other.a) < tolerance &&
               Math.abs(this.b - other.b) < tolerance &&
               Math.abs(this.c - other.c) < tolerance &&
               Math.abs(this.d - other.d) < tolerance &&
               Math.abs(this.e - other.e) < tolerance &&
               Math.abs(this.f - other.f) < tolerance;
    }

    /**
     * String representation for debugging
     * @returns {string} Transform2D description
     */
    toString() {
        return `Transform2D([${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f}])`;
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
/**
 * Surface class for SWCanvas
 * 
 * Represents a 2D pixel surface with RGBA data storage.
 * Following Joshua Bloch's principle of proper class design with validation,
 * clear error messages, and immutable properties where sensible.
 */
class Surface {
    /**
     * Create a Surface
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // Validate parameters with descriptive error messages
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('Surface width must be a positive integer');
        }
        
        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('Surface height must be a positive integer');
        }
        
        // Check area first (SurfaceTooLarge takes precedence for test compatibility)
        if (width * height > 268435456) { // 16384 * 16384
            throw new Error('SurfaceTooLarge');
        }
        
        // Prevent memory issues with reasonable individual dimension limits
        const maxDimension = 16384;
        if (width > maxDimension || height > maxDimension) {
            throw new Error(`Surface dimensions must be ≤ ${maxDimension}x${maxDimension}`);
        }
        
        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
        Object.defineProperty(this, 'stride', { value: width * 4, writable: false });
        
        // Allocate pixel data (RGBA, non-premultiplied)
        this.data = new Uint8ClampedArray(this.stride * height);
    }
    
    /**
     * Create a copy of this surface
     * @returns {Surface} New surface with copied data
     */
    clone() {
        const clone = new Surface(this.width, this.height);
        clone.data.set(this.data);
        return clone;
    }
    
    /**
     * Get pixel color at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Color|null} Color at position, or null if out of bounds
     */
    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        
        const offset = y * this.stride + x * 4;
        return new Color(
            this.data[offset],
            this.data[offset + 1], 
            this.data[offset + 2],
            this.data[offset + 3],
            false // Non-premultiplied
        );
    }
    
    /**
     * Set pixel color at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Color} color - Color to set
     */
    setPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return; // Silently ignore out-of-bounds writes
        }
        
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        const offset = y * this.stride + x * 4;
        this.data[offset] = color.r;
        this.data[offset + 1] = color.g;
        this.data[offset + 2] = color.b;
        this.data[offset + 3] = color.a;
    }
    
    /**
     * Clear surface to specified color
     * @param {Color} color - Color to clear to (defaults to transparent)
     */
    clear(color = Color.transparent()) {
        if (!(color instanceof Color)) {
            throw new Error('Color must be a Color instance');
        }
        
        const rgba = color.toRGBA();
        
        for (let i = 0; i < this.data.length; i += 4) {
            this.data[i] = rgba[0];
            this.data[i + 1] = rgba[1];
            this.data[i + 2] = rgba[2];
            this.data[i + 3] = rgba[3];
        }
    }
    
    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage
     */
    getMemoryUsage() {
        return this.data.byteLength;
    }
    
    /**
     * String representation for debugging
     * @returns {string} Surface description
     */
    toString() {
        const memoryMB = (this.getMemoryUsage() / (1024 * 1024)).toFixed(2);
        return `Surface(${this.width}×${this.height}, ${memoryMB}MB)`;
    }
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
    static encode(surface) {
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
     * @param {Transform2D} transform - Transformation matrix to apply to polygons
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
     * @param {ClipMask|null} clipMask - Stencil clipping mask
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
     * @param {ClipMask|null} clipMask - Stencil clipping mask
     * @private
     */
    static _fillPixelSpan(surface, y, startX, endX, color, clipMask) {
        for (let x = startX; x <= endX; x++) {
            // Check stencil buffer clipping
            if (clipMask && clipMask.isPixelClipped(x, y)) {
                continue; // Skip pixels clipped by stencil buffer
            }
            
            const offset = y * surface.stride + x * 4;
            PolygonFiller._blendPixel(surface, offset, color);
        }
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
            // Opaque source - copy non-premultiplied values (surface stores non-premultiplied)
            surface.data[offset] = color.r;
            surface.data[offset + 1] = color.g;
            surface.data[offset + 2] = color.b;
            surface.data[offset + 3] = color.a;
            return;
        }
        
        // Alpha blending required (source-over composition)
        // Surface stores non-premultiplied RGBA, use standard blending formula
        const dstR = surface.data[offset];
        const dstG = surface.data[offset + 1];
        const dstB = surface.data[offset + 2];
        const dstA = surface.data[offset + 3];
        
        const srcR = color.r;
        const srcG = color.g;
        const srcB = color.b;
        const srcA = color.a;
        
        const srcAlpha = srcA / 255;
        const invSrcAlpha = 1 - srcAlpha;
        
        // Use original non-premultiplied blending formula (matches original implementation)
        const newR = Math.round(srcR * srcAlpha + dstR * invSrcAlpha);
        const newG = Math.round(srcG * srcAlpha + dstG * invSrcAlpha);
        const newB = Math.round(srcB * srcAlpha + dstB * invSrcAlpha);
        const newA = Math.round(srcA + dstA * invSrcAlpha);
        
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
        
        if (validated.lineWidth < 0) {
            throw new Error('lineWidth must not be negative');
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
        // Calculate half width from segment body (same as original)
        const halfWidth = Math.sqrt(
            Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
            Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
        ) / 2;
        
        // Determine which sides are on the outside of the turn
        const cross = seg1.tangent.cross(seg2.tangent);
        
        let outer1, outer2;
        if (cross > 0) {
            // Left turn - right sides are outer
            outer1 = seg1.body[2]; // Right side of seg1 end
            outer2 = seg2.body[3]; // Right side of seg2 start  
        } else {
            // Right turn - left sides are outer
            outer1 = seg1.body[1]; // Left side of seg1 end
            outer2 = seg2.body[0]; // Left side of seg2 start
        }
        
        // Calculate miter point (intersection of extended outer edges)
        // Extend seg1's outer edge forward
        const seg1Extended = {
            x: outer1.x + seg1.tangent.x * 100, 
            y: outer1.y + seg1.tangent.y * 100
        };
        // Extend seg2's outer edge backward  
        const seg2Extended = {
            x: outer2.x - seg2.tangent.x * 100,
            y: outer2.y - seg2.tangent.y * 100
        };
        
        const miterPoint = StrokeGenerator._lineIntersection(outer1, seg1Extended, outer2, seg2Extended);
        
        if (!miterPoint) {
            // Fallback to bevel if no intersection
            return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
        
        // Check miter limit
        const miterLength = Math.sqrt(
            Math.pow(miterPoint.x - joinPoint.x, 2) + 
            Math.pow(miterPoint.y - joinPoint.y, 2)
        );
        const miterRatio = miterLength / halfWidth;
        
        if (miterRatio > miterLimit) {
            // Exceeds miter limit - use bevel
            return StrokeGenerator._generateBevelJoin(seg1, seg2, joinPoint);
        }
        
        // For miter join, we need to fill both the miter triangle and the inner area
        let inner1, inner2;
        if (cross > 0) {
            // Left turn - left sides are inner
            inner1 = seg1.body[1]; // Left side of seg1 end  
            inner2 = seg2.body[0]; // Left side of seg2 start
        } else {
            // Right turn - right sides are inner
            inner1 = seg1.body[2]; // Right side of seg1 end
            inner2 = seg2.body[3]; // Right side of seg2 start
        }
        
        // Create miter triangle and inner quadrilateral
        return [
            [outer1, miterPoint, outer2],  // Miter triangle
            [outer1, outer2, inner2, inner1]  // Inner connecting area
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
        // Calculate half width from segment body (distance between top and bottom edges)
        const halfWidth = Math.sqrt(
            Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
            Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
        ) / 2;
        
        // Determine which sides are on the outside of the turn
        const cross = seg1.tangent.cross(seg2.tangent);
        
        let outer1, outer2;
        if (cross > 0) {
            // Left turn - right sides are outer
            outer1 = seg1.body[2]; // Right side of seg1 end
            outer2 = seg2.body[3]; // Right side of seg2 start  
        } else {
            // Right turn - left sides are outer
            outer1 = seg1.body[1]; // Left side of seg1 end
            outer2 = seg2.body[0]; // Left side of seg2 start
        }
        
        // Calculate angles
        const angle1 = Math.atan2(outer1.y - joinPoint.y, outer1.x - joinPoint.x);
        const angle2 = Math.atan2(outer2.y - joinPoint.y, outer2.x - joinPoint.x);
        
        let startAngle = angle1;
        let endAngle = angle2;
        
        // Normalize angles to go the correct way around (from original implementation)
        let angleDiff = endAngle - startAngle;
        if (angleDiff > Math.PI) {
            angleDiff -= 2 * Math.PI;
        } else if (angleDiff < -Math.PI) {
            angleDiff += 2 * Math.PI;
        }
        
        // We want to go the convex way (positive turn)
        if (angleDiff < 0) {
            // Swap to go positive direction
            const temp = startAngle;
            startAngle = endAngle;
            endAngle = temp;
            angleDiff = -angleDiff;
        }
        
        const segments = Math.max(2, Math.ceil(angleDiff / (Math.PI / 4))); // At least 2 segments
        const angleStep = angleDiff / segments;
        
        const triangles = [];
        for (let i = 0; i < segments; i++) {
            const a1 = startAngle + i * angleStep;
            const a2 = startAngle + (i + 1) * angleStep;
            
            const p1 = {
                x: joinPoint.x + halfWidth * Math.cos(a1),
                y: joinPoint.y + halfWidth * Math.sin(a1)
            };
            const p2 = {
                x: joinPoint.x + halfWidth * Math.cos(a2),
                y: joinPoint.y + halfWidth * Math.sin(a2)
            };
            
            triangles.push([joinPoint.toObject(), p1, p2]);
        }
        
        return triangles;
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
     * Calculate intersection of two lines defined by points
     * @param {Object} p1 - First line point 1
     * @param {Object} p2 - First line point 2  
     * @param {Object} p3 - Second line point 1
     * @param {Object} p4 - Second line point 2
     * @returns {Object|null} Intersection point or null if parallel
     * @private
     */
    static _lineIntersection(p1, p2, p3, p4) {
        const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        
        if (Math.abs(denom) < 1e-10) {
            return null; // Lines are parallel
        }
        
        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
        
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
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
 * ClipMask class for SWCanvas
 * 
 * Represents a 1-bit stencil buffer for memory-efficient clipping operations.
 * Encapsulates bit manipulation and provides proper domain object interface
 * following Joshua Bloch's principles of clear responsibility and encapsulation.
 * 
 * Memory Layout:
 * - Each pixel is represented by 1 bit (1 = visible, 0 = clipped)
 * - Bits are packed into Uint8Array (8 pixels per byte)
 * - Memory usage: width × height ÷ 8 bytes (87.5% reduction vs full coverage)
 */
class ClipMask {
    /**
     * Create a ClipMask
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // Validate parameters
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('ClipMask width must be a positive integer');
        }
        
        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('ClipMask height must be a positive integer');
        }
        
        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        
        // Initialize to all 1s (no clipping by default)
        this._buffer = new Uint8Array(this._numBytes);
        this._initializeNoClipping();
        
        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
    }
    
    /**
     * Initialize buffer to "no clipping" state (all 1s)
     * @private
     */
    _initializeNoClipping() {
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
     * Get clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is visible (not clipped)
     */
    getPixel(x, y) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return false; // Out of bounds pixels are clipped
        }
        
        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 1;
    }
    
    /**
     * Set clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} visible - True if pixel should be visible
     */
    setPixel(x, y, visible) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return; // Ignore out of bounds
        }
        
        const pixelIndex = y * this._width + x;
        this._setBit(pixelIndex, visible ? 1 : 0);
    }
    
    /**
     * Check if a pixel is clipped (convenience method)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is clipped out
     */
    isPixelClipped(x, y) {
        return !this.getPixel(x, y);
    }
    
    /**
     * Clear all clipping (set all pixels to visible)
     */
    clear() {
        this._initializeNoClipping();
    }
    
    /**
     * Set all pixels to clipped state
     */
    clipAll() {
        this._buffer.fill(0);
    }
    
    /**
     * Intersect this clip mask with another (AND operation)
     * Only pixels visible in BOTH masks will remain visible
     * @param {ClipMask} other - Other clip mask to intersect with
     */
    intersectWith(other) {
        if (!(other instanceof ClipMask)) {
            throw new Error('Argument must be a ClipMask instance');
        }
        
        if (other._width !== this._width || other._height !== this._height) {
            throw new Error('ClipMask dimensions must match for intersection');
        }
        
        // Perform bitwise AND on each byte
        for (let i = 0; i < this._numBytes; i++) {
            this._buffer[i] &= other._buffer[i];
        }
    }
    
    /**
     * Create a deep copy of this clip mask
     * @returns {ClipMask} New ClipMask with copied data
     */
    clone() {
        const clone = new ClipMask(this._width, this._height);
        clone._buffer.set(this._buffer);
        return clone;
    }
    
    /**
     * Create a clip pixel writer function for path rendering
     * @returns {Function} clipPixel function for coverage-based rendering
     */
    createPixelWriter() {
        return (x, y, coverage) => {
            // Bounds checking
            if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;
            
            // Convert coverage to binary: >0.5 means inside, <=0.5 means outside
            const isInside = coverage > 0.5;
            this.setPixel(x, y, isInside);
        };
    }
    
    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage of the clip mask
     */
    getMemoryUsage() {
        return this._buffer.byteLength;
    }
    
    /**
     * Check if mask has any clipping (optimization)
     * @returns {boolean} True if any pixels are clipped
     */
    hasClipping() {
        // Quick check: if all bytes are 0xFF, no clipping
        for (let i = 0; i < this._numBytes - 1; i++) {
            if (this._buffer[i] !== 0xFF) {
                return true;
            }
        }
        
        // Check last byte accounting for partial bits
        const remainderBits = this._numPixels % 8;
        if (remainderBits === 0) {
            return this._buffer[this._numBytes - 1] !== 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return this._buffer[this._numBytes - 1] !== lastByteMask;
        }
    }
    
    /**
     * Get bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     * @private
     */
    _getBit(pixelIndex) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (byteIndex >= this._buffer.length) {
            return 0; // Out of bounds pixels are clipped
        }
        
        return (this._buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }
    
    /**
     * Set bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     * @private
     */
    _setBit(pixelIndex, value) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;
        
        if (byteIndex >= this._buffer.length) {
            return; // Ignore out of bounds
        }
        
        if (value) {
            this._buffer[byteIndex] |= (1 << bitIndex);
        } else {
            this._buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }
    
    /**
     * String representation for debugging
     * @returns {string} ClipMask description
     */
    toString() {
        const memoryKB = (this.getMemoryUsage() / 1024).toFixed(2);
        const clippingStatus = this.hasClipping() ? 'with clipping' : 'no clipping';
        return `ClipMask(${this._width}×${this._height}, ${memoryKB}KB, ${clippingStatus})`;
    }
    
    /**
     * Check equality with another ClipMask
     * @param {ClipMask} other - Other ClipMask to compare
     * @returns {boolean} True if masks are identical
     */
    equals(other) {
        if (!(other instanceof ClipMask)) {
            return false;
        }
        
        if (other._width !== this._width || other._height !== this._height) {
            return false;
        }
        
        // Compare buffer contents
        for (let i = 0; i < this._numBytes; i++) {
            if (this._buffer[i] !== other._buffer[i]) {
                return false;
            }
        }
        
        return true;
    }
}
/**
 * ImageProcessor class for SWCanvas
 * 
 * Handles ImageLike interface validation and format conversions.
 * Provides static methods following Joshua Bloch's principle of 
 * using static methods for stateless utility operations.
 */
class ImageProcessor {
    /**
     * Validate and convert ImageLike object to standardized RGBA format
     * @param {Object} imageLike - ImageLike object to validate and convert
     * @returns {Object} Validated and converted image data
     */
    static validateAndConvert(imageLike) {
        ImageProcessor._validateImageLike(imageLike);
        
        const expectedRGBLength = imageLike.width * imageLike.height * 3;
        const expectedRGBALength = imageLike.width * imageLike.height * 4;
        
        if (imageLike.data.length === expectedRGBLength) {
            return ImageProcessor._convertRGBToRGBA(imageLike);
        } else if (imageLike.data.length === expectedRGBALength) {
            // Already RGBA - return as-is with validation
            return {
                width: imageLike.width,
                height: imageLike.height,
                data: imageLike.data
            };
        } else {
            throw new Error(
                `ImageLike data length (${imageLike.data.length}) must match ` +
                `width*height*3 (${expectedRGBLength}) for RGB or ` +
                `width*height*4 (${expectedRGBALength}) for RGBA`
            );
        }
    }
    
    /**
     * Validate basic ImageLike interface properties
     * @param {Object} imageLike - Object to validate
     * @private
     */
    static _validateImageLike(imageLike) {
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
        
        // Additional validation for reasonable limits
        const maxDimension = 16384;
        if (imageLike.width > maxDimension || imageLike.height > maxDimension) {
            throw new Error(`ImageLike dimensions must be ≤ ${maxDimension}x${maxDimension}`);
        }
    }
    
    /**
     * Convert RGB image data to RGBA format
     * @param {Object} rgbImage - RGB ImageLike object
     * @returns {Object} RGBA ImageLike object
     * @private
     */
    static _convertRGBToRGBA(rgbImage) {
        const expectedRGBALength = rgbImage.width * rgbImage.height * 4;
        const rgbaData = new Uint8ClampedArray(expectedRGBALength);
        
        // RGB to RGBA conversion - append alpha = 255 to each pixel
        for (let i = 0; i < rgbImage.width * rgbImage.height; i++) {
            const rgbOffset = i * 3;
            const rgbaOffset = i * 4;
            
            rgbaData[rgbaOffset] = rgbImage.data[rgbOffset];         // R
            rgbaData[rgbaOffset + 1] = rgbImage.data[rgbOffset + 1]; // G
            rgbaData[rgbaOffset + 2] = rgbImage.data[rgbOffset + 2]; // B
            rgbaData[rgbaOffset + 3] = 255;                          // A = fully opaque
        }
        
        return {
            width: rgbImage.width,
            height: rgbImage.height,
            data: rgbaData
        };
    }
    
    /**
     * Convert Surface to ImageLike format
     * @param {Surface} surface - Surface to convert
     * @returns {Object} ImageLike representation of surface
     */
    static surfaceToImageLike(surface) {
        if (!surface || typeof surface !== 'object') {
            throw new Error('Surface must be a valid Surface object');
        }
        
        if (!surface.width || !surface.height || !surface.data) {
            throw new Error('Surface must have width, height, and data properties');
        }
        
        return {
            width: surface.width,
            height: surface.height,
            data: new Uint8ClampedArray(surface.data) // Create copy for safety
        };
    }
    
    /**
     * Create a blank ImageLike object filled with specified color
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {Color|Array} fillColor - Color to fill with (Color instance or RGBA array)
     * @returns {Object} ImageLike object
     */
    static createBlankImage(width, height, fillColor = [0, 0, 0, 255]) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            throw new Error('Width and height must be positive integers');
        }
        
        const numPixels = width * height;
        const data = new Uint8ClampedArray(numPixels * 4);
        
        // Determine RGBA values
        let r, g, b, a;
        if (fillColor instanceof Color) {
            const rgba = fillColor.toRGBA();
            r = rgba[0];
            g = rgba[1];
            b = rgba[2];
            a = rgba[3];
        } else if (Array.isArray(fillColor) && fillColor.length >= 4) {
            r = fillColor[0];
            g = fillColor[1];
            b = fillColor[2];
            a = fillColor[3];
        } else {
            throw new Error('fillColor must be a Color instance or RGBA array');
        }
        
        // Fill image with specified color
        for (let i = 0; i < numPixels; i++) {
            const offset = i * 4;
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
            data[offset + 3] = a;
        }
        
        return {
            width,
            height,
            data
        };
    }
    
    /**
     * Extract a rectangular region from an ImageLike object
     * @param {Object} source - Source ImageLike object
     * @param {number} x - Source x coordinate
     * @param {number} y - Source y coordinate
     * @param {number} width - Region width
     * @param {number} height - Region height
     * @returns {Object} New ImageLike object containing the extracted region
     */
    static extractRegion(source, x, y, width, height) {
        const validated = ImageProcessor.validateAndConvert(source);
        
        // Validate extraction bounds
        if (x < 0 || y < 0 || x + width > validated.width || y + height > validated.height) {
            throw new Error('Extraction region exceeds source image bounds');
        }
        
        if (width <= 0 || height <= 0) {
            throw new Error('Extraction region dimensions must be positive');
        }
        
        const extractedData = new Uint8ClampedArray(width * height * 4);
        
        // Copy pixel data row by row
        for (let row = 0; row < height; row++) {
            const sourceRowStart = ((y + row) * validated.width + x) * 4;
            const destRowStart = row * width * 4;
            const rowLength = width * 4;
            
            extractedData.set(
                validated.data.subarray(sourceRowStart, sourceRowStart + rowLength),
                destRowStart
            );
        }
        
        return {
            width,
            height,
            data: extractedData
        };
    }
    
    /**
     * Scale an ImageLike object using nearest-neighbor interpolation
     * @param {Object} source - Source ImageLike object
     * @param {number} newWidth - Target width
     * @param {number} newHeight - Target height
     * @returns {Object} Scaled ImageLike object
     */
    static scaleImage(source, newWidth, newHeight) {
        const validated = ImageProcessor.validateAndConvert(source);
        
        if (!Number.isInteger(newWidth) || !Number.isInteger(newHeight) || 
            newWidth <= 0 || newHeight <= 0) {
            throw new Error('Target dimensions must be positive integers');
        }
        
        const scaledData = new Uint8ClampedArray(newWidth * newHeight * 4);
        const scaleX = validated.width / newWidth;
        const scaleY = validated.height / newHeight;
        
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                // Nearest-neighbor sampling
                const sourceX = Math.floor(x * scaleX);
                const sourceY = Math.floor(y * scaleY);
                
                // Clamp to source bounds (shouldn't be necessary with correct scaling)
                const clampedX = Math.min(sourceX, validated.width - 1);
                const clampedY = Math.min(sourceY, validated.height - 1);
                
                const sourceOffset = (clampedY * validated.width + clampedX) * 4;
                const destOffset = (y * newWidth + x) * 4;
                
                // Copy RGBA values
                scaledData[destOffset] = validated.data[sourceOffset];
                scaledData[destOffset + 1] = validated.data[sourceOffset + 1];
                scaledData[destOffset + 2] = validated.data[sourceOffset + 2];
                scaledData[destOffset + 3] = validated.data[sourceOffset + 3];
            }
        }
        
        return {
            width: newWidth,
            height: newHeight,
            data: scaledData
        };
    }
    
    /**
     * Check if an object conforms to the ImageLike interface
     * @param {*} obj - Object to check
     * @returns {boolean} True if object is ImageLike-compatible
     */
    static isImageLike(obj) {
        try {
            ImageProcessor._validateImageLike(obj);
            
            const expectedRGBLength = obj.width * obj.height * 3;
            const expectedRGBALength = obj.width * obj.height * 4;
            
            return obj.data.length === expectedRGBLength || obj.data.length === expectedRGBALength;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get information about an ImageLike object
     * @param {Object} imageLike - ImageLike object to analyze
     * @returns {Object} Information about the image
     */
    static getImageInfo(imageLike) {
        const validated = ImageProcessor.validateAndConvert(imageLike);
        const isRGB = imageLike.data.length === imageLike.width * imageLike.height * 3;
        
        return {
            width: validated.width,
            height: validated.height,
            pixelCount: validated.width * validated.height,
            format: isRGB ? 'RGB' : 'RGBA',
            dataSize: validated.data.length,
            bytesPerPixel: isRGB ? 3 : 4,
            memoryUsage: validated.data.byteLength
        };
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
        let finalStrokeColor = color.withGlobalAlpha(this._currentOp.globalAlpha);
        
        // Sub-pixel stroke rendering: apply opacity adjustment for strokes <= 1px
        let adjustedStrokeProps = strokeProps;
        if (strokeProps.lineWidth <= 1.0) {
            // Zero-width strokes: render at full opacity like HTML5Canvas (browsers render at minimum visible width)
            // Sub-pixel strokes: render with proportional opacity
            const subPixelOpacity = strokeProps.lineWidth === 0 ? 1.0 : strokeProps.lineWidth; // 0px = 100% opacity, 0.5px = 50% opacity
            const adjustedAlpha = Math.round(finalStrokeColor.a * subPixelOpacity);
            finalStrokeColor = new Color(finalStrokeColor.r, finalStrokeColor.g, finalStrokeColor.b, adjustedAlpha, finalStrokeColor.premultiplied);
            
            // Render all sub-pixel strokes (including zero-width) at 1px width with adjusted opacity
            adjustedStrokeProps = { ...strokeProps, lineWidth: 1.0 };
        }
        
        // Generate stroke polygons using geometric approach
        const strokePolygons = StrokeGenerator.generateStrokePolygons(path, adjustedStrokeProps);
        
        // Fill stroke polygons with current transform and stencil clipping
        PolygonFiller.fillPolygons(this._surface, strokePolygons, finalStrokeColor, 'nonzero', this._currentOp.transform, this._currentOp.clipMask);
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
            fillStyle: this._fillStyle.slice(),
            strokeStyle: this._strokeStyle.slice(),
            clipMask: clipMaskCopy,   // Deep copy of clip mask
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
        clipMask: this.clipMask
    });
    
    // Delegate to rasterizer
    this.rasterizer.drawImage.apply(this.rasterizer, arguments);
    
    // End rasterizer operation
    this.rasterizer.endOp();
    }
}
// Backward compatibility factory functions and aliases
function SurfaceFactory(width, height) {
    return new Surface(width, height);
}

// Legacy alias for Transform2D
const Matrix = Transform2D;

// Legacy encodeBMP function
function encodeBMP(surface) {
    return BitmapEncoder.encode(surface);
}


// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // Core API (public)
        Surface: SurfaceFactory,
        Transform2D: Transform2D,
        Matrix: Matrix, // Legacy alias for Transform2D
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // Core API (public)
        Surface: SurfaceFactory,
        Transform2D: Transform2D,
        Matrix: Matrix, // Legacy alias for Transform2D
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
}

})();
