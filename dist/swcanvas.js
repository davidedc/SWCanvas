(function() {
'use strict';

function Matrix(init) {
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

Matrix.prototype.multiply = function(other) {
    const result = new Matrix();
    result.a = this.a * other.a + this.b * other.c;
    result.b = this.a * other.b + this.b * other.d;
    result.c = this.c * other.a + this.d * other.c;
    result.d = this.c * other.b + this.d * other.d;
    result.e = this.e * other.a + this.f * other.c + other.e;
    result.f = this.e * other.b + this.f * other.d + other.f;
    return result;
};

Matrix.prototype.translate = function(x, y) {
    const t = new Matrix([1, 0, 0, 1, x, y]);
    return this.multiply(t);
};

Matrix.prototype.scale = function(sx, sy) {
    const s = new Matrix([sx, 0, 0, sy, 0, 0]);
    return this.multiply(s);
};

Matrix.prototype.rotate = function(angleInRadians) {
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);
    const r = new Matrix([cos, sin, -sin, cos, 0, 0]);
    return this.multiply(r);
};

Matrix.prototype.invert = function() {
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
};

Matrix.prototype.transformPoint = function(point) {
    return {
        x: this.a * point.x + this.c * point.y + this.e,
        y: this.b * point.x + this.d * point.y + this.f
    };
};
function Path2D() {
    this.commands = [];
}

Path2D.prototype.closePath = function() {
    this.commands.push({type: 'closePath'});
};

Path2D.prototype.moveTo = function(x, y) {
    this.commands.push({type: 'moveTo', x: x, y: y});
};

Path2D.prototype.lineTo = function(x, y) {
    this.commands.push({type: 'lineTo', x: x, y: y});
};

Path2D.prototype.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.commands.push({
        type: 'bezierCurveTo',
        cp1x: cp1x, cp1y: cp1y,
        cp2x: cp2x, cp2y: cp2y,
        x: x, y: y
    });
};

Path2D.prototype.quadraticCurveTo = function(cpx, cpy, x, y) {
    this.commands.push({
        type: 'quadraticCurveTo',
        cpx: cpx, cpy: cpy,
        x: x, y: y
    });
};

Path2D.prototype.rect = function(x, y, w, h) {
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
};

Path2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
    this.commands.push({
        type: 'arc',
        x: x, y: y,
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle,
        counterclockwise: !!counterclockwise
    });
};

Path2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
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
};
function createSurface(width, height) {
    if (width <= 0 || height <= 0) {
        throw new Error('Surface dimensions must be positive');
    }
    
    if (width * height > 268435456) { // 16384 * 16384
        throw new Error('SurfaceTooLarge');
    }
    
    const stride = width * 4;
    const data = new Uint8ClampedArray(stride * height);
    
    return {
        width: width,
        height: height,
        stride: stride,
        data: data
    };
}

