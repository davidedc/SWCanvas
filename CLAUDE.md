# Claude Code Context - SWCanvas

This file provides Claude with essential context about the SWCanvas project for efficient collaboration and development.

## Project Overview

**SWCanvas** is a deterministic 2D raster engine with dual API architecture that produces pixel-perfect, identical results across all platforms. It provides both HTML5 Canvas-compatible API and a high-performance Core API.

### Key Characteristics
- **Deterministic**: Same input → same output on any platform
- **Cross-platform**: Works identically in Node.js and browsers  
- **Dual API**: HTML5-compatible API for portability + Core API for performance
- **Drop-in replacement**: True HTML5 Canvas 2D Context compatibility
- **Memory efficient**: 1-bit stencil clipping, optimized algorithms
- **Sub-pixel accurate**: Thin strokes render with proportional opacity (no anti-aliasing)
- **Well-tested**: 32 shared tests + 57 visual tests with pixel-perfect validation

## Dual API Architecture

SWCanvas provides two complementary APIs for different use cases:

### 1. HTML5 Canvas-Compatible API (Recommended for Portability)
```javascript
// Drop-in replacement for HTML5 Canvas
const canvas = SWCanvas.createCanvas(800, 600);
const ctx = canvas.getContext('2d');

// Standard HTML5 Canvas API
ctx.fillStyle = '#FF0000';
ctx.strokeStyle = 'blue';
ctx.lineWidth = 2;
ctx.fillRect(10, 10, 100, 100);

// Works with CSS colors, named colors, hex, rgb(), rgba()
ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
```

### 2. Core API (Recommended for Performance/Control)
```javascript
// Direct access to optimized rendering engine
const surface = SWCanvas.Core.Surface(800, 600);
const ctx = new SWCanvas.Core.Context2D(surface);

// Explicit RGBA values (0-255) - no color parsing overhead
ctx.setFillStyle(255, 0, 0, 255);
ctx.setStrokeStyle(0, 0, 255, 255);
ctx.lineWidth = 2;
ctx.fillRect(10, 10, 100, 100);

// Direct access to advanced features
const color = new SWCanvas.Core.Color(0, 255, 0, 128);
const transform = new SWCanvas.Core.Transform2D().translate(100, 50);
```

### When to Use Which API

**Use HTML5-Compatible API for:**
- Drop-in HTML5 Canvas replacement
- Cross-platform code that runs in browsers
- CSS color support (hex, named colors, rgb/rgba functions)
- Familiar, standard web development workflow
- Gradual migration from HTML5 Canvas

**Use Core API for:**
- Performance-critical applications
- Color-intensive operations (avoids parsing overhead)
- Advanced geometric operations with Point/Rectangle classes
- Direct access to rendering internals
- Custom rendering pipelines

### Interoperability
Both APIs are fully interoperable:
```javascript
// Create with Canvas API
const canvas = SWCanvas.createCanvas(200, 200);
const ctx = canvas.getContext('2d');

// Access underlying Core surface for advanced operations
const surface = canvas._coreSurface;
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);

// Or access Core context for performance-critical sections
const coreCtx = ctx._coreContext;
coreCtx.setFillStyle(255, 0, 0, 255); // Skip color parsing
```

## Architecture (Object-Oriented Design)

### Core Components
```
# Core Rendering Engine (SWCanvas.Core.*)
src/Context2D.js              # Core 2D rendering context (explicit RGBA API)
src/Rasterizer.js             # Low-level pixel operations and rendering pipeline
src/Surface.js                # Memory buffer management - RGBA pixel data
src/Transform2D.js            # Immutable transformation matrix mathematics
src/Path2D.js                 # Path definition and command recording
src/Color.js                  # Immutable color handling with premultiplied alpha
src/Point.js                  # Immutable 2D point operations
src/Rectangle.js              # Immutable rectangle operations
src/PolygonFiller.js          # Scanline polygon filling with stencil clipping
src/PathFlattener.js          # Converts paths to polygons
src/StrokeGenerator.js        # Geometric stroke path generation
src/BitmapEncoder.js          # BMP file format encoding
src/ClipMask.js               # 1-bit stencil buffer clipping implementation
src/ImageProcessor.js         # ImageLike validation and format conversion

# HTML5 Canvas Compatibility Layer
src/SWCanvasElement.js        # Canvas-like object (width/height properties, getContext)
src/CanvasCompatibleContext2D.js  # HTML5 Canvas 2D Context API wrapper
src/ColorParser.js            # CSS color string parsing (hex, rgb, named colors)
```

