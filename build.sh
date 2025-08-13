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
cat src/matrix.js >> dist/swcanvas.js
cat src/path2d.js >> dist/swcanvas.js  
cat src/surface.js >> dist/swcanvas.js
cat src/bmp.js >> dist/swcanvas.js
cat src/rasterizer.js >> dist/swcanvas.js
cat src/context2d.js >> dist/swcanvas.js

# Footer to expose globals
cat >> dist/swcanvas.js << 'EOF'

// Export to global scope
if (typeof window !== 'undefined') {
    // Browser
    window.SWCanvas = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        Surface: Surface,
        Matrix: Matrix,
        Path2D: Path2D,
        Rasterizer: Rasterizer,
        Context2D: Context2D,
        encodeBMP: encodeBMP
    };
}

})();
EOF

echo "Build complete: dist/swcanvas.js"