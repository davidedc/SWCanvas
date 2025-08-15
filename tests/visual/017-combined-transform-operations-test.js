// Test 17: Combined transform operations
// This file will be concatenated into the main visual test suite

// Test 17: Combined transform operations
registerVisualTest('transform-combined-operations', {
    name: 'Multiple transforms combined',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        
        // Complex combined transform: translate + rotate + scale
        ctx.translate(100, 75);
        ctx.rotate(Math.PI / 6);
        ctx.scale(1.5, 0.8);
        ctx.translate(-15, -10);
        
        // Draw transformed rectangle
        ctx.fillStyle = 'orange';
        ctx.fillRect(0, 0, 30, 20);
        
        // Draw border to show original position
        ctx.resetTransform();
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 1;
        ctx.strokeRect(85, 65, 30, 20);
    },
});