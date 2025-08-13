#!/bin/bash

# SWCanvas Build Script
# Concatenates source files into a single global script

set -e

echo "Building SWCanvas..."

# Create dist directory
mkdir -p dist

# Header for the global script
cat > dist/swcanvas.js << 'EOF'
(function() {
'use strict';

EOF

# Concatenate source files in dependency order
# Phase 1: Foundation classes (no dependencies)
cat src/Color.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Point.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Rectangle.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Matrix.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Path2D.js >> dist/swcanvas.js  
echo "" >> dist/swcanvas.js
cat src/Surface.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 2: Service classes (depend on foundation)
cat src/BitmapEncoder.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PathFlattener.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PolygonFiller.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/StrokeGenerator.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ClipMaskHelper.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ImageProcessor.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/StencilBuffer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 3: State and rendering classes (depend on services)
cat src/DrawingState.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Rasterizer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Context2D.js >> dist/swcanvas.js

# Footer to expose globals
cat >> dist/swcanvas.js << 'EOF'

// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // Core API (public)
        Surface: Surface,
        Transform2D: Transform2D,
        Matrix: Matrix, // Legacy alias for Transform2D
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        StencilBuffer: StencilBuffer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // Core API (public)
        Surface: Surface,
        Transform2D: Transform2D,
        Matrix: Matrix, // Legacy alias for Transform2D
        Path2D: Path2D,
        Context2D: Context2D,
        encodeBMP: encodeBMP,
        
        // Advanced classes (for power users)
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        DrawingState: DrawingState,
        StencilBuffer: StencilBuffer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
}

})();
EOF

echo "Build complete: dist/swcanvas.js"