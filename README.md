# SWCanvas

A deterministic 2D Javascript raster engine with Canvas-like API, cross-browser and Node.js.

**🎨 [Demo](examples/showcase.html)** • **🧪 [Tests](tests/browser/index.html)** • **📊 [Minimal Example](tests/browser/minimal-example.html)**

## Features

- **Cross-platform Deterministic Rendering**: Identical results across all browsers and Node.js
- **HTML5 Canvas Compatibility**: Drop-in replacement with familiar API  
- **Object-Oriented Design**: Clean ES6 classes following effective OO principles
- **Geometric Path Hit Testing**: Complete `isPointInPath` and `isPointInStroke` implementation with accurate geometric calculation
- **Memory Efficient Clipping**: Stencil-based clipping system with proper intersection support
- **Sub-pixel Stroke Rendering**: Thin strokes render with proportional opacity, works with all paint sources
- **Full Porter-Duff Compositing**: Complete `globalCompositeOperation` support with all 10 standard operations working correctly
- **Comprehensive Test Coverage**: 36 core tests + 138 visual tests
- **Immutable Value Objects**: Point, Rectangle, Transform2D, Color prevent mutation bugs
- **Cross-Platform**: Works in Node.js and browsers
- **No Dependencies**: Pure JavaScript implementation

## Not Supported

SWCanvas focuses on deterministic 2D graphics primitives and does not implement several HTML5 Canvas features:

- **Text Rendering / Advanced Typography**: No `fillText()`, `strokeText()`, `measureText()` or font handling, no text baseline, direction, or complex text layout
- **Image Loading**: No built-in image loading from URLs or files (use ImageLike objects with raw pixel data)
- **Video/Media**: No video frame rendering or media stream support
- **Filter Effects**: No CSS-style filters or convolution matrices
- **Canvas-to-Canvas Blitting**: Limited `drawImage()` support (works with ImageLike objects, not arbitrary Canvas elements)
- **Pixel Manipulation Beyond ImageData**: No advanced pixel-level operations beyond `getImageData()/putImageData()`

### Performance Limitations

**⚠️ Important Performance Note**: SWCanvas prioritized cross-platform rendering consistency, educational and debugging purposes, and is **not optimized for**:
- Real-time animations or games
- High-frequency updates (>30 FPS)
- Complex scenes with many elements
- Performance-critical applications

For animations beyond very basic drawings, expect significant performance limitations. The rendering engine uses CPU-based pixel manipulation in Javascript without GPU acceleration, making it unsuitable for intensive animated content.

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
- `tests/dist/core-functionality-tests.js` from 36 individual test files in `/tests/core/`
- `tests/dist/visual-rendering-tests.js` from 138 individual test files in `/tests/visual/`

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

// Export as PNG (recommended - preserves transparency)
const pngData = SWCanvas.Core.PngEncoder.encode(surface);
// Or export as BMP (legacy - composites with white background)  
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

// Path operations including ellipses
ctx.beginPath();
ctx.ellipse(400, 200, 80, 40, Math.PI / 4, 0, 2 * Math.PI);
ctx.fill();

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
- 36 modular core functionality tests (automatically uses built tests from `/tests/core/`)
- 138 visual rendering tests generating PNG files in `tests/output/`

### Browser Tests

Open `tests/browser/index.html` in a web browser for:
- Side-by-side HTML5 Canvas vs SWCanvas comparisons  
- Interactive visual tests
- All 138 visual rendering tests comparisons (automatically uses built modular tests)
- PNG/BMP download functionality

### Test Architecture

- **Core Functionality Tests** (36): Individual test files in `/tests/core/` - API correctness, edge cases, mathematical accuracy
- **Visual Rendering Tests** (138): Individual test files in `/tests/visual/` - Rendering verification with PNG generation  
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

