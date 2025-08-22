# SWCanvas

A deterministic 2D raster engine with Canvas-like API. SWCanvas provides pixel-perfect, cross-platform 2D rendering that produces identical results on any system, making it ideal for testing, screenshots, and server-side graphics.

**🎨 [Interactive Demo](examples/showcase.html)** • **🧪 [Visual Tests](tests/browser/index.html)** • **📊 [Simple Test](tests/browser/simple-test.html)**

## Features

- **Deterministic Rendering**: Identical results across all platforms and browsers
- **HTML5 Canvas Compatibility**: Drop-in replacement with familiar API  
- **Object-Oriented Design**: Clean ES6 classes following effective OO principles
- **Memory Efficient Clipping**: Stencil-based clipping system with proper intersection support
- **Sub-pixel Stroke Rendering**: Thin strokes render with proportional opacity, works with all paint sources
- **Full Porter-Duff Compositing**: Complete `globalCompositeOperation` support with all 10 standard operations working correctly
- **Comprehensive Test Coverage**: 33 core tests + 88 visual tests ensuring pixel-perfect accuracy with modular architecture
- **Immutable Value Objects**: Point, Rectangle, Transform2D, Color prevent mutation bugs
- **Cross-Platform**: Works in Node.js and browsers
- **No Dependencies**: Pure JavaScript implementation

## Quick Start

### Building

```bash
npm run build      # Build the library
npm run minify     # Create minified version
npm run build:prod # Build + minify in one command
```

This generates:
- `dist/swcanvas.js` - Complete library for development
- `dist/swcanvas.min.js` - Minified library for production (71% smaller)
- `dist/swcanvas.min.js.map` - Source map for debugging
- `tests/dist/core-functionality-tests.js` from 32 individual test files in `/tests/core/`
- `tests/dist/visual-rendering-tests.js` from 78 individual test files in `/tests/visual/`

### Node.js Usage

```javascript
const SWCanvas = require('./dist/swcanvas.js');

// Create surface with immutable dimensions
const surface = SWCanvas.Core.Surface(800, 600);
const ctx = new SWCanvas.Core.Context2D(surface);

// Use Canvas 2D API
ctx.setFillStyle(255, 0, 0, 255); // Red
ctx.fillRect(10, 10, 100, 50);

// Advanced: Use OO classes directly
const transform = new SWCanvas.Core.Transform2D()
    .translate(100, 100)
    .rotate(Math.PI / 4);

const point = new SWCanvas.Point(50, 75);
const rect = new SWCanvas.Rectangle(0, 0, 200, 150);
const color = new SWCanvas.Core.Color(255, 128, 0, 200);

// Export as BMP
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
```

### Browser Usage

```html
<script src="dist/swcanvas.js"></script>
<script>
// Create surface and context
const surface = SWCanvas.Core.Surface(800, 600);
const ctx = new SWCanvas.Core.Context2D(surface);

// Standard Canvas 2D operations
ctx.setFillStyle(255, 0, 0, 255); // Red
ctx.fillRect(10, 10, 100, 50);

// Use immutable geometry classes
const center = new SWCanvas.Point(400, 300);
const bounds = new SWCanvas.Rectangle(100, 100, 600, 400);
if (bounds.contains(center)) {
    console.log('Center is within bounds');
}

// Transform operations
ctx.save();
const rotTransform = SWCanvas.Core.Transform2D.rotation(Math.PI / 6);
ctx.setTransform(rotTransform.a, rotTransform.b, rotTransform.c, rotTransform.d, rotTransform.e, rotTransform.f);
ctx.fillRect(50, 50, 100, 100);
ctx.restore();
</script>
```

## Examples

### Feature Showcase

Open `examples/showcase.html` in a web browser for a comprehensive demonstration of SWCanvas capabilities:

- **Interactive Demo**: All major features demonstrated on a single 800x600 canvas
- **Live Features**: Redraw button, animation demo, BMP download functionality  
- **Production Build**: Uses minified version (`swcanvas.min.js`) with automatic fallback
- **Performance Metrics**: Real-time render timing display

