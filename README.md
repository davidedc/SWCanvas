# SWCanvas

A deterministic 2D raster engine with Canvas-like API. SWCanvas provides pixel-perfect, cross-platform 2D rendering that produces identical results on any system, making it ideal for testing, screenshots, and server-side graphics.

## Features

- **Deterministic Rendering**: Identical results across all platforms and browsers
- **HTML5 Canvas Compatibility**: Drop-in replacement with familiar API  
- **Object-Oriented Design**: Clean ES6 classes following effective OO principles
- **Memory Efficient Clipping**: Stencil-based clipping system with proper intersection support
- **Comprehensive Test Coverage**: 32 core tests + 60 visual tests ensuring pixel-perfect accuracy with modular architecture
- **Immutable Value Objects**: Point, Rectangle, Transform2D, Color prevent mutation bugs
- **Cross-Platform**: Works in Node.js and browsers
- **No Dependencies**: Pure JavaScript implementation

## Quick Start

### Building

```bash
npm run build
```

This generates:
- `dist/swcanvas.js` containing the complete library
- `tests/dist/core-functionality-tests.js` from 31 individual test files in `/tests/core/`
- `tests/dist/visual-rendering-tests.js` from 60 individual test files in `/tests/visual/`

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

## Testing

### Run All Tests

```bash
npm test
```

This runs:
- 32 modular core functionality tests (automatically uses built tests from `/tests/core/`)
- 60 visual rendering tests generating BMPs in `tests/output/`

### Browser Tests

Open `tests/browser/index.html` in a web browser for:
- Side-by-side HTML5 Canvas vs SWCanvas comparisons  
- Interactive visual tests
- All 60 visual rendering test comparisons (automatically uses built modular tests)
- BMP download functionality

### Test Architecture

- **Core Functionality Tests** (32): Individual test files in `/tests/core/` - API correctness, edge cases, mathematical accuracy
- **Visual Rendering Tests** (60): Individual test files in `/tests/visual/` - Pixel-perfect rendering verification with BMP generation  
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
- **Geometry**: Point and Rectangle value objects
- **StencilBuffer**: 1-bit clipping buffer management
- **DrawingState**: Context state stack management
- **PolygonFiller**: Scanline-based polygon filling (static methods)
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

### Project Structure (Object-Oriented Architecture)

```
src/              # Source files (ES6 Classes)
├── Context2D.js     # Main drawing API (class)
├── Surface.js       # Memory management (ES6 class) 
├── Matrix.js        # Transform mathematics (immutable class)
├── Rasterizer.js    # Low-level rendering (ES6 class)
├── Color.js         # Immutable color handling (class)
├── Point.js         # Immutable 2D point operations (class)
├── Rectangle.js     # Immutable rectangle operations (class)
├── StencilBuffer.js # 1-bit clipping buffer (class)
├── DrawingState.js  # State stack management (class)
├── ClipMaskHelper.js # 1-bit stencil buffer utilities (static methods)
├── ImageProcessor.js # ImageLike validation and conversion (static methods)
├── PolygonFiller.js # Scanline polygon filling (static methods)
├── StrokeGenerator.js # Stroke generation (static methods)
├── PathFlattener.js # Path to polygon conversion (static methods)
├── BitmapEncoder.js # BMP file encoding (static methods)
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
- **31 core functionality tests**: Programmatic API verification with assertions
- **57 visual rendering tests**: Pixel-perfect BMP generation and comparison
- **Modular architecture**: Individual test files auto-concatenated at build time

See [tests/README.md](tests/README.md) for complete test documentation, adding tests, and build utilities.

### Build Process

The build script (`build.sh`) concatenates source files in dependency order, following OO architecture:

**Phase 1: Foundation Classes**
1. Color - Immutable color handling
2. Point - Immutable 2D point operations
3. Rectangle - Immutable rectangle operations
4. Matrix - Transformation mathematics
5. Path2D - Path definitions
6. Surface - Memory buffer management

**Phase 2: Service Classes**
7. BitmapEncoder - BMP file encoding (static methods)
8. PathFlattener - Path-to-polygon conversion (static methods)
9. PolygonFiller - Scanline filling (static methods)
10. StrokeGenerator - Stroke generation (static methods) 
11. ClipMaskHelper - 1-bit stencil buffer utilities (static methods)
12. ImageProcessor - ImageLike validation and conversion (static methods)
13. StencilBuffer - 1-bit clipping buffer management (class)

**Phase 3: State and Rendering Classes**
14. DrawingState - State stack management (class)
15. Rasterizer - Rendering pipeline (class)
16. Context2D - Main drawing API (class)

## License

MIT License - see LICENSE file for details.

## Contributing

1. **Build**: `npm run build`
2. **Test**: `npm test` 
3. **Visual Test**: Open `tests/browser/index.html` in browser
4. **Add Tests**: Create individual test files in `/tests/core/` or `/tests/visual/` (see renumbering utility for advanced organization)
5. **Verify**: Ensure identical results in both Node.js and browser

The comprehensive test suite ensures any changes maintain pixel-perfect compatibility with HTML5 Canvas.