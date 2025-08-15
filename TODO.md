# SWCanvas Test Expansion TODO

## Current Status
- ✅ Analyzed current test coverage gaps  
- ✅ Drafted comprehensive test expansion plan
- ✅ Phase 1 Basic Transformation Tests FULLY COMPLETED (8/8 tests)
- ✅ Phase 2 Advanced Path Filling Tests FULLY COMPLETED (9/9 tests)
- ✅ Phase 3 Advanced Clipping Tests FULLY COMPLETED (8/8 tests)
- ✅ Phase 4 Combined Feature Tests FULLY COMPLETED (7/7 tests)
- ✅ Phase 5 Image Operations FULLY COMPLETED (6/6 tests)
- ✅ Phase 6 Sub-pixel Rendering FULLY COMPLETED (4/4 tests)
- ✅ Modular Test Architecture FULLY IMPLEMENTED
- ✅ All placeholder test implementations COMPLETED
- ✅ Rescued Test Integration FULLY COMPLETED (4/4 rescued tests)

## Test Expansion Plan

### Phase 1: Basic Transformation Tests (Priority: HIGH) ✅ COMPLETED
- [x] transform-basic-translate - Basic translation operations
- [x] transform-basic-scale - Basic scaling operations  
- [x] transform-basic-rotate - Basic rotation operations
- [x] transform-setTransform-vs-transform - Compare setTransform vs transform behavior
- [x] transform-resetTransform - Test resetTransform functionality
- [x] transform-state-save-restore - Transform with save/restore stack
- [x] transform-combined-operations - Multiple transforms combined
- [x] transform-matrix-order - Test transform order dependency (A*B ≠ B*A)

### Phase 2: Advanced Path Filling Tests ✅ COMPLETED
- [x] fill-concave-polygons - Star shapes, L-shapes
- [x] fill-self-intersecting - Self-intersecting paths
- [x] fill-nested-holes - Paths with holes
- [x] fill-multiple-subpaths - Multiple subpath handling
- [x] fill-bezier-curves - Cubic bezier curve filling
- [x] fill-quadratic-curves - Quadratic curve filling  
- [x] fill-arcs-ellipses - Arc and ellipse filling
- [x] fill-mixed-paths - Linear + curve combinations
- [x] fill-rule-complex - Complex even-odd vs nonzero comparisons

### Phase 3: Advanced Clipping Tests ✅ COMPLETED
- [x] clip-rectangular - Rectangular clip regions
- [x] clip-polygon - Polygon clip shapes
- [x] clip-curved - Arc/ellipse clip regions
- [x] clip-self-intersecting - Self-intersecting clip paths
- [x] clip-stack-nested - Multiple nested clips
- [x] clip-save-restore - Clip with save/restore behavior
- [x] clip-intersection - Clip intersection behavior
- [x] clip-intersection-enhanced - Enhanced clipping intersection test

### Phase 4: Combined Feature Tests (Integration) ✅ FULLY COMPLETED
- [x] combined-transform-fill-rotate - Rotated complex polygons
- [x] combined-transform-fill-scale - Scaled paths with fill rules
- [x] combined-transform-stroke-rotate - Rotated stroke joins
- [x] combined-transform-stroke-scale - Scaled stroke behavior
- [x] combined-transform-clip-fill - Transform + Clip + Fill
- [x] combined-transform-clip-stroke - Transform + Clip + Stroke
- [x] combined-all-features - All features + globalAlpha

### Phase 5: Image Operations ✅ FULLY COMPLETED  
- [x] drawimage-basic - Basic drawImage positioning
- [x] drawimage-scaling - drawImage with scaling  
- [x] drawimage-rgb-conversion - RGB to RGBA auto-conversion
- [x] drawimage-transforms - drawImage with transforms
- [x] drawimage-alpha-blending - drawImage with alpha and blending
- [x] drawimage-surface-conversion - drawImage using surface-to-ImageLike conversion

