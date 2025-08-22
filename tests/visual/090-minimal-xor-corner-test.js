// Test: Minimal XOR Corner Test - Blue Square + Red Circle Corner Overlap
// This is a truly minimal XOR test with clear corner overlap

registerVisualTest('minimal-xor-corner', {
    name: 'Minimal XOR Corner Test - Blue Square + Red Circle Corner Overlap',
    width: 150, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 150, 150);
        
        // Draw blue square as destination
        ctx.fillStyle = 'blue';
        ctx.fillRect(30, 30, 60, 60);  // Blue square from (30,30) to (90,90)
        
        // Switch to XOR and draw red circle overlapping top-right corner
        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(75, 45, 25, 0, Math.PI * 2);  // Red circle center (75,45), radius 25
        ctx.fill();
        
        // Expected result:
        // - Blue square areas not covered by circle: blue
        // - Red circle areas not covering the square: red
        // - Overlap area (top-right corner): transparent (white background shows)
        // - Background: white
        //
        // The circle center (75,45) with radius 25 covers roughly (50,20) to (100,70)
        // The square covers (30,30) to (90,90)  
        // Overlap should be roughly (50,30) to (90,70)
    }
});