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