**Features Demonstrated:**
- Basic shapes, gradients, and patterns
- Transformations and clipping operations
- Various stroke styles and line dashing
- Alpha blending and complex paths
- Sub-pixel rendering accuracy

```bash
# View the example
open examples/showcase.html
```

See [examples/README.md](examples/README.md) for additional examples and usage instructions.

## Testing

### Run All Tests

```bash
npm test
```

This runs:
- 32 modular core functionality tests (automatically uses built tests from `/tests/core/`)
- 78 visual rendering tests generating BMPs in `tests/output/`

### Browser Tests

Open `tests/browser/index.html` in a web browser for:
- Side-by-side HTML5 Canvas vs SWCanvas comparisons  
- Interactive visual tests
- All 78 visual rendering test comparisons (automatically uses built modular tests)
- BMP download functionality

### Test Architecture

- **Core Functionality Tests** (32): Individual test files in `/tests/core/` - API correctness, edge cases, mathematical accuracy
- **Visual Rendering Tests** (78): Individual test files in `/tests/visual/` - Pixel-perfect rendering verification with BMP generation  
- **Browser Tests**: Interactive visual comparison tools using built test suites with HTML5 Canvas vs SWCanvas side-by-side

The modular architecture allows individual test development while maintaining build-time concatenation for performance.

See [tests/README.md](tests/README.md) for detailed test documentation.

## API Documentation

SWCanvas provides **dual API architecture** for maximum flexibility:

### HTML5 Canvas-Compatible API (Recommended for Portability)

Drop-in replacement for HTML5 Canvas with familiar API:

```javascript
// Create canvas element (works in Node.js and browsers)
const canvas = SWCanvas.createCanvas(800, 600);
const ctx = canvas.getContext('2d');

// Standard HTML5 Canvas API
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 50);

ctx.strokeStyle = '#0066cc';
ctx.lineWidth = 2;
ctx.strokeRect(20, 20, 80, 30);

// Line dashing
ctx.setLineDash([5, 5]);       // Dashed line pattern
ctx.lineDashOffset = 0;        // Starting offset
ctx.beginPath();
ctx.moveTo(10, 70);
ctx.lineTo(100, 70);
ctx.stroke();

// Composite operations (Porter-Duff blending)
ctx.fillStyle = 'red';
ctx.fillRect(30, 30, 40, 40);

ctx.globalCompositeOperation = 'destination-over'; // Draw behind existing content
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 40, 40);

// All Porter-Duff operations supported:
// Local operations: source-over (default), destination-over, destination-out, xor
// Global operations: destination-atop, destination-in, source-atop, source-in, source-out, copy

// ImageData API for pixel manipulation
const imageData = ctx.createImageData(100, 100);
// ... modify imageData.data ...
ctx.putImageData(imageData, 50, 50);

// Extract pixel data
const pixelData = ctx.getImageData(60, 60, 10, 10);

// Factory method for ImageData objects
const blankImage = SWCanvas.createImageData(50, 50);
```

### Core API (Recommended for Performance)

Direct access to core classes with explicit RGBA values:

```javascript
// Create surface and context directly  
const surface = SWCanvas.Core.Surface(width, height);
const ctx = new SWCanvas.Core.Context2D(surface);

// Explicit RGBA values (0-255)
ctx.setFillStyle(255, 0, 0, 255);    // Red
ctx.setStrokeStyle(0, 102, 204, 255); // Blue
```

### Drawing Operations
```javascript
// Rectangle filling
ctx.fillRect(x, y, width, height);

// Path operations
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x2, y2);
ctx.fill();
ctx.stroke();

// Transforms
ctx.translate(x, y);
ctx.scale(x, y);
ctx.rotate(angle);

// Clipping
ctx.clip();

// State management
ctx.save();
ctx.restore();

// Image rendering
ctx.drawImage(imagelike, dx, dy);                    // Basic positioning
ctx.drawImage(imagelike, dx, dy, dw, dh);            // With scaling
ctx.drawImage(imagelike, sx, sy, sw, sh, dx, dy, dw, dh); // With source rectangle

// Line dashing
ctx.setLineDash([10, 5]);        // Set dash pattern: 10px dash, 5px gap
ctx.lineDashOffset = 2;          // Starting offset into pattern
const pattern = ctx.getLineDash(); // Get current pattern: [10, 5]
```

