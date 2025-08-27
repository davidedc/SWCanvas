# SWCanvas Architecture

SWCanvas implements a sophisticated **multi-paradigm design pattern** that resolves fundamental impedance mismatches in graphics programming through a layered architecture with progressive disclosure.

## Core Architectural Problem

Graphics programming faces three competing paradigms that are difficult to reconcile:

### HTML5 Canvas Paradigm (Web Standards)
- DOM-like, stateful, string-based, mutable element model
- Familiar to web developers but performance-limited
- String parsing overhead, implicit state management

### High-Performance Graphics Paradigm (Game Engines)
- Direct, explicit, numeric, immutable objects
- Maximum performance but unfamiliar to web developers
- No parsing overhead, explicit state management

### Cross-Platform Library Paradigm (Universal)
- Factory-based, namespace-organized, environment-agnostic
- Works across Node.js and browser environments

## Layered Solution Architecture

SWCanvas resolves these competing paradigms through a three-layer architecture:

### Layer 1: Core Engine (Performance)
```
Surface.js          → Raw pixel buffer management
Context2D.js        → High-performance rendering engine  
Transform2D.js      → Immutable transformation mathematics
Point/Rectangle.js  → Pure geometric value objects
Color.js            → Immutable color handling
BitBuffer.js        → 1-bit per pixel utility for memory-efficient mask operations
ClipMask.js         → Stencil-based clipping using BitBuffer composition
SourceMask.js       → Source coverage tracking using BitBuffer composition
Gradient.js         → Linear, radial, and conic gradient paint sources
Pattern.js          → Repeating image pattern paint sources
SWPath2D.js         → Path definition and command recording
ShadowBuffer.js     → Sparse shadow alpha storage with extended bounds for blur overflow
BoxBlur.js          → Multi-pass box blur algorithm approximating Gaussian blur
```

**Purpose**: Maximum performance graphics operations with zero overhead.

### Layer 2: HTML5 Compatibility (Familiarity)
```
SWCanvasElement.js           → HTMLCanvasElement mimic
CanvasCompatibleContext2D.js → CanvasRenderingContext2D mimic
ColorParser.js               → CSS color string processing
```

**Purpose**: Familiar HTML5 Canvas API for web developers.

### Layer 3: Global API Organization
```
SWCanvas (namespace object) → API organizer, not a class
├── createCanvas()          → Factory returning SWCanvasElement
└── Core.*                  → Direct access to performance engine
```

**Purpose**: Clean namespace organization and environment abstraction.

## The Element/Context Split Pattern

HTML5 Canvas has a fundamental dual nature that SWCanvas preserves through architectural separation:

### Canvas Element Concerns (SWCanvasElement)
- **Dimensional Management**: `width`/`height` properties with automatic recreation
- **Context Factory**: `getContext('2d')` method
- **DOM Integration**: Element-like behavior for web compatibility
- **Surface Lifecycle**: Managing the underlying pixel buffer

### Context Concerns (CanvasCompatibleContext2D)
- **Drawing Operations**: `fillRect()`, `stroke()`, `fill()`, `drawImage()`
- **State Management**: `save()`/`restore()` stack
- **Style Properties**: `fillStyle`, `strokeStyle`, `lineWidth`
- **Shadow Properties**: `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`
- **Paint Sources**: `createLinearGradient()`, `createRadialGradient()`, `createConicGradient()`, `createPattern()`
- **Transform Operations**: `translate()`, `rotate()`, `scale()`
- **Path Hit Testing**: `isPointInPath()`, `isPointInStroke()` with geometric accuracy
- **ImageData API**: `getImageData()`, `createImageData()`, `putImageData()`

This separation maintains the HTML5 Canvas conceptual model while enabling performance optimizations.

## Delegation Chain Pattern

All operations flow through a clear delegation chain:

