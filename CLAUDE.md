# Claude Code Context - SWCanvas

This file provides Claude with essential context about the SWCanvas project for efficient collaboration and development.

## Project Overview

**SWCanvas** is a deterministic 2D raster engine with Canvas-like API that produces pixel-perfect, identical results across all platforms. It's designed as a drop-in replacement for HTML5 Canvas 2D Context with additional deterministic guarantees.

### Key Characteristics
- **Deterministic**: Same input → same output on any platform
- **Cross-platform**: Works identically in Node.js and browsers  
- **Canvas-compatible**: Familiar HTML5 Canvas 2D API
- **Memory efficient**: 1-bit stencil clipping, optimized algorithms
- **Well-tested**: 31 shared tests + 52 visual tests with pixel-perfect validation

## Architecture (Object-Oriented Design)

### Core Components
```
src/Context2D.js         # Main API - implements Canvas 2D Context interface
src/Rasterizer.js        # Low-level pixel operations and rendering pipeline (ES6 class)
src/Surface.js           # Memory buffer management - RGBA pixel data (ES6 class)
src/Transform2D.js       # Transform mathematics - immutable transformation matrix (ES6 class)
src/Path2D.js           # Path definition and command recording (ES6 class)
src/Color.js            # Immutable color handling with premultiplied alpha (ES6 class)
src/Point.js            # Immutable 2D point operations (ES6 class)
src/Rectangle.js        # Immutable rectangle operations (ES6 class)
src/PolygonFiller.js    # Scanline polygon filling with stencil clipping (static methods)
src/PathFlattener.js    # Converts paths to polygons (static methods)
src/StrokeGenerator.js  # Geometric stroke path generation (static methods)
src/BitmapEncoder.js    # BMP file format encoding (static methods)
src/ClipMaskHelper.js   # 1-bit stencil buffer manipulation utilities (static methods)
src/ImageProcessor.js   # ImageLike validation and format conversion (static methods)
src/StencilBuffer.js    # 1-bit clipping buffer management (ES6 class)
src/DrawingState.js     # Context state stack management (ES6 class)
```

### Key Systems

#### Stencil-Based Clipping System
- Uses 1-bit per pixel stencil buffer (memory efficient)
- **ClipMaskHelper class**: Encapsulates all bit manipulation operations
- Supports proper clip intersections with AND operations
- Handles nested clipping via save/restore stack
- Static utility methods for creating, manipulating, and checking stencil buffers

#### Color System (Object-Oriented Design)
- **Color class**: Immutable color handling with premultiplied alpha internally
- **Surface class**: Stores non-premultiplied RGBA (0-255) with immutable dimensions
- Color class handles conversion between premultiplied/non-premultiplied forms
- CSS color names mapped to exact RGB values in `tests/test-colors.js`
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

## Build & Test Commands

### Essential Commands
```bash
# Build the library
npm run build          # or ./build.sh

# Run all tests (shared + visual BMP generation)
npm test              # or node tests/run-tests.js

# Check test status
ls -la tests/output/  # Should see 55+ BMP files after test run
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
1. **Shared Tests** (`tests/shared-test-suite.js`) - 31 core functionality tests
2. **Visual Tests** (`tests/visual-test-registry.js`) - 52 rendering tests  
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

## Public API (Object-Oriented Design)

### Core Classes
- **SWCanvas.Surface(width, height)**: Create rendering surface with immutable dimensions
- **SWCanvas.Context2D(surface)**: Canvas 2D context implementation
- **SWCanvas.Transform2D([a,b,c,d,e,f])**: Immutable transformation matrix
- **SWCanvas.Point(x, y)**: Immutable 2D point with geometric operations
- **SWCanvas.Rectangle(x, y, width, height)**: Immutable rectangle with bounds operations
- **SWCanvas.Color(r, g, b, a, premultiplied)**: Immutable color with alpha handling
- **SWCanvas.Path2D()**: Path definition and command recording

### Utility Classes
- **SWCanvas.BitmapEncoder**: Static methods for BMP file encoding
- **SWCanvas.ClipMaskHelper**: Static utilities for stencil buffer manipulation
- **SWCanvas.ImageProcessor**: Static methods for ImageLike validation and conversion

### Legacy Aliases
- **SWCanvas.Matrix**: Alias for Transform2D (backward compatibility)
- **SWCanvas.encodeBMP(surface)**: Legacy function for BMP encoding

## Common Tasks

### Adding New Visual Tests
Add to `tests/visual-test-registry.js`:
```javascript
visualTests['new-test-name'] = {
    name: 'Human-readable description',
    width: 200, height: 150,
    drawSWCanvas: function(SWCanvas) {
        const surface = SWCanvas.Surface(200, 150);
        const ctx = new SWCanvas.Context2D(surface);
        helpers.setSWCanvasFill(ctx, 'red');  // Use color helpers
        ctx.fillRect(10, 10, 50, 50);
        return surface;
    },
    drawHTML5Canvas: function(html5Canvas) {
        const ctx = html5Canvas.getContext('2d');
        helpers.setHTML5CanvasFill(ctx, 'red');  // Same operations
        ctx.fillRect(10, 10, 50, 50);
    }
};
```

### Using the New OO Classes
```javascript
// Create surface with enhanced validation
const surface = SWCanvas.Surface(400, 300);