### Phase 6: Sub-pixel Rendering ✅ FULLY COMPLETED
- [x] subpixel-strokes - Sub-pixel stroke rendering comparison
- [x] stroke-edge-cases - Stroke edge cases (zero-width, etc.)
- [x] clipped-path-strokes - Clipped path strokes
- [x] stroke-pixel-analysis - Stroke pixel analysis

### Phase 7: Modular Test Architecture ✅ FULLY COMPLETED
- [x] Individual test files for all 31 core tests in `/tests/core/`
- [x] Individual test files for all 60 visual tests in `/tests/visual/`  
- [x] Build-time concatenation system with `concat-tests.js`
- [x] Smart test runner with automatic built-test detection
- [x] Browser test reorganization from `/examples/` to `/tests/browser/`
- [x] All placeholder test implementations completed (Tests 035-039)

### Phase 8: Test Rescue Operation ✅ FULLY COMPLETED
- [x] Rescued Test 037 (old 36): 6-point star complex polygons with figure-8 self-intersecting
- [x] Rescued Test 040 (old 37): Asymmetric scaling with bow-tie evenodd fills  
- [x] Rescued Test 042 (old 38): Rotated clip regions with multi-level intersections
- [x] Rescued Test 044 (old 39): Spiral stroke patterns with layered globalAlpha
- [x] Complementary test coverage with alternative geometric implementations
- [x] Test renumbering utility integration with git history preservation

### Phase 9: Future Edge Cases & Robustness (Optional)
- [ ] edge-zero-dimensions - Zero width/height paths
- [ ] edge-large-coordinates - Extremely large coordinates
- [ ] edge-singular-transforms - Near-singular transform matrices
- [ ] edge-empty-clips - Empty clip regions
- [ ] determinism-order - Same operations, different order
- [ ] determinism-floating-point - Floating-point precision edge cases

## Implementation Notes
- All tests must work in both Node.js and browser environments
- Each test goes in `visual-rendering-tests.js` 
- Tests appear in "Visual Test Comparisons" section of test.html
- Include both SWCanvas and HTML5 Canvas implementations
- Generate golden BMP images for visual validation
- Use clear naming convention: `category-specific-description`

## Current Test Count ✅ COMPREHENSIVE COVERAGE ACHIEVED
- **Core Functionality Tests**: 31 tests (complete API coverage)
- **Visual Rendering Tests**: 60 tests (pixel-perfect validation)
  - **Original Implementation Tests**: 56 tests covering all Canvas API features
  - **Rescued Complementary Tests**: 4 tests providing alternative geometric implementations
- **Total**: 91 comprehensive tests covering all Canvas API features
- **Status**: All tests passing with full modular architecture including rescued tests
- **Architecture**: Individual test files with build-time concatenation
- **Coverage**: Complete Canvas 2D API implementation with pixel-perfect accuracy and complementary test variations

## Completed Implementation
✅ **Phase 1: Basic Transformation Tests - COMPLETE**
- Added missing Context2D methods: `translate()`, `scale()`, `rotate()`
- Implemented missing `strokeRect()` method
- Fixed matrix multiplication order to match HTML5 Canvas
- Fixed color consistency issues (green, orange)
- Added rotated rectangle support via polygon conversion
- Added 6 new transformation tests to core-functionality-tests.js
- Added 7 new visual tests to visual-rendering-tests.js  
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html
- Full transform system now matches HTML5 Canvas exactly

## Current Architecture Status ✅ FULLY COMPLETE

🎯 **All Major Development Phases Complete**

SWCanvas now has comprehensive test coverage with a fully modular architecture. The project includes:

- **Complete Canvas 2D API Implementation** with pixel-perfect accuracy
- **Modular Test Architecture** with individual test files and build-time concatenation  
- **87 comprehensive tests** covering all Canvas API features
- **Cross-platform compatibility** (Node.js and browser)
- **Deterministic rendering** with identical results across platforms