function Surface(width, height) {
    return createSurface(width, height);
}
function encodeBMP(surface) {
    const width = surface.width;
    const height = surface.height;
    const data = surface.data;
    
    // BMP row padding (each row must be aligned to 4-byte boundary)
    const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
    const imageSize = rowSize * height;
    const fileSize = 54 + imageSize; // 54 = BMP header size
    
    // Create output buffer
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    
    // BMP File Header (14 bytes)
    bytes[0] = 0x42; // 'B'
    bytes[1] = 0x4D; // 'M'
    view.setUint32(2, fileSize, true); // File size
    view.setUint32(6, 0, true); // Reserved
    view.setUint32(10, 54, true); // Pixel data offset
    
    // BMP Info Header (40 bytes)
    view.setUint32(14, 40, true); // Header size
    view.setInt32(18, width, true); // Width
    view.setInt32(22, -height, true); // Height (negative for top-down)
    view.setUint16(26, 1, true); // Planes
    view.setUint16(28, 24, true); // Bits per pixel
    view.setUint32(30, 0, true); // Compression
    view.setUint32(34, imageSize, true); // Image size
    view.setInt32(38, 2835, true); // X pixels per meter (~72 DPI)
    view.setInt32(42, 2835, true); // Y pixels per meter (~72 DPI)
    view.setUint32(46, 0, true); // Colors in palette
    view.setUint32(50, 0, true); // Important colors
    
    // Convert RGBA to BGR and write pixel data
    let pixelOffset = 54;
    for (let y = 0; y < height; y++) {
        let rowOffset = pixelOffset;
        for (let x = 0; x < width; x++) {
            const srcOffset = (y * surface.stride) + (x * 4);
            
            // Get RGBA values (premultiplied)
            const r = data[srcOffset];
            const g = data[srcOffset + 1];
            const b = data[srcOffset + 2];
            const a = data[srcOffset + 3];
            
            // Un-premultiply and convert to RGB
            let finalR, finalG, finalB;
            if (a === 0) {
                finalR = finalG = finalB = 0;
            } else if (a === 255) {
                finalR = r;
                finalG = g;
                finalB = b;
            } else {
                // Un-premultiply: color_unpremult = color_premult * 255 / alpha
                finalR = Math.round((r * 255) / a);
                finalG = Math.round((g * 255) / a);
                finalB = Math.round((b * 255) / a);
            }
            
            // BMP stores as BGR
            bytes[rowOffset] = finalB;
            bytes[rowOffset + 1] = finalG;
            bytes[rowOffset + 2] = finalR;
            rowOffset += 3;
        }
        
        // Apply row padding
        while ((rowOffset - pixelOffset) < rowSize) {
            bytes[rowOffset] = 0;
            rowOffset++;
        }
        
        pixelOffset += rowSize;
    }
    
    return buffer;
}
// Path flattening utilities for converting curves to line segments
// Implements deterministic curve flattening with 0.25px tolerance