### Key Systems

#### Stencil-Based Clipping System
- Uses 1-bit per pixel stencil buffer (memory efficient)
- **ClipMask class**: Encapsulates all bit manipulation operations
- Supports proper clip intersections with AND operations
- Handles nested clipping via save/restore stack
- Instance methods for creating, manipulating, and checking stencil buffers

#### Color System (Object-Oriented Design)
- **Color class**: Immutable color handling with premultiplied alpha internally
- **Surface class**: Stores non-premultiplied RGBA (0-255) with immutable dimensions
- Color class handles conversion between premultiplied/non-premultiplied forms
- CSS color names mapped to exact RGB values using standard Canvas API
- Alpha blending uses source-over composition with correct math
- Global alpha applied correctly via `Color.withGlobalAlpha()` method

#### Transform System
- **Transform2D class**: Immutable transformation matrix (replaces Matrix)
- Static factory methods: `Transform2D.identity()`, `.translation()`, `.scaling()`, `.rotation()`
- Accumulative: `transform()` multiplies with current matrix
- Absolute: `setTransform()` replaces current matrix
- Transform order matters: translate→scale ≠ scale→translate
- Comprehensive API with validation and utility methods

#### Geometry System
- **Point class**: Immutable 2D points with rich operations (distance, interpolation, transformations)
- **Rectangle class**: Immutable rectangles with geometric operations (union, intersection, bounds checking)
- Both classes follow value object pattern with proper equals() methods
- Extensive mathematical operations for geometric computations

#### Sub-pixel Stroke System
- **Deterministic sub-pixel rendering**: Strokes thinner than 1px render with proportional opacity
- **Zero-width stroke handling**: `lineWidth = 0` renders at full opacity (matches HTML5Canvas behavior)
- **Opacity-based thinning**: 0.5px stroke = 1px stroke at 50% opacity (no anti-aliasing)
- **Implementation location**: `Rasterizer.js:270-280` applies opacity adjustment before stroke generation
- **Formula**: `subPixelOpacity = lineWidth === 0 ? 1.0 : lineWidth`
- **Visual consistency**: Maintains deterministic pixel-perfect output across platforms
- **Browser compatibility**: Matches modern HTML5Canvas behavior for edge cases

## Build & Test Commands

### Essential Commands
```bash
# Build the library
npm run build          # or ./build.sh

# Run all tests (shared + visual BMP generation)
npm test              # or node tests/run-tests.js

# Check test status
ls -la tests/output/  # Should see 58+ BMP files after test run
```

### Development Workflow
```bash
# 1. Make changes to src/ files
# 2. Build to regenerate dist/swcanvas.js  
npm run build

# 3. Run tests to verify no regressions
npm test

# 4. Browser testing (open in browser)
open examples/test.html

# 5. Check specific test output if needed
node -e "console.log(require('./tests/shared-test-suite.js'))"
```

## Test System Architecture

### Three Test Layers
1. **Shared Tests** (`tests/shared-test-suite.js`) - 32 core functionality tests
2. **Visual Tests** (`tests/visual-test-registry.js`) - 58 rendering tests  
3. **Browser Tests** (`examples/test.html`) - Interactive comparisons

### Test Execution
- **Node.js**: `npm test` runs shared tests + generates BMP files
- **Browser**: Open `examples/test.html` for visual comparisons
- **Both use same test definitions** - no code duplication

### Key Test Categories
- **Phase 1**: Basic transforms (translate/scale/rotate)
- **Phase 2**: Advanced fills (curves, self-intersecting, fill rules)
- **Phase 3**: Stencil clipping (intersection, nesting)
- **Phase 4**: Combined features (transform+clip+fill+stroke)
- **Phase 5**: Image operations (drawImage with transforms and alpha)

## Public API (Dual Architecture)

### HTML5 Canvas-Compatible API
- **SWCanvas.createCanvas(width, height)**: Create HTML5-style canvas element
```javascript
const canvas = SWCanvas.createCanvas(800, 600);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 100);
```

