# SWCanvas Browser Examples

This directory contains browser-based examples and visual comparison tools for SWCanvas.

## Architecture

The testing system uses a **shared visual test registry** (`../tests/visual-test-registry.js`) to avoid code duplication between Node.js and browser tests. Each visual test defines drawing operations that work identically on both SWCanvas and HTML5 Canvas.

## Files

### test.html
The main testing interface with comprehensive visual comparisons between HTML5 Canvas and SWCanvas.

**Features:**
- **Shared Test Suite**: Runs the same tests as Node.js in the browser
- **Visual Test Comparisons**: Side-by-side comparison using shared drawing logic
- **Interactive Tests**: Real-time drawing comparisons
- **BMP Download**: Download SWCanvas results as BMP files

**Test Coverage:**
- Basic rectangle fills
- Alpha blending with premultiplied sRGB
- Path filling (triangles, even-odd winding rule)
- Clipping with circular paths
- Stroke rendering:
  - Basic line strokes
  - Different join types (miter, bevel, round)
  - Different cap types (butt, square, round)  
  - Variable line widths
  - Curved paths with quadratic Bézier curves
  - Miter limit behavior

### test-simple.html
A minimal test showing basic rectangle rendering comparison.

### browser-visual-tests.js
Browser-specific visual test functions and utilities.

### ../tests/visual-test-registry.js
**Shared visual test registry** - contains the drawing logic used by both Node.js and browser tests to ensure identical test behavior and eliminate code duplication.

## Usage

1. Open `test.html` in a modern browser
2. Click "Run All Visual Comparisons" to see side-by-side rendering
3. Compare the HTML5 Canvas (blue header) with SWCanvas (green header) results
4. Use "Run Shared Test Suite" to verify functionality
5. Use "Download All BMPs" to save SWCanvas results

## Visual Comparison System

The visual comparison system uses a **shared test registry** to eliminate code duplication and ensure identical drawing operations on both HTML5 Canvas and SWCanvas:

### No Code Duplication ✅
- **Single Source of Truth**: Each test is defined once in the visual test registry
- **Shared Drawing Logic**: Both Node.js and browser tests use identical drawing operations
- **Consistent Behavior**: Ensures browser and Node.js tests remain perfectly synchronized
- **Easy Maintenance**: Changes to test logic automatically apply to both environments

### Visual Verification Features
- **Verify visual accuracy**: Ensure SWCanvas produces the same results as HTML5 Canvas
- **Identify differences**: Spot any rendering discrepancies
- **Test edge cases**: Validate behavior for complex operations
- **Debug issues**: Visual feedback for development

Each test renders the same content using:
- HTML5 Canvas native API (reference implementation)
- SWCanvas with identical operations (implementation under test)

The SWCanvas results are converted from premultiplied sRGB to display-ready format and rendered to HTML5 Canvas for comparison.

## Testing Workflow

1. **Visual Verification**: Use the side-by-side comparisons to verify rendering accuracy
2. **Functional Testing**: Run the shared test suite for programmatic validation  
3. **Interactive Testing**: Use the interactive controls for real-time comparison
4. **Export Results**: Download BMP files for external analysis

This comprehensive testing approach ensures SWCanvas provides pixel-perfect compatibility with HTML5 Canvas while maintaining deterministic, cross-platform behavior.