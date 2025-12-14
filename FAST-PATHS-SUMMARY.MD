# SWCanvas Fast Paths - Comprehensive Analysis & Summary

## Executive Summary

SWCanvas implements fast paths for 5 shape types: Rectangle, RoundedRect, Circle, Line, and Arc. Each has specialized rendering paths that bypass the general polygon filler when specific conditions are met.

---

## 1. Fast Path Entry Points (Calling Functions)

| Shape                   | Entry Point                           | Location                 | Fallback Slow Path          |
|-------------------------|---------------------------------------|--------------------------|-----------------------------|
| Rectangle Fill          | Context2D.fillRect()                  | Context2D.js:293-364     | rasterizer.fillRect()       |
| Rectangle Stroke        | Context2D.strokeRect()                | Context2D.js:366-459     | rasterizer.stroke(path)     |
| Rectangle Fill+Stroke   | Context2D.fillAndStrokeRect()         | Context2D.js:469-525     | Separate fill + stroke      |
| RoundedRect Fill        | Context2D.fillRoundRect()             | Context2D.js:713-764     | path.roundRect() + fill()   |
| RoundedRect Stroke      | Context2D.strokeRoundRect()           | Context2D.js:637-702     | path.roundRect() + stroke() |
| RoundedRect Fill+Stroke | Context2D.fillAndStrokeRoundRect()    | Context2D.js:775-836     | Separate fill + stroke      |
| Circle Fill             | Context2D.fillCircle()                | Context2D.js:1474-1496   | path.arc() + fill()         |
| Circle Stroke           | Context2D.strokeCircle()              | Context2D.js:1499-1523   | path.arc() + stroke()       |
| Circle Fill+Stroke      | Context2D.fillAndStrokeCircle()       | Context2D.js:1526-1570   | Separate fill + stroke      |
| Circle (path detection) | Context2D.stroke() [full circle opt]  | Context2D.js:890-915     | Standard path stroke        |
| Line Stroke             | Context2D.strokeLine()                | Context2D.js:1779-1802   | path moveTo/lineTo + stroke |
| Arc Fill                | Context2D.fillArc()                   | Context2D.js:1585-1627   | path.arc() + fill()         |
| Arc Stroke              | Context2D.outerStrokeArc()            | Context2D.js:1638-1695   | path.arc() + stroke()       |
| Arc Fill+Stroke         | Context2D.fillAndOuterStrokeArc()     | Context2D.js:1706-1770   | Separate fill + stroke      |

**Notes:**
- "Circle (path detection)" is an optimization inside `stroke()` that detects when the current path is a full circle via `CircleOps.isFullCirclePath()` and uses CircleOps fast paths. This is different from calling `strokeCircle()` directly.
- Private methods (`_fillCircleDirect`, `_strokeCircleDirect`, `_strokeLineDirect`) are internal helpers called by the public convenience methods.

---

## 2. Fast Path Functions by Shape and Case

### 2.1 RECTANGLES (RectOps.js)

| Stroke Width | Orientation             | Opacity          | Function                    | Clipping |
|--------------|-------------------------|------------------|-----------------------------|----------|
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

| Stroke Width | Orientation  | Opacity          | Function                           | Clipping |
|--------------|--------------|------------------|------------------------------------|----------|
| N/A (fill)   | Axis-aligned | Opaque           | RoundedRectOps.fillOpaque()        | YES      |
| N/A (fill)   | Axis-aligned | Semi-transparent | RoundedRectOps.fillAlpha()         | YES      |
| 1px          | Axis-aligned | Opaque           | RoundedRectOps.stroke1pxOpaque()   | YES      |
| 1px          | Axis-aligned | Semi-transparent | RoundedRectOps.stroke1pxAlpha()    | YES      |
| >1px         | Axis-aligned | Opaque           | RoundedRectOps.strokeThickOpaque() | YES      |
| >1px         | Axis-aligned | Semi-transparent | RoundedRectOps.strokeThickAlpha()  | YES      |
| Any          | Axis-aligned | Both             | RoundedRectOps.fillAndStroke()     | YES      |
| 0px          | Any          | Any              | IGNORED                            | -        |