```javascript
// User calls HTML5-style API
canvas.getContext('2d').fillStyle = 'red';

// Delegation chain:
SWCanvasElement.getContext('2d')               // Returns wrapper
  → CanvasCompatibleContext2D.set fillStyle() // Parses CSS color  
    → ColorParser.parse('red')                 // Converts to RGBA
      → Context2D.setFillStyle(255,0,0,255)   // Core rendering
        → Rasterizer pixel operations          // Actual drawing
```

This ensures that all rendering ultimately uses the same high-performance core engine, regardless of which API layer is used.

## Progressive Disclosure Design

The architecture implements **progressive disclosure** - users can engage at their appropriate complexity level:

### Level 1: Familiar Web Developer
```javascript
const canvas = SWCanvas.createCanvas(800, 600);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FF0000';  // Familiar HTML5 Canvas API
ctx.fillRect(10, 10, 100, 100);
```

### Level 2: Performance-Conscious Developer
```javascript
const canvas = SWCanvas.createCanvas(800, 600);
const ctx = canvas.getContext('2d');
const coreCtx = ctx._coreContext;  // Drop to Core API
coreCtx.setFillStyle(255, 0, 0, 255);  // Skip CSS parsing
```

### Level 3: Engine-Level Control
```javascript
const surface = SWCanvas.Core.Surface(800, 600);
const ctx = new SWCanvas.Core.Context2D(surface);
const transform = new SWCanvas.Core.Transform2D().scale(2,2);
// Maximum performance, zero compatibility overhead
```

## API Surface Design

The final API provides exactly two access patterns:

### HTML5 Canvas-Compatible API
```javascript
SWCanvas.createCanvas(width, height) → SWCanvasElement
```
- Returns object with `width`, `height`, `getContext('2d')` 
- Full HTML5 Canvas 2D Context API compatibility
- CSS color parsing and string-based properties
- Automatic surface recreation on dimension changes

### Core API Namespace  
```javascript
SWCanvas.Core.* → Direct access to all engine classes
```
- `Surface()` - Raw pixel buffer
- `Context2D()` - High-performance rendering context
- `Transform2D()` - Immutable transformation matrices
- `Point()`, `Rectangle()` - Geometric value objects
- `Color()` - Immutable color handling
- `BitBuffer()` - 1-bit per pixel utility for efficient bit manipulation
- `ClipMask()` - Stencil-based clipping using BitBuffer composition
- `SourceMask()` - Source coverage tracking using BitBuffer composition
- `LinearGradient()`, `RadialGradient()`, `ConicGradient()` - Gradient paint sources
- `Pattern()` - Repeating image pattern paint sources
- `ShadowBuffer()` - Sparse shadow alpha storage with extended bounds
- `BoxBlur` - Multi-pass box blur algorithms (static methods)
- `BitmapEncoder` - File format export utilities
- `BitmapEncodingOptions()` - Immutable encoding configuration (Joshua Bloch patterns)
- `CompositeOperations` - Porter-Duff blending operations

## Path Hit Testing System

SWCanvas implements complete geometric path hit testing through `isPointInPath()` and `isPointInStroke()` methods that provide accurate point-in-polygon and point-on-stroke detection.

### Geometric Implementation

- **`isPointInPath()`**: Uses polygon flattening and mathematical point-in-polygon algorithms supporting both `evenodd` and `nonzero` fill rules
- **`isPointInStroke()`**: Converts strokes to polygons using `StrokeGenerator`, then applies point-in-polygon testing with proper line cap, join, and dash pattern support
- **HTML5 Canvas compliance**: Invalid lineWidth values (zero, negative, Infinity, NaN) are ignored per specification
- **Transform awareness**: All hit testing operates in the correct coordinate space respecting current transformation matrix

### API Overloads

Both methods support the complete HTML5 Canvas API surface:
```javascript
// Test against current path
ctx.isPointInPath(x, y, fillRule?)
ctx.isPointInStroke(x, y)

// Test against external SWPath2D
ctx.isPointInPath(path, x, y, fillRule?)
ctx.isPointInStroke(path, x, y)
```

## Shadow Rendering System

SWCanvas implements a comprehensive shadow system that provides HTML5 Canvas-compatible shadow properties with high-performance rendering using sparse storage and multi-pass box blur.