### Color Setting
```javascript
ctx.setFillStyle(r, g, b, a);    // 0-255 values
ctx.setStrokeStyle(r, g, b, a);  // 0-255 values

// Or use Color objects directly
const color = new SWCanvas.Core.Color(255, 128, 0, 200);
ctx.setFillStyle(color.r, color.g, color.b, color.a);
```

### Gradients and Patterns

SWCanvas supports HTML5 Canvas-compatible gradients and patterns for advanced fill and stroke operations:

#### HTML5 Canvas-Compatible API
```javascript
const canvas = SWCanvas.createCanvas(400, 300);
const ctx = canvas.getContext('2d');

// Linear gradients
const linearGrad = ctx.createLinearGradient(0, 0, 200, 0);
linearGrad.addColorStop(0, 'red');
linearGrad.addColorStop(0.5, 'yellow');
linearGrad.addColorStop(1, 'blue');
ctx.fillStyle = linearGrad;
ctx.fillRect(10, 10, 200, 100);

// Radial gradients  
const radialGrad = ctx.createRadialGradient(150, 75, 0, 150, 75, 50);
radialGrad.addColorStop(0, '#ff0000');
radialGrad.addColorStop(1, '#0000ff');
ctx.fillStyle = radialGrad;
ctx.fillRect(100, 50, 100, 100);

// Conic gradients (CSS conic-gradient equivalent)
const conicGrad = ctx.createConicGradient(Math.PI / 4, 200, 150);
conicGrad.addColorStop(0, 'red');
conicGrad.addColorStop(0.25, 'yellow');
conicGrad.addColorStop(0.5, 'lime');
conicGrad.addColorStop(0.75, 'aqua');
conicGrad.addColorStop(1, 'red');
ctx.fillStyle = conicGrad;
ctx.fillRect(150, 100, 100, 100);

// Patterns with ImageLike objects
const patternImage = ctx.createImageData(20, 20);
// ... fill patternImage.data with pattern ...
const pattern = ctx.createPattern(patternImage, 'repeat');
ctx.fillStyle = pattern;
ctx.fillRect(50, 150, 150, 100);

// Gradients work with strokes too, including sub-pixel strokes
ctx.strokeStyle = linearGrad;
ctx.lineWidth = 5;
ctx.strokeRect(250, 50, 100, 100);

// Sub-pixel strokes work with all paint sources
ctx.strokeStyle = radialGrad;
ctx.lineWidth = 0.5; // 50% opacity stroke
ctx.strokeRect(250, 150, 100, 100);
```

#### Core API (Performance)
```javascript
const surface = SWCanvas.Core.Surface(400, 300);
const ctx = new SWCanvas.Core.Context2D(surface);

// Linear gradients
const linearGrad = ctx.createLinearGradient(0, 0, 200, 0);
linearGrad.addColorStop(0, new SWCanvas.Core.Color(255, 0, 0, 255));
linearGrad.addColorStop(1, new SWCanvas.Core.Color(0, 0, 255, 255));
ctx.setFillStyle(linearGrad);
ctx.fillRect(10, 10, 200, 100);

// Radial gradients
const radialGrad = ctx.createRadialGradient(150, 75, 0, 150, 75, 50);
radialGrad.addColorStop(0, new SWCanvas.Core.Color(255, 255, 0, 255));
radialGrad.addColorStop(1, new SWCanvas.Core.Color(255, 0, 255, 255));
ctx.setStrokeStyle(radialGrad);
ctx.lineWidth = 8;
ctx.beginPath();
ctx.arc(150, 75, 40);
ctx.stroke();

// Conic gradients
const conicGrad = ctx.createConicGradient(0, 200, 150);
conicGrad.addColorStop(0, new SWCanvas.Core.Color(255, 0, 0, 255));
conicGrad.addColorStop(0.33, new SWCanvas.Core.Color(0, 255, 0, 255));
conicGrad.addColorStop(0.66, new SWCanvas.Core.Color(0, 0, 255, 255));
conicGrad.addColorStop(1, new SWCanvas.Core.Color(255, 0, 0, 255));
ctx.setFillStyle(conicGrad);
ctx.fillRect(150, 100, 100, 100);

// Patterns with sub-pixel strokes
const imagelike = { width: 10, height: 10, data: new Uint8ClampedArray(400) };
// ... fill imagelike.data ...
const pattern = ctx.createPattern(imagelike, 'repeat-x');
ctx.setStrokeStyle(pattern);
ctx.lineWidth = 0.25; // 25% opacity stroke  
ctx.strokeRect(50, 200, 200, 50);
```

