# SWCanvas Test Expansion TODO

## Current Status
- ✅ Analyzed current test coverage gaps  
- ✅ Drafted comprehensive test expansion plan
- ✅ Phase 1 Basic Transformation Tests completed (7/8 tests)
- 🔄 Ready to continue with remaining tests

## Test Expansion Plan

### Phase 1: Basic Transformation Tests (Priority: HIGH) ✅ COMPLETED
- [x] transform-basic-translate - Basic translation operations
- [x] transform-basic-scale - Basic scaling operations  
- [x] transform-basic-rotate - Basic rotation operations
- [x] transform-setTransform-vs-transform - Compare setTransform vs transform behavior
- [x] transform-resetTransform - Test resetTransform functionality
- [x] transform-state-save-restore - Transform with save/restore stack
- [x] transform-combined-operations - Multiple transforms combined
- [ ] transform-matrix-order - Test transform order dependency (A*B ≠ B*A)

### Phase 2: Advanced Path Filling Tests
- [ ] fill-concave-polygons - Star shapes, L-shapes
- [ ] fill-self-intersecting - Self-intersecting paths
- [ ] fill-nested-holes - Paths with holes
- [ ] fill-multiple-subpaths - Multiple subpath handling
- [ ] fill-bezier-curves - Cubic bezier curve filling
- [ ] fill-quadratic-curves - Quadratic curve filling  
- [ ] fill-arcs-ellipses - Arc and ellipse filling
- [ ] fill-mixed-paths - Linear + curve combinations
- [ ] fill-rule-complex - Complex even-odd vs nonzero comparisons

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
- Phase 1 Added: 5 tests (transforms)
- Current: 30 tests ✅
- Planned: ~45-65 additional tests remaining
- Target: 75-95 comprehensive tests

## Completed Implementation
✅ **Phase 1: Basic Transformation Tests**
- Added missing Context2D methods: `translate()`, `scale()`, `rotate()`
- Added 5 new transformation tests to shared-test-suite.js
- Added 6 new visual tests to visual-test-registry.js  
- All tests work in both Node.js and browser environments
- Visual comparisons available in test.html

## Next Action
Continue with remaining transformation tests or move to Phase 2