### Dual-Buffer Shadow Pipeline

The shadow system uses a sophisticated dual-buffer rendering approach:

1. **Shape Rendering**: Draw the shape to a shadow buffer with alpha values
2. **Blur Application**: Apply box blur to the shadow buffer 
3. **Shadow Compositing**: Composite the blurred shadow to the main surface
4. **Shape Rendering**: Draw the original shape over the shadow

### Core Components

**ShadowBuffer Class** - Sparse shadow storage:
- **Extended bounds**: Accommodates blur overflow beyond original canvas dimensions
- **Sparse storage**: Uses "x,y" string keys to store only non-zero alpha values (memory efficient)
- **Bounds tracking**: Maintains bounding box of actual shadow data for optimization
- **Dense array conversion**: Converts to/from Float32Array for blur processing

**BoxBlur Class** - Multi-pass blur algorithm:
- **Gaussian approximation**: Uses 3-pass box blur to approximate Gaussian blur via Central Limit Theorem
- **Running sums**: Efficient O(1) per-pixel horizontal and vertical passes
- **Sigma calculation**: Automatically calculates box width from blur radius for correct standard deviation
- **Separable filtering**: Applies horizontal then vertical blur passes for optimal performance

### Shadow Properties

The system supports all four HTML5 Canvas shadow properties:

```javascript
// HTML5 Canvas-Compatible API
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';  // CSS color strings
ctx.shadowBlur = 5;                      // Blur radius in pixels
ctx.shadowOffsetX = 3;                   // Horizontal offset
ctx.shadowOffsetY = 3;                   // Vertical offset

// Core API (explicit RGBA values)
ctx.setShadowColor(0, 0, 0, 128);        // Direct RGBA values (0-255)
ctx.shadowBlur = 5;                      
ctx.shadowOffsetX = 3;                   
ctx.shadowOffsetY = 3;                   
```

### Shadow Pipeline Integration

Shadows are integrated into all major drawing operations:
- **fillRect()**: Rectangle fills with shadow support
- **fill()**: Path fills with shadow support  
- **stroke()**: Path strokes with shadow support
- **drawImage()**: Image drawing with shadow support

### Paint Source Compatibility

Shadows work seamlessly with all paint sources:
- **Solid colors**: Standard shadow rendering
- **Linear gradients**: Gradient-filled shapes cast appropriately colored shadows
- **Radial gradients**: Radial gradient shapes cast shadows
- **Conic gradients**: Conic gradient shapes cast shadows
- **Patterns**: Pattern-filled shapes cast shadows

### Performance Optimizations

**Sparse Storage Efficiency**:
- Only non-zero alpha values are stored in memory
- Automatic bounds tracking minimizes processing area
- Dense array creation only for the minimal required region

**Blur Optimization**:
- Multi-pass box blur is more efficient than true Gaussian for most blur radii
- Separable filtering reduces complexity from O(r²) to O(r) per pixel
- Running sums provide O(1) per-pixel blur operations

**Opacity Calibration**:
- 8x opacity multiplier ensures shadow intensity matches HTML5 Canvas behavior
- Proper alpha blending with source-over compositing
- Premultiplied alpha handling for correct transparency

### State Management

Shadow properties are fully integrated into the context state stack:
- **save()/restore()**: Shadow properties saved and restored with other context state
- **Default values**: `shadowColor` defaults to transparent, other properties default to 0
- **Property validation**: Blur radius and offsets accept negative values per HTML5 Canvas specification

This shadow system provides pixel-perfect compatibility with HTML5 Canvas while maintaining the performance characteristics expected from SWCanvas's deterministic rendering engine.

## Composite Operations System

SWCanvas implements a comprehensive Porter-Duff composite operations system that provides HTML5 Canvas-compatible blending modes with mathematically correct rendering.

### Dual Compositing Architecture

The system uses two distinct rendering paths based on operation characteristics:

