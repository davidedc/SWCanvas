# SWCanvas Debug Utilities

This directory contains **debugging scripts and utilities** for analyzing SWCanvas rendering behavior, investigating issues, and validating implementations against HTML5 Canvas.

**All debugging scripts (.js files) are tracked in git for collaborative debugging, while generated BMP output files (.bmp) are gitignored to avoid repository bloat.**

## Overview

Debug utilities help developers:
- **Pixel-level analysis** of rendering output
- **Behavior comparison** between SWCanvas and HTML5 Canvas
- **Issue reproduction** with minimal test cases
- **Visual validation** through BMP output files
- **Development workflow** for investigating rendering problems

## Debug Script Categories

### Composite Operations Debugging

**Purpose**: Investigate Porter-Duff composite operation behavior and HTML5 Canvas compatibility.

- `debug-copy-color.js` - Copy operation with semi-transparent colors
- `debug-copy-composition.js` - Copy vs source-over comparison analysis
- `debug-browser-copy.js` - Browser rendering behavior analysis
- `debug-minimal-xor.js` - Minimal XOR test case analysis
- `debug-html5-xor.js` - HTML5-compatible API XOR testing
- `debug-overlap-analysis.js` - Coordinate overlap calculation and verification
- `debug-specific-pixel.js` - Individual pixel behavior investigation

### Coordinate and Coverage Analysis

**Purpose**: Verify geometric calculations, shape coverage, and pixel positioning.

- `debug-coordinates.js` - Basic coordinate system validation
- `debug-xor-coverage.js` - Circle coverage area calculation
- `debug-overlap-analysis.js` - Shape intersection verification

### Visual Comparison Tools

**Purpose**: Generate side-by-side comparisons and reference implementations.

- `debug-browser-xor.html` - Interactive browser comparison page
- `debug-reference-xor.js` - Reference implementation analysis
- `debug-complex-xor.js` - Complex test case debugging

### BMP Output Files

**Purpose**: Visual verification of rendering output.

All `.bmp` files are generated outputs from debug scripts for visual inspection:
- `debug-copy-color.bmp` - Copy operation color output
- `debug-minimal-xor.bmp` - Minimal XOR test result
- `debug-html5-xor.bmp` - HTML5 API XOR result
- `debug-simple-xor-analysis.bmp` - Simple XOR analysis
- `debug-complex-xor-fixed.bmp` - Complex XOR after fixes

## Usage Patterns

### 1. Issue Investigation Workflow

When encountering a rendering issue:

```bash
# Step 1: Create minimal reproduction case
cp debug/debug-minimal-xor.js debug/debug-my-issue.js
# Edit debug-my-issue.js to reproduce your issue

# Step 2: Run analysis
node debug/debug-my-issue.js

# Step 3: Compare with HTML5 Canvas behavior
# Create corresponding HTML file for browser testing
cp debug/debug-browser-xor.html debug/debug-my-issue.html
```

### 2. Pixel-Level Analysis Template

```javascript
const SWCanvas = require('../dist/swcanvas.js');
const fs = require('fs');

console.log('=== PIXEL ANALYSIS DEBUG ===');
const canvas = SWCanvas.createCanvas(200, 200);
const ctx = canvas.getContext('2d');

// Your drawing operations here
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 200, 200);

// Analyze specific pixels
const testPoints = [
    [50, 50, 'Test point 1'],
    [100, 100, 'Test point 2']
];

testPoints.forEach(([x, y, desc]) => {
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b, a] = imageData.data;
    console.log(`${desc} (${x},${y}): RGBA(${r},${g},${b},${a})`);
});

// Save for visual inspection
const surface = canvas._coreSurface;
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
fs.writeFileSync('debug/debug-my-analysis.bmp', Buffer.from(bmpData));
console.log('Analysis saved: debug/debug-my-analysis.bmp');
```

### 3. Composite Operation Testing

```javascript
const SWCanvas = require('../dist/swcanvas.js');

// Test all composite operations systematically
const operations = [
    'source-over', 'destination-over', 'source-out', 'destination-out',
    'source-in', 'destination-in', 'source-atop', 'destination-atop', 
    'xor', 'copy'
];

operations.forEach(op => {
    console.log(`\n=== Testing: ${op} ===`);
    const canvas = SWCanvas.createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    
    // Standard test pattern
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'blue';
    ctx.fillRect(20, 20, 40, 40);
    
    ctx.globalCompositeOperation = op;
    ctx.fillStyle = 'red';
    ctx.fillRect(40, 40, 40, 40);
    
    // Analyze result
    const overlap = ctx.getImageData(50, 50, 1, 1);
    console.log(`Overlap result: RGBA(${overlap.data.join(',')})`);
});
```

