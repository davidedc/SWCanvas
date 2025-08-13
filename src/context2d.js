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
    
    // Internal path
    this._currentPath = new Path2D();
}

// State management
Context2D.prototype.save = function() {
    this.stateStack.push({
        globalAlpha: this.globalAlpha,
        globalCompositeOperation: this.globalCompositeOperation,
        transform: new Matrix([this._transform.a, this._transform.b, this._transform.c, 
                              this._transform.d, this._transform.e, this._transform.f]),
        fillStyle: this._fillStyle.slice(),
        strokeStyle: this._strokeStyle.slice()
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

// Placeholder methods for later milestones
Context2D.prototype.fill = function(path, rule) {
    throw new Error('Path filling not implemented in M1');
};

Context2D.prototype.stroke = function(path) {
    throw new Error('Path stroking not implemented in M1');
};