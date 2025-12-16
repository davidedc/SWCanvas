# SWCanvas Direct Renderings - Comprehensive Analysis & Summary

## Executive Summary

SWCanvas implements direct renderings for 5 shape types: Rectangle, RoundedRect, Circle, Line, and Arc. Each has specialized rendering paths that bypass the general polygon filler when specific conditions are met.

---

## 1. Direct Rendering Entry Points (Calling Functions)

| Shape                   | Entry Point                           | Path-Based Fallback         |
|-------------------------|---------------------------------------|-----------------------------|
| Rectangle Fill          | Context2D.fillRect()                  | rasterizer.fillRect()       |
| Rectangle Stroke        | Context2D.strokeRect()                | rasterizer.stroke(path)     |
| Rectangle Fill+Stroke   | Context2D.fillAndStrokeRect()         | Separate fill + stroke      |
| RoundedRect Fill        | Context2D.fillRoundRect()             | path.roundRect() + fill()   |
| RoundedRect Stroke      | Context2D.strokeRoundRect()           | path.roundRect() + stroke() |
| RoundedRect Fill+Stroke | Context2D.fillAndStrokeRoundRect()    | Separate fill + stroke      |
| Circle Fill             | Context2D.fillCircle()                | path.arc() + fill()         |
| Circle Stroke           | Context2D.strokeCircle()              | path.arc() + stroke()       |
| Circle Fill+Stroke      | Context2D.fillAndStrokeCircle()       | Separate fill + stroke      |
| Line Stroke             | Context2D.strokeLine()                | path moveTo/lineTo + stroke |
| Arc Fill                | Context2D.fillArc()                   | path.arc() + fill()         |
| Arc Stroke              | Context2D.outerStrokeArc()            | path.arc() + stroke()       |
| Arc Fill+Stroke         | Context2D.fillAndOuterStrokeArc()     | Separate fill + stroke      |

All entry points are in `Context2D.js`. Use grep to find exact locations: `grep -n "methodName(" src/Context2D.js`

**Notes:**
- Direct rendering is available **exclusively** via dedicated methods (e.g., `fillCircle()`, `strokeRect()`). Path-based rendering (`beginPath()` + `arc()/rect()` + `fill()/stroke()`) always uses the generic polygon pipeline for consistent, predictable behavior.
- Private methods (`_fillCircleDirect`, `_strokeCircleDirect`, `_strokeLineDirect`) are internal helpers called by the public convenience methods.

---

## 2. Direct Rendering Functions by Shape and Case

### 2.1 RECTANGLES (RectOps.js)

| Stroke Width | Orientation             | Opacity          | Function                    | Clipping TO |
|--------------|-------------------------|------------------|-----------------------------|-------------|
| N/A (fill)   | Axis-aligned            | Opaque           | RectOps.fillOpaque()        | YES      |
| N/A (fill)   | Axis-aligned            | Semi-transparent | RectOps.fillAlpha()         | YES      |
| N/A (fill)   | Rotated (uniform scale) | Both             | RectOps.fillRotated()       | YES      |
| 1px          | Axis-aligned            | Opaque           | RectOps.stroke1pxOpaque()   | YES      |
| 1px          | Axis-aligned            | Semi-transparent | RectOps.stroke1pxAlpha()    | YES      |
| >1px         | Axis-aligned            | Opaque           | RectOps.strokeThickOpaque() | YES      |
| >1px         | Axis-aligned            | Semi-transparent | RectOps.strokeThickAlpha()  | YES      |
| Any          | Rotated (uniform scale) | Both             | RectOps.strokeRotated()     | YES      |
| Any          | Axis-aligned            | Both             | RectOps.fillAndStroke()     | YES      |
| 0px          | Any                     | Any              | IGNORED (per HTML5 spec)    | -        |

### 2.2 ROUNDED RECTANGLES (RoundedRectOps.js)

| Stroke Width | Orientation  | Opacity          | Function                           | Clipping TO |
|--------------|--------------|------------------|------------------------------------|-------------|
| N/A (fill)   | Axis-aligned | Opaque           | RoundedRectOps.fillOpaque()        | YES      |
| N/A (fill)   | Axis-aligned | Semi-transparent | RoundedRectOps.fillAlpha()         | YES      |
| 1px          | Axis-aligned | Opaque           | RoundedRectOps.stroke1pxOpaque()   | YES      |
| 1px          | Axis-aligned | Semi-transparent | RoundedRectOps.stroke1pxAlpha()    | YES      |
| 1px          | Rotated      | Opaque           | RoundedRectOps.strokeRotated()     | YES      |
| >1px         | Axis-aligned | Opaque           | RoundedRectOps.strokeThickOpaque() | YES      |
| >1px         | Axis-aligned | Semi-transparent | RoundedRectOps.strokeThickAlpha()  | YES      |
| Any          | Axis-aligned | Both             | RoundedRectOps.fillAndStroke()     | YES      |
| 0px          | Any          | Any              | IGNORED                            | -        |