**Source-bounded Operations** (process only source-covered pixels):
- `source-over`, `destination-over`, `destination-out`, `xor`
- Render directly during polygon filling
- Optimal performance for common operations

**Canvas-wide Operations** (require full-region compositing):
- `destination-atop`, `source-atop`, `source-in`, `destination-in`, `source-out`, `copy`
- Use source coverage masks and dual-pass rendering
- Correctly handle pixels outside source area

### XOR Operation Implementation

HTML5 Canvas XOR deviates from mathematical Porter-Duff XOR to provide intuitive visual results:

```javascript
// Mathematical Porter-Duff XOR: αo = αs + αd - 2*αs*αd (makes everything transparent)
// HTML5 Canvas XOR: Practical "bite" effect

case 'xor':
    if (srcAlpha === 0) {
        return destination;  // No source - show destination
    } else if (dstAlpha === 0) {
        return transparent;  // Source over transparent - disappears
    } else {
        return transparent;  // Source over opaque - both disappear (bite effect)
    }
```

This creates the expected "bite" visual where shapes disappear in overlap areas, exposing the original background.

### BMP Alpha Compositing

The BMP encoder handles semi-transparent pixels by compositing them over white background since BMP format doesn't support alpha channels:

```javascript
// Semi-transparent pixels are pre-composited for BMP export
const alpha = a / 255;
return {
    r: Math.round(r * alpha + 255 * (1 - alpha)),
    g: Math.round(g * alpha + 255 * (1 - alpha)), 
    b: Math.round(b * alpha + 255 * (1 - alpha))
};
```

This ensures BMP output accurately represents how semi-transparent elements would appear when rendered.

### Implementation Components

- **CompositeOperations.js**: Core blending logic with HTML5 Canvas behavior matching
- **SourceMask.js**: Tracks source coverage for canvas-wide operations
- **Rasterizer.js**: Determines source-bounded vs canvas-wide operation routing
- **BitmapEncoder.js**: Handles alpha compositing during export

### Special Case Implementations

**clearRect Architecture**: The `clearRect` operation bypasses the standard composite operation pipeline to avoid global compositing issues. Instead of using the `copy` composite operation (which would affect the entire surface), `clearRect` uses direct pixel manipulation through `Context2D._clearRectDirect()`. This approach:

- Preserves pixels outside the specified rectangle
- Handles both axis-aligned and transformed rectangles
- Respects active clipping masks
- Avoids the performance overhead of global compositing for a localized operation

This architectural decision ensures HTML5 Canvas compatibility while maintaining optimal performance for rectangle clearing operations.

## Interoperability Bridges

The architecture provides seamless interoperability between layers:

### Bridge Access Points
```javascript
// From HTML5 API to Core API
const canvas = SWCanvas.createCanvas(800, 600);
const coreSurface = canvas._coreSurface;                // Access Core Surface
const coreContext = canvas.getContext('2d')._coreContext; // Access Core Context

// From Core API to HTML5 API  
const surface = SWCanvas.Core.Surface(800, 600);
const imageData = { width: 800, height: 600, data: surface.data };
// Use as ImageLike object with canvas.getContext('2d').drawImage()
```

## Architectural Benefits

### Paradigm Bridge
- **Web standards compliance** through HTML5 Canvas compatibility layer
- **Performance optimization** through Core direct access
- **Clean organization** through namespaced factory pattern
- **Progressive enhancement** - use complexity level you need

### No Lock-in
- Start with HTML5 API, optimize incrementally to Core API
- Mixed usage patterns supported (HTML5 setup, Core hot loops)
- Migration path preserves existing code investment
- All APIs share same rendering engine - no duplication

### Development Flexibility
- **Web developers**: Familiar HTML5 Canvas patterns
- **Game developers**: Direct performance-oriented APIs  
- **Library developers**: Clean namespace organization
- **Mixed teams**: Can use different APIs in same codebase

## Implementation Principles

The architecture follows several key design principles:

### Single Responsibility
- Each layer handles specific concerns (compatibility vs performance vs organization)
- Clear boundaries between element management and drawing operations
- Immutable value objects for mathematical operations