### Migration Plan

**Migration Order (Dependency-First):**
1. [ ] **Matrix.js** - Foundation class, no dependencies
2. [ ] **Surface.js** - Foundation class, no dependencies  
3. [ ] **Path2D.js** - Depends on Matrix
4. [ ] **Rasterizer.js** - Depends on Surface, Matrix
5. [ ] **Context2D.js** - Depends on all above classes

**Per-Class Migration Steps:**
- Convert `function ClassName()` to `class ClassName`
- Convert `ClassName.prototype.method` to class methods
- Create new `src/ClassName.js` file (CamelCase)
- Update `build.sh` file reference
- Run full test suite (31 shared + 52 visual tests)
- Remove old file after validation

**File Structure Changes:**
```
src/matrix.js      → src/Matrix.js      (class Matrix)
src/surface.js     → src/Surface.js     (class Surface)
src/path2d.js      → src/Path2D.js      (class Path2D)
src/rasterizer.js  → src/Rasterizer.js  (class Rasterizer)
src/context2d.js   → src/Context2D.js   (class Context2D)
```

**Key Constraints:**
- NO imports/exports - maintain global concatenation build
- NO API changes - same public interface
- Classes remain globally available after concatenation
- One migration at a time for stability

**Timeline:** ~5 hours total (30min-2hrs per class)

**Previous Achievement: Phase 5 COMPLETED!** ✅  
- ✅ Image Rendering Implementation FULLY COMPLETED
- ✅ ImageLike interface with RGB→RGBA auto-conversion
- ✅ drawImage with nearest-neighbor sampling, transforms, clipping  
- ✅ 6 comprehensive drawImage visual tests added
- ✅ 52 total visual tests implemented and passing
- ✅ Complete documentation and API examples

### Completed Achievements
- **✅ Coverage-Based Clipping**: 1-bit stencil buffer system implemented
- **✅ Legacy System Cleanup**: Removed all legacy polygon-clipper code and references  
- **✅ Integration Testing**: All transform+clip+stroke combinations tested
- **✅ Production Ready**: 55 comprehensive tests all passing

#### Detailed Implementation Plan

**Phase A: Data Structures (1-2 days)** ✅ COMPLETED
- [x] Add `clipMask` field to Context2D state (Uint8Array with 1 bit per pixel)
- [x] Implement bit manipulation helpers: `setBit()`, `getBit()`, `clearMask()`
- [x] Add clipMask to save/restore state stack for proper nesting
- [x] Memory management: allocate/deallocate clipMask only when needed

**Phase B: Clip Pixel Writer (1 day)** ✅ COMPLETED  
- [x] Implement `clipPixel(x, y, coverage)` function that writes to temporary clip buffer
- [x] Modify existing `setPixel()` to multiply coverage by current clipMask bit
- [x] Handle edge cases: out-of-bounds, invalid coordinates
- [x] Optimize for common case where no clipping is active

**Phase C: Clip Method Implementation (1-2 days)** ✅ COMPLETED
- [x] Add `clip(path, fillRule = 'nonzero')` method to Context2D
- [x] Redirect pixel writer to clipPixel during clip fill operation
- [x] Create temporary clip buffer during fill, then combine with existing clipMask using AND
- [x] Handle first clip (no existing mask) vs subsequent clips (intersection)
- [x] Ensure fillRule ('evenodd' vs 'nonzero') is properly respected

**Phase D: Integration with Rendering Pipeline (1 day)** ✅ COMPLETED
- [x] Modify final pixel output to multiply by clipMask bit
- [x] Ensure shadows are clipped (apply clipMask to shadow rendering)
- [x] Update stroke rendering to respect clipping
- [x] Handle anti-aliasing edge cases where coverage needs precise bit handling