// Flatten a Path2D into a list of polygons (each polygon is an array of {x, y} points)
function flattenPath(path2d) {
    const polygons = [];
    let currentPoly = [];
    let currentPoint = {x: 0, y: 0};
    let subpathStart = {x: 0, y: 0};
    
    for (const cmd of path2d.commands) {
        switch (cmd.type) {
            case 'moveTo':
                // Start new subpath
                if (currentPoly.length > 0) {
                    polygons.push(currentPoly);
                }
                currentPoly = [];
                currentPoint = {x: cmd.x, y: cmd.y};
                subpathStart = {x: cmd.x, y: cmd.y};
                currentPoly.push(currentPoint);
                break;
                
            case 'lineTo':
                currentPoint = {x: cmd.x, y: cmd.y};
                currentPoly.push(currentPoint);
                break;
                
            case 'closePath':
                if (currentPoly.length > 0) {
                    // Close the polygon by adding the start point if not already there
                    const last = currentPoly[currentPoly.length - 1];
                    if (last.x !== subpathStart.x || last.y !== subpathStart.y) {
                        currentPoly.push({x: subpathStart.x, y: subpathStart.y});
                    }
                    polygons.push(currentPoly);
                    currentPoly = [];
                }
                break;
                
            case 'quadraticCurveTo':
                const quadPoints = flattenQuadraticBezier(
                    currentPoint.x, currentPoint.y,
                    cmd.cpx, cmd.cpy,
                    cmd.x, cmd.y
                );
                // Add all points except the first (which is currentPoint)
                for (let i = 1; i < quadPoints.length; i++) {
                    currentPoly.push(quadPoints[i]);
                }
                currentPoint = {x: cmd.x, y: cmd.y};
                break;
                
            case 'bezierCurveTo':
                const cubicPoints = flattenCubicBezier(
                    currentPoint.x, currentPoint.y,
                    cmd.cp1x, cmd.cp1y,
                    cmd.cp2x, cmd.cp2y,
                    cmd.x, cmd.y
                );
                // Add all points except the first (which is currentPoint)
                for (let i = 1; i < cubicPoints.length; i++) {
                    currentPoly.push(cubicPoints[i]);
                }
                currentPoint = {x: cmd.x, y: cmd.y};
                break;
                
            case 'arc':
                const arcPoints = flattenArc(
                    cmd.x, cmd.y, cmd.radius,
                    cmd.startAngle, cmd.endAngle,
                    cmd.counterclockwise
                );
                if (arcPoints.length > 0) {
                    // Move to arc start if we're not already there
                    const arcStart = arcPoints[0];
                    const distance = Math.sqrt((currentPoint.x - arcStart.x) ** 2 + (currentPoint.y - arcStart.y) ** 2);
                    if (distance > 0.01) {  // Add line to arc start if not already there
                        currentPoly.push(arcStart);
                    }
                    // Add all arc points except the first
                    for (let i = 1; i < arcPoints.length; i++) {
                        currentPoly.push(arcPoints[i]);
                    }
                    currentPoint = arcPoints[arcPoints.length - 1];
                }
                break;
                
            case 'ellipse':
                const ellipsePoints = flattenEllipse(
                    cmd.x, cmd.y, cmd.radiusX, cmd.radiusY, cmd.rotation,
                    cmd.startAngle, cmd.endAngle, cmd.counterclockwise
                );
                if (ellipsePoints.length > 0) {
                    // Move to ellipse start if we're not already there
                    const ellipseStart = ellipsePoints[0];
                    const distance = Math.sqrt((currentPoint.x - ellipseStart.x) ** 2 + (currentPoint.y - ellipseStart.y) ** 2);
                    if (distance > 0.01) {  // Add line to ellipse start if not already there
                        currentPoly.push(ellipseStart);
                    }
                    // Add all ellipse points except the first
                    for (let i = 1; i < ellipsePoints.length; i++) {
                        currentPoly.push(ellipsePoints[i]);
                    }
                    currentPoint = ellipsePoints[ellipsePoints.length - 1];
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

// Flatten quadratic Bézier curve with 0.25px tolerance
function flattenQuadraticBezier(x0, y0, x1, y1, x2, y2) {
    const points = [{x: x0, y: y0}];
    flattenQuadraticBezierRecursive(x0, y0, x1, y1, x2, y2, points, 0.25);
    return points;
}

function flattenQuadraticBezierRecursive(x0, y0, x1, y1, x2, y2, points, tolerance) {
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
    flattenQuadraticBezierRecursive(x0, y0, x01, y01, x012, y012, points, tolerance);
    flattenQuadraticBezierRecursive(x012, y012, x12, y12, x2, y2, points, tolerance);
}

// Flatten cubic Bézier curve with 0.25px tolerance  
function flattenCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
    const points = [{x: x0, y: y0}];
    flattenCubicBezierRecursive(x0, y0, x1, y1, x2, y2, x3, y3, points, 0.25);
    return points;
}

function flattenCubicBezierRecursive(x0, y0, x1, y1, x2, y2, x3, y3, points, tolerance) {
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
    flattenCubicBezierRecursive(x0, y0, x01, y01, x012, y012, x0123, y0123, points, tolerance);
    flattenCubicBezierRecursive(x0123, y0123, x123, y123, x23, y23, x3, y3, points, tolerance);
}

// Flatten arc to line segments
function flattenArc(cx, cy, radius, startAngle, endAngle, counterclockwise) {
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
    
    // Calculate number of segments needed for 0.25px tolerance
    // Use the formula: segments = ceil(totalAngle / (2 * acos(1 - tolerance/radius)))
    const tolerance = 0.25;
    const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - tolerance / radius));
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

// Flatten ellipse to line segments
function flattenEllipse(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
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
    const tolerance = 0.25;
    const maxAngleStep = 2 * Math.acos(Math.max(0, 1 - tolerance / minRadius));
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
// Polygon filling implementation with nonzero and evenodd winding rules
// Uses scanline algorithm for efficient aliased filling

// Fill polygons using scanline algorithm with specified winding rule
function fillPolygons(surface, polygons, color, fillRule, transform) {
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
    
    // Clamp to surface bounds
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(surface.height - 1, Math.ceil(maxY));
    
    // Process each scanline
    for (let y = minY; y <= maxY; y++) {
        const intersections = [];
        
        // Find all intersections with this scanline
        for (const poly of transformedPolygons) {
            findPolygonIntersections(poly, y + 0.5, intersections); // Use pixel center
        }
        
        // Sort intersections by x coordinate
        intersections.sort((a, b) => a.x - b.x);
        
        // Fill spans based on winding rule
        fillScanlineSpans(surface, y, intersections, color, fillRule);
    }
}

// Find intersections between a polygon and a horizontal scanline
function findPolygonIntersections(polygon, y, intersections) {
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

// Fill spans on a scanline based on winding rule
function fillScanlineSpans(surface, y, intersections, color, fillRule) {
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
            const endX = Math.min(surface.width - 1, Math.floor(nextIntersection.x));
            
            for (let x = startX; x <= endX; x++) {
                const offset = y * surface.stride + x * 4;
                
                // Simple copy for now (will be enhanced with proper blending later)
                surface.data[offset] = color[0];     // R
                surface.data[offset + 1] = color[1]; // G  
                surface.data[offset + 2] = color[2]; // B
                surface.data[offset + 3] = color[3]; // A
            }
        }
    }
}

// Test if a point is inside polygons using winding rule
function pointInPolygons(x, y, polygons, fillRule) {
    let windingNumber = 0;
    
    for (const polygon of polygons) {
        windingNumber += pointInPolygon(x, y, polygon);
    }
    
    if (fillRule === 'evenodd') {
        return (windingNumber % 2) !== 0;
    } else { // nonzero
        return windingNumber !== 0;
    }
}

// Calculate winding number for a point relative to a polygon
function pointInPolygon(x, y, polygon) {
    let winding = 0;
    
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        if (p1.y <= y) {
            if (p2.y > y) { // Upward crossing
                if (isLeft(p1, p2, {x, y}) > 0) {
                    winding++;
                }
            }
        } else {
            if (p2.y <= y) { // Downward crossing
                if (isLeft(p1, p2, {x, y}) < 0) {
                    winding--;
                }
            }
        }
    }
    
    return winding;
}

// Test if point P2 is left of the line P0P1
function isLeft(P0, P1, P2) {
    return ((P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y));
}
// Basic polygon clipping implementation
// For M2, we implement simple clipping by intersection

// Clip subject polygons by clip polygons 
function clipPolygonsByPolygons(subjectPolygons, clipPolygons, clipRule) {
    if (clipPolygons.length === 0) return subjectPolygons;
    
    let result = [];
    
    // For each subject polygon, test if it should be included
    for (const subjectPoly of subjectPolygons) {
        const clippedPoly = clipPolygonByPolygons(subjectPoly, clipPolygons, clipRule);
        if (clippedPoly && clippedPoly.length > 0) {
            result.push(clippedPoly);
        }
    }
    
    return result;
}

// Clip a single polygon by multiple clip polygons
function clipPolygonByPolygons(polygon, clipPolygons, clipRule) {
    // For M2, we use a simple approach: test each vertex of the subject polygon
    // and only include vertices that are inside the clip region
    
    const clippedVertices = [];
    
    for (const vertex of polygon) {
        if (pointInPolygons(vertex.x, vertex.y, clipPolygons, clipRule)) {
            clippedVertices.push(vertex);
        }
    }
    
    // If we have at least 3 vertices, we have a valid polygon
    if (clippedVertices.length >= 3) {
        return clippedVertices;
    }
    
    return null;
}

// Note: This is a very basic clipping implementation for M2.
// A full implementation would use Sutherland-Hodgman clipping or similar
// to properly handle edge intersections, but for M2 this simple approach
// will work for basic clip testing.
// Geometric stroke generation implementation
// Converts paths into filled polygons representing stroke geometry

// Generate stroke polygons for a path with given stroke properties
function generateStrokePolygons(path, strokeProps) {
    const { lineWidth, lineJoin, lineCap, miterLimit } = strokeProps;
    
    if (lineWidth <= 0) return [];
    
    // Flatten path to get line segments
    const pathPolygons = flattenPath(path);
    const strokePolygons = [];
    
    for (const polygon of pathPolygons) {
        if (polygon.length < 2) continue;
        
        const strokeParts = generateStrokeForPolygon(polygon, lineWidth, lineJoin, lineCap, miterLimit);
        strokePolygons.push(...strokeParts);
    }
    
    return strokePolygons;
}

// Generate stroke geometry for a single polygon (subpath)
function generateStrokeForPolygon(points, lineWidth, lineJoin, lineCap, miterLimit) {
    if (points.length < 2) return [];
    
    const strokeParts = [];
    const halfWidth = lineWidth / 2;
    
    // Determine if this is a closed path
    const isClosed = points.length > 2 && 
                     Math.abs(points[0].x - points[points.length - 1].x) < 1e-10 &&
                     Math.abs(points[0].y - points[points.length - 1].y) < 1e-10;
    
    // Generate segment bodies
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Skip zero-length segments
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length < 1e-10) continue;
        
        const segment = generateSegmentBody(p1, p2, halfWidth);
        segments.push({
            body: segment,
            p1, p2,
            tangent: { x: dx / length, y: dy / length },
            normal: { x: -dy / length, y: dx / length },
            length
        });
    }
    
    if (segments.length === 0) return [];
    
    // Add segment bodies to stroke parts
    for (const segment of segments) {
        strokeParts.push(segment.body);
    }
    
    // Generate joins
    for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i];
        const seg2 = segments[i + 1];
        const joinPolygons = generateJoin(seg1, seg2, lineJoin, miterLimit);
        strokeParts.push(...joinPolygons);
    }
    
    // Handle closed path joining
    if (isClosed && segments.length > 1) {
        const lastSeg = segments[segments.length - 1];
        const firstSeg = segments[0];
        const joinPolygons = generateJoin(lastSeg, firstSeg, lineJoin, miterLimit);
        strokeParts.push(...joinPolygons);
    }
    
    // Generate caps for open paths
    if (!isClosed && segments.length > 0) {
        // Start cap
        const startCaps = generateCap(segments[0].p1, segments[0].tangent, halfWidth, lineCap, true);
        if (startCaps) {
            if (Array.isArray(startCaps[0])) {
                // Multiple triangles (round cap)
                strokeParts.push(...startCaps);
            } else {
                // Single polygon (square cap)
                strokeParts.push(startCaps);
            }
        }
        
        // End cap
        const lastSeg = segments[segments.length - 1];
        const endCaps = generateCap(lastSeg.p2, lastSeg.tangent, halfWidth, lineCap, false);
        if (endCaps) {
            if (Array.isArray(endCaps[0])) {
                // Multiple triangles (round cap)
                strokeParts.push(...endCaps);
            } else {
                // Single polygon (square cap)
                strokeParts.push(endCaps);
            }
        }
    }
    
    return strokeParts;
}

