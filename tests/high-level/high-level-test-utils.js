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
        return function () {
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
 * @param {string} mode - 'opaque', 'semitransparent', 'semitransparent-light',
 *                        'semitransparent-visible', 'mixed', or 'mixed-visible'
 *   - 'semitransparent-visible': Guarantees color remains visible on white background
 *     with colorTolerance up to ~15 (at least one channel is dark enough after blending)
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
        case 'semitransparent-visible':
            // Generates colors guaranteed to be visible on white background
            // with colorTolerance up to ~15
            // Ensures at least one channel is dark enough to remain visible after blending
            alpha = (100 + Math.floor(SeededRandom.getRandom() * 101)) / 255;  // 0.39-0.78

            // To guarantee visibility: at least one channel must be < 255 - tolerance/alpha
            // With tolerance=15 and alpha=0.39 (worst case): channel < 255 - 38.5 ≈ 216
            // We'll ensure the darkest channel is at most 200 for safety margin
            const maxForVisibility = 200;

            // Generate all three channels
            let rv = Math.floor(SeededRandom.getRandom() * 256);
            let gv = Math.floor(SeededRandom.getRandom() * 256);
            let bv = Math.floor(SeededRandom.getRandom() * 256);

            // Ensure at least one channel is dark enough
            const minChannel = Math.min(rv, gv, bv);
            if (minChannel > maxForVisibility) {
                // Pick a random channel to make dark
                const channelToFix = Math.floor(SeededRandom.getRandom() * 3);
                if (channelToFix === 0) rv = Math.floor(SeededRandom.getRandom() * (maxForVisibility + 1));
                else if (channelToFix === 1) gv = Math.floor(SeededRandom.getRandom() * (maxForVisibility + 1));
                else bv = Math.floor(SeededRandom.getRandom() * (maxForVisibility + 1));
            }

            return `rgba(${rv}, ${gv}, ${bv}, ${alpha.toFixed(2)})`;
        case 'mixed-visible':
            // 50% opaque, 50% semitransparent-visible
            if (SeededRandom.getRandom() < 0.5) {
                return `rgb(${r}, ${g}, ${b})`;
            } else {
                return getRandomColor('semitransparent-visible');
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
 * Get a fully opaque random color guaranteed to be visible on white background
 * with colorTolerance up to ~15 (at least one channel is dark enough)
 * @returns {string} CSS color string
 */
function getRandomOpaqueVisibleColor() {
    // Generate channels in range 100-254
    let r = Math.floor(100 + SeededRandom.getRandom() * 155);
    let g = Math.floor(100 + SeededRandom.getRandom() * 155);
    let b = Math.floor(100 + SeededRandom.getRandom() * 155);

    // Ensure at least one channel is dark enough to be visible on white
    // With max 200, difference from white is at least 55 (well above typical tolerance 8-15)
    const maxForVisibility = 200;
    const minChannel = Math.min(r, g, b);

    if (minChannel > maxForVisibility) {
        // Pick a random channel to make darker
        const channelToFix = Math.floor(SeededRandom.getRandom() * 3);
        // Generate in range [100, maxForVisibility]
        const darkValue = Math.floor(100 + SeededRandom.getRandom() * (maxForVisibility - 100 + 1));
        if (channelToFix === 0) r = darkValue;
        else if (channelToFix === 1) g = darkValue;
        else b = darkValue;
    }

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
 * Generate arc angles with gap constrained to a single quadrant.
 * Ensures gap doesn't cross cardinal points (0°, 90°, 180°, 270°).
 * Gap is always ≤ 85° and completely within one quadrant.
 * @returns {Object} { startAngle, endAngle, gapQuadrant, gapSizeDeg }
 */
function generateConstrainedArcAngles() {
    const quadrantBases = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    const gapQuadrant = Math.floor(SeededRandom.getRandom() * 4);
    const quadrantStart = quadrantBases[gapQuadrant];

    const margin = 5 * Math.PI / 180;  // 5° margin from quadrant edges
    const minGapSize = 30 * Math.PI / 180;  // 30° minimum gap
    const maxGapSize = 85 * Math.PI / 180;  // 85° maximum gap

    // Calculate available space for gap start (leaving room for minimum gap + margins)
    const availableForStart = Math.PI / 2 - margin * 2 - minGapSize;
    const gapStartOffset = margin + SeededRandom.getRandom() * Math.max(0, availableForStart);
    const gapStart = quadrantStart + gapStartOffset;

    // Constrain gap size to stay within quadrant
    const maxAllowedGap = Math.min(maxGapSize, quadrantStart + Math.PI / 2 - gapStart - margin);
    const gapSize = minGapSize + SeededRandom.getRandom() * Math.max(0, maxAllowedGap - minGapSize);
    const gapEnd = gapStart + gapSize;

    return {
        startAngle: gapEnd,
        endAngle: gapStart + Math.PI * 2,
        gapQuadrant,
        gapSizeDeg: gapSize * 180 / Math.PI
    };
}

/**
 * Calculate arc test parameters with gap constrained to a single quadrant.
 * Arc extends > 270° (3/4 circle) to include all cardinal points for extremes checks.
 * @param {Object} options - Same as calculateCircleTestParameters
 * @param {number} options.canvasWidth - Canvas width
 * @param {number} options.canvasHeight - Canvas height
 * @param {number} options.minRadius - Minimum radius (default 8)
 * @param {number} options.maxRadius - Maximum radius (default 42)
 * @param {boolean} options.hasStroke - Whether arc has stroke
 * @param {number} options.minStrokeWidth - Minimum stroke width (default 1)
 * @param {number} options.maxStrokeWidth - Maximum stroke width (default 4)
 * @param {boolean} options.randomPosition - Use random position vs centered
 * @param {number} options.marginX - Horizontal margin (default 60)
 * @param {number} options.marginY - Vertical margin (default 60)
 * @returns {Object} Circle params + {startAngle, endAngle, gapQuadrant, gapSizeDeg}
 */
function calculateArcTestParameters(options) {
    // Get base circle parameters
    const circleParams = calculateCircleTestParameters(options);

    // Generate arc angles with gap in single quadrant
    // Quadrant bases: Q1=0°, Q2=90°, Q3=180°, Q4=270°
    const quadrantBases = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    const gapQuadrant = Math.floor(SeededRandom.getRandom() * 4);
    const quadrantStart = quadrantBases[gapQuadrant];

    // Gap position within quadrant (with 5° margin from quadrant edges)
    const margin = 5 * Math.PI / 180; // 5 degrees in radians
    const maxGapSize = 85 * Math.PI / 180; // 85 degrees max gap
    const minGapSize = 30 * Math.PI / 180; // 30 degrees min gap

    // Calculate available space for gap start within quadrant
    // quadrant is 90° (PI/2), we need margin at start and space for gap at end
    const availableForStart = Math.PI / 2 - margin * 2 - minGapSize;
    const gapStartOffset = margin + SeededRandom.getRandom() * Math.max(0, availableForStart);
    const gapStart = quadrantStart + gapStartOffset;

    // Gap size: 30° to 85° (ensures arc > 275°), but must fit within quadrant
    const maxAllowedGap = Math.min(maxGapSize, quadrantStart + Math.PI / 2 - gapStart - margin);
    const gapSize = minGapSize + SeededRandom.getRandom() * Math.max(0, maxAllowedGap - minGapSize);
    const gapEnd = gapStart + gapSize;

    // Arc draws the non-gap portion: startAngle = gapEnd, endAngle = gapStart + 2π
    // This makes the arc go from gapEnd all the way around to gapStart
    return {
        ...circleParams,
        startAngle: gapEnd,
        endAngle: gapStart + Math.PI * 2,
        gapQuadrant,
        gapSizeDeg: gapSize * 180 / Math.PI
    };
}

/**
 * Calculates parameters for a single 90-degree arc spanning one quadrant.
 * Used for crisp 90° arc tests with extent validation.
 *
 * @param {Object} options
 * @param {number} options.canvasWidth - Canvas width
 * @param {number} options.canvasHeight - Canvas height
 * @param {number} options.minDiameter - Minimum diameter (default 40)
 * @param {number} options.maxDiameter - Maximum diameter (default 200)
 * @param {number} options.strokeWidth - Stroke width for crisp adjustment (default 1)
 * @returns {Object} {centerX, centerY, radius, atPixel, quadrantIndex, quadrant, startAngle, endAngle, checkData}
 */
function calculate90DegQuadrantArcParams(options) {
    const {
        canvasWidth,
        canvasHeight,
        minDiameter = 40,
        maxDiameter = 200,
        strokeWidth = 1
    } = options;

    // Determine center type: pixel (*.5) or grid (integer)
    const atPixel = SeededRandom.getRandom() < 0.5;

    // Calculate center position
    let centerX, centerY;
    if (atPixel) {
        const pos = placeCloseToCenterAtPixel(canvasWidth, canvasHeight);
        centerX = pos.centerX;
        centerY = pos.centerY;
    } else {
        const pos = placeCloseToCenterAtGrid(canvasWidth, canvasHeight);
        centerX = pos.centerX;
        centerY = pos.centerY;
    }

    // Generate random base diameter
    const diameterRange = maxDiameter - minDiameter;
    const baseDiameter = minDiameter + Math.floor(SeededRandom.getRandom() * diameterRange);

    // Adjust diameter for crisp rendering
    const center = { x: centerX, y: centerY };
    const adjustedDiameter = adjustDimensionsForCrispStrokeRendering(
        baseDiameter, baseDiameter, strokeWidth, center
    ).width;

    // Calculate final radius
    const radius = adjustedDiameter / 2;

    // Select random quadrant (0-3)
    const quadrantIndex = Math.floor(SeededRandom.getRandom() * 4);
    const quadrants = [
        { start: 0, end: Math.PI / 2, name: 'Q1 (0-90)' },
        { start: Math.PI / 2, end: Math.PI, name: 'Q2 (90-180)' },
        { start: Math.PI, end: Math.PI * 3 / 2, name: 'Q3 (180-270)' },
        { start: Math.PI * 3 / 2, end: Math.PI * 2, name: 'Q4 (270-360)' }
    ];
    const quadrant = quadrants[quadrantIndex];

    // Calculate extent bounds based on quadrant
    const effectiveRadius = radius + strokeWidth / 2;
    const checkData = { effectiveRadius };

    switch (quadrantIndex) {
        case 0: // Q1: 0-90 (right, bottom)
            checkData.leftX = Math.floor(centerX);
            checkData.rightX = Math.floor(centerX + effectiveRadius);
            checkData.topY = Math.floor(centerY);
            checkData.bottomY = Math.floor(centerY + effectiveRadius);
            break;
        case 1: // Q2: 90-180 (left, bottom)
            checkData.leftX = Math.floor(centerX - effectiveRadius);
            checkData.rightX = Math.floor(centerX);
            checkData.topY = Math.floor(centerY);
            checkData.bottomY = Math.floor(centerY + effectiveRadius);
            break;
        case 2: // Q3: 180-270 (left, top)
            checkData.leftX = Math.floor(centerX - effectiveRadius);
            checkData.rightX = Math.floor(centerX);
            checkData.topY = Math.floor(centerY - effectiveRadius);
            checkData.bottomY = Math.floor(centerY);
            break;
        case 3: // Q4: 270-360 (right, top)
            checkData.leftX = Math.floor(centerX);
            checkData.rightX = Math.floor(centerX + effectiveRadius);
            checkData.topY = Math.floor(centerY - effectiveRadius);
            checkData.bottomY = Math.floor(centerY);
            break;
    }

    return {
        centerX,
        centerY,
        radius,
        atPixel,
        quadrantIndex,
        quadrant,
        startAngle: quadrant.start,
        endAngle: quadrant.end,
        checkData
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
 * Check that rendered shape has consistent width across all content rows
 * and consistent height across all content columns.
 * Detects issues like missing pixels on edges.
 * @param {Object} surface - Surface with data, width, height, stride
 * @param {Object} backgroundColor - Background color {r, g, b, a}
 * @returns {Object} { widthConsistent, heightConsistent, expectedWidth, minWidth, maxWidth,
 *                     expectedHeight, minHeight, maxHeight, issues: string[] }
 */
function checkDimensionConsistency(surface, backgroundColor = { r: 255, g: 255, b: 255, a: 255 }) {
    const issues = [];

    // First get overall bounds
    const extremes = analyzeExtremes(surface, backgroundColor);
    if (extremes.leftX >= surface.width || extremes.rightX < 0) {
        return { widthConsistent: true, heightConsistent: true, issues }; // No content
    }

    const expectedWidth = extremes.rightX - extremes.leftX + 1;
    const expectedHeight = extremes.bottomY - extremes.topY + 1;

    // Check width consistency (scan rows)
    let minRowWidth = expectedWidth, maxRowWidth = expectedWidth;
    let inconsistentWidthRow = null;

    for (let y = extremes.topY; y <= extremes.bottomY; y++) {
        let rowLeft = -1, rowRight = -1;
        for (let x = extremes.leftX; x <= extremes.rightX; x++) {
            const offset = y * surface.stride + x * 4;
            const isBackground =
                surface.data[offset] === backgroundColor.r &&
                surface.data[offset + 1] === backgroundColor.g &&
                surface.data[offset + 2] === backgroundColor.b &&
                surface.data[offset + 3] === backgroundColor.a;
            if (!isBackground) {
                if (rowLeft === -1) rowLeft = x;
                rowRight = x;
            }
        }
        if (rowLeft !== -1) {
            const rowWidth = rowRight - rowLeft + 1;
            if (rowWidth < minRowWidth) { minRowWidth = rowWidth; inconsistentWidthRow = y; }
            if (rowWidth > maxRowWidth) maxRowWidth = rowWidth;
        }
    }

    const widthConsistent = minRowWidth === maxRowWidth;
    if (!widthConsistent) {
        issues.push(`Width inconsistent: rows vary from ${minRowWidth} to ${maxRowWidth}px (Y=${inconsistentWidthRow})`);
    }

    // Check height consistency (scan columns)
    let minColHeight = expectedHeight, maxColHeight = expectedHeight;
    let inconsistentHeightCol = null;

    for (let x = extremes.leftX; x <= extremes.rightX; x++) {
        let colTop = -1, colBottom = -1;
        for (let y = extremes.topY; y <= extremes.bottomY; y++) {
            const offset = y * surface.stride + x * 4;
            const isBackground =
                surface.data[offset] === backgroundColor.r &&
                surface.data[offset + 1] === backgroundColor.g &&
                surface.data[offset + 2] === backgroundColor.b &&
                surface.data[offset + 3] === backgroundColor.a;
            if (!isBackground) {
                if (colTop === -1) colTop = y;
                colBottom = y;
            }
        }
        if (colTop !== -1) {
            const colHeight = colBottom - colTop + 1;
            if (colHeight < minColHeight) { minColHeight = colHeight; inconsistentHeightCol = x; }
            if (colHeight > maxColHeight) maxColHeight = colHeight;
        }
    }

    const heightConsistent = minColHeight === maxColHeight;
    if (!heightConsistent) {
        issues.push(`Height inconsistent: columns vary from ${minColHeight} to ${maxColHeight}px (X=${inconsistentHeightCol})`);
    }

    return {
        widthConsistent,
        heightConsistent,
        expectedWidth, minWidth: minRowWidth, maxWidth: maxRowWidth,
        expectedHeight, minHeight: minColHeight, maxHeight: maxColHeight,
        issues
    };
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

/**
 * Count unique colors in the middle row of the surface
 * Skips transparent pixels (alpha === 0)
 * @param {Object} surface - Surface with data, width, height, stride
 * @returns {number} Count of unique non-transparent colors
 */
function countUniqueColorsInMiddleRow(surface) {
    const colors = new Set();
    const middleY = Math.floor(surface.height / 2);

    for (let x = 0; x < surface.width; x++) {
        const offset = middleY * surface.stride + x * 4;
        const a = surface.data[offset + 3];
        if (a === 0) continue; // Skip transparent pixels
        const colorKey = `${surface.data[offset]},${surface.data[offset + 1]},${surface.data[offset + 2]},${a}`;
        colors.add(colorKey);
    }

    return colors.size;
}

/**
 * Count unique colors in the middle column of the surface
 * Skips transparent pixels (alpha === 0)
 * @param {Object} surface - Surface with data, width, height, stride
 * @returns {number} Count of unique non-transparent colors
 */
function countUniqueColorsInMiddleColumn(surface) {
    const colors = new Set();
    const middleX = Math.floor(surface.width / 2);

    for (let y = 0; y < surface.height; y++) {
        const offset = y * surface.stride + middleX * 4;
        const a = surface.data[offset + 3];
        if (a === 0) continue; // Skip transparent pixels
        const colorKey = `${surface.data[offset]},${surface.data[offset + 1]},${surface.data[offset + 2]},${a}`;
        colors.add(colorKey);
    }

    return colors.size;
}

/**
 * Count speckles in the surface (matching CrispSWCanvas algorithm)
 * A speckle is a pixel that differs from its neighbors when those neighbors match each other
 * @param {Object} surface - Surface with data, width, height, stride
 * @returns {{count: number, firstSpeckle: {x: number, y: number}|null}} Speckle count and first location
 */
function countSpeckles(surface) {
    let speckleCount = 0;
    let firstSpeckle = null;
    const data = surface.data;
    const width = surface.width;
    const stride = surface.stride;

    for (let y = 1; y < surface.height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const currentIdx = y * stride + x * 4;
            const leftIdx = y * stride + (x - 1) * 4;
            const rightIdx = y * stride + (x + 1) * 4;
            const topIdx = (y - 1) * stride + x * 4;
            const bottomIdx = (y + 1) * stride + x * 4;

            // Check if horizontal neighbors match
            const horizontalMatch =
                data[leftIdx] === data[rightIdx] &&
                data[leftIdx + 1] === data[rightIdx + 1] &&
                data[leftIdx + 2] === data[rightIdx + 2] &&
                data[leftIdx + 3] === data[rightIdx + 3];

            // Check if vertical neighbors match
            const verticalMatch =
                data[topIdx] === data[bottomIdx] &&
                data[topIdx + 1] === data[bottomIdx + 1] &&
                data[topIdx + 2] === data[bottomIdx + 2] &&
                data[topIdx + 3] === data[bottomIdx + 3];

            // Check if current pixel differs from neighbors
            const differentFromHorizontal =
                data[currentIdx] !== data[leftIdx] ||
                data[currentIdx + 1] !== data[leftIdx + 1] ||
                data[currentIdx + 2] !== data[leftIdx + 2] ||
                data[currentIdx + 3] !== data[leftIdx + 3];

            const differentFromVertical =
                data[currentIdx] !== data[topIdx] ||
                data[currentIdx + 1] !== data[topIdx + 1] ||
                data[currentIdx + 2] !== data[topIdx + 2] ||
                data[currentIdx + 3] !== data[topIdx + 3];

            if ((horizontalMatch && differentFromHorizontal) ||
                (verticalMatch && differentFromVertical)) {
                speckleCount++;
                if (!firstSpeckle) {
                    firstSpeckle = { x, y };
                }
            }
        }
    }

    return { count: speckleCount, firstSpeckle };
}

/**
 * Run all validation checks on a surface
 * Shared between Node.js and browser test runners for consistency.
 * @param {Object} surface - Surface with data, width, height, stride
 * @param {Object} checks - Checks configuration from test
 * @returns {Object} { passed: boolean, issues: string[], knownFailureIssues: string[] }
 */
function runValidationChecks(surface, checks) {
    const issues = [];
    const knownFailureIssues = [];

    // Total unique colors check (exactly N)
    if (checks.totalUniqueColors) {
        const isObject = typeof checks.totalUniqueColors === 'object';
        // Support both .expected and .count for backwards compatibility
        const expected = isObject
            ? (checks.totalUniqueColors.expected !== undefined
                ? checks.totalUniqueColors.expected
                : checks.totalUniqueColors.count)
            : checks.totalUniqueColors;
        const actual = countUniqueColors(surface);
        if (actual !== expected) {
            issues.push(`Unique colors: expected exactly ${expected}, got ${actual}`);
        }
    }

    // Max unique colors check (at most N)
    if (checks.maxUniqueColors) {
        const actual = countUniqueColors(surface);
        if (actual > checks.maxUniqueColors) {
            issues.push(`Unique colors: ${actual} exceeds maximum of ${checks.maxUniqueColors}`);
        }
    }

    // Middle row unique colors
    if (checks.uniqueColors && checks.uniqueColors.middleRow) {
        const expected = checks.uniqueColors.middleRow.count;
        const actual = countUniqueColorsInMiddleRow(surface);
        if (actual !== expected) {
            issues.push(`Middle row unique colors: ${actual} (expected ${expected})`);
        }
    }

    // Middle column unique colors
    if (checks.uniqueColors && checks.uniqueColors.middleColumn) {
        const expected = checks.uniqueColors.middleColumn.count;
        const actual = countUniqueColorsInMiddleColumn(surface);
        if (actual !== expected) {
            issues.push(`Middle column unique colors: ${actual} (expected ${expected})`);
        }
    }

    // Speckle checks
    if (checks.speckles === true || (checks.speckles && typeof checks.speckles === 'object')) {
        const expected = (typeof checks.speckles === 'object' && checks.speckles.expected !== undefined)
            ? checks.speckles.expected : 0;
        const maxSpeckles = typeof checks.speckles === 'object' ? checks.speckles.maxSpeckles : undefined;
        const isKnownFailure = typeof checks.speckles === 'object' && checks.speckles.knownFailure === true;
        const speckleResult = countSpeckles(surface);
        const speckleCount = speckleResult.count;

        const speckleCheckPassed = maxSpeckles !== undefined
            ? speckleCount <= maxSpeckles
            : speckleCount === expected;

        if (!speckleCheckPassed) {
            const firstInfo = speckleResult.firstSpeckle
                ? ` (first at ${speckleResult.firstSpeckle.x},${speckleResult.firstSpeckle.y})`
                : '';
            const expectedMsg = maxSpeckles !== undefined ? `≤${maxSpeckles}` : `${expected}`;
            const message = `Speckle count: ${speckleCount} (expected ${expectedMsg})${firstInfo}`;
            if (isKnownFailure) {
                knownFailureIssues.push(message + ' [KNOWN]');
            } else {
                issues.push(message);
            }
        }
    } else if (checks.noSpeckles === true || checks.speckles === false) {
        if (hasSpeckles(surface)) {
            issues.push('Unexpected speckles found');
        }
    }

    // Dimension consistency check (stroke width/height uniformity)
    if (checks.dimensionConsistency) {
        const result = checkDimensionConsistency(surface);
        if (!result.widthConsistent || !result.heightConsistent) {
            issues.push(...result.issues);
        }
    }

    return {
        passed: issues.length === 0,
        issues,
        knownFailureIssues
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HIGH_LEVEL_TESTS,
        SeededRandom,
        getRandomColor,
        getRandomOpaqueColor,
        getRandomOpaqueVisibleColor,
        getRandomPoint,
        placeCloseToCenterAtPixel,
        placeCloseToCenterAtGrid,
        adjustDimensionsForCrispStrokeRendering,
        roundPoint,
        adjustCenterForCrispStrokeRendering,
        calculateCrispFillAndStrokeRectParams,
        calculateCircleTestParameters,
        calculateArcTestParameters,
        calculate90DegQuadrantArcParams,
        generateConstrainedArcAngles,
        registerHighLevelTest,
        analyzeExtremes,
        checkDimensionConsistency,
        countUniqueColors,
        countUniqueColorsInMiddleRow,
        countUniqueColorsInMiddleColumn,
        countSpeckles,
        hasSpeckles,
        runValidationChecks
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HIGH_LEVEL_TESTS = HIGH_LEVEL_TESTS;
    window.SeededRandom = SeededRandom;
    window.getRandomColor = getRandomColor;
    window.getRandomOpaqueColor = getRandomOpaqueColor;
    window.getRandomOpaqueVisibleColor = getRandomOpaqueVisibleColor;
    window.getRandomPoint = getRandomPoint;
    window.placeCloseToCenterAtPixel = placeCloseToCenterAtPixel;
    window.placeCloseToCenterAtGrid = placeCloseToCenterAtGrid;
    window.adjustDimensionsForCrispStrokeRendering = adjustDimensionsForCrispStrokeRendering;
    window.roundPoint = roundPoint;
    window.adjustCenterForCrispStrokeRendering = adjustCenterForCrispStrokeRendering;
    window.calculateCrispFillAndStrokeRectParams = calculateCrispFillAndStrokeRectParams;
    window.calculateCircleTestParameters = calculateCircleTestParameters;
    window.calculateArcTestParameters = calculateArcTestParameters;
    window.calculate90DegQuadrantArcParams = calculate90DegQuadrantArcParams;
    window.generateConstrainedArcAngles = generateConstrainedArcAngles;
    window.registerHighLevelTest = registerHighLevelTest;
    window.analyzeExtremes = analyzeExtremes;
    window.checkDimensionConsistency = checkDimensionConsistency;
    window.countUniqueColors = countUniqueColors;
    window.countUniqueColorsInMiddleRow = countUniqueColorsInMiddleRow;
    window.countUniqueColorsInMiddleColumn = countUniqueColorsInMiddleColumn;
    window.countSpeckles = countSpeckles;
    window.hasSpeckles = hasSpeckles;
    window.runValidationChecks = runValidationChecks;
}