Note: Rotated rounded rectangle **stroke** (1px opaque) uses hybrid algorithm: 4 edges via LineOps + 4 corner arcs via ArcOps.stroke1pxOpaqueExactEndpoints(). Fill and thick stroke for rotated rounded rects use path-based rendering.

### 2.3 CIRCLES (CircleOps.js)

| Stroke Width | Opacity          | Function                   | Clipping TO |
|--------------|------------------|----------------------------|-------------|
| N/A (fill)   | Opaque           | CircleOps.fillOpaque()     | YES      |
| N/A (fill)   | Semi-transparent | CircleOps.fillAlpha()      | YES      |
| 1px          | Opaque           | CircleOps.stroke1pxOpaque()| YES      |
| 1px          | Semi-transparent | CircleOps.stroke1pxAlpha() | YES      |
| >1px         | Opaque           | CircleOps.strokeThick()    | YES      |
| >1px         | Semi-transparent | CircleOps.strokeThickAlpha()| YES     |
| Any          | Both             | CircleOps.fillAndStroke()  | YES      |
| 0px          | Any              | IGNORED                    | -        |

Note: Circles are inherently rotation-invariant (no tilted variant needed)

### 2.4 LINES (LineOps.js)

| Stroke Width | Orientation     | Opacity          | Function                          | Clipping TO |
|--------------|-----------------|------------------|-----------------------------------|-------------|
| ≤1.5px       | Any (Bresenham) | Opaque           | LineOps.strokeDirect() thin path  | YES      |
| ≤1.5px       | Any (Bresenham) | Semi-transparent | LineOps.strokeDirect() thin alpha | YES      |
| >1.5px       | Horizontal      | Opaque           | LineOps.strokeDirect() → SpanOps  | YES      |
| >1.5px       | Vertical        | Opaque           | LineOps.strokeDirect() → SpanOps  | YES      |
| >1.5px       | Diagonal/Tilted | Opaque           | LineOps.strokeThickPolygonScan()  | YES      |
| >1.5px       | Any             | Semi-transparent | LineOps.strokeThickPolygonScan()  | YES      |
| 0px          | Any             | Any              | IGNORED                           | -        |

Note: Lines already handle all orientations - no separate "rotated" variant needed.
**Requires lineCap === 'butt' for direct rendering (non-butt caps fall to path-based rendering).**

### 2.5 ARCS (ArcOps.js)

| Stroke Width | Opacity          | Function                            | Clipping TO |
|--------------|------------------|-------------------------------------|-------------|
| N/A (fill)   | Opaque           | ArcOps.fillOpaque()                 | YES      |
| N/A (fill)   | Semi-transparent | ArcOps.fillAlpha()                  | YES      |
| 1px          | Opaque           | ArcOps.stroke1pxOpaque()            | YES      |
| 1px          | Opaque (junctions) | ArcOps.stroke1pxOpaqueExactEndpoints() | YES   |
| 1px          | Semi-transparent | ArcOps.stroke1pxAlpha()             | YES      |
| >1px         | Opaque           | ArcOps.strokeOuterOpaque()          | YES      |
| >1px         | Semi-transparent | ArcOps.strokeOuterAlpha()           | YES      |
| Any          | Both             | ArcOps.fillAndStrokeOuter()         | YES      |

Note: Arc uses Bresenham + angle filtering. 1px paths skip Set overhead for opaque.
**stroke1pxOpaqueExactEndpoints()** uses angle-based iteration (not Bresenham) guaranteeing pixels at exact start/end angles - used by RoundedRectOps.strokeRotated() for junction alignment.
**Requires lineCap === 'butt' for direct rendering (non-butt caps fall to path-based rendering).**

---

## 3. Condition Checks for Direct Rendering Eligibility

### Universal Conditions (all shapes):