### 4. Browser Comparison Template

Create HTML files for visual comparison:

```html
<!DOCTYPE html>
<html>
<head><title>Debug Comparison</title></head>
<body>
    <h2>HTML5 Canvas vs SWCanvas Comparison</h2>
    <div style="display: flex; gap: 20px;">
        <div>
            <h3>HTML5 Canvas</h3>
            <canvas id="html5" width="200" height="200"></canvas>
        </div>
        <div>
            <h3>SWCanvas (load swcanvas.js first)</h3>
            <canvas id="swcanvas" width="200" height="200"></canvas>
        </div>
    </div>

    <script>
        // Your drawing code for both canvases
        function drawTest(ctx) {
            // Drawing operations here
        }
        
        // HTML5 Canvas
        const html5Ctx = document.getElementById('html5').getContext('2d');
        drawTest(html5Ctx);
        
        // SWCanvas (when loaded)
        if (typeof SWCanvas !== 'undefined') {
            const swCanvas = SWCanvas.createCanvas(200, 200);
            const swCtx = swCanvas.getContext('2d');
            drawTest(swCtx);
            
            // Transfer to display canvas
            const displayCanvas = document.getElementById('swcanvas');
            const displayCtx = displayCanvas.getContext('2d');
            const surface = swCanvas._coreSurface;
            const imageData = displayCtx.createImageData(200, 200);
            
            for (let i = 0; i < surface.data.length; i++) {
                imageData.data[i] = surface.data[i];
            }
            displayCtx.putImageData(imageData, 0, 0);
        }
    </script>
</body>
</html>
```

## Debug Script Patterns

### Essential Debugging Components

Every debug script should include:

1. **Clear console output** with section headers
2. **Pixel analysis** of key test points  
3. **BMP file output** for visual verification
4. **Expected vs actual** result documentation
5. **Coordinate verification** for geometric operations

### Common Analysis Functions

```javascript
// Pixel color description
function describeColor(r, g, b, a) {
    if (r === 255 && g === 255 && b === 255 && a === 255) return 'WHITE';
    if (r === 0 && g === 0 && b === 255 && a === 255) return 'BLUE';
    if (r === 255 && g === 0 && b === 0 && a === 255) return 'RED';
    if (a === 0) return 'TRANSPARENT';
    return `RGB(${r},${g},${b},${a})`;
}

// Distance calculation for circular shapes
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

// Overlap detection for rectangles
function rectOverlap(rect1, rect2) {
    return !(rect1.right < rect2.left || rect2.right < rect1.left ||
             rect1.bottom < rect2.top || rect2.bottom < rect1.top);
}
```

## Development Tips

### When to Create Debug Scripts

- **New feature implementation** - Validate behavior matches specification
- **Bug investigation** - Isolate minimal reproduction case
- **HTML5 Canvas compatibility** - Compare behavior pixel-by-pixel
- **Performance analysis** - Measure rendering time for operations
- **Visual regression** - Compare before/after BMP outputs

### Script Naming Convention

- `debug-feature-issue.js` - Specific feature investigation
- `debug-comparison-feature.js` - SWCanvas vs HTML5 Canvas comparison
- `debug-minimal-case.js` - Minimal reproduction case
- `debug-analysis-feature.js` - Detailed analysis with multiple test points

### BMP File Management

- **Keep outputs for comparison** - Use git to track before/after changes
- **Clear naming** - Include feature and test case in filename
- **Visual inspection** - Open BMPs in image viewer for verification
- **Pixel-level analysis** - Use image editor for precise pixel inspection

## Integration with Main Test Suite

Debug utilities complement the main test suite:

- **Main tests**: Comprehensive automated validation
- **Debug utilities**: Focused investigation of specific issues
- **Visual tests**: Cross-platform pixel-perfect validation
- **Debug scripts**: Developer workflow for rapid iteration

Use debug utilities during development, then create proper tests in `/tests/visual/` or `/tests/core/` for permanent validation.

## Contributing Debug Utilities

When adding new debug utilities:

1. **Follow naming convention**: `debug-feature-description.js`
2. **Include comprehensive comments** explaining what's being tested
3. **Generate BMP output** for visual verification
4. **Document expected vs actual results** in the script
5. **Add usage instructions** in comments at top of file

This ensures debug utilities remain valuable for future development and debugging efforts.