// Use immutable Transform2D with factory methods
const transform = SWCanvas.Transform2D.identity()
    .translate(100, 50)
    .scale(2, 2)
    .rotate(Math.PI / 4);

// Create geometric objects
const point = new SWCanvas.Point(10, 20);
const rect = new SWCanvas.Rectangle(0, 0, 100, 100);
const center = rect.center; // Point(50, 50)

// Advanced color handling
const color = new SWCanvas.Color(255, 0, 0, 128); // Semi-transparent red
const premult = color.toPremultiplied();

// Utility operations
const clipMask = SWCanvas.ClipMaskHelper.createClipMask(400, 300);
const imageData = SWCanvas.ImageProcessor.validateAndConvert(rgbImage);
```

### Debugging Rendering Issues
1. Add debug visual test with simplified case
2. Generate BMP: `npm test`  
3. Compare with HTML5 Canvas in browser: `examples/test.html`
4. Check pixel values manually if needed
5. Use git to compare before/after BMPs

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
- **Comprehensive Testing**: All 31 shared tests + 52 visual tests passing with pixel-perfect accuracy

### Key Design Patterns Applied
- **Value Object Pattern**: Point, Rectangle, Transform2D, Color are immutable with proper equals()
- **Factory Methods**: Transform2D.identity(), .translation(), .scaling(), .rotation()
- **Static Utility Classes**: ClipMaskHelper, ImageProcessor for pure functions
- **Composition over Inheritance**: Classes use other classes rather than extending
- **Defensive Programming**: Comprehensive validation with descriptive error messages
- **Memory Efficiency**: 1-bit stencil clipping, immutable objects prevent accidental mutation

### Test Results Status
- **Node.js**: All 31 shared tests passing, 52 visual BMPs generated successfully  
- **Browser**: Proper SWCanvas global export, all classes available for use
- **Cross-platform**: Identical behavior verified between Node.js and browser environments
- **Deterministic**: Same input produces identical output across all platforms

## Important Notes for Claude

### When Debugging Tests
- **Always run full test suite** after changes: `npm test`
- **Browser vs Node.js differences** - use same visual test registry for consistency
- **Color consistency** - use helpers from `tests/test-colors.js`
- **Coordinate expectations** - test pixel positions are carefully calculated

### When Making Changes  
- **Update both paths** - SWCanvas and HTML5Canvas implementations in visual tests
- **Verify cross-platform** - test in both Node.js and browser
- **Check all phases** - changes may affect multiple test categories
- **Build before testing** - `npm run build` then `npm test`

### OO Development Patterns
- **Use proper classes**: Prefer `new SWCanvas.Point(x, y)` over plain objects
- **Leverage immutability**: Transform2D, Point, Rectangle, Color are immutable - use their methods
- **Static utilities**: Use ClipMaskHelper for bit operations, ImageProcessor for format conversion
- **Factory methods**: Use Transform2D.identity(), .translation(), etc. for common transformations
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