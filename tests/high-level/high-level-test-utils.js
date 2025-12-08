/**
 * High-Level Test Utilities for SWCanvas
 *
 * Provides test registration, SeededRandom, and validation utilities
 * for testing direct shape APIs with fast path verification.
 */

// Test registry - stores all registered tests
const HIGH_LEVEL_TESTS = [];

/**
 * SeededRandom - Deterministic random number generator for reproducible tests
 * Uses Small Fast Counter (SFC) 32-bit implementation
 */
class SeededRandom {
    static #currentRandom = null;

    static seedWithInteger(seed) {
        // XOR the seed with a constant value
        seed = seed ^ 0xDEADBEEF;

        // Pad seed with Phi, Pi and E.
        this.#currentRandom = this.#sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, seed);

        // Warm up the generator
        for (let i = 0; i < 15; i++) {
            this.#currentRandom();
        }
    }

    static getRandom() {
        if (!this.#currentRandom) {
            throw new Error('SeededRandom must be initialized with seedWithInteger before use');
        }
        return this.#currentRandom();
    }

    // Small Fast Counter (SFC) 32-bit implementation
    static #sfc32(a, b, c, d) {
        return function() {
            a |= 0; b |= 0; c |= 0; d |= 0;
            let t = (a + b | 0) + d | 0;
            d = d + 1 | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        };
    }
}

/**
 * Get a random color for testing
 * @param {string} mode - 'opaque', 'semitransparent', 'semitransparent-light', or 'mixed'
 * @returns {string} CSS color string
 */
function getRandomColor(mode = 'opaque') {
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);

    let alpha;
    switch (mode) {
        case 'opaque':
            return `rgb(${r}, ${g}, ${b})`;
        case 'semitransparent':
            // Alpha range 100-200 (out of 255) -> ~0.39-0.78
            alpha = (100 + Math.floor(SeededRandom.getRandom() * 101)) / 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
        case 'semitransparent-light':
            // Alpha range 50-150 (out of 255) -> ~0.20-0.59
            alpha = (50 + Math.floor(SeededRandom.getRandom() * 101)) / 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
        case 'mixed':
            // 50% chance opaque, 50% chance semitransparent
            if (SeededRandom.getRandom() < 0.5) {
                return `rgb(${r}, ${g}, ${b})`;
            } else {
                alpha = (100 + Math.floor(SeededRandom.getRandom() * 101)) / 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
            }
        default:
            return `rgb(${r}, ${g}, ${b})`;
    }
}

/**
 * Get a random point within canvas bounds
 * @param {number} decimalPlaces - Number of decimal places (null for full precision)
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} margin - Margin from edges (default 100)
 * @returns {Object} Point with x, y coordinates
 */
function getRandomPoint(decimalPlaces = null, canvasWidth, canvasHeight, margin = 100) {
    const x = margin + SeededRandom.getRandom() * (canvasWidth - 2 * margin);
    const y = margin + SeededRandom.getRandom() * (canvasHeight - 2 * margin);

    if (decimalPlaces === null) {
        return { x, y };
    }

    return {
        x: Number(x.toFixed(decimalPlaces)),
        y: Number(y.toFixed(decimalPlaces))
    };
}

/**
 * Places a center point at pixel boundary (*.5 coordinates) relative to canvas center
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Center coordinates {centerX, centerY}
 */
function placeCloseToCenterAtPixel(width, height) {
    return {
        centerX: Math.floor(width / 2) + 0.5,
        centerY: Math.floor(height / 2) + 0.5
    };
}

/**
 * Places a center point at grid intersection (integer coordinates) relative to canvas center
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Center coordinates {centerX, centerY}
 */
function placeCloseToCenterAtGrid(width, height) {
    return {
        centerX: Math.floor(width / 2),
        centerY: Math.floor(height / 2)
    };
}

/**
 * Get a fully opaque random color
 * @returns {string} CSS color string
 */
function getRandomOpaqueColor() {
    const r = Math.floor(100 + SeededRandom.getRandom() * 155);
    const g = Math.floor(100 + SeededRandom.getRandom() * 155);
    const b = Math.floor(100 + SeededRandom.getRandom() * 155);
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Adjusts dimensions for crisp stroke rendering based on stroke width and center position.
 * For grid-centered shapes (integer coords) with odd strokeWidth: dimensions must be ODD.
 * For grid-centered shapes (integer coords) with even strokeWidth: dimensions must be EVEN.
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} strokeWidth - Width of the stroke
 * @param {Object} center - Center coordinates {x, y}
 * @returns {Object} Adjusted width and height {width, height}
 */
function adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {
    let adjustedWidth = Math.floor(width);
    let adjustedHeight = Math.floor(height);

    // For center at grid points (integer coordinates)
    if (Number.isInteger(center.x)) {
        // Odd strokeWidth → odd dimension; Even strokeWidth → even dimension
        if (strokeWidth % 2 !== 0) {
            if (adjustedWidth % 2 === 0) adjustedWidth++;
        } else {
            if (adjustedWidth % 2 !== 0) adjustedWidth++;
        }
    }
    // For center at pixel centers (*.5 coordinates)
    else if (center.x % 1 === 0.5) {
        // Odd strokeWidth → even dimension; Even strokeWidth → odd dimension
        if (strokeWidth % 2 !== 0) {
            if (adjustedWidth % 2 !== 0) adjustedWidth++;
        } else {
            if (adjustedWidth % 2 === 0) adjustedWidth++;
        }
    }

    // Same logic for height/Y
    if (Number.isInteger(center.y)) {
        if (strokeWidth % 2 !== 0) {
            if (adjustedHeight % 2 === 0) adjustedHeight++;
        } else {
            if (adjustedHeight % 2 !== 0) adjustedHeight++;
        }
    } else if (center.y % 1 === 0.5) {
        if (strokeWidth % 2 !== 0) {
            if (adjustedHeight % 2 !== 0) adjustedHeight++;
        } else {
            if (adjustedHeight % 2 === 0) adjustedHeight++;
        }
    }

    return { width: adjustedWidth, height: adjustedHeight };
}

/**
 * Round point coordinates to integers
 * @param {Object} point - Point with x, y coordinates
 * @returns {Object} Rounded point
 */
function roundPoint(point) {
    return {
        x: Math.round(point.x),
        y: Math.round(point.y)
    };
}

/**
 * Adjusts center coordinates for crisp 1px stroke rendering
 * For even width+height with 1px stroke, center should be on pixel center (*.5)
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} strokeWidth - Stroke width
 * @returns {Object} Adjusted center coordinates {x, y}
 */
function adjustCenterForCrispStrokeRendering(centerX, centerY, width, height, strokeWidth) {
    let adjX = centerX;
    let adjY = centerY;

    // For 1px stroke with even dimensions, shift to pixel center
    if (strokeWidth === 1) {
        if (width % 2 === 0 && Number.isInteger(centerX)) {
            adjX = centerX + 0.5;
        }
        if (height % 2 === 0 && Number.isInteger(centerY)) {
            adjY = centerY + 0.5;
        }
    }

    return { x: adjX, y: adjY };
}

/**
 * Calculate crisp fill and stroke rectangle parameters
 * Combines random dimension generation with crisp adjustment
 * @param {Object} options - Configuration options
 * @param {number} options.canvasWidth - Canvas width
 * @param {number} options.canvasHeight - Canvas height
 * @param {number} options.minWidth - Minimum rectangle width (default 50)
 * @param {number} options.maxWidth - Maximum rectangle width (default 400)
 * @param {number} options.minHeight - Minimum rectangle height (default 50)
 * @param {number} options.maxHeight - Maximum rectangle height (default 400)
 * @param {number} options.maxStrokeWidth - Maximum stroke width (default 10)
 * @param {boolean} options.ensureEvenStroke - Force even stroke width (default false)
 * @param {boolean} options.randomPosition - Use random positioning (default false)
 * @returns {Object} { center, adjustedDimensions, strokeWidth }
 */
function calculateCrispFillAndStrokeRectParams(options) {
    const {
        canvasWidth,
        canvasHeight,
        minWidth = 50,
        maxWidth = 400,
        minHeight = 50,
        maxHeight = 400,
        maxStrokeWidth = 10,
        ensureEvenStroke = false,
        randomPosition = false
    } = options;

    // SeededRandom Call 1: baseWidth
    const baseWidth = Math.round(minWidth + SeededRandom.getRandom() * (maxWidth - minWidth));
    // SeededRandom Call 2: baseHeight
    const baseHeight = Math.round(minHeight + SeededRandom.getRandom() * (maxHeight - minHeight));
    // SeededRandom Call 3: strokeWidth (optionally ensure even)
    let strokeWidth = Math.round(2 + SeededRandom.getRandom() * (maxStrokeWidth - 2));
    if (ensureEvenStroke && strokeWidth % 2 !== 0) {
        strokeWidth++;
    }
    // SeededRandom Call 4: center type (grid vs pixel)
    const atPixel = SeededRandom.getRandom() < 0.5;

    // Calculate center
    let center;
    if (randomPosition) {
        const randomPt = getRandomPoint(1, canvasWidth, canvasHeight);
        center = atPixel ? randomPt : roundPoint(randomPt);
    } else {
        center = atPixel
            ? placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
            : placeCloseToCenterAtGrid(canvasWidth, canvasHeight);
        center = { x: center.centerX, y: center.centerY };
    }

    // Adjust dimensions for crisp rendering
    const adjusted = adjustDimensionsForCrispStrokeRendering(
        baseWidth, baseHeight, strokeWidth, center
    );

    return {
        center,
        adjustedDimensions: { width: adjusted.width, height: adjusted.height },
        strokeWidth
    };
}