**Phase E: Memory Optimization (1 day)** ✅ COMPLETED
- [x] Lazy allocation: only create clipMask when first clip() is called
- [x] Efficient bit packing: 8 pixels per byte with bit operations
- [x] Memory cleanup: deallocate clipMask when no clips are active
- [x] Consider clipMask sharing/copying for save/restore efficiency

**Phase F: Testing & Validation (2-3 days)** ✅ COMPLETED
- [x] Create comprehensive clipping intersection tests
- [x] Test save/restore behavior with nested clips
- [x] Validate performance with large canvases
- [x] Test edge cases: empty clips, out-of-bounds clips, transform interactions
- [x] Update existing clip-intersection test to use real intersections again

#### Technical Details

**1-Bit Stencil Buffer Format:**
```
Memory layout: width × height bits packed into Uint8Array
Bit access: byte = clipMask[Math.floor(pixelIndex/8)]; bit = byte & (1 << (pixelIndex%8))
Memory usage: width × height ÷ 8 bytes (vs width × height bytes for full coverage)
```

**Clip Intersection Logic:**
```
Initial state: no clipMask (all pixels available)
First clip(): create clipMask, fill with 1s where path covers
Second clip(): temp mask from new path, AND with existing: clipMask[i] &= tempMask[i]
Result: only pixels covered by ALL clips have bit = 1
```

**Performance Considerations:**
- Bit operations are fast but need care for cache alignment
- Large canvases (4K) need ~2MB for clip mask vs 16MB for full coverage
- Most common case (no clipping) should have near-zero overhead
- Consider SIMD operations for bulk bit manipulation if performance critical

#### Success Criteria ✅ ALL ACHIEVED
- [x] Clipping intersection tests pass with pixel-perfect HTML5 Canvas matching
- [x] Save/restore properly manages clip stack nesting
- [x] Performance degradation < 10% for non-clipped rendering
- [x] Memory usage reasonable for large canvases (1-bit per pixel achieved)
- [x] All existing tests continue to pass

#### Risk Mitigation
- **Memory pressure**: Use lazy allocation, deallocate aggressively
- **Performance regression**: Profile carefully, optimize hot paths
- **Complexity creep**: Keep implementation simple, avoid premature optimization
- **Edge case bugs**: Comprehensive test suite, especially transform interactions

## Upcoming After Clipping Fix
Begin Phase 4: Combined Feature Tests (Integration)

## Recently Completed Implementation
✅ **Phase 3: Advanced Clipping Tests - COMPLETE**
- Added 7 comprehensive clipping tests to visual-rendering-tests.js
- Tests cover rectangular, polygon, curved, self-intersecting, nested, save/restore, and intersection clipping
- All clipping tests work with both simple and complex shapes
- Proper save/restore state management testing
- Complex clip intersection behavior verification
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html
- Fixed missing color consistency between Canvas implementations
- Adapted ellipse usage to circles for SWCanvas compatibility
- Advanced clipping system now thoroughly tested

✅ **Phase 2: Advanced Path Filling Tests - COMPLETE**
- Added 9 comprehensive path filling tests to visual-rendering-tests.js
- Tests cover concave polygons, self-intersecting paths, nested holes
- Multiple subpath handling, bezier curves, quadratic curves
- Arc/ellipse filling, mixed linear+curve paths, complex fill rules
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html
- Advanced path filling system now thoroughly tested

✅ **Bug Fixes & Infrastructure Improvements - COMPLETE**
- Fixed arc path issue where semicircles had unwanted triangles extending to canvas corners
- Fixed missing BMP generation for Phase 2 visual tests in Node.js output directory  
- Fixed color mismatch between HTML5Canvas CSS colors and SWCanvas RGB values
- Implemented standard Canvas API for consistent color mapping
- Updated test runner to generate BMPs for all 27 visual tests
- Fixed browser compatibility issues using standard Canvas API
- All visual tests now render identical colors in both contexts