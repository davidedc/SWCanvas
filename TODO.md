# SWCanvas Test Expansion TODO

## Current Status
- ✅ Analyzed current test coverage gaps  
- ✅ Drafted comprehensive test expansion plan
- ✅ Phase 1 Basic Transformation Tests FULLY COMPLETED (8/8 tests)
- ✅ Phase 2 Advanced Path Filling Tests FULLY COMPLETED (9/9 tests)

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

### Phase 3: Advanced Clipping Tests
- [ ] clip-rectangular - Rectangular clip regions
- [ ] clip-polygon - Polygon clip shapes
- [ ] clip-curved - Arc/ellipse clip regions
- [ ] clip-self-intersecting - Self-intersecting clip paths
- [ ] clip-stack-nested - Multiple nested clips
- [ ] clip-save-restore - Clip with save/restore behavior
- [ ] clip-intersection - Clip intersection behavior

### Phase 4: Combined Feature Tests (Integration)
- [ ] combined-transform-fill-rotate - Rotated complex polygons
- [ ] combined-transform-fill-scale - Scaled paths with fill rules
- [ ] combined-transform-stroke-rotate - Rotated stroke joins
- [ ] combined-transform-stroke-scale - Scaled stroke behavior
- [ ] combined-transform-clip-fill - Transform + Clip + Fill
- [ ] combined-transform-clip-stroke - Transform + Clip + Stroke
- [ ] combined-all-features - All features + globalAlpha

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
- Current: 40 tests ✅
- Planned: ~35-55 additional tests remaining (Phases 3-5)
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
Begin Phase 3: Advanced Clipping Tests

## Recently Completed Implementation
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