/**
 * Calculates circle parameters with proper positioning and dimensions.
 * Adapted from CrispSwCanvas test-helper-functions.js for SWCanvas.
 *
 * @param {Object} options - Configuration options for circle creation
 * @param {number} options.canvasWidth - Canvas width
 * @param {number} options.canvasHeight - Canvas height
 * @param {number} options.minRadius - Minimum radius for the circle (default 8)
 * @param {number} options.maxRadius - Maximum radius for the circle (default 42)
 * @param {boolean} options.hasStroke - Whether the circle has a stroke (default false)
 * @param {number} options.minStrokeWidth - Minimum stroke width if hasStroke (default 1)
 * @param {number} options.maxStrokeWidth - Maximum stroke width if hasStroke (default 4)
 * @param {boolean} options.randomPosition - Whether to use random positioning (default true)
 * @param {number} options.marginX - Horizontal margin from canvas edges (default 60)
 * @param {number} options.marginY - Vertical margin from canvas edges (default 60)
 * @returns {Object} Calculated circle parameters: {centerX, centerY, radius, strokeWidth, finalDiameter, atPixel}
 */
function calculateCircleTestParameters(options) {
    const {
        canvasWidth,
        canvasHeight,
        minRadius = 8,
        maxRadius = 42,
        hasStroke = false,
        minStrokeWidth = 1,
        maxStrokeWidth = 4,
        randomPosition = true,
        marginX = 60,
        marginY = 60
    } = options;

    // Randomly choose between grid-centered and pixel-centered
    const atPixel = SeededRandom.getRandom() < 0.5;

    // Get initial center point
    let { centerX, centerY } = atPixel
        ? placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
        : placeCloseToCenterAtGrid(canvasWidth, canvasHeight);

    // Calculate base diameter
    const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
    const baseRadius = diameter / 2;

    // Calculate stroke width
    const maxAllowedStrokeWidth = Math.floor(baseRadius / 1);
    const strokeWidth = hasStroke
        ? (minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeWidth)))
        : 0;

    // Handle random positioning if requested
    if (randomPosition) {
        const totalRadius = baseRadius + (strokeWidth / 2);

        // Calculate safe bounds
        const minX = Math.ceil(totalRadius + marginX);
        const maxX = Math.floor(canvasWidth - totalRadius - marginX);
        const minY = Math.ceil(totalRadius + marginY);
        const maxY = Math.floor(canvasHeight - totalRadius - marginY);

        // Adjust diameter if circle is too large
        let adjustedDiameter = diameter;
        if (maxX <= minX || maxY <= minY) {
            // Circle is too large, reduce diameter to 1/4 of canvas size
            adjustedDiameter = Math.min(
                Math.floor(canvasWidth / 4),
                Math.floor(canvasHeight / 4)
            );

            // Recalculate bounds with reduced diameter
            const newTotalRadius = (adjustedDiameter / 2) + (strokeWidth / 2);
            const newMinX = Math.ceil(newTotalRadius + marginX);
            const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
            const newMinY = Math.ceil(newTotalRadius + marginY);
            const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);

            // Generate random position within new safe bounds
            centerX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
            centerY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
        } else {
            // Generate random position within original safe bounds
            centerX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
            centerY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
        }
    }

    // Adjust diameter for crisp circle rendering (uses same logic as CrispSwCanvas)
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
        diameter, diameter, strokeWidth, { x: centerX, y: centerY }
    );
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;

    return {
        centerX,
        centerY,
        radius,
        strokeWidth,
        finalDiameter,
        atPixel
    };
}

/**
 * Register a high-level test
 * @param {string} name - Test name
 * @param {function} drawFunction - Function that draws the test
 * @param {string} category - Test category
 * @param {object} checks - Validation checks to perform
 * @param {object} metadata - Test metadata
 */
function registerHighLevelTest(name, drawFunction, category, checks, metadata = {}) {
    HIGH_LEVEL_TESTS.push({
        name,
        drawFunction,
        category,
        checks,
        metadata
    });
}

