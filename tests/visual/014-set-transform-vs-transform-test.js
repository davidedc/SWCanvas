// Test: setTransform vs transform behavior
// This file will be concatenated into the main visual test suite

registerVisualTest('transform-setTransform-vs-transform', {
    name: 'setTransform vs transform behavior comparison',
    width: 250, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 250, 150);
        
        // Left side: Using transform() - accumulative
        ctx.fillStyle = 'red';
        ctx.transform(1, 0, 0, 1, 20, 20); // translate(20, 20)
        ctx.fillRect(0, 0, 20, 20);
        
        ctx.transform(2, 0, 0, 2, 0, 0); // scale(2, 2) - accumulative
        ctx.fillStyle = 'green';
        ctx.fillRect(15, 0, 15, 15);
        
        // Right side: Using setTransform() - absolute
        ctx.setTransform(1, 0, 0, 1, 150, 20); // absolute translate(150, 20)
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 20, 20);
        
        ctx.setTransform(2, 0, 0, 2, 150, 60); // absolute scale + translate
        ctx.fillStyle = 'magenta';
        ctx.fillRect(0, 0, 15, 15);
    },
});