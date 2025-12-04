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
cat ../SWCanvas-primitives/Color.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Point.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Rectangle.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat ../SWCanvas-primitives/Transform2D.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/SWPath2D.js >> dist/swcanvas.js  
echo "" >> dist/swcanvas.js
cat src/Surface.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 2: Core Service classes (depend on foundation)
cat src/CompositeOperations.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/BitmapEncodingOptions.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/BitmapEncoder.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PngEncodingOptions.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PngEncoder.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PathFlattener.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/PolygonFiller.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/StrokeGenerator.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/BitBuffer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/BoundsTracker.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ClipMask.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/SourceMask.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ShadowBuffer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/BoxBlur.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/ImageProcessor.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat ../SWCanvas-primitives/ColorParser.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 2.5: Paint sources (depend on foundation + ColorParser)
cat src/Gradient.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Pattern.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 3: Core rendering classes (depend on services)
cat src/Rasterizer.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js
cat src/Context2D.js >> dist/swcanvas.js
echo "" >> dist/swcanvas.js

# Phase 4: Canvas compatibility layer (depends on Core)
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

// Factory function for creating ImageData objects
function createImageData(width, height) {
    if (typeof width !== 'number' || width <= 0 || !Number.isInteger(width)) {
        throw new Error('Width must be a positive integer');
    }
    if (typeof height !== 'number' || height <= 0 || !Number.isInteger(height)) {
        throw new Error('Height must be a positive integer');
    }
    
    return {
        width: width,
        height: height,
        data: new Uint8ClampedArray(width * height * 4)
    };
}

EOF

# Footer to expose clean dual API globals
cat >> dist/swcanvas.js << 'EOF'

// Export to global scope with clean dual API architecture
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        // HTML5 Canvas-compatible API (recommended for portability)
        createCanvas: createCanvas,
        createImageData: createImageData,
        
        // Core API namespace (recommended for performance/control)  
        Core: {
            Surface: CoreSurfaceFactory,
            Context2D: Context2D,
            Transform2D: Transform2D,
            SWPath2D: SWPath2D,
            Color: Color,
            Point: Point,
            Rectangle: Rectangle,
            BitmapEncoder: BitmapEncoder,
            BitmapEncodingOptions: BitmapEncodingOptions,
            PngEncoder: PngEncoder,
            PngEncodingOptions: PngEncodingOptions,
            BitBuffer: BitBuffer,
            BoundsTracker: BoundsTracker,
            ClipMask: ClipMask,
            SourceMask: SourceMask,
            ShadowBuffer: ShadowBuffer,
            BoxBlur: BoxBlur,
            ImageProcessor: ImageProcessor,
            CompositeOperations: CompositeOperations,
            Rasterizer: Rasterizer,
            PathFlattener: PathFlattener,
            PolygonFiller: PolygonFiller,
            StrokeGenerator: StrokeGenerator,
            Gradient: Gradient,
            LinearGradient: LinearGradient,
            RadialGradient: RadialGradient,
            ConicGradient: ConicGradient,
            Pattern: Pattern
        }
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        // HTML5 Canvas-compatible API (recommended for portability)
        createCanvas: createCanvas,
        createImageData: createImageData,
        
        // Core API namespace (recommended for performance/control)
        Core: {
            Surface: CoreSurfaceFactory,
            Context2D: Context2D,
            Transform2D: Transform2D,
            SWPath2D: SWPath2D,
            Color: Color,
            Point: Point,
            Rectangle: Rectangle,
            BitmapEncoder: BitmapEncoder,
            BitmapEncodingOptions: BitmapEncodingOptions,
            PngEncoder: PngEncoder,
            PngEncodingOptions: PngEncodingOptions,
            BitBuffer: BitBuffer,
            BoundsTracker: BoundsTracker,
            ClipMask: ClipMask,
            SourceMask: SourceMask,
            ShadowBuffer: ShadowBuffer,
            BoxBlur: BoxBlur,
            ImageProcessor: ImageProcessor,
            CompositeOperations: CompositeOperations,
            Rasterizer: Rasterizer,
            PathFlattener: PathFlattener,
            PolygonFiller: PolygonFiller,
            StrokeGenerator: StrokeGenerator,
            Gradient: Gradient,
            LinearGradient: LinearGradient,
            RadialGradient: RadialGradient,
            ConicGradient: ConicGradient,
            Pattern: Pattern
        }
    };
}

})();
EOF

echo "Build complete: dist/swcanvas.js"