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
Path2D.js           → Path definition and command recording
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
- **Drawing Operations**: `fillRect()`, `stroke()`, `fill()`
- **State Management**: `save()`/`restore()` stack
- **Style Properties**: `fillStyle`, `strokeStyle`, `lineWidth`
- **Transform Operations**: `translate()`, `rotate()`, `scale()`

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
- `BitmapEncoder` - File format export utilities

## Interoperability Bridges

The architecture provides seamless interoperability between layers:

### Bridge Access Points
```javascript
// From HTML5 API to Core API
const canvas = SWCanvas.createCanvas(800, 600);
const coreSurface = canvas._coreSurface;           // Access Core Surface
const coreContext = canvas.getContext('2d')._core; // Access Core Context

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

This architecture represents a **paradigm bridge** that successfully unifies web standards compliance, performance optimization, and clean API design in a single coherent system.