// Shadows
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';  // Semi-transparent black
ctx.shadowBlur = 5;                      // 5px blur radius
ctx.shadowOffsetX = 3;                   // 3px right offset
ctx.shadowOffsetY = 3;                   // 3px down offset
ctx.fillStyle = 'red';
ctx.fillRect(120, 10, 50, 30);          // Rectangle with shadow

// Rounded corners with arcTo
ctx.beginPath();
ctx.moveTo(50, 100);
ctx.lineTo(150, 100);
ctx.arcTo(200, 100, 200, 150, 25); // 25px radius rounded corner
ctx.lineTo(200, 200);
ctx.stroke();

// Path hit testing
ctx.beginPath();
ctx.rect(10, 120, 100, 60);
ctx.fillStyle = 'blue';
ctx.fill();

// Test if points are inside the filled rectangle
if (ctx.isPointInPath(60, 150)) {
    console.log('Point (60, 150) is inside the rectangle');
}
if (ctx.isPointInPath(60, 150, 'evenodd')) {
    console.log('Point is inside using evenodd fill rule');
}

// Test if points are on the stroke outline
ctx.lineWidth = 5;
ctx.stroke();
if (ctx.isPointInStroke(48, 150)) { // On stroke edge
    console.log('Point (48, 150) is on the stroke outline');
}

// Composite operations (Porter-Duff blending)
ctx.fillStyle = 'red';
ctx.fillRect(30, 30, 40, 40);

ctx.globalCompositeOperation = 'destination-over'; // Draw behind existing content
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 40, 40);

// All Porter-Duff operations supported:
// Source-bounded operations: source-over (default), destination-over, destination-out, xor
// Canvas-wide operations: destination-atop, destination-in, source-atop, source-in, source-out, copy

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
ctx.arc(cx, cy, radius, startAngle, endAngle, counterclockwise);
ctx.ellipse(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
ctx.arcTo(x1, y1, x2, y2, radius); // Rounded corners between lines
ctx.fill();
ctx.stroke();

// Path testing  
const isInside = ctx.isPointInPath(x, y, fillRule); // Test if point is inside current path
const isOnStroke = ctx.isPointInStroke(x, y); // Test if point is on stroke outline

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

// Shadow properties
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'; // Shadow color with transparency
ctx.shadowBlur = 8;                     // Blur radius in pixels
ctx.shadowOffsetX = 4;                  // Horizontal shadow offset
ctx.shadowOffsetY = 4;                  // Vertical shadow offset

// Drawing with shadows (works with all drawing operations)
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 100, 60);          // Rectangle with shadow
ctx.strokeStyle = 'green';
ctx.lineWidth = 3;
ctx.strokeRect(50, 120, 100, 60);       // Stroked rectangle with shadow

// Shadows work with paths and complex shapes
ctx.beginPath();
ctx.arc(300, 100, 40, 0, Math.PI * 2);
ctx.fillStyle = 'orange';
ctx.fill();                             // Circle with shadow

// Turn off shadows
ctx.shadowColor = 'transparent';        // Or set to 'rgba(0,0,0,0)'
```

### Color Setting
```javascript
ctx.setFillStyle(r, g, b, a);    // 0-255 values
ctx.setStrokeStyle(r, g, b, a);  // 0-255 values

// Shadow properties (Core API uses explicit RGBA values)
ctx.setShadowColor(0, 0, 0, 128);    // Semi-transparent black shadow
ctx.shadowBlur = 5;                  // 5px blur radius
ctx.shadowOffsetX = 3;               // 3px horizontal offset
ctx.shadowOffsetY = 3;               // 3px vertical offset

// Or use Color objects directly
const color = new SWCanvas.Core.Color(255, 128, 0, 200);
ctx.setFillStyle(color.r, color.g, color.b, color.a);

const shadowColor = new SWCanvas.Core.Color(0, 0, 0, 100);
ctx.setShadowColor(shadowColor.r, shadowColor.g, shadowColor.b, shadowColor.a);
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

