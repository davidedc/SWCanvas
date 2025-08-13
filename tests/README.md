# SWCanvas Test Suite

This directory contains the comprehensive test infrastructure for SWCanvas, with 55+ visual tests and cross-platform compatibility.

## Test Structure

```
tests/
├── shared-test-suite.js          # Common test logic (runs in both environments)
├── visual-test-registry.js       # 55+ comprehensive visual tests
├── test-colors.js                # CSS-RGB color mapping system
├── run-tests.js                  # Node.js test runner + BMP generator
├── output/                       # Generated BMP test images (55+ files)
└── README.md                     # This file

examples/
├── test.html                     # Browser visual test runner + comparisons
├── browser-visual-tests.js       # Browser-specific visual testing tools
├── test-simple.html              # Simple browser test page
└── README.md
```

## Running Tests

### Node.js Tests
```bash
# Run shared test suite in Node.js
npm test

# Or directly:
node tests/run-tests.js
```

### Browser Tests
1. Open `examples/test.html` in a web browser
2. Click "Run Shared Test Suite" to run the same tests as Node.js
3. Use the visual comparison tools to test rendering accuracy

## Test Categories

### Shared Tests (`shared-test-suite.js`)
Core functionality tests that run identically in both Node.js and browser:
- ✅ Surface creation and validation
- ✅ Matrix mathematics (multiply, transform, invert)  
- ✅ Path2D command recording
- ✅ Context2D state management
- ✅ Rectangle filling and alpha blending
- ✅ BMP file generation
- ✅ Pixel-perfect alpha blending validation

### Visual Tests (`visual-test-registry.js`)
Comprehensive visual rendering tests (55+ tests):
- ✅ **Phase 1**: Basic transformations (translate, scale, rotate)
- ✅ **Phase 2**: Advanced path filling (curves, self-intersecting, fill rules)
- ✅ **Phase 3**: Stencil-based clipping system (intersection, nesting)
- ✅ **Phase 4**: Combined features (transform+fill+stroke+clip integration)
- ✅ Debug and analysis tests for specific rendering issues

### Browser-Only Tests (`browser-visual-tests.js`)
Interactive tests requiring DOM and visual comparison:
- ✅ Side-by-side HTML5 Canvas vs SWCanvas rendering
- ✅ Interactive drawing tools
- ✅ Real-time pixel value debugging
- ✅ BMP file download functionality

## Benefits

1. **No Duplication**: Core test logic exists in one place
2. **Consistency**: Same tests produce same results everywhere
3. **Cross-Platform Validation**: Ensures identical behavior in Node.js and browsers
4. **Easy Maintenance**: Update test logic once, runs everywhere
5. **Comprehensive Coverage**: Combines programmatic testing with visual validation

## Adding New Tests

### For Core Functionality
Add tests to `shared-test-suite.js` - they will automatically run in both environments.

### For Visual Rendering Tests
Add tests to `visual-test-registry.js` using the established pattern:
- Both SWCanvas and HTML5 Canvas implementations
- Consistent naming convention (`category-specific-description`)
- Use the shared color system from `test-colors.js`

### For Browser-Specific Features
Add tests to `browser-visual-tests.js` for features that require DOM or visual comparison.

## Key Features

### Stencil-Based Clipping System
SWCanvas uses a 1-bit stencil buffer approach for clipping:
- Memory efficient (1 bit per pixel)
- Supports proper clip intersections with AND operations
- Handles complex nested clipping scenarios
- Matches HTML5 Canvas behavior exactly

### Color Consistency System
The `test-colors.js` module ensures consistent colors:
- Maps CSS color names to exact RGB values
- Eliminates color mismatches between implementations
- Provides helper functions for both contexts

### Comprehensive Test Coverage
- 55+ visual tests covering all major Canvas2D features
- Pixel-perfect comparison with HTML5 Canvas
- Cross-platform validation (Node.js + browsers)
- BMP generation for visual inspection