### Core API (SWCanvas.Core.*)
- **Core.Surface(width, height)**: Create rendering surface with immutable dimensions
- **Core.Context2D(surface)**: Core 2D context with explicit RGBA API
- **Core.Transform2D([a,b,c,d,e,f])**: Immutable transformation matrix
- **Core.Point(x, y)**: Immutable 2D point with geometric operations
- **Core.Rectangle(x, y, width, height)**: Immutable rectangle with bounds operations
- **Core.Color(r, g, b, a, premultiplied)**: Immutable color with alpha handling
- **Core.Path2D()**: Path definition and command recording

### Core Utility Classes
- **Core.BitmapEncoder**: Static methods for BMP file encoding
- **Core.ClipMask**: ES6 class for stencil buffer manipulation  
- **Core.ImageProcessor**: Static methods for ImageLike validation and conversion

### Legacy API (Backward Compatibility)
All existing SWCanvas APIs continue to work unchanged:
- **SWCanvas.Surface(width, height)**: Points to Core.Surface
- **SWCanvas.Context2D(surface)**: Points to Core.Context2D
- **SWCanvas.Transform2D**: Points to Core.Transform2D
- **SWCanvas.Matrix**: Alias for Core.Transform2D
- **SWCanvas.encodeBMP(surface)**: Legacy function for BMP encoding

*Note: Legacy API maintains full backward compatibility while the Core API provides explicit namespace organization.*

## Common Tasks

### Adding New Visual Tests

**Recommended: registerVisualTest Helper (Current Approach)**
```javascript
registerVisualTest('new-test-name', {
    name: 'Human-readable description',
    width: 200, height: 150,
    // Single function works with both Canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';          // Standard HTML5 Canvas API
        ctx.fillRect(10, 10, 50, 50);
    }
    // Backward compatibility functions auto-generated by registerVisualTest
});
```

The `registerVisualTest` helper automatically generates the required `drawSWCanvas` and `drawHTML5Canvas` functions, eliminating boilerplate code while maintaining full compatibility with existing test runners.

**Legacy: Manual Registration (still supported)**
```javascript
visualTests['legacy-test'] = {
    name: 'Legacy dual-function approach',
    width: 200, height: 150,
    drawSWCanvas: function(SWCanvas) {
        const surface = SWCanvas.Core.Surface(200, 150);
        const ctx = new SWCanvas.Core.Context2D(surface);
        ctx.setFillStyle(255, 0, 0, 255);  // Core API
        ctx.fillRect(10, 10, 50, 50);
        return surface;
    },
    drawHTML5Canvas: function(html5Canvas) {
        const ctx = html5Canvas.getContext('2d');
        ctx.fillStyle = 'red';  // HTML5 Canvas API
        ctx.fillRect(10, 10, 50, 50);
    }
};
```

### Using the Dual API

**HTML5-Compatible API Usage:**
```javascript
// Create HTML5-style canvas
const canvas = SWCanvas.createCanvas(400, 300);
const ctx = canvas.getContext('2d');

// Standard HTML5 Canvas operations
ctx.fillStyle = '#FF0000';
ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
ctx.lineWidth = 2;
ctx.fillRect(10, 10, 100, 100);

// Canvas properties work as expected
canvas.width = 800;   // Automatically resizes
canvas.height = 600;

// Sub-pixel stroke rendering (deterministic)
ctx.lineWidth = 0.5;  // Renders as 1px stroke at 50% opacity
ctx.beginPath();
ctx.moveTo(10, 10);
ctx.lineTo(100, 10);
ctx.stroke();
```

**Core API Usage (Performance/Control):**
```javascript
// Create surface with Core API
const surface = SWCanvas.Core.Surface(400, 300);
const ctx = new SWCanvas.Core.Context2D(surface);

// Explicit RGBA operations (no color parsing)
ctx.setFillStyle(255, 0, 0, 255);      // Red, fully opaque
ctx.setStrokeStyle(0, 255, 0, 128);    // Green, 50% alpha

// Use immutable Transform2D with method chaining
const transform = new SWCanvas.Core.Transform2D()
    .translate(100, 50)
    .scale(2, 2)
    .rotate(Math.PI / 4);

// Create geometric objects
const point = new SWCanvas.Core.Point(10, 20);
const rect = new SWCanvas.Core.Rectangle(0, 0, 100, 100);
const center = rect.center; // Point(50, 50)

// Advanced color handling
const color = new SWCanvas.Core.Color(255, 0, 0, 128); // Semi-transparent red
const premult = color.toPremultiplied();

// Utility operations
const clipMask = new SWCanvas.Core.ClipMask(400, 300);
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
```