// Shadows work with all paint sources
ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
ctx.shadowBlur = 6;
ctx.shadowOffsetX = 4;
ctx.shadowOffsetY = 4;
ctx.fillStyle = conicGrad;
ctx.fillRect(300, 10, 80, 80);           // Gradient fill with shadow
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

// Shadows work with all paint sources (Core API)
ctx.setShadowColor(0, 0, 0, 100);        // RGBA shadow color
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
ctx.setFillStyle(conicGrad);
ctx.fillRect(300, 200, 80, 80);          // Conic gradient fill with shadow
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

// Bit manipulation utility (used by mask classes)
const bitBuffer = new SWCanvas.Core.BitBuffer(100, 100, 0); // Default to 0s
bitBuffer.setPixel(50, 50, true);
console.log(bitBuffer.getPixel(50, 50)); // true

// Bounds tracking utility (used by SourceMask and ShadowBuffer)
const boundsTracker = new SWCanvas.Core.BoundsTracker();
boundsTracker.updateBounds(50, 75);
console.log(boundsTracker.getBounds()); // { minX: 50, maxX: 50, minY: 75, maxY: 75, isEmpty: false }

// Mask classes (use BitBuffer and BoundsTracker composition internally)
const clipMask = new SWCanvas.Core.ClipMask(800, 600);
const sourceMask = new SWCanvas.Core.SourceMask(800, 600);

// Image processing utilities
const validImage = SWCanvas.Core.ImageProcessor.validateAndConvert(imageData);

// Composite operations utilities
const supportedOps = SWCanvas.Core.CompositeOperations.getSupportedOperations();
const isSupported = SWCanvas.Core.CompositeOperations.isSupported('xor');

// Path processing utilities
const polygons = SWCanvas.Core.PathFlattener.flattenPath(path2d);
const strokePolys = SWCanvas.Core.StrokeGenerator.generateStrokePolygons(path2d, strokeProps);

// Color parsing utilities (for CSS color strings)
const color = SWCanvas.Core.ColorParser.parse('#FF0000');

// BMP encoding configuration
const encodingOptions = SWCanvas.Core.BitmapEncodingOptions.withGrayBackground(128);
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

### Image Export

#### PNG Export (Recommended - Supports Transparency)
```javascript
const pngData = SWCanvas.Core.PngEncoder.encode(surface);
// Returns ArrayBuffer containing PNG file data
// Preserves transparency without background compositing

// PNG with custom options
const pngOptions = SWCanvas.Core.PngEncodingOptions.withTransparency();
const pngData = SWCanvas.Core.PngEncoder.encode(surface, pngOptions);
```

#### BMP Export (Legacy - Background Compositing)
```javascript
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
// Returns ArrayBuffer containing BMP file data
// Transparent pixels composited with white background (default)

// Custom background colors for transparent pixel compositing
const grayOptions = SWCanvas.Core.BitmapEncodingOptions.withGrayBackground(128);
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface, grayOptions);

// Pre-defined background options
const blackBmp = SWCanvas.Core.BitmapEncoder.encode(surface, 
    SWCanvas.Core.BitmapEncodingOptions.withBlackBackground());
```

## Architecture

### Core Components (Object-Oriented Design)

