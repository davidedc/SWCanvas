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
- **Well-tested**: 32 core tests + 75 visual tests with pixel-perfect validation
- **Paint Sources**: Full HTML5-compatible gradients (linear, radial, conic) and patterns

## API Usage

SWCanvas provides dual APIs - see README.md for complete API documentation and examples.

- **HTML5 Canvas-Compatible API**: `SWCanvas.createCanvas()` for familiarity
- **Core API**: `SWCanvas.Core.*` for performance
- **Interoperability**: Both APIs work together seamlessly

Refer to README.md for detailed usage examples and ARCHITECTURE.md for design rationale.

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
src/Gradient.js               # Linear, radial, and conic gradient paint sources
src/Pattern.js                # Repeating image pattern paint sources
src/Point.js                  # Immutable 2D point operations
src/Rectangle.js              # Immutable rectangle operations
src/PolygonFiller.js          # Scanline polygon filling with paint source support
src/PathFlattener.js          # Converts paths to polygons
src/StrokeGenerator.js        # Geometric stroke path generation with line dashing
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
- Static factory methods: `.translation()`, `.scaling()`, `.rotation()` (identity is default constructor)
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
- **Universal paint source support**: Works with Colors, Gradients, and Patterns seamlessly
- **Implementation location**: `Rasterizer.js:270-277` calculates opacity, `PolygonFiller.js` applies during paint evaluation
- **Formula**: `subPixelOpacity = lineWidth === 0 ? 1.0 : lineWidth`
- **Visual consistency**: Maintains deterministic pixel-perfect output across platforms
- **Browser compatibility**: Matches modern HTML5Canvas behavior for edge cases

#### Line Dashing System
- **HTML5 Canvas-compatible API**: `setLineDash()`, `getLineDash()`, `lineDashOffset` property
- **Deterministic dash patterns**: Consistent dash spacing across all platforms 
- **Complex path support**: Works with curves, arcs, transforms, and clipping
- **Odd-length pattern handling**: Automatically duplicates odd-length arrays per HTML5 spec
- **Implementation location**: `StrokeGenerator.js` applies dash patterns before stroke generation
- **Algorithm**: Walks path segments, breaks at dash boundaries, generates only visible segments
- **State management**: Dash properties saved/restored with context state stack

#### Paint Source System
- **Unified paint source architecture**: Colors, gradients, and patterns all implement consistent interface
- **LinearGradient**: Linear color transitions with `addColorStop()` API matching HTML5 Canvas
- **RadialGradient**: Radial color transitions between two circles (inner/outer radius)
- **ConicGradient**: Sweep gradients around a center point with configurable start angle
- **Pattern**: Repeating image patterns with repetition modes (`repeat`, `repeat-x`, `repeat-y`, `no-repeat`)
- **Per-pixel evaluation**: All paint sources evaluated at rasterization time with transform awareness
- **Color interpolation**: Linear interpolation between color stops for smooth gradients
- **Global alpha support**: Global alpha correctly applied during per-pixel paint evaluation
- **Sub-pixel stroke integration**: Sub-pixel opacity applied to all paint source types during evaluation
- **Implementation location**: `PolygonFiller.js` evaluates paint sources via `_evaluatePaintSource()` method

## Build & Test Commands

See README.md for complete build and test instructions.

### Development Workflow

Standard development cycle:
1. Edit source files in `src/` or individual test files
2. `npm run build` to regenerate library and test suites  
3. `npm test` to verify no regressions
4. Browser testing via `tests/browser/index.html`

For test development details, see `tests/README.md` and `tests/build/README.md`.

## Test System

SWCanvas uses a comprehensive test system with modular architecture. See `tests/README.md` for complete test documentation including:

- Test architecture and organization
- Adding new tests (core and visual)
- Build utilities and renumbering tools
- Cross-platform validation approach

Quick reference: `npm run build` then `npm test` to run all 32 core + 60 visual tests.

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
├── core/                               # 32 individual core test files
│   ├── 001-surface-creation-valid.js
│   ├── 015-alpha-blending-test.js
│   ├── 032-line-dash-api-test.js
│   └── ... (29 more files)
├── visual/                             # 75 individual visual test files
│   ├── 001-simple-rectangle-test.js
│   ├── 058-line-dash-basic-patterns-test.js
│   ├── 060-line-dash-complex-paths-test.js
│   ├── 068-gradient-strokes-with-dashes-test.js
│   ├── 075-gradient-strokes-with-dashes-subpixel-test.js
│   └── ... (71 more files)
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
    ├── 058-line-dash-basic-patterns.bmp
    ├── 060-line-dash-complex-paths.bmp
    └── ... (75+ BMP files)
```

## Common Tasks

### Adding New Tests

See `tests/README.md` for comprehensive test development documentation.

### Using the Dual API

See README.md for complete API usage examples.

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
const surface = SWCanvas.Core.Surface(200, 100);
const ctx = new SWCanvas.Core.Context2D(surface);

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
const surface = SWCanvas.Core.Surface(100, 100);
const ctx = new SWCanvas.Core.Context2D(surface);

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
const surface = SWCanvas.Core.Surface(100, 100);
const ctx = new SWCanvas.Core.Context2D(surface);

// Your drawing code here
ctx.setFillStyle(255, 0, 0, 255);
ctx.fillRect(25, 25, 50, 50);

// Save for visual inspection
const bmpData = SWCanvas.Core.BitmapEncoder.encode(surface);
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

## Architecture Status

Project fully implemented with object-oriented ES6 class design. See ARCHITECTURE.md for complete architectural details and design patterns.

## Important Notes for Claude

### Documentation Strategy
- **Avoid duplication**: Each document has specific responsibilities (see DOCS.md)
- **Use cross-references**: Reference other docs rather than duplicating content
- **Single source of truth**: API examples in README.md, architecture in ARCHITECTURE.md, tests in tests/README.md

### When Debugging Tests
- **Always run full test suite** after changes: `npm test`
- **Browser vs Node.js differences** - use same visual test registry for consistency
- **Color consistency** - use standard Canvas API (`ctx.fillStyle`, `ctx.strokeStyle`)
- **Coordinate expectations** - test pixel positions are carefully calculated
- **ImageData API available** - use `ctx.getImageData()` for pixel analysis (works on both APIs)
- **Image creation helpers** - use `createCompatibleImage()` for unified image handling in tests

### When Making Changes  
- **Update both paths** - SWCanvas and HTML5Canvas implementations in visual tests
- **Verify cross-platform** - test in both Node.js and browser
- **Check all phases** - changes may affect multiple test categories
- **Build before testing** - `npm run build` then `npm test`

### OO Development Patterns
- **Use proper classes**: Prefer `new SWCanvas.Core.Point(x, y)` over plain objects
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