// Generate rectangular body for a single segment
function generateSegmentBody(p1, p2, halfWidth) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 1e-10) return [];
    
    // Unit tangent and normal vectors
    const tx = dx / length;
    const ty = dy / length;
    const nx = -ty;  // Normal is perpendicular to tangent
    const ny = tx;
    
    // Four corners of the rectangle
    return [
        { x: p1.x + nx * halfWidth, y: p1.y + ny * halfWidth },
        { x: p2.x + nx * halfWidth, y: p2.y + ny * halfWidth },
        { x: p2.x - nx * halfWidth, y: p2.y - ny * halfWidth },
        { x: p1.x - nx * halfWidth, y: p1.y - ny * halfWidth }
    ];
}

// Generate join geometry between two segments
function generateJoin(seg1, seg2, lineJoin, miterLimit) {
    const joinPoint = seg2.p1; // Connection point
    
    // Calculate angle between segments
    const dot = seg1.tangent.x * seg2.tangent.x + seg1.tangent.y * seg2.tangent.y;
    const cross = seg1.tangent.x * seg2.tangent.y - seg1.tangent.y * seg2.tangent.x;
    
    // Check for 180-degree turn (parallel segments)
    if (Math.abs(cross) < 1e-10) {
        // Parallel segments - use bevel join
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Determine if this is a convex or concave turn
    const isConvex = cross > 0;
    
    if (!isConvex) {
        // Concave turn - no join needed (segments naturally overlap)
        return [];
    }
    
    // Convex turn - generate appropriate join
    switch (lineJoin) {
        case 'miter':
            return generateMiterJoin(seg1, seg2, joinPoint, miterLimit);
        case 'round':
            return generateRoundJoin(seg1, seg2, joinPoint);
        case 'bevel':
        default:
            return generateBevelJoin(seg1, seg2, joinPoint);
    }
}

// Generate miter join with miter limit checking
function generateMiterJoin(seg1, seg2, joinPoint, miterLimit) {
    // Calculate half width from segment body
    const halfWidth = Math.sqrt(
        Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
        Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
    ) / 2;
    
    // Get outer edge points - seg1 end (right) and seg2 start (left)  
    const outer1 = seg1.body[1]; // End right side of seg1
    const outer2 = seg2.body[0]; // Start left side of seg2
    
    // Calculate miter point (intersection of extended outer edges)
    // Extend seg1's right edge forward
    const seg1Extended = {
        x: outer1.x + seg1.tangent.x * 100, 
        y: outer1.y + seg1.tangent.y * 100
    };
    // Extend seg2's left edge backward  
    const seg2Extended = {
        x: outer2.x - seg2.tangent.x * 100,
        y: outer2.y - seg2.tangent.y * 100
    };
    
    const miterPoint = lineIntersection(outer1, seg1Extended, outer2, seg2Extended);
    
    if (!miterPoint) {
        // Fallback to bevel if no intersection
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Check miter limit
    const miterLength = Math.sqrt(
        Math.pow(miterPoint.x - joinPoint.x, 2) + 
        Math.pow(miterPoint.y - joinPoint.y, 2)
    );
    const miterRatio = miterLength / halfWidth;
    
    if (miterRatio > miterLimit) {
        // Exceeds miter limit - use bevel
        return generateBevelJoin(seg1, seg2, joinPoint);
    }
    
    // Create miter triangle
    return [
        [outer1, miterPoint, outer2]
    ];
}

// Generate bevel join
function generateBevelJoin(seg1, seg2, joinPoint) {
    const outer1 = seg1.body[1]; // Right side of seg1
    const outer2 = seg2.body[0]; // Right side of seg2
    
    return [
        [outer1, outer2, joinPoint]
    ];
}

// Generate round join
function generateRoundJoin(seg1, seg2, joinPoint) {
    const halfWidth = Math.sqrt(
        Math.pow(seg1.body[0].x - seg1.body[3].x, 2) + 
        Math.pow(seg1.body[0].y - seg1.body[3].y, 2)
    ) / 2;
    
    const outer1 = seg1.body[1]; // End right side of seg1  
    const outer2 = seg2.body[0]; // Start left side of seg2
    
    // Calculate angles
    const angle1 = Math.atan2(outer1.y - joinPoint.y, outer1.x - joinPoint.x);
    const angle2 = Math.atan2(outer2.y - joinPoint.y, outer2.x - joinPoint.x);
    
    let startAngle = angle1;
    let endAngle = angle2;
    
    // Normalize angles to go the correct way around
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
        
        triangles.push([joinPoint, p1, p2]);
    }
    
    return triangles;
}

// Generate cap geometry
function generateCap(point, tangent, halfWidth, lineCap, isStart) {
    const normal = { x: -tangent.y, y: tangent.x };
    
    switch (lineCap) {
        case 'square':
            // Extend by halfWidth in tangent direction
            const extension = isStart ? 
                { x: point.x - tangent.x * halfWidth, y: point.y - tangent.y * halfWidth } :
                { x: point.x + tangent.x * halfWidth, y: point.y + tangent.y * halfWidth };
            
            return [
                { x: extension.x + normal.x * halfWidth, y: extension.y + normal.y * halfWidth },
                { x: extension.x - normal.x * halfWidth, y: extension.y - normal.y * halfWidth },
                { x: point.x - normal.x * halfWidth, y: point.y - normal.y * halfWidth },
                { x: point.x + normal.x * halfWidth, y: point.y + normal.y * halfWidth }
            ];
            
        case 'round':
            // Generate semicircle
            const startAngle = Math.atan2(normal.y, normal.x);
            const segments = Math.max(4, Math.ceil(Math.PI / (Math.PI / 4))); // At least 4 segments for semicircle
            const angleStep = Math.PI / segments;
            
            const triangles = [];
            for (let i = 0; i < segments; i++) {
                const a1 = startAngle + i * angleStep * (isStart ? 1 : -1);
                const a2 = startAngle + (i + 1) * angleStep * (isStart ? 1 : -1);
                
                const p1 = {
                    x: point.x + halfWidth * Math.cos(a1),
                    y: point.y + halfWidth * Math.sin(a1)
                };
                const p2 = {
                    x: point.x + halfWidth * Math.cos(a2),
                    y: point.y + halfWidth * Math.sin(a2)
                };
                
                triangles.push([point, p1, p2]);
            }
            
            // Return multiple triangles as separate polygons (consistent with joins)
            return triangles;
            
        case 'butt':
        default:
            // No cap - stroke ends flush
            return null;
    }
}

// Calculate intersection of two lines defined by points
function lineIntersection(p1, p2, p3, p4) {
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
function Rasterizer(surface) {
    this.surface = surface;
    this.currentOp = null;
}

Rasterizer.prototype.beginOp = function(params) {
    this.currentOp = {
        composite: params.composite || 'source-over',
        globalAlpha: params.globalAlpha !== undefined ? params.globalAlpha : 1.0,
        transform: params.transform || new Matrix(),
        clipPath: params.clipPath || null,
        fillStyle: params.fillStyle || null,
        strokeStyle: params.strokeStyle || null
    };
};

Rasterizer.prototype.endOp = function() {
    this.currentOp = null;
};

// Simple solid rectangle fill for M1
Rasterizer.prototype.fillRect = function(x, y, width, height, color) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
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
    
    // For M1, we'll do axis-aligned rectangles only (no rotation support yet)
    if (this.currentOp.transform.b === 0 && this.currentOp.transform.c === 0) {
        this._fillAxisAlignedRect(minX, minY, maxX - minX + 1, maxY - minY + 1, color);
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
    
    // Apply global alpha to fill color, then premultiply (same as fillRect)
    const color = this.currentOp.fillStyle || [0, 0, 0, 255];
    const globalAlpha = this.currentOp.globalAlpha;
    const effectiveAlpha = (color[3] / 255) * globalAlpha;
    const srcA = Math.round(effectiveAlpha * 255);
    const srcR = Math.round(color[0] * effectiveAlpha);
    const srcG = Math.round(color[1] * effectiveAlpha);
    const srcB = Math.round(color[2] * effectiveAlpha);
    
    const fillColor = [srcR, srcG, srcB, srcA];
    const fillRule = rule || 'nonzero';
    
    // Flatten path to polygons
    const polygons = flattenPath(path);
    
    // Fill polygons with current transform and clipping
    if (this.currentOp.clipPath) {
        // With clipping - clip polygons first, then fill
        const clipPolygons = flattenPath(this.currentOp.clipPath);
        const clippedPolygons = clipPolygonsByPolygons(polygons, clipPolygons, 'nonzero');
        fillPolygons(this.surface, clippedPolygons, fillColor, fillRule, this.currentOp.transform);
    } else {
        // No clipping - direct fill
        fillPolygons(this.surface, polygons, fillColor, fillRule, this.currentOp.transform);
    }
};

Rasterizer.prototype.stroke = function(path, strokeProps) {
    if (!this.currentOp) {
        throw new Error('Must call beginOp before drawing operations');
    }
    
    // Apply global alpha to stroke color, then premultiply
    const color = this.currentOp.strokeStyle || [0, 0, 0, 255];
    const globalAlpha = this.currentOp.globalAlpha;
    const effectiveAlpha = (color[3] / 255) * globalAlpha;
    const srcA = Math.round(effectiveAlpha * 255);
    const srcR = Math.round(color[0] * effectiveAlpha);
    const srcG = Math.round(color[1] * effectiveAlpha);
    const srcB = Math.round(color[2] * effectiveAlpha);
    
    const strokeColor = [srcR, srcG, srcB, srcA];
    
    // Generate stroke polygons using geometric approach
    const strokePolygons = generateStrokePolygons(path, strokeProps);
    
    // Fill stroke polygons with current transform and clipping
    if (this.currentOp.clipPath) {
        // With clipping - clip polygons first, then fill
        const clipPolygons = flattenPath(this.currentOp.clipPath);
        const clippedPolygons = clipPolygonsByPolygons(strokePolygons, clipPolygons, 'nonzero');
        fillPolygons(this.surface, clippedPolygons, strokeColor, 'nonzero', this.currentOp.transform);
    } else {
        // No clipping - direct fill
        fillPolygons(this.surface, strokePolygons, strokeColor, 'nonzero', this.currentOp.transform);
    }
};

Rasterizer.prototype.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    throw new Error('Image drawing not implemented in M1');
};
function Context2D(surface) {
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
    this._clipPath = null;
}

// State management
Context2D.prototype.save = function() {
    this.stateStack.push({
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        transform: new Matrix([this._transform.a, this._transform.b, this._transform.c, 
                              this._transform.d, this._transform.e, this._transform.f]),
        fillStyle: this._fillStyle.slice(),
        strokeStyle: this._strokeStyle.slice(),
        clipPath: this._clipPath, // Note: shallow copy for M2, should be deep copy in full implementation
        lineWidth: this.lineWidth,
        lineJoin: this.lineJoin,
        lineCap: this.lineCap,
        miterLimit: this.miterLimit
    });
};

Context2D.prototype.restore = function() {
    if (this.stateStack.length === 0) return;
    
    const state = this.stateStack.pop();
    this.globalAlpha = state.globalAlpha;
    this.globalCompositeOperation = state.globalCompositeOperation;
    this._transform = state.transform;
    this._fillStyle = state.fillStyle;
    this._strokeStyle = state.strokeStyle;
    this._clipPath = state.clipPath;
    this.lineWidth = state.lineWidth;
    this.lineJoin = state.lineJoin;
    this.lineCap = state.lineCap;
    this.miterLimit = state.miterLimit;
};

// Transform methods
Context2D.prototype.transform = function(a, b, c, d, e, f) {
    const m = new Matrix([a, b, c, d, e, f]);
    this._transform = this._transform.multiply(m);
};

Context2D.prototype.setTransform = function(a, b, c, d, e, f) {
    this._transform = new Matrix([a, b, c, d, e, f]);
};

Context2D.prototype.resetTransform = function() {
    this._transform = new Matrix();
};

// Style setters (simplified for M1)
Context2D.prototype.setFillStyle = function(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form
    this._fillStyle = [r, g, b, a];
};

Context2D.prototype.setStrokeStyle = function(r, g, b, a) {
    a = a !== undefined ? a : 255;
    // Store colors in non-premultiplied form  
    this._strokeStyle = [r, g, b, a];
};

// Path methods (delegated to internal path)
Context2D.prototype.beginPath = function() {
    this._currentPath = new Path2D();
};

Context2D.prototype.closePath = function() {
    this._currentPath.closePath();
};

Context2D.prototype.moveTo = function(x, y) {
    this._currentPath.moveTo(x, y);
};

Context2D.prototype.lineTo = function(x, y) {
    this._currentPath.lineTo(x, y);
};

Context2D.prototype.rect = function(x, y, w, h) {
    this._currentPath.rect(x, y, w, h);
};

Context2D.prototype.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
    this._currentPath.arc(x, y, radius, startAngle, endAngle, counterclockwise);
};

