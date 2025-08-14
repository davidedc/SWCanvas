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

