# SWCanvas — Implementation Spec & Project Plan

---

## Part I: Implementation Specification

### 1) Goals & Non‑Goals

**Goals**

*   Deterministic, portable Javascript 2D raster engine with a Canvas‑like API, compatible with both browsers and Node.js.
*   Visually consistent rendering using **premultiplied sRGB** math end‑to‑end.
*   High throughput for large fills/paths via simple span batching (no AA in v1).
*   Minimal **.BMP** image exports.

**Non‑Goals (v1)**

*   Anti‑aliasing (AA). **All fills and strokes in v1 are aliased**.
*   Text layout/shaping; advanced color management (ICC); EXIF; animations (GIF/APNG); filters/effects beyond shadow blur.
*   Streaming I/O for encoders/decoders.
*   JPEG/GIF/PNG support.

---

### 2) Public API (TypeScript shown although the project will be in Javascript)

#### Class Overview

*   **`Context2D`**: The main high-level, stateful API for drawing, mimicking the HTML5 Canvas API. It manages a state stack and an internal path object.
*   **`Rasterizer`**: A low-level, stateless drawing interface that performs individual operations. `Context2D` serves as a user-friendly wrapper around the `Rasterizer`.
*   **`Path2D`**: A class for storing and replaying path drawing commands, enabling path reuse.
*   **`Matrix`**: A 2D affine transformation matrix class, used in place of the browser-only `DOMMatrix` to ensure Node.js compatibility.

#### API Details

```ts
export type RGBA8 = [r: number, g: number, b: number, a: number]; // 0..255, *premultiplied sRGB*
export type CompositionMode = 'source-over' | 'copy'; // v1 scope
export type FillRule = 'nonzero' | 'evenodd';
export type ImageLike = { width: number, height: number, data: Uint8ClampedArray };

export interface Surface {
  readonly width: number;
  readonly height: number;
  readonly stride: number; // Row stride in *bytes*. For a standard surface, stride === width*4.
  readonly data: Uint8ClampedArray; // Backing store (RGBA8 premultiplied sRGB)
  // Memory layout: data[y*stride + x*4 + 0] = R, data[y*stride + x*4 + 1] = G,
  // data[y*stride + x*4 + 2] = B, data[y*stride + x*4 + 3] = A
}

export class Matrix {
  a: number; b: number; c: number; d: number; e: number; f: number;
  constructor(init?: number[]); // e.g., new Matrix([a, b, c, d, e, f])
  multiply(other: Matrix): Matrix;
  translate(x: number, y: number): Matrix;
  scale(sx: number, sy: number): Matrix;
  rotate(angleInRadians: number): Matrix;
  invert(): Matrix;
  transformPoint(point: {x: number, y: number}): {x: number, y: number};
}

export class Path2D {
  constructor();
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
}

export interface RasterizerBeginParams {
  composite: CompositionMode;
  globalAlpha?: number;        // [0..1], applied in premultiplied domain
  transform?: Matrix;          // Full 2D transform support
  clipMask?: Uint8Array;       // 1-bit stencil buffer for clipping (memory efficient)
}

export class Rasterizer {
  constructor(surface: Surface);
  beginOp(params: RasterizerBeginParams): void;
  fill(path: Path2D, rule: FillRule): void;
  stroke(path: Path2D): void; // Aliased thick strokes (no dashes in v1)
  drawImage(img: ImageLike, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  endOp(): void;
}

export class Context2D {
  constructor(surface: Surface);
  // State stack
  save(): void; restore(): void;
  // State
  globalAlpha: number;
  globalCompositeOperation: CompositionMode;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  resetTransform(): void;
  clip(rule?: FillRule): void;
  clip(path: Path2D, rule?: FillRule): void;
  // Path Operations
  // Note: These methods modify an internal, default Path2D object managed by the context.
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  // Draw Operations
  fill(rule?: FillRule): void;
  fill(path: Path2D, rule?: FillRule): void;
  stroke(): void;
  stroke(path: Path2D): void;
  drawImage(image: ImageLike, dx: number, dy: number): void;
  drawImage(image: ImageLike, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: ImageLike, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
}


```

---

### 3) Determinism Policy

*   **Float Math**: Use Float32 intermediates. Serialize final pixel writes to the `Uint8ClampedArray` surface.
*   **Rounding**: Clamp color channels to, then use `Math.round(value * 255)` to write 8‑bit values.
*   **Path Flattening**: Paths containing curves (Béziers, arcs) must be flattened into polygons. The flattening tolerance shall be fixed at **0.25 pixels** to ensure visual consistency.
*   **Geometric Stroking**: All strokes must be generated using a fixed geometric algorithm (see *Rasterizer Architecture*) that produces a set of polygons. The rules for joins, caps, and miter limits are fixed, ensuring the stroke shape is identical across platforms.
*   Round joins and caps will be approximated by a polygonal fan. The number of segments will be determined by a fixed formula based on the line width, such as Math.max(8, Math.ceil(lineWidth)) to ensure a consistent level of detail.
*   **Determinism Target**: **Visual determinism**. the rendered image must be identical.