/**
 * Analyze surface for extreme bounds (leftmost, rightmost, topmost, bottommost non-background pixels)
 * @param {Object} surface - Surface with data, width, height, stride
 * @param {Object} backgroundColor - Background color {r, g, b, a}
 * @param {number} colorTolerance - Max difference from background to still be considered background (0-255)
 */
function analyzeExtremes(surface, backgroundColor = { r: 255, g: 255, b: 255, a: 255 }, colorTolerance = 0) {
    let topY = surface.height;
    let bottomY = -1;
    let leftX = surface.width;
    let rightX = -1;

    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = y * surface.stride + x * 4;
            const r = surface.data[offset];
            const g = surface.data[offset + 1];
            const b = surface.data[offset + 2];
            const a = surface.data[offset + 3];

            // Check if pixel differs from background (with tolerance)
            const rDiff = Math.abs(r - backgroundColor.r);
            const gDiff = Math.abs(g - backgroundColor.g);
            const bDiff = Math.abs(b - backgroundColor.b);
            const aDiff = Math.abs(a - backgroundColor.a);

            if (rDiff > colorTolerance || gDiff > colorTolerance ||
                bDiff > colorTolerance || aDiff > colorTolerance) {
                if (y < topY) topY = y;
                if (y > bottomY) bottomY = y;
                if (x < leftX) leftX = x;
                if (x > rightX) rightX = x;
            }
        }
    }

    return { topY, bottomY, leftX, rightX };
}

/**
 * Count unique colors in the surface
 */
function countUniqueColors(surface) {
    const colors = new Set();

    for (let y = 0; y < surface.height; y++) {
        for (let x = 0; x < surface.width; x++) {
            const offset = y * surface.stride + x * 4;
            const colorKey = `${surface.data[offset]},${surface.data[offset + 1]},${surface.data[offset + 2]},${surface.data[offset + 3]}`;
            colors.add(colorKey);
        }
    }

    return colors.size;
}

/**
 * Check for single-pixel speckles (isolated pixels that differ from their neighbors)
 */
function hasSpeckles(surface, maxSpeckleSize = 1) {
    let speckleCount = 0;

    for (let y = 1; y < surface.height - 1; y++) {
        for (let x = 1; x < surface.width - 1; x++) {
            const offset = y * surface.stride + x * 4;
            const pixel = [
                surface.data[offset],
                surface.data[offset + 1],
                surface.data[offset + 2],
                surface.data[offset + 3]
            ];

            // Check if all 4 neighbors are different
            const neighbors = [
                [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
            ];

            let allDifferent = true;
            for (const [nx, ny] of neighbors) {
                const nOffset = ny * surface.stride + nx * 4;
                if (surface.data[nOffset] === pixel[0] &&
                    surface.data[nOffset + 1] === pixel[1] &&
                    surface.data[nOffset + 2] === pixel[2] &&
                    surface.data[nOffset + 3] === pixel[3]) {
                    allDifferent = false;
                    break;
                }
            }

            if (allDifferent && pixel[3] > 0) { // Non-transparent isolated pixel
                speckleCount++;
            }
        }
    }

    return speckleCount > 0;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HIGH_LEVEL_TESTS,
        SeededRandom,
        getRandomColor,
        getRandomOpaqueColor,
        getRandomPoint,
        placeCloseToCenterAtPixel,
        placeCloseToCenterAtGrid,
        adjustDimensionsForCrispStrokeRendering,
        roundPoint,
        adjustCenterForCrispStrokeRendering,
        calculateCrispFillAndStrokeRectParams,
        calculateCircleTestParameters,
        registerHighLevelTest,
        analyzeExtremes,
        countUniqueColors,
        hasSpeckles
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HIGH_LEVEL_TESTS = HIGH_LEVEL_TESTS;
    window.SeededRandom = SeededRandom;
    window.getRandomColor = getRandomColor;
    window.getRandomOpaqueColor = getRandomOpaqueColor;
    window.getRandomPoint = getRandomPoint;
    window.placeCloseToCenterAtPixel = placeCloseToCenterAtPixel;
    window.placeCloseToCenterAtGrid = placeCloseToCenterAtGrid;
    window.adjustDimensionsForCrispStrokeRendering = adjustDimensionsForCrispStrokeRendering;
    window.roundPoint = roundPoint;
    window.adjustCenterForCrispStrokeRendering = adjustCenterForCrispStrokeRendering;
    window.calculateCrispFillAndStrokeRectParams = calculateCrispFillAndStrokeRectParams;
    window.calculateCircleTestParameters = calculateCircleTestParameters;
    window.registerHighLevelTest = registerHighLevelTest;
    window.analyzeExtremes = analyzeExtremes;
    window.countUniqueColors = countUniqueColors;
    window.hasSpeckles = hasSpeckles;
}
