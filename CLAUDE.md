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
- **Well-tested**: 31 core tests + 56 visual tests with pixel-perfect validation

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
- CSS color names mapped to exact RGB values using ColorParser.js
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
# Build the library + modular tests
npm run build          # or ./build.sh
                       # - Builds dist/swcanvas.js
                       # - Concatenates /tests/core/ → /tests/dist/core-functionality-tests.js
                       # - Concatenates /tests/visual/ → /tests/dist/visual-rendering-tests.js

# Run all tests (31 core + 56 visual BMP generation)
npm test              # or node tests/run-tests.js
                      # - Uses built modular tests from /tests/dist/ automatically
                      # - Generates 56+ BMP files in tests/output/

# Check test status
ls -la tests/output/  # Should see 56+ BMP files after test run
ls -la tests/dist/    # Should see built test files after build
```

### Development Workflow
```bash
# 1. Make changes to src/ files or individual test files
# 2. Build to regenerate dist/swcanvas.js + test suites
npm run build

# 3. Run tests to verify no regressions
npm test              # Automatically uses built modular tests

# 4. Browser testing (uses built tests automatically)
open tests/browser/index.html

# 5. Add new modular tests
# Create /tests/core/032-new-feature.js or /tests/visual/057-new-test.js
npm run build         # Auto-includes new tests
npm test              # Runs new tests

# 6. Check specific test output if needed  
node -e "console.log(require('./tests/dist/core-functionality-tests.js'))"
```

### Modular Test Development

#### Adding Tests at the End (Simple)
```bash
# Add a new core functionality test (next number: 032)
echo "// Test 032: New feature test" > tests/core/032-new-feature-test.js
echo "test('New feature test', () => { /* test code */ });" >> tests/core/032-new-feature-test.js

# Add a new visual test (next number: 057)
echo "// Test 057: New visual test" > tests/visual/057-new-visual-test.js
echo "registerVisualTest('new-visual', { /* test config */ });" >> tests/visual/057-new-visual-test.js

# Build automatically includes new tests
npm run build && npm test
```

#### Inserting Tests in the Middle (Advanced)
When you need to add a test at a specific position (e.g., to group related tests):

```bash
# Step 1: Make space for a new test at position 25
node tests/build/renumber-tests.js --type visual --position 25 --shift forward

# This shifts all tests from 025 onwards:
# 025-old-test.js → 026-old-test.js
# 026-other-test.js → 027-other-test.js
# etc.

# Step 2: Create your new test at the now-available position 025
echo "// Test 025: My Grouped Test" > tests/visual/025-my-grouped-test.js

# Step 3: Rebuild and test
npm run build && npm test

# Optional: Undo if needed
./undo-renumber.sh  # Generated automatically by renumbering script
```

**Renumbering Utility Options**:
```bash
# Preview changes without executing
node tests/build/renumber-tests.js --type visual --position 30 --shift forward --dry-run

# Close a gap after removing a test
node tests/build/renumber-tests.js --type core --position 15 --shift backward

# Get help
node tests/build/renumber-tests.js --help
```

## Test System Architecture

SWCanvas uses a **modular dual test architecture** where each test is in its own file, automatically concatenated at build time for optimal performance and maintainability.

### Modular Test Structure
**Core Philosophy**: Individual test files + build-time concatenation = maintainable code + production performance

#### Core Functionality Tests - 31 Individual Files
- **Location**: `/tests/core/` - Individual test files numbered 001-031
- **Built Output**: `/tests/dist/core-functionality-tests.js` (auto-generated)
- **Purpose**: Programmatic verification with pass/fail assertions
- **Type**: Unit tests with `assertEquals()` and `assertThrows()` assertions  
- **Focus**: API correctness, error handling, data validation, mathematical accuracy
- **Output**: Console logs with ✓ pass/✗ fail status + assertion details
- **Examples**: `001-surface-creation-valid.js`, `015-alpha-blending-test.js`, `031-transform-matrix-order-dependency.js`

#### Visual Rendering Tests - 56 Individual Files  
- **Location**: `/tests/visual/` - Individual test files numbered 001-056
- **Built Output**: `/tests/dist/visual-rendering-tests.js` (auto-generated) 
- **Purpose**: Visual verification with pixel-perfect BMP output
- **Type**: Visual tests that generate images for comparison
- **Focus**: Rendering accuracy, pixel-perfect output, visual consistency
- **Output**: BMP files for Node.js, side-by-side visual comparison in browser
- **Examples**: `001-simple-rectangle-test.js`, `027-fill-rule-complex-complex-even-odd-vs-nonzero-comparisons-test.js`, `056-stroke-pixel-analysis-test.js`

### Build System Integration
```bash
npm run build  # Automatically detects /tests/core/ and /tests/visual/ directories
               # Concatenates individual files into built test suites
               # Maintains proper test ordering and dependencies
