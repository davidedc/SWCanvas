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