### Debugging Rendering Issues
1. Add debug visual test with simplified case
2. Generate BMP: `npm test`  
3. Compare with HTML5 Canvas in browser: `examples/test.html`
4. Check pixel values manually if needed
5. Use git to compare before/after BMPs

#### Quick Node.js Analysis Scripts
Use one-liner Node.js scripts for rapid debugging and pixel-level analysis:

**Pixel Inspection Example (HTML5-Compatible API):**
```bash
node -e "
const SWCanvas = require('./dist/swcanvas.js');
const canvas = SWCanvas.createCanvas(100, 100);
const ctx = canvas.getContext('2d');

// Test your drawing operations
ctx.strokeStyle = 'red';
ctx.lineWidth = 0.5;
ctx.beginPath();
ctx.moveTo(50, 50);
ctx.lineTo(80, 50);
ctx.stroke();

// Access underlying surface for pixel analysis
const surface = canvas._coreSurface;
for (let x = 45; x <= 85; x += 5) {
  const offset = 50 * surface.stride + x * 4;
  const r = surface.data[offset];
  const g = surface.data[offset + 1];
  const b = surface.data[offset + 2];
  if (r !== 255 || g !== 255 || b !== 255) {
    console.log(\`Pixel at (\${x},50): R=\${r}, G=\${g}, B=\${b}\`);
  }
}
"
```

**Stroke Width Analysis Example:**
```bash
node -e "
const SWCanvas = require('./dist/swcanvas.js');
const surface = SWCanvas.Surface(200, 100);
const ctx = new SWCanvas.Context2D(surface);

// White background
ctx.setFillStyle(255, 255, 255, 255);
ctx.fillRect(0, 0, 200, 100);

// Test different stroke widths
const widths = [0, 0.1, 0.5, 1.0];
widths.forEach((width, i) => {
  const y = 20 + i * 15;
  ctx.setStrokeStyle(0, 0, 255, 255);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(150, y);
  ctx.stroke();
  
  // Check if stroke rendered (strokes may render at y-1 due to pixel grid alignment)
  let hasStroke = false;
  for (let checkY = y - 1; checkY <= y + 1; checkY++) {
    const offset = checkY * surface.stride + 100 * 4;
    if (surface.data[offset] !== 255 || surface.data[offset + 1] !== 255 || surface.data[offset + 2] !== 255) {
      hasStroke = true;
      break;
    }
  }
  console.log(\`\${width}px stroke at y=\${y}: \${hasStroke ? 'VISIBLE' : 'not visible'}\`);
});
"
```

**Behavior Comparison Example:**
```bash
node -e "
const SWCanvas = require('./dist/swcanvas.js');

console.log('=== FEATURE ANALYSIS ===');
const surface = SWCanvas.Surface(100, 100);
const ctx = new SWCanvas.Context2D(surface);

// Test specific behavior
ctx.setFillStyle(255, 255, 255, 255);
ctx.fillRect(0, 0, 100, 100);

try {
  ctx.lineWidth = 0;  // Test edge case
  ctx.setStrokeStyle(255, 0, 0, 255);
  ctx.beginPath();
  ctx.moveTo(20, 50);
  ctx.lineTo(80, 50);
  ctx.stroke();
  console.log('✓ Zero-width stroke accepted');
} catch (e) {
  console.log('✗ Zero-width stroke rejected:', e.message);
}
"
```

**Visual Comparison with File Output:**
```bash
node -e "
const SWCanvas = require('./dist/swcanvas.js');
const fs = require('fs');

// Create test image
const surface = SWCanvas.Surface(100, 100);
const ctx = new SWCanvas.Context2D(surface);

// Your drawing code here
ctx.setFillStyle(255, 0, 0, 255);
ctx.fillRect(25, 25, 50, 50);

// Save for visual inspection
const bmpData = SWCanvas.BitmapEncoder.encode(surface);
fs.writeFileSync('debug-output.bmp', Buffer.from(bmpData));
console.log('Saved debug image: debug-output.bmp');
"
```

