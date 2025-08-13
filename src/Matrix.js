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
