/**
 * Browser High-Level Test Runner
 *
 * Runs high-level tests comparing SWCanvas output with native HTML5 Canvas
 * and verifies that fast paths are used where expected.
 */

// Polyfill direct shape APIs on native CanvasRenderingContext2D
(function installPolyfills() {
    const proto = CanvasRenderingContext2D.prototype;

    if (!proto.fillCircle) {
        proto.fillCircle = function(cx, cy, r) {
            this.beginPath();
            this.arc(cx, cy, r, 0, Math.PI * 2);
            this.fill();
        };
    }

    if (!proto.strokeCircle) {
        proto.strokeCircle = function(cx, cy, r) {
            this.beginPath();
            this.arc(cx, cy, r, 0, Math.PI * 2);
            this.stroke();
        };
    }

    if (!proto.fillAndStrokeCircle) {
        proto.fillAndStrokeCircle = function(cx, cy, r) {
            this.beginPath();
            this.arc(cx, cy, r, 0, Math.PI * 2);
            this.fill();
            this.stroke();
        };
    }

    if (!proto.strokeLine) {
        proto.strokeLine = function(x1, y1, x2, y2) {
            this.beginPath();
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.stroke();
        };
    }

    if (!proto.fillRectShape) {
        proto.fillRectShape = function(x, y, w, h) {
            this.fillRect(x, y, w, h);
        };
    }

    if (!proto.strokeRectShape) {
        proto.strokeRectShape = function(x, y, w, h) {
            this.strokeRect(x, y, w, h);
        };
    }
})();

/**
 * High-Level Test Runner for browser
 */
class HighLevelTestRunner {
    static results = { passed: 0, failed: 0 };
    static testElements = new Map();

    /**
     * Initialize the test runner
     */
    static initialize() {
        // Build navigation
        this.buildNavigation();

        // Create test sections
        this.createTestSections();

        // Build summary (initially empty)
        this.updateSummary();

        // Add controls
        this.addControls();
    }

    /**
     * Build navigation links
     */
    static buildNavigation() {
        const nav = document.getElementById('navigation');
        if (!nav) return;

        HIGH_LEVEL_TESTS.forEach(test => {
            const link = document.createElement('a');
            link.href = `#test-${test.name}`;
            link.className = 'nav-link';
            link.textContent = test.name;
            link.dataset.testName = test.name;
            nav.appendChild(link);
        });
    }

    /**
     * Add run all button
     */
    static addControls() {
        const header = document.querySelector('header');
        if (!header) return;

        const controls = document.createElement('div');
        controls.id = 'controls';

        const runAllBtn = document.createElement('button');
        runAllBtn.className = 'primary';
        runAllBtn.textContent = 'Run All Tests';
        runAllBtn.onclick = () => this.runAllTests();
        controls.appendChild(runAllBtn);

        header.appendChild(controls);
    }

    /**
     * Create test sections for each registered test
     */
    static createTestSections() {
        const container = document.getElementById('test-container');
        if (!container) return;

        HIGH_LEVEL_TESTS.forEach(test => {
            const section = this.createTestSection(test);
            container.appendChild(section);
            this.testElements.set(test.name, section);
        });
    }

    /**
     * Create a single test section
     */
    static createTestSection(test) {
        const section = document.createElement('div');
        section.className = 'test-section';
        section.id = `test-${test.name}`;

        // Header
        const header = document.createElement('div');
        header.className = 'test-header';

        const titleDiv = document.createElement('div');
        const title = document.createElement('h3');
        title.className = 'test-title';
        title.textContent = test.metadata.title || test.name;
        titleDiv.appendChild(title);

        if (test.metadata.description) {
            const desc = document.createElement('p');
            desc.className = 'test-description';
            desc.textContent = test.metadata.description;
            titleDiv.appendChild(desc);
        }
        header.appendChild(titleDiv);

        const runBtn = document.createElement('button');
        runBtn.className = 'run-test-btn';
        runBtn.textContent = 'Run Test';
        runBtn.onclick = () => this.runTest(test);
        header.appendChild(runBtn);

        section.appendChild(header);

        // Canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';

        // SWCanvas side
        const swWrapper = document.createElement('div');
        swWrapper.className = 'canvas-wrapper';
        const swLabel = document.createElement('div');
        swLabel.className = 'canvas-label swcanvas-label';
        swLabel.textContent = 'SWCanvas';
        swWrapper.appendChild(swLabel);
        const swCanvas = document.createElement('canvas');
        swCanvas.width = 400;
        swCanvas.height = 300;
        swCanvas.dataset.renderer = 'swcanvas';
        swWrapper.appendChild(swCanvas);
        canvasContainer.appendChild(swWrapper);

        // HTML5 Canvas side
        const html5Wrapper = document.createElement('div');
        html5Wrapper.className = 'canvas-wrapper';
        const html5Label = document.createElement('div');
        html5Label.className = 'canvas-label html5-label';
        html5Label.textContent = 'HTML5 Canvas';
        html5Wrapper.appendChild(html5Label);
        const html5Canvas = document.createElement('canvas');
        html5Canvas.width = 400;
        html5Canvas.height = 300;
        html5Canvas.dataset.renderer = 'html5';
        html5Wrapper.appendChild(html5Canvas);
        canvasContainer.appendChild(html5Wrapper);

        section.appendChild(canvasContainer);

        // Results section (initially hidden)
        const results = document.createElement('div');
        results.className = 'test-results';
        results.style.display = 'none';
        section.appendChild(results);

        return section;
    }