---

### 4) Rasterizer Architecture

*   **Pipeline**: For every draw operation, the following sequence is applied:
    1.  Source geometry is transformed by the current `transform` matrix into device space.
    2.  The transformed geometry is clipped against the active stencil buffer.
    3.  The `globalAlpha` value is applied.
    4.  The final pixels are blended into the surface using the specified `composite` mode.
*   **Fills**: Aliased, using even‑odd or non‑zero winding rules via pixel‑center sampling.
*   **Stencil-Based Clipping**: Uses a 1-bit stencil buffer for memory-efficient clipping with proper intersection semantics. Each `clip()` operation renders the path to a temporary buffer and ANDs it with the existing clip mask.
*   clip() without a path argument uses the context's current default path. This is standard behavior but worth stating for absolute clarity.

#### Stroke Generation

Strokes are not generated by pixel dilation. They are constructed geometrically in device space as a set of polygons, which are then filled by the standard rasterizer. This ensures watertight and deterministic results.

1.  **Segment Bodies**: For each straight path segment from P to Q, a rectangular body is generated.
    *   The unit tangent **t** and unit normal **n** of the segment are calculated.
    *   The four corners of the rectangle are defined as `P ± (lineWidth/2)·n` and `Q ± (lineWidth/2)·n`.
    *   This quadrilateral is then handed to the fill routine.

2.  **Joins**: At the junction between two segments, a bridging shape is added to the convex side of the turn.
    *   **Bevel**: A triangular cap connects the outer edges of the two segment bodies. This is the simplest join and serves as a fallback for extreme miters.
    *   **Miter**: The outer edges of the segment bodies are extended as lines until they intersect. If the distance from the inner corner to this intersection point is within `miterLimit * lineWidth / 2`, a triangular fan is created to fill the miter. If it exceeds the limit, the join falls back to a **Bevel** to prevent excessive "spikes".
    *   **Round**: A circular fan (approximated by triangles) is created, centered on the join point with a radius of `lineWidth / 2`.

3.  **Caps**: At the end of an open subpath:
    *   **Butt**: No cap is added; the stroke ends flush with the segment endpoint.
    *   **Square**: The stroke body is extended by a distance of `lineWidth / 2` along its tangent, and a rectangular cap is added.
    *   **Round**: A 180-degree semicircular fan is added, centered on the endpoint.

4.  **Robustness & Edge Cases**:
    *   **Zero-Length Segments**: These are skipped during body generation. If a zero-length subpath has a round cap, it renders as a full circle.
    *   **Concave Corners**: On the inner ("concave") side of a turn, the stroke bodies naturally overlap. No join geometry is generated on this side to prevent self-overdraw.
    *   **180-Degree Turns**: Miter joins are mathematically undefined for parallel segments. The implementation detects this case and falls back to a bevel join.

#### Stencil-Based Clipping System

SWCanvas uses a memory-efficient 1-bit stencil buffer approach for clipping that provides correct intersection semantics and matches HTML5 Canvas behavior exactly.

**Architecture:**
*   **1-bit stencil buffer**: Each pixel is represented by a single bit (1 = visible, 0 = clipped)
*   **Memory layout**: `width × height` bits packed into `Uint8Array` (8 pixels per byte)  
*   **Memory efficiency**: ~87.5% reduction compared to full coverage buffers (`width × height ÷ 8` bytes)
*   **Lazy allocation**: Stencil buffer is only created when the first `clip()` operation is performed

**Clipping Operations:**
1.  **First clip**: Creates stencil buffer and renders clip path with 1s where path covers pixels
2.  **Subsequent clips**: Renders new clip path to temporary buffer, then performs bitwise AND with existing stencil buffer
3.  **Intersection semantics**: Only pixels covered by ALL clip paths have bit = 1 (visible)
4.  **Save/restore**: Stencil buffer is deep-copied during `save()` and restored during `restore()`

**Implementation Details:**
*   **Bit access**: `byte = clipMask[Math.floor(pixelIndex/8)]; bit = byte & (1 << (pixelIndex%8))`
*   **Fill rule support**: Both 'nonzero' and 'evenodd' winding rules supported for clip paths
*   **Transform integration**: Clip paths are transformed before rasterization, supporting all transform operations
*   **Performance**: Optimized for common case of no clipping (near-zero overhead)

