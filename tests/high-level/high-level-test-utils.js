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
 * @param {string} mode - 'opaque' or 'semitransparent'
 * @returns {string} CSS color string
 */
function getRandomColor(mode = 'opaque') {
    const r = Math.floor(100 + SeededRandom.getRandom() * 100);
    const g = Math.floor(100 + SeededRandom.getRandom() * 100);
    const b = Math.floor(100 + SeededRandom.getRandom() * 100);

    if (mode === 'semitransparent') {
        const a = 0.5 + SeededRandom.getRandom() * 0.5;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
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
 * Calculate circle test parameters
 */
function calculateCircleTestParameters(options) {
    const {
        canvasWidth,
        canvasHeight,
        minRadius = 10,
        maxRadius = 100,
        hasStroke = false,
        strokeWidth = 1,
        randomPosition = false
    } = options;

    // Randomize radius
    const radius = minRadius + SeededRandom.getRandom() * (maxRadius - minRadius);
    const diameter = radius * 2;

    // Calculate center
    let centerX, centerY;
    let atPixel;

    if (randomPosition) {
        centerX = radius + SeededRandom.getRandom() * (canvasWidth - diameter);
        centerY = radius + SeededRandom.getRandom() * (canvasHeight - diameter);
        atPixel = SeededRandom.getRandom() < 0.5;
    } else {
        // Centered
        const isAtPixelCenter = SeededRandom.getRandom() < 0.5;
        atPixel = isAtPixelCenter;
        centerX = canvasWidth / 2;
        centerY = canvasHeight / 2;
        if (isAtPixelCenter) {
            centerX = Math.floor(centerX) + 0.5;
            centerY = Math.floor(centerY) + 0.5;
        } else {
            centerX = Math.floor(centerX);
            centerY = Math.floor(centerY);
        }
    }

    return {
        centerX,
        centerY,
        radius: Math.round(radius),
        finalDiameter: Math.round(diameter),
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
 */
function analyzeExtremes(surface, backgroundColor = { r: 255, g: 255, b: 255, a: 255 }) {
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

            // Check if pixel differs from background
            if (r !== backgroundColor.r || g !== backgroundColor.g ||
                b !== backgroundColor.b || a !== backgroundColor.a) {
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
    window.calculateCircleTestParameters = calculateCircleTestParameters;
    window.registerHighLevelTest = registerHighLevelTest;
    window.analyzeExtremes = analyzeExtremes;
    window.countUniqueColors = countUniqueColors;
    window.hasSpeckles = hasSpeckles;
}
