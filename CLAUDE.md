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

## Architecture

### Core Components
```
src/context2d.js      # Main API - implements Canvas 2D Context interface
src/rasterizer.js     # Low-level pixel operations and rendering pipeline  
src/polygon-filler.js # Scanline polygon filling with stencil clipping
src/matrix.js         # Transform mathematics (translate/scale/rotate)
src/surface.js        # Memory buffer management (RGBA pixel data)
src/path2d.js         # Path definition and command recording
src/path-flattener.js # Converts paths (lines/curves) to polygons
src/stroke-generator.js # Geometric stroke path generation
src/bmp.js           # BMP file format encoding for output
```

### Key Systems

#### Stencil-Based Clipping System
- Uses 1-bit per pixel stencil buffer (memory efficient)
- Supports proper clip intersections with AND operations
- Handles nested clipping via save/restore stack
- **No legacy polygon clipping code** - uses only stencil approach

#### Color System
- **Premultiplied sRGB** throughout the pipeline
- CSS color names mapped to exact RGB values in `tests/test-colors.js`
- Alpha blending uses source-over composition
- Colors are (r,g,b,a) where 0-255, with alpha premultiplied for internal ops

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

### Making API Changes
1. Update `src/context2d.js` for public API
2. Update `src/rasterizer.js` for rendering pipeline
3. Ensure both SWCanvas and HTML5Canvas paths in tests do the same thing
4. Run full test suite to verify no regressions

## Current Status (As of Latest Session)

### Recently Completed ✅
- **Legacy Code Cleanup**: Removed all old polygon-clipper code and references
- **Browser Test Fixes**: Fixed coordinate expectations in transform tests  
- **Documentation**: Added comprehensive README.md and improved test docs
- **Build System**: Verified working after cleanup
- **Test Coverage**: All 31 shared tests + 55 visual tests passing

### Key Implementation Details
- **Clipping**: Uses stencil-only approach (no legacy polygon clipping)
- **Colors**: Green = (0,128,0), not (0,255,0) - use test color helpers
- **Coordinates**: Transform tests expect specific pixel positions - see fixed coordinates in shared-test-suite.js
- **File Structure**: No temporary debug files, clean codebase

### Test Output Status
- **Node.js**: All tests passing, 55+ BMPs generated
- **Browser**: Transform tests now pass after coordinate fixes
- All test outputs in `tests/output/` are fresh and valid

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

### Code Patterns
- **Error handling**: Throw descriptive errors for invalid operations
- **Memory efficiency**: Use existing Surface methods, don't duplicate buffers  
- **Color handling**: Always use premultiplied RGBA internally
- **Matrix math**: Use existing Matrix class methods, don't recreate logic

This context should help Claude understand the project structure, current status, and development patterns for effective collaboration.