#### Pattern Repetition Modes
- `'repeat'` - Tile in both directions (default)
- `'repeat-x'` - Tile horizontally only
- `'repeat-y'` - Tile vertically only  
- `'no-repeat'` - Display once at pattern origin

#### Gradient Types
- **LinearGradient**: `createLinearGradient(x0, y0, x1, y1)` - Linear color transition
- **RadialGradient**: `createRadialGradient(x0, y0, r0, x1, y1, r1)` - Radial color transition
- **ConicGradient**: `createConicGradient(startAngle, centerX, centerY)` - Conic sweep transition

### Core API Classes

SWCanvas provides rich OO classes for advanced operations through the Core API:

```javascript
// Immutable geometry classes
const point = new SWCanvas.Core.Point(100, 50);
const rect = new SWCanvas.Core.Rectangle(10, 20, 100, 80);
const center = rect.center; // Returns Point(60, 60)

// Immutable transformation matrix
const transform = new SWCanvas.Core.Transform2D()
    .translate(100, 100)
    .scale(2, 2)
    .rotate(Math.PI / 4);

// Apply to points
const transformed = transform.transformPoint(point);

// Utility classes
const clipMask = new SWCanvas.Core.ClipMask(800, 600);

// Image processing utilities
const validImage = SWCanvas.Core.ImageProcessor.validateAndConvert(imageData);
```

### Image Rendering

SWCanvas supports drawing ImageLike objects with nearest-neighbor sampling:

```javascript
// ImageLike interface: { width, height, data: Uint8ClampedArray }
const imagelike = {
    width: 10,
    height: 10,
    data: new Uint8ClampedArray(10 * 10 * 4) // RGBA
};

// RGB images auto-convert to RGBA
const rgbImage = {
    width: 5,
    height: 5, 
    data: new Uint8ClampedArray(5 * 5 * 3) // RGB → RGBA with alpha=255
};

// Basic usage
ctx.drawImage(imagelike, 10, 10);                    // Draw at position
ctx.drawImage(imagelike, 10, 10, 20, 20);            // Draw with scaling
ctx.drawImage(imagelike, 0, 0, 5, 5, 10, 10, 10, 10); // Source rectangle

// Works with transforms and clipping
ctx.translate(50, 50);
ctx.rotate(Math.PI / 4);
ctx.drawImage(imagelike, 0, 0);
```

### BMP Export
```javascript
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
// Returns ArrayBuffer containing BMP file data
```

## Architecture

### Core Components (Object-Oriented Design)

- **Surface**: Memory buffer for pixel data
- **Context2D**: Drawing API and state management
- **Matrix**: Transformation mathematics (immutable value object)
- **Path2D**: Path definition and flattening
- **Rasterizer**: Low-level pixel operations
- **Color**: Immutable color handling with premultiplied alpha support
- **Gradients**: Paint source objects for linear, radial, and conic gradients with color stops
- **Pattern**: Paint source objects for repeating image patterns with repetition modes
- **Geometry**: Point and Rectangle value objects
- **StencilBuffer**: 1-bit clipping buffer management
- **DrawingState**: Context state stack management
- **PolygonFiller**: Scanline-based polygon filling with paint source support
- **StrokeGenerator**: Geometric stroke generation (static methods)  
- **PathFlattener**: Path-to-polygon conversion (static methods)
- **BitmapEncoder**: BMP file format export (static methods)

### Key Features

