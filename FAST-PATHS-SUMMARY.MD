SWCanvas Fast Paths - Comprehensive Analysis & Comparison

 Executive Summary

 SWCanvas implements fast paths for 5 shape types: Rectangle, RoundedRect, Circle, Line, and Arc. Each has specialized rendering paths that bypass the general polygon filler when specific conditions are met.

 ---
 1. Fast Path Entry Points (Calling Functions)

 | Shape                 | Entry Point                     | Location               | Fallback Slow Path          |
 |-----------------------|---------------------------------|------------------------|-----------------------------|
 | Rectangle Fill        | Context2D.fillRect()            | Context2D.js:293-362   | rasterizer.fillRect()       |
 | Rectangle Stroke      | Context2D.strokeRect()          | Context2D.js:364-455   | rasterizer.stroke(path)     |
 | RoundedRect Fill      | Context2D.fillRoundRect()       | Context2D.js:643+      | path.roundRect() + fill()   |
 | RoundedRect Stroke    | Context2D.strokeRoundRect()     | Context2D.js:567-632   | path.roundRect() + stroke() |
 | Circle Fill           | Context2D._fillCircleDirect()   | Context2D.js:1717-1788 | path.arc() + fill()         |
 | Circle Stroke         | Context2D._strokeCircleDirect() | Context2D.js:1794-1829 | path.arc() + stroke()       |
 | Circle (via stroke()) | Context2D.stroke()              | Context2D.js:820-846   | Standard path stroke        |
 | Circle Fill+Stroke    | Context2D.fillAndStroke()       | Context2D.js:1485-1494 | Separate fill + stroke      |
 | Line                  | Context2D._strokeLineDirect()   | Context2D.js:1835-1869 | Standard path stroke        |
 | Arc Fill              | via _fillArcDirect()            | Uses ArcOps            | path.arc() + fill()         |
 | Arc Stroke            | via _strokeArcDirect()          | Uses ArcOps            | path.arc() + stroke()       |

 ---
 2. Fast Path Functions by Shape and Case

 2.1 RECTANGLES (RectOps.js)

 | Stroke Width | Orientation             | Opacity          | Function                    | Line |
 |--------------|-------------------------|------------------|-----------------------------|------|
 | N/A (fill)   | Axis-aligned            | Opaque           | RectOps.fillOpaque()        | 316  |
 | N/A (fill)   | Axis-aligned            | Semi-transparent | RectOps.fillAlpha()         | 353  |
 | N/A (fill)   | Rotated (uniform scale) | Both             | RectOps.fillRotated()       | 407  |
 | 1px          | Axis-aligned            | Opaque           | RectOps.stroke1pxOpaque()   | 16   |
 | 1px          | Axis-aligned            | Semi-transparent | RectOps.stroke1pxAlpha()    | 72   |
 | >1px         | Axis-aligned            | Opaque           | RectOps.strokeThickOpaque() | 138  |
 | >1px         | Axis-aligned            | Semi-transparent | RectOps.strokeThickAlpha()  | 202  |
 | Any          | Rotated (uniform scale) | Both             | RectOps.strokeRotated()     | 564  |
 | 0px          | Any                     | Any              | IGNORED (per HTML5 spec)    | -    |

 Missing: fillAndStroke() for rectangles (roundedrects have it)

 2.2 ROUNDED RECTANGLES (RoundedRectOps.js)

 | Stroke Width | Orientation  | Opacity          | Function                           | Line |
 |--------------|--------------|------------------|------------------------------------|------|
 | N/A (fill)   | Axis-aligned | Opaque           | RoundedRectOps.fillOpaque()        | 238  |
 | N/A (fill)   | Axis-aligned | Semi-transparent | RoundedRectOps.fillAlpha()         | 324  |
 | 1px          | Axis-aligned | Opaque           | RoundedRectOps.stroke1pxOpaque()   | 22   |
 | 1px          | Axis-aligned | Semi-transparent | RoundedRectOps.stroke1pxAlpha()    | 122  |
 | >1px         | Axis-aligned | Opaque           | RoundedRectOps.strokeThickOpaque() | 412  |
 | >1px         | Axis-aligned | Semi-transparent | RoundedRectOps.strokeThickAlpha()  | 545  |
 | Any          | Axis-aligned | Both             | RoundedRectOps.fillAndStroke()     | 679  |
 | 0px          | Any          | Any              | IGNORED                            | -    |

 Missing: Rotated rounded rectangles (no fast path - falls through to slow path)

 2.3 CIRCLES (CircleOps.js)

 | Stroke Width | Opacity          | Function                             | Line               |
 |--------------|------------------|--------------------------------------|--------------------|
 | N/A (fill)   | Opaque           | Uses SpanOps.fillFast() with extents | via Context2D:1717 |
 | N/A (fill)   | Semi-transparent | CircleOps.fillAlphaBlend()           | 94                 |
 | 1px          | Opaque           | CircleOps.stroke1pxOpaque()          | 153                |
 | 1px          | Semi-transparent | CircleOps.stroke1pxAlpha()           | 277                |
 | >1px         | Opaque           | CircleOps.strokeThick()              | 574                |
 | >1px         | Semi-transparent | CircleOps.strokeThickAlpha()         | 663                |
 | Any          | Both             | CircleOps.fillAndStroke()            | 403                |
 | 0px          | Any              | IGNORED                              | -                  |

 Note: Circles are inherently rotation-invariant (no tilted variant needed)

 2.4 LINES (LineOps.js)

 | Stroke Width | Orientation     | Opacity          | Function                          | Line    |
 |--------------|-----------------|------------------|-----------------------------------|---------|
 | ≤1.5px       | Any (Bresenham) | Opaque           | LineOps.strokeDirect() thin path  | 25-79   |
 | ≤1.5px       | Any (Bresenham) | Semi-transparent | LineOps.strokeDirect() thin alpha | 119-192 |
 | >1.5px       | Horizontal      | Opaque           | LineOps.strokeDirect() → SpanOps  | 88-100  |
 | >1.5px       | Vertical        | Opaque           | LineOps.strokeDirect() → SpanOps  | 101-113 |
 | >1.5px       | Diagonal/Tilted | Opaque           | LineOps.strokeThickPolygonScan()  | 217     |
 | >1.5px       | Any             | Semi-transparent | LineOps.strokeThickPolygonScan()  | 195     |
 | 0px          | Any             | Any              | IGNORED                           | -       |

 Note: Lines already handle all orientations - no separate "rotated" variant needed

 2.5 ARCS (ArcOps.js)

 | Stroke Width | Opacity          | Function                    | Line |
 |--------------|------------------|-----------------------------|------|
 | N/A (fill)   | Opaque           | ArcOps.fillOpaque()         | 69   |
 | N/A (fill)   | Semi-transparent | ArcOps.fillAlpha()          | 116  |
 | Any          | Opaque           | ArcOps.strokeOuterOpaque()  | 214  |
 | Any          | Semi-transparent | ArcOps.strokeOuterAlpha()   | 297  |
 | Any          | Both             | ArcOps.fillAndStrokeOuter() | 404  |

 Note: Arc stroke uses Bresenham + angle filtering, no separate 1px/thick variants

 ---
 3. Condition Checks for Fast Path Eligibility

 Universal Conditions (all shapes):

 | Condition    | Check                                      | What Blocks It                            |
 |--------------|--------------------------------------------|-------------------------------------------|
 | Paint Source | paintSource instanceof Color               | Gradients, Patterns                       |
 | Composite Op | globalCompositeOperation === 'source-over' | All other ops (copy, xor, etc.)           |
 | Shadows      | No active shadow                           | Any shadowColor, shadowBlur, shadowOffset |
 | Paint Alpha  | paintSource.a > 0                          | Fully transparent paint                   |

 Shape-Specific Conditions:

 | Shape       | Additional Checks                                                            |
 |-------------|------------------------------------------------------------------------------|
 | Rectangle   | Clipping: noClip = !this._clipMask (fast path requires no clipping)          |
 |             | Transform: isAxisAligned OR isUniformScale                                   |
 |             | Non-uniform scale + rotation → slow path (produces parallelogram)            |
 | RoundedRect | Clipping: noClip (fast path requires no clipping)                            |
 |             | Transform: noTransform = this._transform.isIdentity (stricter than Rect!)    |
 | Circle      | Transform: noTransform = this._transform.isIdentity (for stroke() detection) |
 |             | 1px stroke check in stroke(): Math.abs(lineWidth - 1) < 0.001                |
 | Line        | Returns false if gradient/pattern (caller must handle)                       |
 | Arc         | Angle normalization for clockwise/anticlockwise                              |

 Key Asymmetry Found:

 - Rectangles: Support transforms (axis-aligned + uniform-scale rotated)
 - RoundedRects: Require isIdentity transform (no rotation/scale fast path)
 - Circles: Require isIdentity transform for stroke() fast path detection

 ---
 4. Interdependencies Between Fast Paths

 RectOps.strokeRotated() ──────────► LineOps.strokeDirect()
    (lines 582-643)                    (draws each edge as thick line)

 RoundedRectOps.stroke1pxOpaque() ──► RectOps.stroke1pxOpaque()
    (line 35)                          (fallback when radius=0)

 RoundedRectOps.fillOpaque() ───────► RectOps.fillOpaque()
    (line 248)                          (fallback when radius=0)

 RoundedRectOps.strokeThickOpaque() ─► RectOps.strokeThickOpaque()
    (line 422)                          (fallback when radius=0)

 RoundedRectOps.fillAndStroke() ────► RectOps.* methods
    (lines 696-710)                     (fallback when radius=0)

 LineOps.strokeDirect() ────────────► SpanOps.fillFast()
    (thick horizontal/vertical)         (lines 98, 111)

 LineOps.strokeThickPolygonScan() ──► SpanOps.fillFast() / SpanOps.fillAlpha()
    (diagonal lines)                    (lines 342, 358)

 CircleOps.fillAlphaBlend() ────────► SpanOps.fillAlpha()
    (line 132)                          (each scanline)

 RoundedRectOps.fillOpaque() ───────► SpanOps.fillFast()
    (line 306)                          (each scanline)

 All *Ops.fill*() ──────────────────► SpanOps.fillFast() or SpanOps.fillAlpha()
    (most shapes)                       (shared horizontal span utility)

 SpanOps is the shared primitive - used by RectOps, CircleOps, LineOps, RoundedRectOps

 ---
 5. Clipping Handling by Fast Path

 | Shape                   | Clipping Support in Fast Path | Method                        |
 |-------------------------|-------------------------------|-------------------------------|
 | Rectangle (fill/stroke) | NO - requires noClip          | Falls to slow path if clipped |
 | RoundedRect (all)       | YES - clipBuffer param        | Bit-checked per pixel         |
 | Circle (all)            | YES - clipBuffer param        | Bit-checked per pixel         |
 | Line (all)              | YES - clipBuffer param        | Bit-checked per pixel/span    |
 | Arc (all)               | YES - clipBuffer param        | Bit-checked per pixel         |

 Broken Symmetry:

 Rectangles reject clipping in fast path (Context2D.js lines 297, 368: noClip = !this._clipMask)
 but other shapes handle clipping within their fast paths via clipBuffer parameter.

 ---
 6. Optimizations Used per Fast Path

 6.1 32-Bit Packed Pixel Writes

 | Shape       | Opaque Path Uses                 | Location                        |
 |-------------|----------------------------------|---------------------------------|
 | Rectangle   | data32[pixelIndex] = packedColor | RectOps.js:337                  |
 | RoundedRect | data32[pos] = packedColor        | RoundedRectOps.js:60, 252, etc. |
 | Circle      | data32[pixelIndex] = packedColor | CircleOps.js:207-253            |
 | Line        | data32[pixelIndex] = packedColor | LineOps.js:63                   |
 | Arc         | data32[pos] = packedColor        | ArcOps.js:97                    |
 | SpanOps     | data32[pixelIndex] = packedColor | SpanOps.js:52, 59               |

 All opaque fast paths use 32-bit writes - consistent!

 6.2 Byte-Skip Optimization for Clipping

 Only in SpanOps.fillFast() (lines 43-48):
 if (clipBuffer[byteIndex] === 0) {
     const nextByteBoundary = (byteIndex + 1) << 3;
     pixelIndex = Math.min(nextByteBoundary, endIndex);
     continue;  // Skip entire clipped byte (8 pixels)
 }

 Not used in: Individual shape ops (RectOps, CircleOps, etc.) - they check bit-by-bit

 6.3 Algorithm Choices

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

 6.4 Unique Optimizations

 | Optimization         | Where                                                         | Description                                           |
 |----------------------|---------------------------------------------------------------|-------------------------------------------------------|
 | Epsilon contraction  | CircleOps.fillAndStroke:716, RoundedRectOps.fillAndStroke:716 | FILL_EPSILON = 0.0001 prevents boundary speckles      |
 | Line extend/shorten  | RectOps.strokeRotated:610,630                                 | Proper miter corners for thick rotated rect stroke    |
 | Thickness adjustment | ArcOps:227,313                                                | thickness *= 0.75 for thick arcs (visual calibration) |
 | CrispSWCanvas center | CircleOps, ArcOps                                             | floor(cx - 0.5) for consistent pixel placement        |

 ---
 7. Broken Symmetries & Missing Features

 7.1 Missing fillAndStroke()

 | Shape       | Has fillAndStroke? |
 |-------------|--------------------|
 | Rectangle   | NO                 |
 | RoundedRect | YES (line 679)     |
 | Circle      | YES (line 403)     |
 | Line        | N/A (stroke only)  |
 | Arc         | YES (line 404)     |

 Gap: Rectangles lack unified fillAndStroke() - could cause speckles at fill/stroke boundary

 7.2 Rotation Support Inconsistency

 | Shape       | Rotation Fast Path                                                 |
 |-------------|--------------------------------------------------------------------|
 | Rectangle   | YES (uniform scale) - fillRotated, strokeRotated                   |
 | RoundedRect | NO - requires isIdentity                                           |
 | Circle      | N/A (rotation invariant)                                           |
 | Line        | YES (all orientations handled)                                     |
 | Arc         | NO - requires identity (CrispSWCanvas center implies no transform) |

 Gap: RoundedRects and Arcs could potentially support rotated fast paths like Rectangles

 7.3 Clipping Support Inconsistency

 | Shape       | Clipping in Fast Path   |
 |-------------|-------------------------|
 | Rectangle   | NO (bails to slow path) |
 | RoundedRect | YES                     |
 | Circle      | YES                     |
 | Line        | YES                     |
 | Arc         | YES                     |

 Gap: Rectangles don't handle clipping in fast path while all other shapes do

 7.4 Stroke Width Handling Inconsistency

 | Shape       | 1px Special Case                      | Thick Path         |
 |-------------|---------------------------------------|--------------------|
 | Rectangle   | YES (stroke1px*)                      | YES (strokeThick*) |
 | RoundedRect | YES (stroke1px*)                      | YES (strokeThick*) |
 | Circle      | YES (stroke1px*)                      | YES (strokeThick*) |
 | Line        | YES (≤1.5px Bresenham)                | YES (polygon scan) |
 | Arc         | NO (uses Set-based Bresenham for all) | Same as thin       |

 Gap: Arc doesn't have separate 1px vs thick paths - uses same algorithm with thickness parameter

 7.5 Byte-Skip Clipping Optimization

 | Location                    | Uses Byte-Skip      |
 |-----------------------------|---------------------|
 | SpanOps.fillFast()          | YES                 |
 | SpanOps.fillAlpha()         | NO (per-pixel only) |
 | All *Ops per-pixel clipping | NO                  |

 Gap: Alpha spans and direct pixel ops could benefit from byte-skip optimization

 ---
 8. Summary Comparison Table

 | Feature               | Rect | RoundRect | Circle    | Line | Arc |
 |-----------------------|------|-----------|-----------|------|-----|
 | Fill opaque           | ✓    | ✓         | ✓         | N/A  | ✓   |
 | Fill alpha            | ✓    | ✓         | ✓         | N/A  | ✓   |
 | Stroke 1px opaque     | ✓    | ✓         | ✓         | ✓    | -   |
 | Stroke 1px alpha      | ✓    | ✓         | ✓         | ✓    | -   |
 | Stroke thick opaque   | ✓    | ✓         | ✓         | ✓    | ✓   |
 | Stroke thick alpha    | ✓    | ✓         | ✓         | ✓    | ✓   |
 | fillAndStroke()       | ✗    | ✓         | ✓         | N/A  | ✓   |
 | Rotation support      | ✓    | ✗         | N/A       | ✓    | ✗   |
 | Clipping in fast path | ✗    | ✓         | ✓         | ✓    | ✓   |
 | 32-bit writes         | ✓    | ✓         | ✓         | ✓    | ✓   |
 | Uses SpanOps          | ✗    | ✓         | ✓         | ✓    | ✗   |
 | Bresenham algorithm   | ✗    | ✗         | ✓         | ✓    | ✓   |
 | Set deduplication     | ✗    | ✗         | ✓ (alpha) | ✗    | ✓   |

 ---
 9. Code File Summary

 | File                  | Lines | Purpose                          |
 |-----------------------|-------|----------------------------------|
 | src/SpanOps.js        | 143   | Shared horizontal span utilities |
 | src/RectOps.js        | ~650  | Rectangle fast paths             |
 | src/CircleOps.js      | ~755  | Circle fast paths                |
 | src/LineOps.js        | ~365  | Line fast paths                  |
 | src/RoundedRectOps.js | ~948  | Rounded rectangle fast paths     |
 | src/ArcOps.js         | ~430  | Partial arc fast paths           |
 | src/Context2D.js      | ~1870 | Entry points and dispatch logic  |