```

### Build Utilities (`/tests/build/`)
The modular test system includes specialized build utilities for maintenance:

#### Test Concatenation (`concat-tests.js`)
- **Purpose**: Combines individual test files into unified test suites
- **Auto-run**: Called by `npm run build` automatically
- **Output**: `tests/dist/core-functionality-tests.js` and `tests/dist/visual-rendering-tests.js`
- **Fallback**: Gracefully handles missing modular files

#### Test Renumbering (`renumber-tests.js`) 
- **Purpose**: Shifts test numbers to insert tests at specific positions
- **Use case**: Maintain logical test grouping and organization
- **Safety**: Dry-run mode, conflict detection, undo script generation
- **Git integration**: Preserves file history with `git mv` when available

**Key Features**:
- **Forward shift**: Make space for new test (`--shift forward`)
- **Backward shift**: Close gaps after test removal (`--shift backward`) 
- **Content updating**: Updates `// Test N:` comments automatically
- **Conflict prevention**: Checks for existing files before renaming
- **History preservation**: Uses `git mv` to maintain file history

See `/tests/build/README.md` for detailed build utilities documentation.

#### Smart Test Runner Architecture
```javascript
// Automatic fallback system in run-tests.js
let CoreFunctionalityTests;
if (fs.existsSync('./tests/dist/core-functionality-tests.js')) {
    CoreFunctionalityTests = require('./dist/core-functionality-tests.js');  // Use modular
} else {
    CoreFunctionalityTests = require('./core-functionality-tests.js');        // Fallback to original
}
```

### Modular File Structure
```
/tests/
├── core/                               # 31 individual core test files
│   ├── 001-surface-creation-valid.js
│   ├── 015-alpha-blending-test.js
│   ├── 031-transform-matrix-order-dependency.js
│   └── ... (28 more files)
├── visual/                             # 56 individual visual test files
│   ├── 001-simple-rectangle-test.js
│   ├── 027-fill-rule-complex-test.js
│   ├── 056-stroke-pixel-analysis-test.js
│   └── ... (53 more files)
├── browser/                            # Browser-specific test files
│   ├── index.html                      # Main browser test page (moved from examples/)
│   ├── simple-test.html                # Simple visual comparison test
│   └── browser-test-helpers.js         # Interactive test utilities
├── dist/                               # Built test files (auto-generated, .gitignored)
│   ├── core-functionality-tests.js     # Auto-generated from /core/
│   └── visual-rendering-tests.js       # Auto-generated from /visual/
├── build/
│   └── concat-tests.js                 # Build concatenation script
├── core-functionality-tests.js         # Original (fallback/reference)
├── visual-rendering-tests.js           # Original (fallback/reference)
├── run-tests.js                        # Smart test runner with auto-detection
└── output/                             # Generated BMP files
    ├── 001-simple-rectangle-test.bmp
    ├── 056-stroke-pixel-analysis-test.bmp
    └── ... (56+ BMP files)
```

### Individual Test File Format
```javascript
// /tests/core/015-alpha-blending-test.js
// Test 015: Alpha blending test - semi-transparent rectangles
// This file will be concatenated into the main test suite

// Test 015
test('Alpha blending test - semi-transparent rectangles', () => {
    // Use visual test registry if available, otherwise fall back to inline test
    if (typeof VisualRenderingTests !== 'undefined') {
        const visualTest = VisualRenderingTests.getTest('alpha-test');
        if (visualTest) {
            const surface = visualTest.drawSWCanvas(SWCanvas);
            // ... validation logic ...
        }
    }
    // Fallback inline test code
});
```

```javascript
// /tests/visual/002-alpha-blending-test.js  
// Test 2: Alpha Blending Test
// This file will be concatenated into the main visual test suite

// Test 2
registerVisualTest('alpha-test', {
    name: 'Alpha blending test - semi-transparent rectangles',
    width: 200, height: 150,
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        // Unified drawing function that works with both canvas types
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 150);
        // ... drawing operations ...
    }
});
```