    /**
     * Run a single test
     */
    static runTest(test) {
        const section = this.testElements.get(test.name);
        if (!section) return;

        const swCanvas = section.querySelector('canvas[data-renderer="swcanvas"]');
        const html5Canvas = section.querySelector('canvas[data-renderer="html5"]');
        const resultsDiv = section.querySelector('.test-results');

        // Run on SWCanvas
        const swResult = this.runOnSWCanvas(test, swCanvas);

        // Get fast path status AFTER running SWCanvas
        const slowPathUsed = SWCanvas.Core.Context2D.wasSlowPathUsed();
        const allowSlowPath = test.checks.allowSlowPath === true;

        // Run on HTML5 Canvas
        const html5Result = this.runOnHTML5Canvas(test, html5Canvas);

        // Run validation checks
        const checkResults = this.runValidationChecks(test, swCanvas, swResult);

        // Display results
        this.displayResults(section, test, slowPathUsed, allowSlowPath, checkResults, swResult);
    }

    /**
     * Run test on SWCanvas
     */
    static runOnSWCanvas(test, canvas) {
        // Create SWCanvas from the canvas element
        const swCanvas = SWCanvas.createCanvas(canvas.width, canvas.height);
        const ctx = swCanvas.getContext('2d');
        ctx.canvas = swCanvas;

        // Reset slow path flag before drawing
        SWCanvas.Core.Context2D.resetSlowPathFlag();

        // Seed random for reproducibility
        SeededRandom.seedWithInteger(12345);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Run the test draw function
        const result = test.drawFunction(ctx, 1, null);

        // Copy SWCanvas result to visible canvas
        const visibleCtx = canvas.getContext('2d');
        const swImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Create a native browser ImageData from SWCanvas data
        const nativeImageData = visibleCtx.createImageData(canvas.width, canvas.height);
        nativeImageData.data.set(swImageData.data);
        visibleCtx.putImageData(nativeImageData, 0, 0);

        return result || {};
    }

    /**
     * Run test on native HTML5 Canvas
     */
    static runOnHTML5Canvas(test, canvas) {
        const ctx = canvas.getContext('2d');
        // Note: ctx.canvas is already set and readonly on native Canvas

        // Seed random with same seed for reproducibility
        SeededRandom.seedWithInteger(12345);

        // Clear and white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Run the test draw function
        const result = test.drawFunction(ctx, 1, null);

        return result || {};
    }

    /**
     * Run validation checks on the SWCanvas output
     */
    static runValidationChecks(test, canvas, drawResult) {
        const results = [];
        const checks = test.checks || {};

        // Get image data for analysis
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Create a mock surface object for the utility functions
        const surface = {
            width: canvas.width,
            height: canvas.height,
            stride: canvas.width * 4,
            data: imageData.data
        };

        // Extremes check
        if (checks.extremes) {
            const extremes = analyzeExtremes(surface);
            const expectedData = drawResult.checkData || {};

            let passed = true;
            let details = '';

            if (extremes.topY === surface.height || extremes.bottomY === -1) {
                passed = false;
                details = 'No drawing detected';
            } else if (expectedData.topY !== undefined) {
                const tolerance = typeof checks.extremes === 'object'
                    ? (checks.extremes.tolerance || 0) * surface.height
                    : 0;

                const topDiff = Math.abs(extremes.topY - expectedData.topY);
                const bottomDiff = Math.abs(extremes.bottomY - expectedData.bottomY);
                const leftDiff = Math.abs(extremes.leftX - expectedData.leftX);
                const rightDiff = Math.abs(extremes.rightX - expectedData.rightX);

                const maxDiff = Math.max(topDiff, bottomDiff, leftDiff, rightDiff);

                if (maxDiff > tolerance + 2) {
                    passed = false;
                }
                details = `bounds: T=${extremes.topY} B=${extremes.bottomY} L=${extremes.leftX} R=${extremes.rightX}`;
            } else {
                details = `bounds: T=${extremes.topY} B=${extremes.bottomY} L=${extremes.leftX} R=${extremes.rightX}`;
            }

            results.push({
                name: 'Extremes',
                passed,
                details
            });
        }

        // Unique colors check
        if (checks.totalUniqueColors !== undefined) {
            const uniqueColors = countUniqueColors(surface);
            const passed = uniqueColors >= checks.totalUniqueColors;
            results.push({
                name: 'Unique Colors',
                passed,
                details: `${uniqueColors} (expected >= ${checks.totalUniqueColors})`
            });
        }

        // Speckles check
        if (checks.noSpeckles === true) {
            const hasSpecklePixels = hasSpeckles(surface);
            results.push({
                name: 'No Speckles',
                passed: !hasSpecklePixels,
                details: hasSpecklePixels ? 'Speckles detected' : 'Clean edges'
            });
        }

        return results;
    }

