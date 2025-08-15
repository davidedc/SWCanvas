#!/bin/bash

# SWCanvas Build Script
# Concatenates source files into a single global script

set -e

echo "Building SWCanvas..."

# Step 1: Build modular tests (if directories exist)
if [ -d "tests/core" ] || [ -d "tests/visual" ]; then
    echo "Building modular tests..."
    node tests/build/concat-tests.js
fi

# Create dist directory
mkdir -p dist

# Header for the global script
cat > dist/swcanvas.js << 'EOF'
(function() {
'use strict';

EOF

# Concatenate source files in dependency order
# Phase 1: Core Foundation classes (no dependencies)
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

# Phase 2: Core Service classes (depend on foundation)
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

# Phase 3: Core rendering classes (depend on services)
cat src/Rasterizer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Context2D.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 4: Canvas compatibility layer (depends on Core)
cat src/ColorParser.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/CanvasCompatibleContext2D.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/SWCanvasElement.js >> dist/swcanvas.js

# Add compatibility layer and dual API setup
cat >> dist/swcanvas.js << 'EOF'

// Canvas factory function for HTML5 Canvas compatibility
function createCanvas(width = 300, height = 150) {
    return new SWCanvasElement(width, height);
}

// Core namespace factory functions  
function CoreSurfaceFactory(width, height) {
    return new Surface(width, height);
}


// Legacy encodeBMP function
function encodeBMP(surface) {
    return BitmapEncoder.encode(surface);
}

EOF

# Footer to expose dual API globals
cat >> dist/swcanvas.js << 'EOF'

// Export to global scope with dual API architecture
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // HTML5 Canvas-compatible API (recommended for portability)
        createCanvas: createCanvas,
        
        // Core API namespace (recommended for performance/control)  
        Core: {
            Surface: CoreSurfaceFactory,
            Context2D: Context2D,
            Transform2D: Transform2D,
            Path2D: Path2D,
            Color: Color,
            Point: Point,
            Rectangle: Rectangle,
            BitmapEncoder: BitmapEncoder,
            ClipMask: ClipMask,
            ImageProcessor: ImageProcessor,
            Rasterizer: Rasterizer,
            PathFlattener: PathFlattener,
            PolygonFiller: PolygonFiller,
            StrokeGenerator: StrokeGenerator
        },
        
        // Legacy API (backward compatibility - points to Core)
        Surface: CoreSurfaceFactory,
        Context2D: Context2D,
        Transform2D: Transform2D,
        Path2D: Path2D,
        encodeBMP: encodeBMP,
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        Rasterizer: Rasterizer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // HTML5 Canvas-compatible API (recommended for portability)
        createCanvas: createCanvas,
        
        // Core API namespace (recommended for performance/control)
        Core: {
            Surface: CoreSurfaceFactory,
            Context2D: Context2D,
            Transform2D: Transform2D,
            Path2D: Path2D,
            Color: Color,
            Point: Point,
            Rectangle: Rectangle,
            BitmapEncoder: BitmapEncoder,
            ClipMask: ClipMask,
            ImageProcessor: ImageProcessor,
            Rasterizer: Rasterizer,
            PathFlattener: PathFlattener,
            PolygonFiller: PolygonFiller,
            StrokeGenerator: StrokeGenerator
        },
        
        // Legacy API (backward compatibility - points to Core)
        Surface: CoreSurfaceFactory,
        Context2D: Context2D,
        Transform2D: Transform2D,
        Path2D: Path2D,
        encodeBMP: encodeBMP,
        Color: Color,
        Point: Point,
        Rectangle: Rectangle,
        BitmapEncoder: BitmapEncoder,
        ClipMask: ClipMask,
        ImageProcessor: ImageProcessor,
        Rasterizer: Rasterizer,
        PathFlattener: PathFlattener,
        PolygonFiller: PolygonFiller,
        StrokeGenerator: StrokeGenerator
    };
}

})();
EOF

echo "Build complete: dist/swcanvas.js"