### Development Benefits
- **Individual Focus**: Each test in its own file with descriptive naming
- **No Merge Conflicts**: Developers can work on separate tests simultaneously  
- **Easy Maintenance**: Add/edit/remove tests without affecting others
- **Clear Organization**: Numerical ordering with descriptive names
- **Build Optimization**: Production gets concatenated files for performance

### Test Execution
- **Node.js**: `npm test` automatically uses built modular tests + generates 56+ BMP files  
- **Browser**: `tests/browser/index.html` automatically uses built modular tests with visual comparisons
- **Development**: Edit individual test files, run `npm run build` to regenerate
- **Production**: Built concatenated files ensure optimal loading performance

### Architectural Relationship
The modular architecture maintains **intentional complementary redundancy**:

1. **Dual Verification**: 8 overlapping tests provide both programmatic AND visual validation
2. **Smart Delegation**: Core tests delegate to visual tests when available, with fallback implementations
3. **Cross-Platform**: Node.js gets programmatic verification, browser gets visual comparison
4. **Comprehensive Coverage**: 31 modular core tests + 56 modular visual tests = thorough validation
5. **Maintainable Modularity**: Each test is independently editable while preserving system integration

### Key Test Categories by Phase
- **Phase 1**: Basic transforms (Tests 011-018) - translate/scale/rotate operations
- **Phase 2**: Advanced fills (Tests 019-027) - curves, self-intersecting paths, fill rules
- **Phase 3**: Stencil clipping (Tests 028-035) - intersection, nesting, save/restore
- **Phase 4**: Combined features (Tests 036-046) - transform+clip+fill+stroke integration  
- **Phase 5**: Image operations (Tests 047-052) - drawImage with transforms and alpha
- **Phase 6**: Sub-pixel rendering (Tests 053-056) - edge cases and pixel analysis

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

**Recommended: Modular Test File Approach (Current Architecture)**

#### Step 1: Create Individual Test File
Create a new file in `/tests/visual/` with the naming convention `{3-digit-number}-{descriptive-name}.js`:

```javascript
// /tests/visual/057-new-feature-test.js
// Test 57: New Feature Test
// This file will be concatenated into the main visual test suite

// Test 57: New Feature Test
registerVisualTest('new-feature-test', {
    name: 'Human-readable description of new feature',
    width: 300, height: 200,
    // Unified drawing function that works with both canvas types
    draw: function(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Use standard HTML5 Canvas API - works with both implementations
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 200);
        
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 50, 50);
        
        // Test your new feature here...
    }
});
```

#### Step 2: Build and Test
```bash
npm run build    # Concatenates your new test into visual-rendering-tests-built.js
npm test         # Runs all tests including your new one, generates BMP
```

#### Step 3: Verify Cross-Platform
```bash
open tests/browser/index.html    # Browser visual comparison includes your test automatically
```

**Key Benefits of Modular Approach:**
- **No merge conflicts**: Your test file is independent
- **Clear naming**: Descriptive filename makes purpose obvious  
- **Automatic integration**: Build system includes it automatically
- **Version control friendly**: Changes isolated to single file

**Legacy: Direct Registration in Main File (discouraged for new tests)**
```javascript
// In /tests/visual-rendering-tests.js - not recommended for new tests
registerVisualTest('legacy-approach', {
    name: 'Legacy direct registration',
    width: 200, height: 150,
    draw: function(canvas) {
        // Same unified API approach
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 200, 150);
    }
});
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
3. Compare with HTML5 Canvas in browser: `tests/browser/index.html`
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
- **Comprehensive Testing**: All 31 core tests + 56 visual tests passing with pixel-perfect accuracy

### Key Design Patterns Applied
- **Value Object Pattern**: Point, Rectangle, Transform2D, Color are immutable
- **Factory Methods**: Transform2D.translation(), .scaling(), .rotation() for common transforms
- **Static Utility Classes**: BitmapEncoder, ImageProcessor for pure functions
- **Composition over Inheritance**: Classes use other classes rather than extending
- **Defensive Programming**: Comprehensive validation with descriptive error messages
- **Memory Efficiency**: 1-bit stencil clipping, immutable objects prevent accidental mutation

### Test Results Status
- **Node.js**: All 31 core tests passing, 56 visual BMPs generated successfully  
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