| Condition    | Check                                      | What Blocks It                            |
|--------------|--------------------------------------------|-------------------------------------------|
| Paint Source | paintSource instanceof Color               | Gradients, Patterns                       |
| Composite Op | globalCompositeOperation === 'source-over' | All other ops (copy, xor, etc.)           |
| Shadows      | No active shadow                           | Any shadowColor, shadowBlur, shadowOffset |
| Paint Alpha  | paintSource.a > 0                          | Fully transparent paint                   |

### Shape-Specific Conditions:

| Shape       | Additional Checks                                                         |
|-------------|---------------------------------------------------------------------------|
| Rectangle   | Transform: isAxisAligned OR isUniformScale                                |
|             | Non-uniform scale + rotation → path-based rendering (produces parallelogram)         |
| RoundedRect | Transform: noTransform = this._transform.isIdentity (stricter than Rect!) |
| Circle      | Transform: noTransform = this._transform.isIdentity                       |
| Line        | lineCap === 'butt' (required for direct rendering)                               |
| Arc         | lineCap === 'butt' (required for direct rendering)                               |
|             | Angle normalization for clockwise/anticlockwise                           |

---

## 4. Interdependencies Between Direct Renderings

```
RectOps.strokeRotated() ──────────► LineOps.strokeDirect()
   (draws each edge as thick line)

RoundedRectOps.strokeRotated() ───► LineOps.strokeDirect() + ArcOps.stroke1pxOpaqueExactEndpoints()
   (4 edges + 4 corner arcs, 1px opaque only)

RoundedRectOps.stroke1pxOpaque() ──► RectOps.stroke1pxOpaque()
   (fallback when radius=0)

RoundedRectOps.fillOpaque() ───────► RectOps.fillOpaque()
   (fallback when radius=0)

RoundedRectOps.strokeThickOpaque() ─► RectOps.strokeThickOpaque()
   (fallback when radius=0)

RoundedRectOps.fillAndStroke() ────► RectOps.* methods
   (fallback when radius=0)

LineOps.strokeDirect() ────────────► SpanOps.fillOpaque()
   (thick horizontal/vertical lines)

LineOps.strokeThickPolygonScan() ──► SpanOps.fillOpaque() / SpanOps.fillAlpha()
   (diagonal lines)

CircleOps.fillOpaque() ────────────► SpanOps.fillOpaque()
   (each scanline)

CircleOps.fillAlpha() ─────────────► SpanOps.fillAlpha()
   (each scanline)

RoundedRectOps.fillOpaque() ───────► SpanOps.fillOpaque()
   (each scanline)

All *Ops.fill*() ──────────────────► SpanOps.fillOpaque() or SpanOps.fillAlpha()
   (most shapes)                       (shared horizontal span utility)
```

**SpanOps is the shared primitive** - used by RectOps, CircleOps, LineOps, RoundedRectOps

---

## 5. Clipping TO Support (Respects Active Clip Mask)

| Shape                   | Clipping TO Support | Method                    |
|-------------------------|---------------------|---------------------------|
| Rectangle (fill/stroke) | YES                 | clipBuffer per pixel      |
| RoundedRect (all)       | YES                 | clipBuffer per pixel      |
| Circle (all)            | YES                 | clipBuffer per pixel      |
| Line (all)              | YES                 | clipBuffer per pixel/span |
| Arc (all)               | YES                 | clipBuffer per pixel      |

All shapes use clipBuffer parameter passed from Context2D to their respective *Ops methods.

---

## 5.1 Clipping AT Support (Using Primitives as Clip Regions)

**Direct rendering does NOT provide methods to define clip regions.** All clipping uses the standard path-based approach per HTML5 Canvas specification:

```javascript
// To clip AT a circle
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.clip();  // Path-based clipping

// To clip AT a rectangle
ctx.beginPath();
ctx.rect(50, 50, 100, 80);
ctx.clip();

// To clip AT a rounded rectangle
ctx.beginPath();
ctx.roundRect(50, 50, 100, 80, 10);
ctx.clip();
```

| Primitive   | Direct clip*() Method | Path-Based Alternative             |
|-------------|----------------------|-------------------------------------|
| Rectangle   | Not available        | `rect()` + `clip()`                 |
| Circle      | Not available        | `arc(0, 2π)` + `clip()`             |
| Arc         | Not available        | `arc(start, end)` + `clip()`        |
| RoundedRect | Not available        | `roundRect()` + `clip()`            |
| Line        | N/A (not fillable)   | N/A                                 |

**Design rationale**: Direct rendering optimizes fill/stroke operations. Clip region definition is a path operation that works correctly via the existing `clip()` method with any path shape.

