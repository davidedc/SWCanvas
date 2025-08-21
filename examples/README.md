# SWCanvas Examples

This directory contains examples demonstrating SWCanvas features and capabilities.

## Available Examples

### `showcase.html`
A comprehensive feature showcase demonstrating:
- Basic shapes (rectangles, circles, polygons)
- Gradients (linear, radial, conic) and patterns
- Transformations (translation, rotation, scaling)
- Clipping and masking
- Various stroke styles and line dashing
- Alpha blending and transparency
- Complex paths with curves and arcs
- Sub-pixel rendering

**Usage:**
1. First, build the project: `npm run build`
2. Optionally, create minified version: `npm run minify`
3. Open `showcase.html` in a web browser

The example automatically uses the minified version (`swcanvas.min.js`) if available, falling back to the regular build (`swcanvas.js`).

**Features:**
- Interactive redraw button
- Animation demo
- BMP download functionality (where supported)
- Performance timing display
- Comprehensive feature descriptions

**Note:** SWCanvas focuses on graphics primitives and does not implement text rendering (`fillText`, `strokeText`, etc.). The showcase demonstrates all supported Canvas 2D API features.

## Creating New Examples

When adding new examples:
1. Use the HTML5 Canvas-compatible API for maximum compatibility
2. Include fallback for both minified and regular builds
3. Add descriptive comments and documentation
4. Test in multiple browsers
5. Consider both visual appeal and educational value

## Requirements

- Modern web browser with Canvas support
- Built SWCanvas library (`npm run build`)
- Optional: Terser for minified builds (`npm install -g terser`)