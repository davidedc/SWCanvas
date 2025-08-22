# SWCanvas Test Suite

This directory contains the comprehensive **modular test infrastructure** for SWCanvas, with 32 core tests + 78 visual tests and cross-platform compatibility.

## Modular Test Architecture

```
tests/
├── core/                          # 32 individual core test files (001-032)
│   ├── 001-surface-creation-valid.js
│   ├── 015-alpha-blending-test.js  
│   ├── 031-transform-matrix-order-dependency.js
│   └── ... (28 more files)
├── visual/                        # 78 individual visual test files (001-078)
│   ├── 001-simple-rectangle-test.js
│   ├── 027-fill-rule-complex-test.js
│   ├── 056-stroke-pixel-analysis-test.js
│   └── ... (53 more files)
├── browser/                       # Browser-specific test files
│   ├── index.html                 # Main browser test page (interactive + comparisons)
│   ├── simple-test.html           # Simple visual comparison test
│   └── browser-test-helpers.js    # Browser-specific interactive testing tools
├── dist/                          # Built test files (auto-generated, .gitignored)
│   ├── core-functionality-tests.js    # Auto-generated from /core/
│   └── visual-rendering-tests.js      # Auto-generated from /visual/
├── build/
│   └── concat-tests.js            # Build-time concatenation script
├── core-functionality-tests.js          # Original (fallback/reference)
├── visual-rendering-tests.js            # Original (fallback/reference)
├── run-tests.js                         # Smart test runner with auto-detection
├── output/                              # Generated BMP test images (78+ files)
└── README.md                            # This file
```

## Running Tests

### Node.js Tests
```bash
# Build modular tests + run complete test suite
npm run build  # Concatenates individual test files 
npm test       # Uses built modular tests automatically

# Or directly:
node tests/run-tests.js  # Smart runner uses built tests when available
```

### Browser Tests
1. Open `tests/browser/index.html` in a web browser (automatically runs all tests on page load)
2. Automatically runs 32 modular core functionality tests from `/tests/core/` 
3. Automatically runs all 88 visual rendering tests with side-by-side HTML5 Canvas vs SWCanvas comparison
4. Use interactive visual comparison tools for real-time testing
5. Simple test: Open `tests/browser/simple-test.html` for basic visual comparison

**Technical Note**: Browser visual comparisons use `renderSWCanvasToHTML5()` helper function in `build/concat-tests.js` which correctly transfers SWCanvas Surface data (non-premultiplied RGBA) to HTML5 Canvas ImageData without unpremultiplication, ensuring accurate semi-transparent color display.

## Modular Dual Test Architecture

SWCanvas uses a **modular complementary dual test system** where individual test files are automatically concatenated at build time, maintaining both development flexibility and production performance:

### Core Functionality Tests - 33 Individual Files
**Location**: `/tests/core/` (individual files) → `/tests/dist/core-functionality-tests.js` (concatenated)

**Modular Structure**:
- **33 individual test files** numbered 001-033 with descriptive names
- **Build-time concatenation** into single optimized file
- **Smart test runner** automatically uses built version
- **Development benefit**: No merge conflicts, focused editing

**Characteristics**:
- **33 unit tests** using `assertEquals()`, `assertThrows()` assertions
- **Output**: Console logs with ✓ pass/✗ fail status + detailed error messages
- **Environment**: Runs identically in both Node.js and browser
- **Focus**: API correctness, error handling, data validation, mathematical accuracy

**Test Types**:
- ✅ **API Validation**: Surface creation, dimension validation, error handling
- ✅ **Mathematical Correctness**: Matrix operations, coordinate transformations
- ✅ **State Management**: Context save/restore, property persistence  
- ✅ **Data Structures**: Path2D command recording, parameter validation
- ✅ **Integration Points**: BMP generation, cross-platform consistency

**Example Modular Test File** (`/tests/core/001-surface-creation-valid.js`):
```javascript
// Test: Surface creation with valid dimensions
// This file will be concatenated into the main test suite

// Test 001
test('Surface creation with valid dimensions', () => {
    const surface = SWCanvas.Core.Surface(400, 300);
    assertEquals(surface.width, 400);
    assertEquals(surface.height, 300);
    // ✓ Programmatic validation with assertions
});
```

### Visual Rendering Tests - 88 Individual Files
**Location**: `/tests/visual/` (individual files) → `/tests/dist/visual-rendering-tests.js` (concatenated)

**Modular Structure**:
- **88 individual test files** numbered 001-088 with descriptive names
- **Build-time concatenation** preserves registerVisualTest pattern
- **Smart test runner** with automatic fallback to original
- **Development benefit**: Isolated test development, clear organization

**Characteristics**:
- **88 visual tests** that generate actual rendered images
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
- ✅ **Line Dashing**: Dash patterns, offsets, complex paths - 3 tests
- ✅ **Gradient & Pattern Strokes**: All paint sources with sub-pixel strokes - 15 tests
- ✅ **Thick Polyline Joins**: Systematic testing of bevel, miter, round joins with dash patterns - 3 tests
- ✅ **Debug & Analysis**: Specific rendering issue investigation - 6 tests

**Example Modular Test File** (`/tests/visual/002-alpha-blending-test.js`):
```javascript
// Test: Alpha Blending Test  
// This file will be concatenated into the main visual test suite

// Test 2
registerVisualTest('alpha-test', {
    name: 'Alpha blending test - semi-transparent rectangles',
    width: 200, height: 150,
    // Unified drawing function that works with both canvas types
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

### For Core Functionality Tests
Create a new individual file in `/tests/core/` with the naming pattern `{3-digit-number}-{descriptive-name}.js`:

```bash
# Create new core test 
echo "// Test: New feature test" > tests/core/032-new-feature-test.js
echo "test('New feature test', () => { /* test code */ });" >> tests/core/032-new-feature-test.js

# Build automatically includes it
npm run build && npm test
```

### For Visual Rendering Tests  
Create a new individual file in `/tests/visual/` with the naming pattern `{3-digit-number}-{descriptive-name}.js`:

```bash
# Create new visual test
cat > tests/visual/057-new-visual-test.js << 'EOF'
// Test: New Visual Test
// This file will be concatenated into the main visual test suite

registerVisualTest('new-visual-test', {
    name: 'New visual feature test',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // Standard HTML5 Canvas API works with both implementations
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 10, 100, 100);
    }
});
EOF

# Build automatically includes it
npm run build && npm test
```

### For Browser-Specific Features
Add interactive tests to `browser-visual-tests.js` for features requiring DOM interaction or real-time visual comparison.

**Key Benefits of Modular Approach**:
- **No merge conflicts**: Each test is in its own file
- **Clear organization**: Numbered files with descriptive names
- **Easy maintenance**: Edit individual tests without affecting others
- **Automatic integration**: Build system includes new tests automatically

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

### Comprehensive Modular Test Coverage
- **33 modular core tests** covering all API functionality with individual files
- **88 modular visual tests** covering all major Canvas2D features with pixel-perfect accuracy
- **Build-time concatenation** for optimal performance
- **Smart test runner** with automatic fallback system
- **Cross-platform validation** (Node.js + browsers)
- **BMP generation** for visual inspection and regression detection