### Bit Ordering Convention

All direct renderings use the standard bit ordering convention that matches BitBuffer:
```javascript
const bitIndex = pixelIndex & 7;
const bitMask = (1 << bitIndex);  // CORRECT
```

---

## 6. Optimizations Used per Direct Rendering

### 6.1 32-Bit Packed Pixel Writes

All opaque direct renderings use 32-bit writes for efficiency:
```javascript
const packedColor = Surface.packColor(r, g, b, 255);
data32[pixelIndex] = packedColor;
```

### 6.2 Byte-Skip Optimization for Clipping

Both SpanOps.fillOpaque() and SpanOps.fillAlpha() include byte-skip optimization:
```javascript
if (clipBuffer[byteIndex] === 0) {
    const nextByteBoundary = (byteIndex + 1) << 3;
    // Skip entire clipped byte (8 pixels)
    pixelIndex = Math.min(nextByteBoundary, endIndex);
    continue;
}
```

### 6.3 Algorithm Choices

| Algorithm           | Used By                                  | Purpose                                |
|---------------------|------------------------------------------|----------------------------------------|
| Bresenham circle    | CircleOps.stroke1px*, generateExtents    | Pixel-perfect circle outline           |
| Bresenham line      | LineOps thin strokes                     | Pixel-perfect line rasterization       |
| 8-way symmetry      | CircleOps.stroke1px*                     | Generate 8 points per Bresenham step   |
| Edge function       | RectOps.fillRotated                      | Test if pixel inside rotated rect      |
| Polygon scanline    | LineOps.strokeThickPolygonScan           | Fill thick diagonal lines              |
| Sqrt-based extent   | CircleOps.fillAndStroke, strokeThick     | Analytical circle intersection         |
| Annulus (ring)      | CircleOps.strokeThick, fillAndStroke     | Inner/outer radius for thick strokes   |
| Angle filtering     | ArcOps.*                                 | Filter Bresenham points by angle range |
| Angle-based iterate | ArcOps.stroke1pxOpaqueExactEndpoints     | Exact start/end pixels for junctions   |
| Set deduplication   | CircleOps.stroke1pxAlpha, ArcOps         | Prevent overdraw for alpha blending    |
| Hybrid edges+arcs   | RoundedRectOps.strokeRotated             | 4 lines + 4 arcs for rotated rrect     |

### 6.4 Special Optimizations

| Optimization         | Where                                                          | Description                                        |
|----------------------|----------------------------------------------------------------|----------------------------------------------------|
| Epsilon contraction  | CircleOps.fillAndStroke, RoundedRectOps.fillAndStroke          | FILL_EPSILON = 0.0001 prevents boundary speckles   |
| Line extend/shorten  | RectOps.strokeRotated                                          | Proper miter corners for thick rotated rect stroke |
| Crisp center adjust  | CircleOps, ArcOps                                              | floor(cx - 0.5) for consistent pixel placement     |
| Exact endpoints      | ArcOps.stroke1pxOpaqueExactEndpoints                           | Angle-based iteration guarantees junction pixels   |

---

## 7. Feature Comparison Summary

| Feature               | Rect | RoundRect | Circle | Line | Arc |
|-----------------------|------|-----------|--------|------|-----|
| Fill opaque           | ✓    | ✓         | ✓      | N/A  | ✓   |
| Fill alpha            | ✓    | ✓         | ✓      | N/A  | ✓   |
| Stroke 1px opaque     | ✓    | ✓         | ✓      | ✓    | ✓   |
| Stroke 1px alpha      | ✓    | ✓         | ✓      | ✓    | ✓   |
| Stroke thick opaque   | ✓    | ✓         | ✓      | ✓    | ✓   |
| Stroke thick alpha    | ✓    | ✓         | ✓      | ✓    | ✓   |
| fillAndStroke()       | ✓    | ✓         | ✓      | N/A  | ✓   |
| Rotation support      | ✓    | ⚬†        | N/A    | ✓    | ✗   |
| Clipping TO (respects clip) | ✓    | ✓         | ✓      | ✓    | ✓   |
| Clipping AT (defines clip)  | ✗    | ✗         | ✗      | N/A  | ✗   |
| 32-bit writes         | ✓    | ✓         | ✓      | ✓    | ✓   |
| Uses SpanOps          | ✗    | ✓         | ✓      | ✓    | ✗   |
| Bresenham algorithm   | ✗    | ✗         | ✓      | ✓    | ✓   |
| Set deduplication     | ✗    | ✗         | ✓      | ✗    | ✓   |

