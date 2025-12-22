# Claude Code Context - SWCanvas

This file provides Claude with essential context about the SWCanvas project for efficient collaboration and development.

## Project Overview

**SWCanvas** is a deterministic 2D raster engine with dual API architecture that produces identical results across all platforms. It provides both HTML5 Canvas-compatible API and a high-performance Core API.

### Key Characteristics
- **Deterministic**: Same input → same output on any platform
- **Cross-platform**: Works identically in Node.js and browsers  
- **Dual API**: HTML5-compatible API for portability + Core API for performance
- **Drop-in replacement**: True HTML5 Canvas 2D Context compatibility
- **Memory efficient**: 1-bit stencil clipping, optimized algorithms
- **Sub-pixel accurate**: Thin strokes render with proportional opacity (no anti-aliasing)
- **Well-tested**: 36 core tests + 140 visual tests + 79 direct rendering tests with pixel-level validation
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
src/
├── core/                     # Core engine primitives
│   ├── Context2D.js          # Core 2D rendering context (explicit RGBA API)
│   ├── Rasterizer.js         # Low-level pixel operations and rendering pipeline
│   ├── Surface.js            # Memory buffer management - RGBA pixel data
│   ├── SWPath2D.js           # Path definition and command recording
│   ├── Transform2D.js        # Immutable transformation matrix mathematics
│   ├── Color.js              # Immutable color handling with premultiplied alpha
│   ├── ClipMask.js           # 1-bit stencil buffer using BitBuffer composition
│   └── StateStack.js         # State stack management for save/restore operations
│
├── renderers/                # Shape-specific direct renderers (static utility classes)
│   ├── SpanOps.js            # Horizontal span filling utilities (shared by shape ops)
│   ├── FastPixelOps.js       # Fast pixel operation utilities
│   ├── RectOpsAA.js          # Axis-aligned rectangle direct rendering
│   ├── RectOpsRot.js         # Rotated rectangle direct rendering
│   ├── CircleOps.js          # Circle fill/stroke direct rendering (Bresenham, annulus)
│   ├── LineOps.js            # Line stroke direct rendering (Bresenham, polygon scan)
│   ├── ArcOps.js             # Arc fill/stroke direct rendering (partial arcs, pie slices)
│   ├── RoundedRectOpsAA.js   # Axis-aligned rounded rectangle direct rendering
│   ├── RoundedRectOpsRot.js  # Rotated rounded rectangle direct rendering
│   ├── PolygonFiller.js      # Scanline polygon filling with paint source support
│   ├── PathFlattener.js      # Converts paths to polygons
│   └── StrokeGenerator.js    # Geometric stroke path generation with line dashing
│
├── utils/                    # Shared internal utilities
│   ├── BitBuffer.js          # 1-bit per pixel utility for mask operations
│   ├── BoundsTracker.js      # Reusable bounds tracking utility for optimization
│   ├── Point.js              # Immutable 2D point operations
│   ├── Rectangle.js          # Immutable rectangle operations
│   ├── ImageProcessor.js     # ImageLike validation and format conversion
│   └── CompositeOperations.js # Porter-Duff composite operation utilities
│
├── paint/                    # Paint sources (gradients, patterns, colors)
│   ├── Gradient.js           # Linear, radial, and conic gradient paint sources
│   ├── Pattern.js            # Repeating image pattern paint sources
│   └── ColorParser.js        # CSS color string parsing (hex, rgb, named colors)
│
├── filters/                  # Image processing & effects
│   ├── BoxBlur.js            # Multi-pass box blur algorithm approximating Gaussian blur
│   └── ShadowBuffer.js       # Sparse shadow alpha storage with extended bounds
│
├── io/                       # File format encoders
│   ├── PngEncoder.js         # PNG file format encoding with transparency support
│   ├── PngEncodingOptions.js # PNG encoding configuration (immutable options)
│   ├── BitmapEncoder.js      # BMP file format encoding (legacy - composites with background)
│   └── BitmapEncodingOptions.js # BMP encoding configuration (immutable options)
│
└── compat/                   # HTML5 Canvas Compatibility Layer
    ├── SWCanvasElement.js    # Canvas-like object (width/height properties, getContext)
    ├── CanvasCompatibleContext2D.js  # HTML5 Canvas 2D Context API wrapper
    └── SourceMask.js         # 1-bit source coverage tracking for canvas-wide compositing