Note: Rotated rounded rectangles use slow path (no fast path)

### 2.3 CIRCLES (CircleOps.js)

| Stroke Width | Opacity          | Function                   | Clipping |
|--------------|------------------|----------------------------|----------|
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

| Stroke Width | Orientation     | Opacity          | Function                          | Clipping |
|--------------|-----------------|------------------|-----------------------------------|----------|
| ≤1.5px       | Any (Bresenham) | Opaque           | LineOps.strokeDirect() thin path  | YES      |
| ≤1.5px       | Any (Bresenham) | Semi-transparent | LineOps.strokeDirect() thin alpha | YES      |
| >1.5px       | Horizontal      | Opaque           | LineOps.strokeDirect() → SpanOps  | YES      |
| >1.5px       | Vertical        | Opaque           | LineOps.strokeDirect() → SpanOps  | YES      |
| >1.5px       | Diagonal/Tilted | Opaque           | LineOps.strokeThickPolygonScan()  | YES      |
| >1.5px       | Any             | Semi-transparent | LineOps.strokeThickPolygonScan()  | YES      |
| 0px          | Any             | Any              | IGNORED                           | -        |

Note: Lines already handle all orientations - no separate "rotated" variant needed.
**Requires lineCap === 'butt' for fast path (non-butt caps fall to slow path).**

### 2.5 ARCS (ArcOps.js)

| Stroke Width | Opacity          | Function                    | Clipping |
|--------------|------------------|-----------------------------|----------|
| N/A (fill)   | Opaque           | ArcOps.fillOpaque()         | YES      |
| N/A (fill)   | Semi-transparent | ArcOps.fillAlpha()          | YES      |
| 1px          | Opaque           | ArcOps.stroke1pxOpaque()    | YES      |
| 1px          | Semi-transparent | ArcOps.stroke1pxAlpha()     | YES      |
| >1px         | Opaque           | ArcOps.strokeOuterOpaque()  | YES      |
| >1px         | Semi-transparent | ArcOps.strokeOuterAlpha()   | YES      |
| Any          | Both             | ArcOps.fillAndStrokeOuter() | YES      |

Note: Arc uses Bresenham + angle filtering. 1px paths skip Set overhead for opaque.
**Requires lineCap === 'butt' for fast path (non-butt caps fall to slow path).**

---

## 3. Condition Checks for Fast Path Eligibility

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
|             | Non-uniform scale + rotation → slow path (produces parallelogram)         |
| RoundedRect | Transform: noTransform = this._transform.isIdentity (stricter than Rect!) |
| Circle      | Transform: noTransform = this._transform.isIdentity                       |
| Line        | lineCap === 'butt' (required for fast path)                               |
| Arc         | lineCap === 'butt' (required for fast path)                               |
|             | Angle normalization for clockwise/anticlockwise                           |

---

## 4. Interdependencies Between Fast Paths

