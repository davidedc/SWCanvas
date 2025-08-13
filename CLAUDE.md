# Claude Code Context - SWCanvas

This file provides Claude with essential context about the SWCanvas project for efficient collaboration and development.

## Project Overview

**SWCanvas** is a deterministic 2D raster engine with Canvas-like API that produces pixel-perfect, identical results across all platforms. It's designed as a drop-in replacement for HTML5 Canvas 2D Context with additional deterministic guarantees.

### Key Characteristics
- **Deterministic**: Same input → same output on any platform
- **Cross-platform**: Works identically in Node.js and browsers  
- **Canvas-compatible**: Familiar HTML5 Canvas 2D API
- **Memory efficient**: 1-bit stencil clipping, optimized algorithms
- **Well-tested**: 55+ visual tests with pixel-perfect validation

## Architecture (Object-Oriented Design)

### Core Components
```
src/Context2D.js      # Main API - implements Canvas 2D Context interface (class)
src/Rasterizer.js     # Low-level pixel operations and rendering pipeline (prototype-based) 
src/PolygonFiller.js  # Scanline polygon filling with stencil clipping (static methods)
src/Matrix.js         # Transform mathematics - immutable value object (class)
src/Surface.js        # Memory buffer management - RGBA pixel data (factory + class)
src/Path2D.js         # Path definition and command recording (class)
src/PathFlattener.js  # Converts paths to polygons (static methods)
src/StrokeGenerator.js # Geometric stroke path generation (static methods)
src/BitmapEncoder.js  # BMP file format encoding for output (static methods)
src/Color.js          # Immutable color handling with premultiplied alpha (class)
src/Geometry.js       # Point and Rectangle value objects (classes)
src/StencilBuffer.js  # 1-bit clipping buffer management (class)
src/DrawingState.js   # Context state stack management (class)
```

### Key Systems

#### Stencil-Based Clipping System
- Uses 1-bit per pixel stencil buffer (memory efficient)
- Supports proper clip intersections with AND operations
- Handles nested clipping via save/restore stack
- **No legacy polygon clipping code** - uses only stencil approach

#### Color System (OO Design)
- **Color class**: Immutable color handling with premultiplied alpha internally
- Surface stores **non-premultiplied RGBA** (0-255)
- Color class handles conversion between premultiplied/non-premultiplied forms
- CSS color names mapped to exact RGB values in `tests/test-colors.js`
- Alpha blending uses source-over composition with correct math
- Global alpha applied correctly via `Color.withGlobalAlpha()` method

#### Transform System
- Matrix-based transformations (translate, scale, rotate)
- Accumulative: `transform()` multiplies with current matrix
- Absolute: `setTransform()` replaces current matrix
- Transform order matters: translate→scale ≠ scale→translate

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
2. **Visual Tests** (`tests/visual-test-registry.js`) - 55+ rendering tests  
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

## Current Status (As of Latest OO Refactoring)

### Recently Completed ✅
- **Object-Oriented Refactoring**: Complete conversion to ES6 classes following Joshua Bloch principles
- **Alpha Blending Fixes**: Corrected premultiplied vs non-premultiplied alpha handling throughout
- **Stroke Generation**: Fixed round joins, miter limits, and missing helper functions
- **Legacy Code Cleanup**: Removed all old functional implementation backup files
- **Documentation Updates**: Updated README.md and CLAUDE.md to reflect OO structure
- **Build System**: Updated dependency order for new class hierarchy
- **Test Coverage**: All 31 shared tests + 52 visual tests passing with pixel-perfect accuracy

### New OO Architecture Details
- **Immutable Value Objects**: Color, Point, Rectangle, Matrix classes
- **Static Algorithm Classes**: PolygonFiller, StrokeGenerator, PathFlattener, BitmapEncoder
- **Encapsulated State Management**: StencilBuffer, DrawingState classes
- **Proper Separation of Concerns**: Each class has single responsibility
- **Consistent Alpha Handling**: Color class manages premultiplied/non-premultiplied conversion
- **Memory Efficient**: StencilBuffer for 1-bit clipping, immutable objects prevent mutation bugs

### Test Output Status
- **Node.js**: All tests passing, 52+ BMPs generated with correct alpha blending
- **Browser**: All visual tests now produce pixel-perfect matches with HTML5 Canvas
- **Alpha Issues Fixed**: "Debug Alpha Blending Issue" and "Scaled Stroke Behavior" now correct
- All test outputs in `tests/output/` reflect new OO implementation

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

### OO Code Patterns
- **Error handling**: Throw descriptive errors with proper validation in constructors
- **Memory efficiency**: Use immutable value objects, avoid buffer duplication
- **Color handling**: Use Color class for all color operations, handles premultiplied/non-premultiplied correctly
- **Matrix math**: Use Matrix class methods, immutable transformations
- **Static methods**: Use for stateless algorithms (PolygonFiller, StrokeGenerator, etc.)
- **Class hierarchy**: Foundation → Core → Algorithm → High-level (see build.sh dependency order)
- **Encapsulation**: Private methods with underscore prefix, public API clearly defined

### Key OO Principles Applied
- **Single Responsibility**: Each class has one clear purpose
- **Immutability**: Color, Point, Rectangle, Matrix are immutable value objects
- **Composition over Inheritance**: Classes use other classes rather than extending
- **Joshua Bloch Guidelines**: Effective use of static methods, immutability, clear APIs

This context should help Claude understand the new OO project structure, current status, and development patterns for effective collaboration.