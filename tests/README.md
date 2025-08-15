# SWCanvas Test Suite

This directory contains the comprehensive test infrastructure for SWCanvas, with 55+ visual tests and cross-platform compatibility.

## Test Structure

```
tests/
├── core-functionality-tests.js   # Common test logic (runs in both environments)
├── visual-rendering-tests.js      # 55+ comprehensive visual tests
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

## Dual Test Architecture

SWCanvas uses a **complementary dual test system** where two test suites verify different aspects of the same functionality:

### Core Functionality Tests (`core-functionality-tests.js`)
**Purpose**: Programmatic API verification with pass/fail assertions

**Characteristics**:
- **31 unit tests** using `assertEquals()`, `assertThrows()` assertions
- **Output**: Console logs with ✓ pass/✗ fail status + detailed error messages
- **Environment**: Runs identically in both Node.js and browser
- **Focus**: API correctness, error handling, data validation, mathematical accuracy

**Test Types**:
- ✅ **API Validation**: Surface creation, dimension validation, error handling
- ✅ **Mathematical Correctness**: Matrix operations, coordinate transformations
- ✅ **State Management**: Context save/restore, property persistence  
- ✅ **Data Structures**: Path2D command recording, parameter validation
- ✅ **Integration Points**: BMP generation, cross-platform consistency

**Example Test**:
```javascript
test('Surface creation with valid dimensions', () => {
    const surface = SWCanvas.Surface(400, 300);
    assertEquals(surface.width, 400);
    assertEquals(surface.height, 300);
    // ✓ Programmatic validation with assertions
});
```

### Visual Rendering Tests (`visual-rendering-tests.js`)  
**Purpose**: Pixel-perfect visual verification with BMP image output

**Characteristics**:
- **56 visual tests** that generate actual rendered images
- **Output**: BMP files (Node.js) + side-by-side comparison (browser)
- **Environment**: BMP generation in Node.js, visual comparison in browser
- **Focus**: Rendering accuracy, visual consistency, pixel-perfect output

**Test Categories**:
- ✅ **Phase 1**: Basic transformations (translate, scale, rotate) - 8 tests
- ✅ **Phase 2**: Advanced path filling (curves, self-intersecting, fill rules) - 9 tests  
- ✅ **Phase 3**: Stencil-based clipping system (intersection, nesting) - 8 tests
- ✅ **Phase 4**: Combined features (transform+clip+fill+stroke integration) - 7 tests
- ✅ **Phase 5**: Image operations (drawImage with transforms and alpha) - 6 tests
- ✅ **Stroke Rendering**: Line styles, caps, joins, sub-pixel accuracy - 6 tests
- ✅ **Debug & Analysis**: Specific rendering issue investigation - 6 tests

**Example Test**:
```javascript
registerVisualTest('alpha-blending', {
    name: 'Alpha blending test - semi-transparent rectangles',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 20, 80, 60);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'green';  
        ctx.fillRect(40, 40, 80, 60);
        // → Generates BMP for pixel-perfect verification
    }
});
```

### Architectural Relationship: Intentional Complementary Redundancy

**Smart Delegation Pattern**:
```javascript
// core-functionality-tests.js
test('Alpha blending test - semi-transparent rectangles', () => {
    // 1. Try to delegate to visual test for consistency
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('alpha-test');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            saveBMP(surface, 'alpha-test.bmp', 'alpha test', SWCanvas);
            
            // 2. Add programmatic validation on top of visual test
            const pixel = getPixelAt(surface, 60, 50); // Green over red area
            assertEquals(pixel.r, 127); // Verify alpha blending math
            return; // ✓ Both visual AND programmatic verification
        }
    }
    
    // 3. Fallback inline test if visual test unavailable
    // ... inline drawing and assertion code
});
```

**Why This Architecture Works**:

1. **Dual Verification**: 8 overlapping tests get BOTH programmatic validation AND visual verification
2. **Fallback Safety**: Core tests work even when visual tests are unavailable  
3. **Cross-Platform Consistency**: Node.js validates math, browser validates visual output
4. **No Code Duplication**: Visual tests define drawing once, used by both test types
5. **Comprehensive Coverage**: Mathematical correctness + pixel-perfect rendering validation

**Benefits of Complementary Testing**:
- **Catch More Bugs**: Logic errors caught by assertions, rendering errors caught by visual comparison
- **Platform Validation**: Ensures identical behavior across Node.js and browser environments
- **Regression Prevention**: Any change must pass both programmatic AND visual validation
- **Development Confidence**: Developers can trust that changes maintain both correctness AND visual fidelity

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
Add tests to `core-functionality-tests.js` - they will automatically run in both environments.

### For Visual Rendering Tests
Add tests to `visual-rendering-tests.js` using the established pattern:
- Both SWCanvas and HTML5 Canvas implementations
- Consistent naming convention (`category-specific-description`)
- Use standard HTML5 Canvas API (`ctx.fillStyle`, `ctx.strokeStyle`)

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
Standard HTML5 Canvas API ensures consistent colors:
- Use `ctx.fillStyle` and `ctx.strokeStyle` with CSS color names
- Works identically with both SWCanvas and HTML5 Canvas
- Eliminates need for helper functions or color mapping

### Comprehensive Test Coverage
- 55+ visual tests covering all major Canvas2D features
- Pixel-perfect comparison with HTML5 Canvas
- Cross-platform validation (Node.js + browsers)
- BMP generation for visual inspection