### Composition over Inheritance
- Classes use each other rather than extending from base classes
- Delegation pattern maintains clean interfaces
- Bridge pattern connects disparate paradigms

### Defensive Programming
- Comprehensive parameter validation at layer boundaries
- Immutable objects prevent accidental state mutations
- Clear error messages guide developers to correct usage

### Joshua Bloch Effective Java Patterns
The codebase implements several key patterns from Joshua Bloch's Effective Java:

- **Static Factory Methods** (`BitmapEncodingOptions.withBackgroundColor()`) - Item 1: Provide clear, self-documenting APIs
- **Immutable Objects** (`BitmapEncodingOptions`, `Color`, `Transform2D`) - Item 17: Minimize mutability for thread safety and prevent bugs
- **Builder Pattern Alternative** (`BitmapEncodingOptions`) - Item 2: Use static factory methods for complex configuration
- **Parameter Validation** (all constructors) - Item 49: Check parameters for validity and fail fast with clear messages

## Composition Pattern for Mask Classes

SWCanvas implements a sophisticated composition pattern for mask classes, following Joshua Bloch's **Item 18: "Favor composition over inheritance"** principle to eliminate code duplication while maintaining clear separation of concerns.

### The Problem: Similar Implementation, Different Semantics

`ClipMask` and `SourceMask` shared significant bit manipulation code but represented fundamentally different abstractions:

- **ClipMask**: Controls which pixels **can be rendered** (default: all visible, 1s)
- **SourceMask**: Tracks which pixels **were covered** by drawing operations (default: none covered, 0s)

### The Solution: BitBuffer Composition Component

Instead of forced inheritance (which would violate the Liskov Substitution Principle), SWCanvas uses **composition with a utility class**:

```javascript
// BitBuffer: Reusable bit manipulation utility
class BitBuffer {
    constructor(width, height, defaultValue) { /* configurable defaults */ }
    getPixel(x, y) { /* common bit operations */ }
    setPixel(x, y, value) { /* common bit operations */ }
    // ... shared implementation
}

// ClipMask: Composed with BitBuffer, clipping-specific behavior
class ClipMask {
    constructor(width, height) {
        this._bitBuffer = new BitBuffer(width, height, 1); // Default: visible
    }
    
    intersectWith(other) { /* clipping-specific logic */ }
    hasClipping() { /* clipping-specific logic */ }
    // Delegates basic operations to BitBuffer
}

// SourceMask: Composed with BitBuffer, coverage-tracking behavior  
class SourceMask {
    constructor(width, height) {
        this._bitBuffer = new BitBuffer(width, height, 0); // Default: not covered
        this._bounds = { /* bounds tracking */ };
    }
    
    getBounds() { /* coverage-specific logic */ }
    getIterationBounds() { /* coverage-specific logic */ }
    // Delegates basic operations to BitBuffer
}
```

### Benefits of This Architecture

1. **Code Reuse Without Inheritance**: Eliminates 200+ lines of duplicated bit manipulation code
2. **Clear Separation of Concerns**: BitBuffer handles bits, masks handle domain logic
3. **No LSP Violations**: ClipMask and SourceMask maintain their distinct semantics
4. **Flexible Design**: Easy to add new mask types or modify bit operations independently
5. **Better Testability**: Can test bit operations and mask logic separately
6. **Joshua Bloch Compliance**: Follows effective OO design patterns

### Implementation Details

- **BitBuffer**: Configurable default values (0 or 1) support different mask semantics
- **Memory Efficiency**: Maintains 1-bit per pixel storage (87.5% memory reduction)
- **Performance**: No overhead compared to original implementation
- **API Compatibility**: All existing mask APIs preserved unchanged

This composition pattern demonstrates how to eliminate code duplication through clean object-oriented design while avoiding the pitfalls of inappropriate inheritance hierarchies.

This architecture represents a **paradigm bridge** that successfully unifies web standards compliance, performance optimization, and clean API design in a single coherent system.