```
RectOps.strokeRotated() ──────────► LineOps.strokeDirect()
   (draws each edge as thick line)

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

## 5. Clipping Handling by Fast Path

| Shape                   | Clipping Support in Fast Path | Method                    |
|-------------------------|-------------------------------|---------------------------|
| Rectangle (fill/stroke) | YES                           | clipBuffer per pixel      |
| RoundedRect (all)       | YES                           | clipBuffer per pixel      |
| Circle (all)            | YES                           | clipBuffer per pixel      |
| Line (all)              | YES                           | clipBuffer per pixel/span |
| Arc (all)               | YES                           | clipBuffer per pixel      |

**All shapes now support clipping in their fast paths.**

### Bit Ordering Convention

All fast paths use the standard bit ordering convention that matches BitBuffer:
```javascript
const bitIndex = pixelIndex & 7;
const bitMask = (1 << bitIndex);  // CORRECT
```

---

## 6. Optimizations Used per Fast Path

### 6.1 32-Bit Packed Pixel Writes

All opaque fast paths use 32-bit writes for efficiency:
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

| Algorithm         | Used By                               | Purpose                                |
|-------------------|---------------------------------------|----------------------------------------|
| Bresenham circle  | CircleOps.stroke1px*, generateExtents | Pixel-perfect circle outline           |
| Bresenham line    | LineOps thin strokes                  | Pixel-perfect line rasterization       |
| 8-way symmetry    | CircleOps.stroke1px*                  | Generate 8 points per Bresenham step   |
| Edge function     | RectOps.fillRotated                   | Test if pixel inside rotated rect      |
| Polygon scanline  | LineOps.strokeThickPolygonScan        | Fill thick diagonal lines              |
| Sqrt-based extent | CircleOps.fillAndStroke, strokeThick  | Analytical circle intersection         |
| Annulus (ring)    | CircleOps.strokeThick, fillAndStroke  | Inner/outer radius for thick strokes   |
| Angle filtering   | ArcOps.*                              | Filter Bresenham points by angle range |
| Set deduplication | CircleOps.stroke1pxAlpha, ArcOps      | Prevent overdraw for alpha blending    |

### 6.4 Special Optimizations

| Optimization         | Where                                                          | Description                                        |
|----------------------|----------------------------------------------------------------|----------------------------------------------------|
| Epsilon contraction  | CircleOps.fillAndStroke, RoundedRectOps.fillAndStroke          | FILL_EPSILON = 0.0001 prevents boundary speckles   |
| Line extend/shorten  | RectOps.strokeRotated                                          | Proper miter corners for thick rotated rect stroke |
| Crisp center adjust  | CircleOps, ArcOps                                              | floor(cx - 0.5) for consistent pixel placement     |

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
| Rotation support      | ✓    | ✗         | N/A    | ✓    | ✗   |
| Clipping in fast path | ✓    | ✓         | ✓      | ✓    | ✓   |
| 32-bit writes         | ✓    | ✓         | ✓      | ✓    | ✓   |
| Uses SpanOps          | ✗    | ✓         | ✓      | ✓    | ✗   |
| Bresenham algorithm   | ✗    | ✗         | ✓      | ✓    | ✓   |
| Set deduplication     | ✗    | ✗         | ✓      | ✗    | ✓   |

---

## 8. Method Naming Conventions

### Public Methods (by Class)

| Class          | Fill Methods                        | Stroke Methods                                                                |
|----------------|-------------------------------------|-------------------------------------------------------------------------------|
| RectOps        | fillOpaque, fillAlpha, fillRotated  | stroke1pxOpaque, stroke1pxAlpha, strokeThickOpaque, strokeThickAlpha          |
| RoundedRectOps | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxAlpha, strokeThickOpaque, strokeThickAlpha          |
| CircleOps      | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxAlpha, strokeThick, strokeThickAlpha                |
| LineOps        | N/A                                 | strokeDirect, strokeThickPolygonScan                                          |
| ArcOps         | fillOpaque, fillAlpha               | stroke1pxOpaque, stroke1pxAlpha, strokeOuterOpaque, strokeOuterAlpha          |
| SpanOps        | fillOpaque, fillAlpha               | N/A                                                                           |

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

1. **Rotated RoundedRect fast path** - Currently requires identity transform
2. **clipRect/clipCircle convenience methods** - Optional non-standard API additions

---

## 10. Code File Summary

| File                  | Purpose                              |
|-----------------------|--------------------------------------|
| src/SpanOps.js        | Shared horizontal span utilities     |
| src/RectOps.js        | Rectangle fast paths                 |
| src/CircleOps.js      | Circle fast paths                    |
| src/LineOps.js        | Line fast paths                      |
| src/RoundedRectOps.js | Rounded rectangle fast paths         |
| src/ArcOps.js         | Partial arc fast paths               |
| src/FastPixelOps.js   | Low-level pixel ops and clipping     |
| src/Context2D.js      | Entry points and dispatch logic      |
