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