- **Surface**: Memory buffer for pixel data
- **Context2D**: Drawing API and state management
- **Transform2D**: Transformation mathematics (immutable value object)
- **SWPath2D**: Path definition and flattening
- **Rasterizer**: Low-level pixel operations
- **Color**: Immutable color handling with premultiplied alpha support
- **Gradients**: Paint source objects for linear, radial, and conic gradients with color stops
- **Pattern**: Paint source objects for repeating image patterns with repetition modes
- **Geometry**: Point and Rectangle value objects
- **BitBuffer**: 1-bit per pixel utility for efficient bit manipulation (composition component)
- **BoundsTracker**: Reusable bounds tracking utility for optimization (composition component)
- **ClipMask**: 1-bit clipping buffer using BitBuffer composition
- **SourceMask**: 1-bit source coverage tracking using BitBuffer and BoundsTracker composition
- **DrawingState**: Context state stack management
- **PolygonFiller**: Scanline-based polygon filling with paint source support
- **StrokeGenerator**: Geometric stroke generation (static methods)  
- **PathFlattener**: Path-to-polygon conversion (static methods)
- **PngEncoder**: PNG file format export with transparency support (static methods)
- **PngEncodingOptions**: Immutable PNG encoding configuration (Joshua Bloch pattern)
- **BitmapEncoder**: BMP file format export (static methods)  
- **BitmapEncodingOptions**: Immutable BMP encoding configuration (Joshua Bloch pattern)

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
├── BitmapEncodingOptions.js # BMP encoding configuration (immutable options)
├── ColorParser.js   # CSS color string parsing (static methods)
└── SWPath2D.js      # Path definition (class)

tests/            # Test suite
├── core-functionality-tests.js # Core functionality tests
├── visual-rendering-tests.js    # 138+ visual tests
└── run-tests.js            # Node.js test runner

tests/browser/    # Browser tests
├── index.html       # Main visual comparison tool (moved from examples/)
├── minimal-example.html # Minimal usage example
└── browser-test-helpers.js # Interactive test utilities

dist/             # Built library
└── swcanvas.js      # Concatenated distribution file
```

## Test Architecture

SWCanvas uses a comprehensive dual test system:
- **36 core functionality tests**: Programmatic API verification with assertions
- **138 visual rendering tests**: PNG (lossless) generation and comparison
- **Modular architecture**: Individual test files auto-concatenated at build time

See [tests/README.md](tests/README.md) for complete test documentation, adding tests, and build utilities.

**Test Count Maintenance**: The `npm run update-test-counts` command automatically updates test count references across all documentation files to match the actual filesystem. This ensures documentation accuracy as tests are added or removed.

### Build Process

The build script (`build.sh`) concatenates source files in dependency order, following OO architecture:

**Phase 1: Foundation Classes**
1. Color - Immutable color handling
2. Point - Immutable 2D point operations
3. Rectangle - Immutable rectangle operations
4. Transform2D - Transformation mathematics
5. SWPath2D - Path definitions
6. Surface - Memory buffer management

**Phase 2: Service Classes**
7. BitmapEncodingOptions - BMP encoding configuration (immutable options)
8. BitmapEncoder - BMP file encoding (static methods)
9. PathFlattener - Path-to-polygon conversion (static methods)
10. PolygonFiller - Scanline filling with paint sources (static methods)
11. StrokeGenerator - Stroke generation (static methods) 
12. BitBuffer - 1-bit per pixel utility (composition component)
13. BoundsTracker - Reusable bounds tracking utility (composition component)
14. ClipMask - 1-bit stencil buffer management (class)
15. SourceMask - 1-bit source coverage tracking (class)
16. ShadowBuffer - Sparse shadow alpha storage (class)
17. ImageProcessor - ImageLike validation and conversion (static methods)
18. ColorParser - CSS color string parsing (static methods)

**Phase 2.5: Paint Sources**
19. Gradient - Linear, radial, and conic gradient paint sources
20. Pattern - Repeating image pattern paint sources

**Phase 3: Rendering Classes**
21. Rasterizer - Rendering pipeline (class)
22. Context2D - Main drawing API (class)

## License

MIT License - see LICENSE file for details.

## Contributing

1. **Build**: `npm run build`
2. **Test**: `npm test` 
3. **Visual Test**: Open `tests/browser/index.html` in browser
4. **Add Tests**: Create individual test files in `/tests/core/` or `/tests/visual/` (see renumbering utility for advanced organization)
5. **Verify**: Ensure identical results in both Node.js and browser

The comprehensive test suite ensures any changes maintain compatibility/similarity with HTML5 Canvas.