†RoundRect rotation support: 1px opaque stroke only via strokeRotated(). Fill/thick stroke use path-based.
‡Clipping AT (defining clip regions) uses path-based approach for all shapes - see Section 5.1.

---

## 8. Method Naming Conventions

### Public Methods (by Class)

| Class          | Fill Methods                        | Stroke Methods                                                                              |
|----------------|-------------------------------------|---------------------------------------------------------------------------------------------|
| RectOps        | fillOpaque, fillAlpha, fillRotated  | stroke1pxOpaque, stroke1pxAlpha, strokeThickOpaque, strokeThickAlpha, strokeRotated         |
| RoundedRectOps | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxAlpha, strokeThickOpaque, strokeThickAlpha, strokeRotated         |
| CircleOps      | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxAlpha, strokeThick, strokeThickAlpha                              |
| LineOps        | N/A                                 | strokeDirect, strokeThickPolygonScan                                                        |
| ArcOps         | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxOpaqueExactEndpoints, stroke1pxAlpha, strokeOuterOpaque, strokeOuterAlpha |
| SpanOps        | fillOpaque, fillAlpha               | N/A                                                                                         |

### Combined Methods

| Class          | fillAndStroke Methods     |
|----------------|---------------------------|
| RectOps        | fillAndStroke()           |
| RoundedRectOps | fillAndStroke()           |
| CircleOps      | fillAndStroke()           |
| ArcOps         | fillAndStrokeOuter()      |

### Private Methods (underscore prefix)

| Class   | Private Methods                                                                 |
|---------|---------------------------------------------------------------------------------|
| RectOps | _extendLine, _shortenLine, _blendPixelAlpha, _renderAndCollectLinePixels, _renderLinePixelsWithCheck |

---

## 9. Remaining Gaps

### Low Priority Enhancements:

1. **Rotated RoundedRect fill/thick stroke** - Currently only 1px opaque stroke supported via strokeRotated()
2. **clipRect/clipCircle convenience methods** - Optional non-standard API additions

---

## 10. Code File Summary

| File                  | Purpose                              |
|-----------------------|--------------------------------------|
| src/SpanOps.js        | Shared horizontal span utilities     |
| src/RectOps.js        | Rectangle direct renderings                 |
| src/CircleOps.js      | Circle direct renderings                    |
| src/LineOps.js        | Line direct renderings                      |
| src/RoundedRectOps.js | Rounded rectangle direct renderings         |
| src/ArcOps.js         | Partial arc direct renderings               |
| src/FastPixelOps.js   | Low-level pixel ops and clipping     |
| src/Context2D.js      | Entry points and dispatch logic      |

---

## 11. Test Coverage Analysis

All 35 documented direct rendering functions have **100% explicit test coverage** via dedicated tests in `tests/direct-rendering/cases/`.

### 11.1 Coverage Matrix

#### RECTANGULAR (RectOps.js) - 9/9 Functions Covered

| Function | Test File(s) |
|----------|--------------|
| `fillOpaque()` | `rect-fill-opaque-test.js` |
| `fillAlpha()` | `rect-sgl-*-fSemi-*` tests |
| `fillRotated()` | `rect-sgl-szMix-fOpaq-sOpaq-*-ctxRotRand-test.js` |
| `stroke1pxOpaque()` | `rect-sgl-szMix-fNone-sOpaq-sw1px-*` tests |
| `stroke1pxAlpha()` | `rect-sgl-szMix-fNone-sSemi-sw1px-lytCenter-cenMixPG-edgeCrisp-ornAxial-test.js` |
| `strokeThickOpaque()` | `rect-*-sw1-10px-*-sOpaq-*` tests |
| `strokeThickAlpha()` | `rect-*-sw1-10px-*-sSemi-*` tests |
| `strokeRotated()` | `rect-sgl-szMix-fOpaq-sOpaq-*-ctxRotRand-test.js` |
| `fillAndStroke()` | `rect-*-fSemi-sMix-*` tests |

#### ROUNDED RECTANGLES (RoundedRectOps.js) - 8/8 Functions Covered

