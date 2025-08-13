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