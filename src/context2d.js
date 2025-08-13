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