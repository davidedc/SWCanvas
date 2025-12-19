/**
 * SWCanvas Compatibility Polyfill for HTML5 Canvas
 *
 * This file adds SWCanvas-specific convenience methods to the native
 * CanvasRenderingContext2D prototype, enabling code that uses these
 * methods to work with both SWCanvas and native HTML5 Canvas.
 *
 * Usage:
 *   <script src="swcanvas-compat-polyfill.js"></script>
 *
 * After loading, native Canvas contexts will have these additional methods:
 *   - fillCircle(cx, cy, radius)
 *   - strokeCircle(cx, cy, radius)
 *   - fillStrokeCircle(cx, cy, radius)
 *   - strokeLine(x1, y1, x2, y2)
 *   - fillRoundRect(x, y, width, height, radii)
 *   - strokeRoundRect(x, y, width, height, radii)
 *   - fillStrokeRoundRect(x, y, width, height, radii)
 *   - fillStrokeRect(x, y, width, height)
 *   - fillArc(cx, cy, radius, startAngle, endAngle, anticlockwise)
 *   - outerStrokeArc(cx, cy, radius, startAngle, endAngle, anticlockwise)
 *   - fillOuterStrokeArc(cx, cy, radius, startAngle, endAngle, anticlockwise)
 *
 * Note: This file is a no-op in Node.js where CanvasRenderingContext2D doesn't exist.
 */

(function installSWCanvasCompatPolyfills() {
    'use strict';

    // Only run in browser environment
    if (typeof CanvasRenderingContext2D === 'undefined') {
        return;
    }

    const proto = CanvasRenderingContext2D.prototype;

    // ===== CIRCLE METHODS =====

    if (!proto.fillCircle) {
        proto.fillCircle = function (cx, cy, radius) {
            this.beginPath();
            this.arc(cx, cy, radius, 0, Math.PI * 2);
            this.fill();
        };
    }

    if (!proto.strokeCircle) {
        proto.strokeCircle = function (cx, cy, radius) {
            this.beginPath();
            this.arc(cx, cy, radius, 0, Math.PI * 2);
            this.stroke();
        };
    }

    if (!proto.fillStrokeCircle) {
        proto.fillStrokeCircle = function (cx, cy, radius) {
            this.beginPath();
            this.arc(cx, cy, radius, 0, Math.PI * 2);
            this.fill();
            this.stroke();
        };
    }

    // ===== LINE METHODS =====

    if (!proto.strokeLine) {
        proto.strokeLine = function (x1, y1, x2, y2) {
            this.beginPath();
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.stroke();
        };
    }

    // ===== RECTANGLE METHODS =====

    if (!proto.fillStrokeRect) {
        proto.fillStrokeRect = function (x, y, width, height) {
            this.fillRect(x, y, width, height);
            this.strokeRect(x, y, width, height);
        };
    }

    // ===== ROUNDED RECTANGLE METHODS =====

    if (!proto.fillRoundRect) {
        proto.fillRoundRect = function (x, y, width, height, radii) {
            this.beginPath();
            this.roundRect(x, y, width, height, radii);
            this.fill();
        };
    }

    if (!proto.strokeRoundRect) {
        proto.strokeRoundRect = function (x, y, width, height, radii) {
            this.beginPath();
            this.roundRect(x, y, width, height, radii);
            this.stroke();
        };
    }

    if (!proto.fillStrokeRoundRect) {
        proto.fillStrokeRoundRect = function (x, y, width, height, radii) {
            this.beginPath();
            this.roundRect(x, y, width, height, radii);
            this.fill();
            this.stroke();
        };
    }

    // ===== ARC METHODS =====

    if (!proto.fillArc) {
        proto.fillArc = function (cx, cy, radius, startAngle, endAngle, anticlockwise) {
            if (anticlockwise === undefined) anticlockwise = false;
            this.beginPath();
            this.moveTo(cx, cy);
            this.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
            this.closePath();
            this.fill();
        };
    }

    if (!proto.outerStrokeArc) {
        proto.outerStrokeArc = function (cx, cy, radius, startAngle, endAngle, anticlockwise) {
            if (anticlockwise === undefined) anticlockwise = false;
            this.beginPath();
            this.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
            this.stroke();
        };
    }

    if (!proto.fillOuterStrokeArc) {
        proto.fillOuterStrokeArc = function (cx, cy, radius, startAngle, endAngle, anticlockwise) {
            if (anticlockwise === undefined) anticlockwise = false;
            // Fill the pie slice
            this.beginPath();
            this.moveTo(cx, cy);
            this.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
            this.closePath();
            this.fill();

            // Stroke only the outer arc
            this.beginPath();
            this.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
            this.stroke();
        };
    }

})();