These scripts are invaluable for:
- Quick pixel-level validation
- Testing edge cases and behavior differences
- Analyzing sub-pixel rendering effects
- Comparing stroke and fill operations
- Debugging coordinate transformations

### Making API Changes (OO Structure)
1. Update `src/Context2D.js` for public API changes
2. Update `src/Rasterizer.js` for rendering pipeline changes
3. Update relevant classes (`PolygonFiller.js`, `StrokeGenerator.js`, etc.) as needed
4. Ensure both SWCanvas and HTML5Canvas paths in tests do the same thing
5. Run full test suite to verify no regressions

## Current Architecture Status

### Object-Oriented Design Implementation ✅
- **Complete ES6 Class Architecture**: All core components converted following Joshua Bloch principles
- **Immutable Value Objects**: Color, Point, Rectangle, Transform2D classes prevent mutation bugs
- **Static Utility Classes**: ClipMaskHelper, ImageProcessor, BitmapEncoder for stateless operations
- **Proper Encapsulation**: Private fields, parameter validation, and clear public APIs
- **Single Responsibility**: Each class has one focused purpose with clean boundaries
- **Comprehensive Testing**: All 32 shared tests + 58 visual tests passing with pixel-perfect accuracy

### Key Design Patterns Applied
- **Value Object Pattern**: Point, Rectangle, Transform2D, Color are immutable
- **Factory Methods**: Transform2D.translation(), .scaling(), .rotation() for common transforms
- **Static Utility Classes**: BitmapEncoder, ImageProcessor for pure functions
- **Composition over Inheritance**: Classes use other classes rather than extending
- **Defensive Programming**: Comprehensive validation with descriptive error messages
- **Memory Efficiency**: 1-bit stencil clipping, immutable objects prevent accidental mutation

### Test Results Status
- **Node.js**: All 32 shared tests passing, 58 visual BMPs generated successfully  
- **Browser**: Proper SWCanvas global export, all classes available for use
- **Cross-platform**: Identical behavior verified between Node.js and browser environments
- **Deterministic**: Same input produces identical output across all platforms

## Important Notes for Claude

### When Debugging Tests
- **Always run full test suite** after changes: `npm test`
- **Browser vs Node.js differences** - use same visual test registry for consistency
- **Color consistency** - use standard Canvas API (`ctx.fillStyle`, `ctx.strokeStyle`)
- **Coordinate expectations** - test pixel positions are carefully calculated

### When Making Changes  
- **Update both paths** - SWCanvas and HTML5Canvas implementations in visual tests
- **Verify cross-platform** - test in both Node.js and browser
- **Check all phases** - changes may affect multiple test categories
- **Build before testing** - `npm run build` then `npm test`

### OO Development Patterns
- **Use proper classes**: Prefer `new SWCanvas.Point(x, y)` over plain objects
- **Leverage immutability**: Transform2D, Point, Rectangle, Color are immutable - use their methods
- **Static utilities**: Use ClipMask class for bit operations, ImageProcessor for format conversion
- **Factory methods**: Use Transform2D constructor and .translation(), .scaling(), .rotation() for common transformations
- **Validation**: All classes validate input parameters with descriptive error messages
- **Composition**: Classes work together rather than through inheritance hierarchies
- **Encapsulation**: Use public APIs, private methods marked with underscore prefix

### Key Architecture Principles
- **Single Responsibility**: Each class handles one specific concern
- **Immutability**: Value objects prevent accidental state mutations
- **Static Methods**: Used for pure functions and utilities without state
- **Defensive Programming**: Comprehensive parameter validation at class boundaries
- **Clean APIs**: Clear public interfaces with proper documentation
- **Memory Efficiency**: Optimized data structures (1-bit stencil buffers, efficient pixel operations)

### File Organization
- **One Class Per File**: Each class in its own appropriately named file
- **Clear Dependencies**: Build script maintains proper dependency order
- **Focused Modules**: Related functionality grouped logically (geometry/, rendering/, etc.)

This context reflects the current object-oriented architecture and development patterns for effective collaboration.