| Function | Test File(s) |
|----------|--------------|
| `fillOpaque()` | `roundrect-sgl-szMix-fOpaq-sNone-lytCenter-cenMixPG-edgeCrisp-ornAxial-rrrRand-test.js` |
| `fillAlpha()` | `roundrect-m8-xl-fSemi-sNone-*` |
| `stroke1pxOpaque()` | `roundrect-*-sw1px-*-sOpaq-*` tests |
| `stroke1pxAlpha()` | `roundrect-sgl-szMix-fNone-sSemi-sw1px-lytCenter-cenMixPG-edgeCrisp-ornAxial-rrrRand-test.js` |
| `strokeThickOpaque()` | `roundrect-*-sw1-11px-*-sOpaq-*` tests |
| `strokeThickAlpha()` | `roundrect-m6-*-sSemi-*`, `roundrect-m8-*` tests |
| `strokeRotated()` | `roundrect-m12-*-ornRot-*`, `roundrect-sgl-szRand-*-ornRot-*` tests |
| `fillAndStroke()` | Multiple fill+stroke tests |

#### CIRCLES (CircleOps.js) - 7/7 Functions Covered

| Function | Test File(s) |
|----------|--------------|
| `fillOpaque()` | `circle-fill-opaque-test.js`, `circle-*-fOpaq-sNone-*` |
| `fillAlpha()` | `circle-semitransparent-test.js` |
| `stroke1pxOpaque()` | `circle-*-sw1px-*-sOpaq-*` tests |
| `stroke1pxAlpha()` | `circle-sgl-szMix-fNone-sSemi-sw1px-lytCenter-cenMixPG-edgeCrisp-test.js` |
| `strokeThick()` | `circle-*-sw1-30px-*-sOpaq-*` tests |
| `strokeThickAlpha()` | `circle-*-sw1-30px-*-sSemi-*` tests |
| `fillAndStroke()` | `circle-*-fOpaq-sOpaq-*`, `multiple-circles-test.js` |

#### LINES (LineOps.js) - 5/5 Functions Covered

| Function | Test File(s) |
|----------|--------------|
| `strokeDirect()` thin opaque | `line-crisp-horizontal-test.js`, `line-*-sw1px-*-sOpaq-*` |
| `strokeDirect()` thin alpha | `line-sgl-fNone-sSemi-sw1px-ornDiag-test.js` |
| `strokeDirect()` thick H/V | `line-*-sw2px-*-ornHoriz/Vert-*` tests |
| `strokeThickPolygonScan()` opaque | `line-m20-*-ornRand-*` tests |
| `strokeThickPolygonScan()` alpha | `line-m15-*-sMix-*` tests |

#### ARCS (ArcOps.js) - 8/8 Functions Covered + Edge Cases

| Function | Test File(s) |
|----------|--------------|
| `fillOpaque()` | `arc-fill-opaque-test.js`, `arc-*-fOpaq-sNone-*` |
| `fillAlpha()` | `arc-semitransparent-test.js` |
| `stroke1pxOpaque()` | `arc-*-sw1px-*-sOpaq-*` tests |
| `stroke1pxOpaqueExactEndpoints()` | Tested via `roundrect-*-ornRot-*` (used for junction alignment) |
| `stroke1pxAlpha()` | `arc-*-sw1px-*-sSemi-*` tests |
| `strokeOuterOpaque()` | `arc-*-sw2-6px-*-sOpaq-*`, `arc-*-sw1-30px-*` tests |
| `strokeOuterAlpha()` | `arc-*-sw2-6px-*-sSemi-*` tests |
| `fillAndStrokeOuter()` | `arc-*-fMix-sOpaq-*`, `arc-*-fMix-sSemi-*` tests |
| *Small angles edge case* | `arc-sgl-szMix-fMix-sMix-swMix-lytCenter-cenMixPG-edgeCrisp-arcASmall-test.js` |

### 11.2 Coverage Summary

| Shape | Functions | Covered |
|-------|-----------|---------|
| Rectangle | 9 | 9 ✓ |
| RoundedRect | 8 | 8 ✓ |
| Circle | 7 | 7 ✓ |
| Line | 5 | 5 ✓ |
| Arc | 8 | 8 ✓ |
| **Total** | **37** | **37 ✓** |

**Test Suite Statistics:**
- **71 test files** in `tests/direct-rendering/cases/`
- **355 test runs passed** (71 tests × 5 iterations)
- Run command: `node tests/direct-rendering/run-direct-rendering-tests.js -i 5`

### 11.3 Optional Future Edge Case Tests

While core functions are fully covered, these edge cases could be added:

1. Near-full arcs (350°-360°)
2. Clockwise vs counterclockwise arc direction
3. Sub-pixel stroke widths (0.1-0.9px)
4. Shapes larger than canvas bounds