**Benefits over path-based clipping:**
*   **Correct intersections**: Handles complex overlapping clips properly
*   **Memory efficiency**: 1 bit per pixel vs 32+ bits for full coverage approaches
*   **Deterministic**: Same results across all platforms and floating-point precision scenarios
*   **HTML5 Canvas compatible**: Identical behavior to browser implementations

---

### 5) Sampling & Images

*   **`drawImage`**: v1 supports **nearest‑neighbor** sampling only.
*   **`ImageLike`**: An interface `{ width, height, data: Uint8ClampedArray }`.
    *   **RGB to RGBA Conversion**: When an `ImageLike` with 3-channel RGB8 data is provided (data.length === width * height * 3), it will be automatically converted to RGBA8 by appending alpha = 255 (fully opaque) to each pixel. Standard RGBA8 images (data.length === width * height * 4) are used as-is.
*   **Patterns & Gradients**: **Out of scope (v1)**.

---

### 6) Developer Experience, Packaging, & Environment

*   **Packaging**: For simplicity, the library will use neither ESM nor CJS modules, nor TypeScript type definitions. It will be a single global script file.
*   **Build & Environment**:
    *   The project must be buildable via a simple, self-contained shell script (e.g., `build.sh`, probably using files concatenation with possible header and footer) without reliance on build systems/bundlers like Webpack.
    *   It must run in both modern browsers and current Node.js LTS versions.
    *   The browser build must be a single file that can be loaded via a `<script>` tag and function from a `file:///` URL without a server.

---
### Appendices

*   **Appendix A — AA (Deferred)**: v1 intentionally ships without anti-aliasing. A future version will implement AA, likely using scanline area coverage.
*   **Appendix B — Compositing Math (premultiplied sRGB, v1)**:
    *   Let `S` and `D` be premultiplied sRGB source and destination colors in [0..1].
    *   **`source-over`**: `Out.rgb = S.rgb + D.rgb * (1 - Sa)`; `Out.a = Sa + Da * (1 - Sa)`
    *   **`copy`**: `Out = S`
    *   **Note**: For simplicity in v1, all compositing operations are performed directly on non-linear sRGB color values. This is a known trade-off against physical color accuracy, which would require linearization.
*   **Appendix C — Error Codes (v1)**:
    *   `SurfaceTooLarge`, `InvalidPathData`, `InvalidCompositeMode`

---
---

## Part II: Project Plan & Milestones

---

### 13) Testing & Acceptance Criteria

*   **Unit Tests**: Individual component testing for faster development feedback:
    *   Matrix operations (multiplication, inversion, transformations)
    *   Path2D command recording and replay
    *   Color blending mathematics
    *   Geometric calculations (stroke generation, clipping)
*   **Golden Image Tests**: A suite of golden BMP images will be generated for end-to-end visual validation. The creation of this golden set is a formal deliverable (see Milestones).
*   **Acceptance Criteria**:
    1.  All unit tests pass for individual components.
    2.  Full visual parity with the golden image set.
    3.  BMP output is deterministic across platforms.
    4.  All public APIs function as defined in the specification.
    5.  The library builds and runs correctly in a browser (`file:///`) and in Node.js.

---

### 14) Milestones (v1)

*   **M1: Core Surface & BMP I/O**
    *   Implement `Surface`, `Matrix` class, and solid rectangle fills (aliased).
    *   Implement `encodeBMP`.
    *   Establish the initial `build.sh` script.

*   **M2: Path Rasterization & Clipping**
    *   Implement the `Path2D` class.
    *   Implement aliased path filling (`nonzero`/`evenodd`) via `Context2D` and `Rasterizer`.
    *   Implement `source-over`/`copy` compositing and the aliased clip stack.
    *   **Deliverable**: Define and create the initial golden image test suite covering M1 and M2 features.

*   **M3: Stroke Implementation**
    *   Implement the full geometric stroke generation pipeline as specified.
    *   Support all specified joins (miter/bevel/round) and caps (butt/round/square) with correct miter limit and edge case handling.
    *   Update golden image set with a comprehensive suite of stroke tests.

*   **M4: Image Drawing**
    *   Implement `drawImage` with nearest-neighbor sampling.
    *   Support both RGBA and RGB `ImageLike` sources.
    *   Update golden image set with `drawImage` tests.

*   **M5: Performance & Hardening**
    *   Benchmark all operations against performance targets.
    *   Optimize hotspots and polish determinism rules.
    *   Finalize the error handling taxonomy and ensure robust input validation.

*   **M6: Packaging & Documentation**
    *   Write final API documentation and usage examples.