# Optional Utilities
lib/swcanvas-compat-polyfill.js  # HTML5 Canvas polyfill for SWCanvas-specific methods
```

### Key Systems

See ARCHITECTURE.md for complete details on all systems below.

- **Clipping**: 1-bit stencil buffer via ClipMask class with AND intersections and save/restore support
- **Color**: Immutable Color class with premultiplied alpha; Surface stores non-premultiplied RGBA
- **Transform**: Immutable Transform2D matrix with factory methods (.translation(), .scaling(), .rotation())
- **Geometry**: Immutable Point and Rectangle classes with rich operations
- **Sub-pixel Strokes**: Strokes < 1px render with proportional opacity (0.5px = 50% opacity)
- **Line Dashing**: HTML5-compatible setLineDash()/getLineDash() via StrokeGenerator.js
- **Paint Sources**: Unified interface for Color, LinearGradient, RadialGradient, ConicGradient, Pattern
- **Direct Rendering**: See DIRECT-RENDERING-SUMMARY.MD for RectOpsAA, RectOpsRot, CircleOps, LineOps, ArcOps, RoundedRectOpsAA, RoundedRectOpsRot
- **Shadows**: See ARCHITECTURE.md for ShadowBuffer and BoxBlur dual-buffer pipeline
- **Compositing**: See ARCHITECTURE.md for Porter-Duff operations (10 modes with source masks)

## Build & Test Commands

See README.md for complete build and test instructions.

### Development Workflow

**Standard development cycle:**
1. Edit source files in `src/` or individual test files
2. `npm run build` to regenerate library and test suites  
3. `npm test` to verify no regressions
4. Browser testing via `tests/browser/index.html`

**Production workflow:**
1. `npm run build:prod` (builds + minifies in one command)
2. Test minified version with `examples/showcase.html`
3. Verify PNG output matches expectations

**Build commands available:**
- `npm run build` - Development build only
- `npm run minify` - Minify existing build (requires Terser)
- `npm run build:prod` - Complete production workflow

**Testing and examples:**
- See `tests/README.md` for test development details
- See `examples/README.md` for example development
- Use `examples/showcase.html` to verify features work with minified build

## Test System

SWCanvas uses a comprehensive test system with modular architecture. See `tests/README.md` for complete test documentation including:

- Test architecture and organization
- Adding new tests (core and visual)
- Build utilities and renumbering tools
- Cross-platform validation approach

Quick reference: `npm run build` then `npm test` to run all 36 core + 140 visual tests. Direct rendering tests (79 tests) run separately via `npm run test:direct-rendering`.

## Common Tasks

### Adding New Tests

See `tests/README.md` for comprehensive test development documentation.

### Using the Dual API

See README.md for complete API usage examples.

### Debugging Rendering Issues
1. Add debug visual test with simplified case
2. Generate PNG: `npm test`  
3. Compare with HTML5 Canvas in browser: `tests/browser/index.html`
4. Check pixel values manually if needed
5. Use git to compare before/after PNGs

See `debug/README.md` for comprehensive debugging utilities, templates, and workflow patterns.

### Making API Changes (OO Structure)
1. Update `src/core/Context2D.js` for public API changes
2. Update `src/core/Rasterizer.js` for rendering pipeline changes
3. Update relevant classes in `src/renderers/` (PolygonFiller.js, StrokeGenerator.js, etc.) as needed
4. Ensure both SWCanvas and HTML5Canvas paths in tests do the same thing
5. Run full test suite to verify no regressions

#### Special Implementation Notes

**clearRect Implementation**: `clearRect` uses direct pixel manipulation (`Context2D._clearRectDirect`) rather than the standard composite operation pipeline. This avoids global compositing issues that would affect the entire canvas. The implementation handles both axis-aligned and transformed rectangles correctly while respecting clipping masks.

## Architecture

Uses object-oriented ES6 class design throughout. See ARCHITECTURE.md for complete architectural details and design patterns.

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
- **Test with different backgrounds** - Use `BitmapEncodingOptions` to test transparency handling

### OO Development Patterns
- **Use proper classes**: Prefer `new SWCanvas.Core.Point(x, y)` over plain objects
- **Leverage immutability**: Transform2D, Point, Rectangle, Color, BitmapEncodingOptions are immutable - use their methods
- **Joshua Bloch patterns**: BitmapEncodingOptions demonstrates static factory methods and immutable configuration objects
- **Composition over inheritance**: BitBuffer and BoundsTracker utilities composed by ClipMask, SourceMask, and ShadowBuffer classes (Item 18)
- **Static utilities**: Use ImageProcessor for format conversion, CompositeOperations for blending
- **Factory methods**: Use Transform2D constructor and .translation(), .scaling(), .rotation() for common transformations
- **Validation**: All classes validate input parameters with descriptive error messages
- **Composition**: Classes work together rather than through inheritance hierarchies
- **Encapsulation**: Use public APIs, private methods marked with underscore prefix
- **Utility classes**: BitBuffer provides reusable bit manipulation, BoundsTracker provides reusable bounds tracking

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
- **Semantic Subdirectories**: Source organized into 7 categories:
  - `src/core/` - Core engine primitives (Context2D, Surface, Transform2D, etc.)
  - `src/renderers/` - Shape-specific direct renderers (*Ops classes)
  - `src/utils/` - Shared utilities (BitBuffer, BoundsTracker, Point, Rectangle)
  - `src/paint/` - Paint sources (Gradient, Pattern, ColorParser)
  - `src/filters/` - Effects (BoxBlur, ShadowBuffer)
  - `src/io/` - File encoders (PngEncoder, BitmapEncoder)
  - `src/compat/` - HTML5 Canvas compatibility layer

This context reflects the current object-oriented architecture and development patterns for effective collaboration.