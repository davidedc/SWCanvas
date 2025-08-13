# SWCanvas

A deterministic 2D raster engine with Canvas-like API. SWCanvas provides pixel-perfect, cross-platform 2D rendering that produces identical results on any system, making it ideal for testing, screenshots, and server-side graphics.

## Features

- **Deterministic Rendering**: Identical results across all platforms and browsers
- **HTML5 Canvas Compatibility**: Drop-in replacement with familiar API
- **Memory Efficient Clipping**: Stencil-based clipping system with proper intersection support
- **Comprehensive Test Coverage**: 52+ visual tests ensuring pixel-perfect accuracy
- **Cross-Platform**: Works in Node.js and browsers
- **No Dependencies**: Pure JavaScript implementation

## Quick Start

### Building

```bash
npm run build
```

This generates `dist/swcanvas.js` containing the complete library.

### Node.js Usage

```javascript
const SWCanvas = require('./dist/swcanvas.js');

const surface = SWCanvas.Surface(800, 600);
const ctx = new SWCanvas.Context2D(surface);

ctx.setFillStyle(255, 0, 0, 255); // Red
ctx.fillRect(10, 10, 100, 50);

// Export as BMP
const bmpData = SWCanvas.encodeBMP(surface);
```

### Browser Usage

```html
<script src="dist/swcanvas.js"></script>
<script>
const surface = SWCanvas.Surface(800, 600);
const ctx = new SWCanvas.Context2D(surface);

ctx.setFillStyle(255, 0, 0, 255); // Red
ctx.fillRect(10, 10, 100, 50);
</script>
```

## Testing

### Run All Tests

```bash
npm test
```

This runs 31+ shared tests and generates 55+ visual test BMPs in `tests/output/`.

### Browser Tests

Open `examples/test.html` in a web browser for:
- Side-by-side HTML5 Canvas vs SWCanvas comparisons
- Interactive visual tests
- BMP download functionality

### Test Structure

- **Shared Tests**: Core functionality tests that run in both Node.js and browsers
- **Visual Tests**: 52+ comprehensive rendering tests with BMP output
- **Browser Tests**: Interactive visual comparison tools

See [tests/README.md](tests/README.md) for detailed test documentation.

## API Documentation

SWCanvas implements a subset of the HTML5 Canvas 2D API:

### Surface Creation
```javascript
const surface = SWCanvas.Surface(width, height);
```

### Context Creation
```javascript
const ctx = new SWCanvas.Context2D(surface);
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
```

### Color Setting
```javascript
ctx.setFillStyle(r, g, b, a);    // 0-255 values
ctx.setStrokeStyle(r, g, b, a);  // 0-255 values
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
const bmpData = SWCanvas.encodeBMP(surface);
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
├── Surface.js       # Memory management (factory + class) 
├── Matrix.js        # Transform mathematics (immutable class)
├── Rasterizer.js    # Low-level rendering (prototype-based)
├── Color.js         # Immutable color handling (class)
├── Geometry.js      # Point and Rectangle value objects (classes)
├── StencilBuffer.js # 1-bit clipping buffer (class)
├── DrawingState.js  # State stack management (class)
├── PolygonFiller.js # Scanline polygon filling (static methods)
├── StrokeGenerator.js # Stroke generation (static methods)
├── PathFlattener.js # Path to polygon conversion (static methods)
├── BitmapEncoder.js # BMP file encoding (static methods)
└── Path2D.js        # Path definition (class)

tests/            # Test suite
├── shared-test-suite.js    # Core functionality tests
├── visual-test-registry.js # 52+ visual tests
├── test-colors.js          # Color consistency system
└── run-tests.js            # Node.js test runner

examples/         # Browser examples
└── test.html        # Visual comparison tool

dist/             # Built library
└── swcanvas.js      # Concatenated distribution file
```

### Adding New Tests

#### For Core Functionality
Add to `tests/shared-test-suite.js` - automatically runs in both Node.js and browsers.

#### For Visual Rendering  
Add to `tests/visual-test-registry.js` with both SWCanvas and HTML5 Canvas implementations:

```javascript
visualTests['my-new-test'] = {
    name: 'My New Test Description',
    width: 200, height: 150,
    drawSWCanvas: function(SWCanvas) {
        const surface = SWCanvas.Surface(200, 150);
        const ctx = new SWCanvas.Context2D(surface);
        // ... drawing operations
        return surface;
    },
    drawHTML5Canvas: function(html5Canvas) {
        const ctx = html5Canvas.getContext('2d');
        // ... identical drawing operations
    }
};
```

Use the color system from `tests/test-colors.js` to ensure consistency:

```javascript
helpers.setSWCanvasFill(ctx, 'red');    // For SWCanvas
helpers.setHTML5CanvasFill(ctx, 'red');  // For HTML5 Canvas
```

### Build Process

The build script (`build.sh`) concatenates source files in dependency order, following OO architecture:

**Phase 1: Foundation Classes**
1. Color - Immutable color handling
2. Geometry - Point and Rectangle value objects  
3. Matrix - Transformation mathematics
4. Surface - Memory buffer management

**Phase 2: Core Classes**
5. StencilBuffer - 1-bit clipping system
6. DrawingState - State management
7. Path2D - Path definitions

**Phase 3: Algorithm Classes** 
8. PathFlattener - Path-to-polygon conversion (static methods)
9. PolygonFiller - Scanline filling (static methods)
10. StrokeGenerator - Stroke generation (static methods) 
11. BitmapEncoder - BMP export (static methods)

**Phase 4: High-Level Classes**
12. Rasterizer - Rendering pipeline
13. Context2D - Main drawing API

## License

MIT License - see LICENSE file for details.

## Contributing

1. **Build**: `npm run build`
2. **Test**: `npm test` 
3. **Visual Test**: Open `examples/test.html` in browser
4. **Add Tests**: Follow patterns in `tests/visual-test-registry.js`
5. **Verify**: Ensure identical results in both Node.js and browser

The comprehensive test suite ensures any changes maintain pixel-perfect compatibility with HTML5 Canvas.