#### Stencil-Based Clipping
- 1-bit per pixel memory efficiency
- Proper clip intersection with AND operations
- Supports complex nested clipping scenarios
- Matches HTML5 Canvas behavior exactly

#### Deterministic Rendering
- Fixed-point arithmetic for transforms
- Consistent rasterization algorithms
- Identical results across platforms
- No floating-point precision issues

#### Premultiplied sRGB
- Consistent alpha blending
- Matches HTML5 Canvas color handling
- Proper transparency composition

## Development

**Debug Utilities**: See `debug/README.md` for debugging scripts, templates, and investigation workflows.

### Project Structure (Object-Oriented Architecture)

```
src/              # Source files (ES6 Classes)
├── Context2D.js     # Main drawing API (class)
├── Surface.js       # Memory management (ES6 class) 
├── Transform2D.js   # Transform mathematics (immutable class)
├── Rasterizer.js    # Low-level rendering (ES6 class)
├── Color.js         # Immutable color handling (class)
├── Point.js         # Immutable 2D point operations (class)
├── Rectangle.js     # Immutable rectangle operations (class)
├── Gradient.js      # Gradient paint sources (linear, radial, conic)
├── Pattern.js       # Pattern paint sources with repetition modes
├── ClipMask.js      # 1-bit clipping buffer (class)
├── ImageProcessor.js # ImageLike validation and conversion (static methods)
├── PolygonFiller.js # Scanline polygon filling with paint sources (static methods)
├── StrokeGenerator.js # Stroke generation (static methods)
├── PathFlattener.js # Path to polygon conversion (static methods)
├── BitmapEncoder.js # BMP file encoding (static methods)
├── ColorParser.js   # CSS color string parsing (static methods)
└── Path2D.js        # Path definition (class)

tests/            # Test suite
├── core-functionality-tests.js # Core functionality tests
├── visual-rendering-tests.js    # 52+ visual tests
└── run-tests.js            # Node.js test runner

tests/browser/    # Browser tests
├── index.html       # Main visual comparison tool (moved from examples/)
├── simple-test.html # Simple visual test
└── browser-test-helpers.js # Interactive test utilities

dist/             # Built library
└── swcanvas.js      # Concatenated distribution file
```

## Test Architecture

SWCanvas uses a comprehensive dual test system:
- **32 core functionality tests**: Programmatic API verification with assertions
- **78 visual rendering tests**: Pixel-perfect BMP generation and comparison
- **Modular architecture**: Individual test files auto-concatenated at build time

See [tests/README.md](tests/README.md) for complete test documentation, adding tests, and build utilities.

### Build Process

The build script (`build.sh`) concatenates source files in dependency order, following OO architecture:

**Phase 1: Foundation Classes**
1. Color - Immutable color handling
2. Point - Immutable 2D point operations
3. Rectangle - Immutable rectangle operations
4. Transform2D - Transformation mathematics
5. Path2D - Path definitions
6. Surface - Memory buffer management

**Phase 2: Service Classes**
7. BitmapEncoder - BMP file encoding (static methods)
8. PathFlattener - Path-to-polygon conversion (static methods)
9. PolygonFiller - Scanline filling with paint sources (static methods)
10. StrokeGenerator - Stroke generation (static methods) 
11. ClipMask - 1-bit stencil buffer management (class)
12. ImageProcessor - ImageLike validation and conversion (static methods)
13. ColorParser - CSS color string parsing (static methods)

**Phase 2.5: Paint Sources**
14. Gradient - Linear, radial, and conic gradient paint sources
15. Pattern - Repeating image pattern paint sources

**Phase 3: Rendering Classes**
16. Rasterizer - Rendering pipeline (class)
17. Context2D - Main drawing API (class)

## License

MIT License - see LICENSE file for details.

## Contributing

1. **Build**: `npm run build`
2. **Test**: `npm test` 
3. **Visual Test**: Open `tests/browser/index.html` in browser
4. **Add Tests**: Create individual test files in `/tests/core/` or `/tests/visual/` (see renumbering utility for advanced organization)
5. **Verify**: Ensure identical results in both Node.js and browser

The comprehensive test suite ensures any changes maintain pixel-perfect compatibility with HTML5 Canvas.