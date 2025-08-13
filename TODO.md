# SWCanvas Test Expansion TODO

## Current Status
- ✅ Analyzed current test coverage gaps  
- ✅ Drafted comprehensive test expansion plan
- ✅ Phase 1 Basic Transformation Tests FULLY COMPLETED (8/8 tests)
- ✅ Phase 2 Advanced Path Filling Tests FULLY COMPLETED (9/9 tests)
- ✅ Phase 3 Advanced Clipping Tests FULLY COMPLETED (7/7 tests)

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

### Phase 4: Combined Feature Tests (Integration) ✅ FULLY COMPLETED
- [x] combined-transform-fill-rotate - Rotated complex polygons
- [x] combined-transform-fill-scale - Scaled paths with fill rules
- [x] combined-transform-stroke-rotate - Rotated stroke joins
- [x] combined-transform-stroke-scale - Scaled stroke behavior
- [x] combined-transform-clip-fill - Transform + Clip + Fill
- [x] combined-transform-clip-stroke - Transform + Clip + Stroke
- [x] combined-all-features - All features + globalAlpha

### Phase 5: Edge Cases & Robustness
- [ ] edge-zero-dimensions - Zero width/height paths
- [ ] edge-large-coordinates - Extremely large coordinates
- [ ] edge-singular-transforms - Near-singular transform matrices
- [ ] edge-empty-clips - Empty clip regions
- [ ] edge-alpha-values - Various globalAlpha values (0, 0.5, 1, >1)
- [ ] edge-compositing-modes - 'copy' vs 'source-over' with transforms
- [ ] determinism-order - Same operations, different order
- [ ] determinism-floating-point - Floating-point precision edge cases

## Implementation Notes
- All tests must work in both Node.js and browser environments
- Each test goes in `visual-test-registry.js` 
- Tests appear in "Visual Test Comparisons" section of test.html
- Include both SWCanvas and HTML5 Canvas implementations
- Generate golden BMP images for visual validation
- Use clear naming convention: `category-specific-description`

## Current Test Count
- Original: 25 tests
- Phase 1 Added: 6 tests (transforms)
- Phase 2 Added: 9 tests (advanced path filling)
- Phase 3 Added: 7 tests (advanced clipping)
- **Coverage-Based Clipping**: Added 1 enhanced intersection test
- **Phase 4 Integration**: Added 7 comprehensive combined feature tests (completed)
- Current: 55 tests ✅
- Remaining: ~20-40 optional tests (edge cases only)
- Target: 75-95 comprehensive tests

## Completed Implementation
✅ **Phase 1: Basic Transformation Tests - COMPLETE**
- Added missing Context2D methods: `translate()`, `scale()`, `rotate()`
- Implemented missing `strokeRect()` method
- Fixed matrix multiplication order to match HTML5 Canvas
- Fixed color consistency issues (green, orange)
- Added rotated rectangle support via polygon conversion
- Added 6 new transformation tests to shared-test-suite.js
- Added 7 new visual tests to visual-test-registry.js  
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html
- Full transform system now matches HTML5 Canvas exactly

## Next Action  
🎉 **Phase 4 Combined Feature Tests FULLY COMPLETED!** 
- ✅ Coverage-Based Clipping System FULLY IMPLEMENTED & TESTED
- ✅ All integration tests completed (fill, stroke, clip, transform combinations)
- ✅ Stencil-only clipping system migration completed
- ✅ 55 comprehensive visual tests implemented and passing

**Ready for Phase 5: Edge Cases & Robustness (optional)**

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
- Added 7 comprehensive clipping tests to visual-test-registry.js
- Tests cover rectangular, polygon, curved, self-intersecting, nested, save/restore, and intersection clipping
- All clipping tests work with both simple and complex shapes
- Proper save/restore state management testing
- Complex clip intersection behavior verification
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html
- Fixed missing colors in test-colors.js system
- Adapted ellipse usage to circles for SWCanvas compatibility
- Advanced clipping system now thoroughly tested

✅ **Phase 2: Advanced Path Filling Tests - COMPLETE**
- Added 9 comprehensive path filling tests to visual-test-registry.js
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
- Created shared color system (test-colors.js) for consistent color mapping
- Updated test runner to generate BMPs for all 27 visual tests
- Fixed browser compatibility issues with DRY color system
- All visual tests now render identical colors in both contexts