    /**
     * Display test results
     */
    static displayResults(section, test, slowPathUsed, allowSlowPath, checkResults, drawResult) {
        const resultsDiv = section.querySelector('.test-results');
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'block';

        // Fast path status
        const fastPathRow = document.createElement('div');
        fastPathRow.className = 'result-row';

        const fastPathLabel = document.createElement('span');
        fastPathLabel.className = 'result-label';
        fastPathLabel.textContent = 'Fast Path:';
        fastPathRow.appendChild(fastPathLabel);

        const fastPathValue = document.createElement('span');
        fastPathValue.className = 'result-value';

        let fastPathPassed;
        if (!slowPathUsed) {
            fastPathValue.innerHTML = '<span class="check-icon">&#x2705;</span><span class="fast-path-pass">Fast path used (PASS)</span>';
            fastPathPassed = true;
        } else if (allowSlowPath) {
            fastPathValue.innerHTML = '<span class="check-icon">&#x26A0;</span><span class="fast-path-expected">Slow path used (Expected - alpha blending)</span>';
            fastPathPassed = true;
        } else {
            fastPathValue.innerHTML = '<span class="check-icon">&#x274C;</span><span class="fast-path-fail">Slow path used (FAIL - fast path expected)</span>';
            fastPathPassed = false;
        }
        fastPathRow.appendChild(fastPathValue);
        resultsDiv.appendChild(fastPathRow);

        // Validation checks
        let allChecksPassed = true;
        checkResults.forEach(check => {
            const row = document.createElement('div');
            row.className = 'result-row';

            const label = document.createElement('span');
            label.className = 'result-label';
            label.textContent = check.name + ':';
            row.appendChild(label);

            const value = document.createElement('span');
            value.className = 'result-value ' + (check.passed ? 'check-pass' : 'check-fail');
            const icon = check.passed ? '&#x2705;' : '&#x274C;';
            value.innerHTML = `<span class="check-icon">${icon}</span>${check.details}`;
            row.appendChild(value);

            resultsDiv.appendChild(row);

            if (!check.passed) {
                allChecksPassed = false;
            }
        });

        // Overall result banner
        const overallPassed = fastPathPassed && allChecksPassed;
        const banner = document.createElement('div');
        banner.className = 'test-result-banner ' + (overallPassed ? 'test-pass' : 'test-fail');
        banner.textContent = overallPassed ? 'PASS' : 'FAIL';
        resultsDiv.appendChild(banner);

        // Logs
        if (drawResult.logs && drawResult.logs.length > 0) {
            const logsDiv = document.createElement('div');
            logsDiv.className = 'test-logs';
            const logsTitle = document.createElement('div');
            logsTitle.className = 'test-logs-title';
            logsTitle.textContent = 'Test Logs:';
            logsDiv.appendChild(logsTitle);

            drawResult.logs.forEach(log => {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.textContent = log;
                logsDiv.appendChild(logEntry);
            });
            resultsDiv.appendChild(logsDiv);
        }

        // Update navigation link color
        const navLink = document.querySelector(`.nav-link[data-test-name="${test.name}"]`);
        if (navLink) {
            navLink.classList.remove('passed', 'failed');
            navLink.classList.add(overallPassed ? 'passed' : 'failed');
        }

        // Update global results
        if (section.dataset.hasRun !== 'true') {
            section.dataset.hasRun = 'true';
            if (overallPassed) {
                this.results.passed++;
            } else {
                this.results.failed++;
            }
            this.updateSummary();
        }

        return overallPassed;
    }

    /**
     * Update summary display
     */
    static updateSummary() {
        const summary = document.getElementById('summary');
        if (!summary) return;

        const total = HIGH_LEVEL_TESTS.length;
        const run = this.results.passed + this.results.failed;

        summary.innerHTML = `
            <div class="summary-item">
                <span>Total:</span>
                <span class="summary-count summary-total">${total}</span>
            </div>
            <div class="summary-item">
                <span>Passed:</span>
                <span class="summary-count summary-passed">${this.results.passed}</span>
            </div>
            <div class="summary-item">
                <span>Failed:</span>
                <span class="summary-count summary-failed">${this.results.failed}</span>
            </div>
            ${run < total ? `<div class="summary-item"><span>(${total - run} not yet run)</span></div>` : ''}
        `;
    }

    /**
     * Run all tests
     */
    static runAllTests() {
        // Reset results
        this.results = { passed: 0, failed: 0 };
        this.testElements.forEach(section => {
            section.dataset.hasRun = 'false';
        });

        // Run each test
        HIGH_LEVEL_TESTS.forEach(test => {
            this.runTest(test);
        });
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HighLevelTestRunner = HighLevelTestRunner;
}