Context2D.prototype.quadraticCurveTo = function(cpx, cpy, x, y) {
    this._currentPath.quadraticCurveTo(cpx, cpy, x, y);
};

Context2D.prototype.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
};

// Drawing methods - simplified for M1 (only rectangles)
Context2D.prototype.fillRect = function(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform
    });
    
    this.rasterizer.fillRect(x, y, width, height, this._fillStyle);
    this.rasterizer.endOp();
};

Context2D.prototype.strokeRect = function(x, y, width, height) {
    throw new Error('strokeRect not implemented in M1');
};

Context2D.prototype.clearRect = function(x, y, width, height) {
    this.rasterizer.beginOp({
        composite: 'copy',
        globalAlpha: 1.0,
        transform: this._transform
    });
    
    this.rasterizer.fillRect(x, y, width, height, [0, 0, 0, 0]); // Transparent
    this.rasterizer.endOp();
};

// M2: Path drawing methods
Context2D.prototype.fill = function(path, rule) {
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
        clipPath: this._clipPath,
        fillStyle: this._fillStyle
    });
    
    this.rasterizer.fill(pathToFill, fillRule);
    this.rasterizer.endOp();
};

Context2D.prototype.stroke = function(path) {
    // Use specified path or current internal path
    const pathToStroke = path || this._currentPath;
    
    this.rasterizer.beginOp({
        composite: this.globalCompositeOperation,
        globalAlpha: this.globalAlpha,
        transform: this._transform,
        clipPath: this._clipPath,
        strokeStyle: this._strokeStyle
    });
    
    this.rasterizer.stroke(pathToStroke, {
        lineWidth: this.lineWidth,
        lineJoin: this.lineJoin,
        lineCap: this.lineCap,
        miterLimit: this.miterLimit
    });
    
    this.rasterizer.endOp();
};

// M2: Clipping support
Context2D.prototype.clip = function(path, rule) {
    // If no path provided, use current internal path
    const pathToClip = path || this._currentPath;
    const clipRule = rule || 'nonzero';
    
    // For M2, we only support a single clip path (no clip stack)
    // In a full implementation, this would intersect with existing clip
    this._clipPath = pathToClip;
};
// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
}

})();
