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
cat src/Transform2D.js >> dist/swcanvas.js
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
cat src/ClipMask.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ImageProcessor.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 3: State and rendering classes (depend on services)
cat src/Rasterizer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Context2D.js >> dist/swcanvas.js

# Add compatibility shims
cat >> dist/swcanvas.js << 'EOF'

// Backward compatibility factory functions and aliases
function SurfaceFactory(width, height) {
    return new Surface(width, height);
}

// Legacy alias for Transform2D
const Matrix = Transform2D;

// Legacy encodeBMP function
function encodeBMP(surface) {
    return BitmapEncoder.encode(surface);
}

EOF

# Footer to expose globals
cat >> dist/swcanvas.js << 'EOF'

// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // Core API (public)
        Surface: SurfaceFactory,
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
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // Core API (public)
        Surface: SurfaceFactory,
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
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        
        // Internal classes (exposed for extensibility)
        Rasterizer: Rasterizer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
}

})();
EOF

echo "Build complete: dist/swcanvas.js"