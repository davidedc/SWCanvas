/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single 90-degree arc spanning one random quadrant with crisp stroke ends,
 *              mixed fill (opaque or semitransparent), and opaque 1px stroke.
 *
 *
 * ---
 *
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | arcs               | The test focuses on rendering a 90-degree arc.
 * | Count                  | single             | The test draws a single arc instance.
 * | SizeCategory           | mixed              | The radius is randomized in a range of [20, 100], spanning multiple size categories.
 * | FillStyle              | mixed              | Fill is randomly opaque or semitransparent (50% chance each).
 * | StrokeStyle            | opaque             | Stroke color is always fully opaque (alpha = 255).
 * | StrokeThickness        | 1px                | Fixed 1px stroke width for crisp rendering.
 * | Layout                 | centered           | The arc's center is at the canvas center.
 * | CenteredAt             | mixed-pixel-grid   | A random flag determines if center is on pixel (*.5) or grid (integer) line.
 * | EdgeAlignment          | crisp              | Diameter adjusted via `adjustDimensionsForCrispStrokeRendering()` for sharp edges.
 * | Orientation            | N/A                | Arc orientation determined by quadrant selection.
 * | ArcAngleExtent         | 90-deg             | Arc spans exactly 90 degrees (one quadrant).
 * | Quadrant               | random             | Randomly selects one of four quadrants: Q1 (0-90), Q2 (90-180), Q3 (180-270), Q4 (270-360).
 * | RoundRectRadius        | N/A                | Not applicable to arcs.
 * | ContextTranslation     | none               | `ctx.translate()` is not used in this test.
 * | ContextRotation        | none               | `ctx.rotate()` is not used in this test.
 * | ContextScaling         | none               | `ctx.scale()` is not used in this test.
 * | Clipped on shape       | none               | No clipping path is defined or applied in this test.
 * | Clipped on shape count | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a          | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - Uses SWCanvas direct API method `ctx.fillAndOuterStrokeArc()` for unified fill+stroke rendering.
 * - Extent check validates that arc bounds match between SWCanvas and HTML5 Canvas.
 * - The 90-degree arc only covers one quadrant, so extent bounds are quadrant-specific.
 *
 */

registerHighLevelTest(
    'arc-sgl-szMix-fMix-sOpaq-sw1px-lytCenter-cenMixPG-edgeCrisp-arcADeg90-quadRand-test',
    function drawTest(ctx, iterationNumber, instances) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

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
        const baseDiameter = 40 + Math.floor(SeededRandom.getRandom() * 160); // 40-200

        // Adjust diameter for crisp rendering with 1px stroke
        const strokeWidth = 1;
        const center = { x: centerX, y: centerY };
        const adjustedDiameter = adjustDimensionsForCrispStrokeRendering(
            baseDiameter, baseDiameter, strokeWidth, center
        ).width;

        // Calculate final radius
        const radius = adjustedDiameter / 2;

        // Select random quadrant (0-3)
        const quadrantIndex = Math.floor(SeededRandom.getRandom() * 4);
        const quadrants = [
            { start: 0, end: Math.PI / 2, name: 'Q1 (0-90)' },                    // Bottom-right
            { start: Math.PI / 2, end: Math.PI, name: 'Q2 (90-180)' },            // Bottom-left
            { start: Math.PI, end: Math.PI * 3 / 2, name: 'Q3 (180-270)' },       // Top-left
            { start: Math.PI * 3 / 2, end: Math.PI * 2, name: 'Q4 (270-360)' }    // Top-right
        ];
        const selectedQuadrant = quadrants[quadrantIndex];
        const startAngle = selectedQuadrant.start;
        const endAngle = selectedQuadrant.end;

        // Generate random fill style (opaque or semitransparent)
        const fillType = SeededRandom.getRandom() < 0.5 ? 'opaque' : 'semitransparent';
        const fillColor = getRandomColor(fillType);

        // Fixed opaque stroke
        const strokeColor = getRandomOpaqueColor();

        // Draw filled and stroked arc using unified Direct API
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.fillAndOuterStrokeArc(centerX, centerY, radius, startAngle, endAngle);

        // Calculate expected extent bounds based on quadrant
        const effectiveRadius = radius + strokeWidth / 2;
        let checkData = { effectiveRadius };

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
            logs: [`90deg Arc: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, quadrant=${selectedQuadrant.name}, fillType=${fillType}, centerType=${atPixel ? 'pixel' : 'grid'}`],
            checkData
        };
    },
    'arcs',
    {
        extremes: { colorTolerance: 20, tolerance: 0.03 },
        maxUniqueColors: 4,  // background + fill + stroke + blend (may be fewer if colors overlap)
        speckles: { maxSpeckles: 4 }
    },
    {
        title: 'Single 90deg Arc (Crisp, Random Quadrant, Mixed Fill)',
        description: 'Tests a single 90-degree arc spanning one random quadrant with crisp stroke ends, mixed fill (opaque or semitransparent), and opaque 1px stroke.',
        displayName: 'Perf: Arc 90deg Crisp QuadRand'
    }
);
