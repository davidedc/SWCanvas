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
    static runningIterations = new Map(); // Track running multi-iteration tests
    static flipStates = new Map(); // Track flip state per test: 'sw' or 'canvas'

    // Magnifier grid dimensions
    static GRID_COLUMNS = 11;
    static GRID_ROWS = 21;

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
     * Add run all button and iteration controls
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

        // Add iteration controls for running all tests
        const iterLabel = document.createElement('span');
        iterLabel.className = 'global-iter-label';
        iterLabel.textContent = 'All Tests:';
        controls.appendChild(iterLabel);

        const run1Btn = document.createElement('button');
        run1Btn.className = 'secondary iter-btn';
        run1Btn.textContent = '1 iter';
        run1Btn.onclick = () => this.runAllIterations(1);
        controls.appendChild(run1Btn);

        const run10Btn = document.createElement('button');
        run10Btn.className = 'secondary iter-btn';
        run10Btn.textContent = '10 iter';
        run10Btn.onclick = () => this.runAllIterations(10);
        controls.appendChild(run10Btn);

        const run100Btn = document.createElement('button');
        run100Btn.className = 'secondary iter-btn';
        run100Btn.textContent = '100 iter';
        run100Btn.onclick = () => this.runAllIterations(100);
        controls.appendChild(run100Btn);

        const stopAllBtn = document.createElement('button');
        stopAllBtn.id = 'stop-all-btn';
        stopAllBtn.className = 'secondary iter-btn stop-btn';
        stopAllBtn.textContent = 'Stop All';
        stopAllBtn.onclick = () => this.stopAllIterations();
        stopAllBtn.style.display = 'none';
        controls.appendChild(stopAllBtn);

        // Global progress display
        const progressDiv = document.createElement('div');
        progressDiv.id = 'global-progress';
        progressDiv.className = 'global-progress';
        progressDiv.style.display = 'none';
        controls.appendChild(progressDiv);

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

        // Iteration controls
        const iterControls = document.createElement('div');
        iterControls.className = 'iteration-controls';

        const iterLabel = document.createElement('span');
        iterLabel.className = 'iter-label';
        iterLabel.textContent = 'Iterations:';
        iterControls.appendChild(iterLabel);

        const run1Btn = document.createElement('button');
        run1Btn.className = 'iter-btn';
        run1Btn.textContent = '1';
        run1Btn.onclick = () => this.runIterations(test, 1);
        iterControls.appendChild(run1Btn);

        const run10Btn = document.createElement('button');
        run10Btn.className = 'iter-btn';
        run10Btn.textContent = '10';
        run10Btn.onclick = () => this.runIterations(test, 10);
        iterControls.appendChild(run10Btn);

        const run100Btn = document.createElement('button');
        run100Btn.className = 'iter-btn';
        run100Btn.textContent = '100';
        run100Btn.onclick = () => this.runIterations(test, 100);
        iterControls.appendChild(run100Btn);

        const stopBtn = document.createElement('button');
        stopBtn.className = 'iter-btn stop-btn';
        stopBtn.textContent = 'Stop';
        stopBtn.onclick = () => this.stopIterations(test);
        stopBtn.style.display = 'none';
        iterControls.appendChild(stopBtn);

        // Progress display
        const progressDiv = document.createElement('div');
        progressDiv.className = 'iter-progress';
        progressDiv.style.display = 'none';
        iterControls.appendChild(progressDiv);

        section.appendChild(iterControls);

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

        // Comparison/Display canvas wrapper
        const displayWrapper = document.createElement('div');
        displayWrapper.className = 'canvas-wrapper display-wrapper';

        // Label container (for dynamic label switching)
        const displayLabelContainer = document.createElement('div');
        displayLabelContainer.className = 'display-label-container';

        // Alternating view label (shown by default)
        const displayAltLabel = document.createElement('div');
        displayAltLabel.className = 'canvas-label display-label';
        displayAltLabel.textContent = 'Alternating View (SW)';
        displayLabelContainer.appendChild(displayAltLabel);

        // Magnifier labels container (hidden by default)
        const displayMagContainer = document.createElement('div');
        displayMagContainer.className = 'magnifier-label-container';
        displayMagContainer.style.display = 'none';

        const magSwLabel = document.createElement('div');
        magSwLabel.className = 'canvas-label mag-label';
        magSwLabel.textContent = 'SW Magnified';

        const magCanvasLabel = document.createElement('div');
        magCanvasLabel.className = 'canvas-label mag-label';
        magCanvasLabel.textContent = 'Canvas Magnified';

        displayMagContainer.appendChild(magSwLabel);
        displayMagContainer.appendChild(magCanvasLabel);
        displayLabelContainer.appendChild(displayMagContainer);

        displayWrapper.appendChild(displayLabelContainer);

        // Third canvas (same size as others)
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = 400;
        displayCanvas.height = 300;
        displayCanvas.dataset.renderer = 'display';
        displayWrapper.appendChild(displayCanvas);

        // Flip button
        const flipBtn = document.createElement('button');
        flipBtn.className = 'flip-btn';
        flipBtn.textContent = 'Flip View';
        flipBtn.onclick = () => this.flipView(test.name);
        displayWrapper.appendChild(flipBtn);

        canvasContainer.appendChild(displayWrapper);

        // Add mouse event listeners for pixel inspection
        swCanvas.style.cursor = 'crosshair';
        html5Canvas.style.cursor = 'crosshair';

        swCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, test.name, swCanvas));
        html5Canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, test.name, html5Canvas));
        swCanvas.addEventListener('mouseout', () => this.handleMouseOut(test.name));
        html5Canvas.addEventListener('mouseout', () => this.handleMouseOut(test.name));

        // Initialize flip state
        if (!this.flipStates.has(test.name)) {
            this.flipStates.set(test.name, 'sw');
        }

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
    static runTest(test, iterationNumber = 1) {
        const section = this.testElements.get(test.name);
        if (!section) return;

        const swCanvas = section.querySelector('canvas[data-renderer="swcanvas"]');
        const html5Canvas = section.querySelector('canvas[data-renderer="html5"]');
        const resultsDiv = section.querySelector('.test-results');

        // Run on SWCanvas
        const swResult = this.runOnSWCanvas(test, swCanvas, iterationNumber);

        // Get fast path status AFTER running SWCanvas
        const slowPathUsed = SWCanvas.Core.Context2D.wasSlowPathUsed();
        const allowSlowPath = test.checks.allowSlowPath === true;

        // Run on HTML5 Canvas
        const html5Result = this.runOnHTML5Canvas(test, html5Canvas, iterationNumber);

        // Update the flip display canvas
        this.updateFlipDisplay(test.name);

        // Run validation checks
        const checkResults = this.runValidationChecks(test, swCanvas, swResult);

        // Display results
        return this.displayResults(section, test, slowPathUsed, allowSlowPath, checkResults, swResult, iterationNumber);
    }

    /**
     * Run multiple iterations of a test
     */
    static runIterations(test, count) {
        const section = this.testElements.get(test.name);
        if (!section) return;

        // Stop any existing run
        this.stopIterations(test);

        // Get UI elements
        const iterControls = section.querySelector('.iteration-controls');
        const stopBtn = iterControls.querySelector('.stop-btn');
        const progressDiv = iterControls.querySelector('.iter-progress');
        const iterBtns = iterControls.querySelectorAll('.iter-btn:not(.stop-btn)');

        // Show progress, hide other buttons
        stopBtn.style.display = 'inline-block';
        progressDiv.style.display = 'inline-block';
        iterBtns.forEach(btn => btn.disabled = true);

        let current = 0;
        let passed = 0;
        let failed = 0;
        const errors = [];

        // Reset section run state for fresh summary tracking
        section.dataset.hasRun = 'false';

        const runState = {
            running: true,
            current: 0,
            total: count
        };
        this.runningIterations.set(test.name, runState);

        const runFrame = () => {
            if (!runState.running || current >= count) {
                // Done - show final results
                this.finishIterations(test, section, passed, failed, errors, count);
                return;
            }

            // Update progress
            progressDiv.textContent = `${current + 1}/${count}`;

            // Run iteration with different seed
            const iterPassed = this.runTest(test, current + 1);
            if (iterPassed) {
                passed++;
            } else {
                failed++;
                errors.push(`Iteration ${current + 1} failed`);
            }

            current++;
            runState.current = current;

            // Schedule next frame
            requestAnimationFrame(runFrame);
        };

        // Start running
        requestAnimationFrame(runFrame);
    }

    /**
     * Stop running iterations
     */
    static stopIterations(test) {
        const runState = this.runningIterations.get(test.name);
        if (runState) {
            runState.running = false;
            this.runningIterations.delete(test.name);
        }
    }

    /**
     * Finish iteration run and show summary
     */
    static finishIterations(test, section, passed, failed, errors, total) {
        // Clean up run state
        this.runningIterations.delete(test.name);

        // Reset UI
        const iterControls = section.querySelector('.iteration-controls');
        const stopBtn = iterControls.querySelector('.stop-btn');
        const progressDiv = iterControls.querySelector('.iter-progress');
        const iterBtns = iterControls.querySelectorAll('.iter-btn:not(.stop-btn)');

        stopBtn.style.display = 'none';
        iterBtns.forEach(btn => btn.disabled = false);

        // Show iteration summary in progress div
        const allPassed = failed === 0;
        progressDiv.className = 'iter-progress ' + (allPassed ? 'iter-pass' : 'iter-fail');
        progressDiv.textContent = `${passed}/${total} passed`;

        // Add error details if any failures
        if (errors.length > 0 && errors.length <= 5) {
            const resultsDiv = section.querySelector('.test-results');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'iter-errors';
            errorDiv.innerHTML = `<strong>Failed iterations:</strong> ${errors.join(', ')}`;
            resultsDiv.appendChild(errorDiv);
        }
    }

    /**
     * Run test on SWCanvas
     */
    static runOnSWCanvas(test, canvas, iterationNumber = 1) {
        // Create SWCanvas from the canvas element
        const swCanvas = SWCanvas.createCanvas(canvas.width, canvas.height);
        const ctx = swCanvas.getContext('2d');
        ctx.canvas = swCanvas;

        // Reset slow path flag before drawing
        SWCanvas.Core.Context2D.resetSlowPathFlag();

        // Seed random for reproducibility - different seed per iteration
        SeededRandom.seedWithInteger(12345 + iterationNumber - 1);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Run the test draw function
        const result = test.drawFunction(ctx, iterationNumber, null);

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
    static runOnHTML5Canvas(test, canvas, iterationNumber = 1) {
        const ctx = canvas.getContext('2d');
        // Note: ctx.canvas is already set and readonly on native Canvas

        // Seed random with same seed for reproducibility - different seed per iteration
        SeededRandom.seedWithInteger(12345 + iterationNumber - 1);

        // Clear and white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Run the test draw function
        const result = test.drawFunction(ctx, iterationNumber, null);

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
            const passed = uniqueColors === checks.totalUniqueColors;
            results.push({
                name: 'Unique Colors',
                passed,
                details: `${uniqueColors} (expected exactly ${checks.totalUniqueColors})`
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
    static displayResults(section, test, slowPathUsed, allowSlowPath, checkResults, drawResult, iterationNumber = 1) {
        const resultsDiv = section.querySelector('.test-results');
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'block';

        // Show iteration number if not 1
        if (iterationNumber > 1) {
            const iterRow = document.createElement('div');
            iterRow.className = 'result-row iter-row';
            iterRow.innerHTML = `<span class="result-label">Iteration:</span><span class="result-value">#${iterationNumber}</span>`;
            resultsDiv.appendChild(iterRow);
        }

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
     * Flip the alternating view for a test
     */
    static flipView(testName) {
        const section = this.testElements.get(testName);
        if (!section) return;

        const currentState = this.flipStates.get(testName) || 'sw';
        const newState = currentState === 'sw' ? 'canvas' : 'sw';
        this.flipStates.set(testName, newState);

        this.updateFlipDisplay(testName);
    }

    /**
     * Update the flip display canvas
     */
    static updateFlipDisplay(testName) {
        const section = this.testElements.get(testName);
        if (!section) return;

        const state = this.flipStates.get(testName) || 'sw';
        const displayCanvas = section.querySelector('canvas[data-renderer="display"]');
        const swCanvas = section.querySelector('canvas[data-renderer="swcanvas"]');
        const html5Canvas = section.querySelector('canvas[data-renderer="html5"]');
        const displayAltLabel = section.querySelector('.display-label');
        const displayMagContainer = section.querySelector('.magnifier-label-container');

        if (!displayCanvas || !swCanvas || !html5Canvas) return;

        const displayCtx = displayCanvas.getContext('2d');
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

        if (state === 'sw') {
            displayCtx.drawImage(swCanvas, 0, 0);
            if (displayAltLabel) displayAltLabel.textContent = 'Alternating View (SW)';
        } else {
            displayCtx.drawImage(html5Canvas, 0, 0);
            if (displayAltLabel) displayAltLabel.textContent = 'Alternating View (Canvas)';
        }

        // Ensure alternating label is visible, magnifier is hidden
        if (displayAltLabel) displayAltLabel.style.display = 'block';
        if (displayMagContainer) displayMagContainer.style.display = 'none';
    }

    /**
     * Handle mouse move over source canvases for pixel inspection
     */
    static handleMouseMove(event, testName, sourceCanvas) {
        const section = this.testElements.get(testName);
        if (!section) return;

        // Get mouse position in canvas coordinates
        const rect = sourceCanvas.getBoundingClientRect();
        const x = Math.floor(event.clientX - rect.left);
        const y = Math.floor(event.clientY - rect.top);

        // Get canvas references
        const swCanvas = section.querySelector('canvas[data-renderer="swcanvas"]');
        const html5Canvas = section.querySelector('canvas[data-renderer="html5"]');
        const displayCanvas = section.querySelector('canvas[data-renderer="display"]');
        const displayAltLabel = section.querySelector('.display-label');
        const displayMagContainer = section.querySelector('.magnifier-label-container');

        if (!swCanvas || !html5Canvas || !displayCanvas) return;

        // Switch to magnifier view (labels)
        if (displayAltLabel) displayAltLabel.style.display = 'none';
        if (displayMagContainer) displayMagContainer.style.display = 'flex';

        // Clear display canvas
        const displayCtx = displayCanvas.getContext('2d');
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

        // Get image data from both canvases
        const swCtx = swCanvas.getContext('2d');
        const html5Ctx = html5Canvas.getContext('2d');

        const halfCols = Math.floor(this.GRID_COLUMNS / 2);
        const halfRows = Math.floor(this.GRID_ROWS / 2);

        const swImageData = swCtx.getImageData(
            Math.max(0, x - halfCols),
            Math.max(0, y - halfRows),
            this.GRID_COLUMNS,
            this.GRID_ROWS
        );

        const canvasImageData = html5Ctx.getImageData(
            Math.max(0, x - halfCols),
            Math.max(0, y - halfRows),
            this.GRID_COLUMNS,
            this.GRID_ROWS
        );

        // Calculate pixel size for magnified view
        const pixelSize = Math.min(
            (displayCanvas.width / 2) / this.GRID_COLUMNS,
            displayCanvas.height / this.GRID_ROWS
        );

        // Draw magnified grids
        this.drawMagnifiedGrid(displayCtx, swImageData, 0, pixelSize, x, y, swCanvas.width, swCanvas.height);
        this.drawMagnifiedGrid(displayCtx, canvasImageData, displayCanvas.width / 2, pixelSize, x, y, html5Canvas.width, html5Canvas.height);

        // Draw separator line
        this.drawSeparator(displayCtx, displayCanvas.width, displayCanvas.height);

        // Draw coordinates at top center
        displayCtx.font = '14px monospace';
        displayCtx.textAlign = 'center';
        displayCtx.fillStyle = 'black';
        displayCtx.fillText(`(${x}, ${y})`, displayCanvas.width / 2, 15);
    }

    /**
     * Draw a magnified pixel grid
     */
    static drawMagnifiedGrid(ctx, imageData, offsetX, pixelSize, mouseX, mouseY, canvasWidth, canvasHeight) {
        const halfCols = Math.floor(this.GRID_COLUMNS / 2);
        const halfRows = Math.floor(this.GRID_ROWS / 2);

        // Calculate source coordinates
        const sourceX = mouseX - halfCols;
        const sourceY = mouseY - halfRows;

        // Calculate read offsets for edge cases
        const readOffsetX = Math.max(0, -sourceX);
        const readOffsetY = Math.max(0, -sourceY);

        const gridTop = 20; // Offset for coordinates text at top

        // Draw each pixel
        for (let py = 0; py < this.GRID_ROWS; py++) {
            for (let px = 0; px < this.GRID_COLUMNS; px++) {
                const actualX = sourceX + px;
                const actualY = sourceY + py;

                const isOutOfBounds = actualX < 0 || actualY < 0 ||
                                      actualX >= canvasWidth || actualY >= canvasHeight;

                if (isOutOfBounds) {
                    ctx.fillStyle = 'rgb(128, 128, 128)'; // Grey for out-of-bounds
                } else {
                    const dataX = px - readOffsetX;
                    const dataY = py - readOffsetY;
                    const i = (dataY * this.GRID_COLUMNS + dataX) * 4;
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                }

                // Fill magnified pixel
                ctx.fillRect(
                    offsetX + px * pixelSize,
                    py * pixelSize + gridTop,
                    pixelSize,
                    pixelSize
                );

                // Draw grid lines
                ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    offsetX + px * pixelSize,
                    py * pixelSize + gridTop,
                    pixelSize,
                    pixelSize
                );
            }
        }

        // Draw red crosshair at center
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        const centerPxX = offsetX + halfCols * pixelSize + pixelSize / 2;
        const gridBottom = gridTop + this.GRID_ROWS * pixelSize;

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(centerPxX, gridTop);
        ctx.lineTo(centerPxX, gridBottom);
        ctx.stroke();

        // Horizontal line
        const centerPxY = gridTop + halfRows * pixelSize + pixelSize / 2;
        ctx.beginPath();
        ctx.moveTo(offsetX, centerPxY);
        ctx.lineTo(offsetX + this.GRID_COLUMNS * pixelSize, centerPxY);
        ctx.stroke();

        // Display center pixel RGBA below grid
        const centerIdx = (halfRows * this.GRID_COLUMNS + halfCols) * 4;
        const r = imageData.data[centerIdx];
        const g = imageData.data[centerIdx + 1];
        const b = imageData.data[centerIdx + 2];
        const a = imageData.data[centerIdx + 3];

        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        const textX = offsetX + (this.GRID_COLUMNS * pixelSize) / 2;
        const textY = gridBottom + 15;
        ctx.fillText(`rgba(${r},${g},${b},${a})`, textX, textY);
    }

    /**
     * Draw separator line between the two grids
     */
    static drawSeparator(ctx, width, height) {
        const centerX = width / 2;

        // Main separator line
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        // White highlights on sides
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(centerX - 2, 0);
        ctx.lineTo(centerX - 2, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 2, 0);
        ctx.lineTo(centerX + 2, height);
        ctx.stroke();
    }

    /**
     * Handle mouse out from source canvases
     */
    static handleMouseOut(testName) {
        // Restore alternating view
        this.updateFlipDisplay(testName);
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

    /**
     * Run all tests for multiple iterations
     */
    static runAllIterations(iterCount) {
        // Stop any existing run
        this.stopAllIterations();

        // Get UI elements
        const controls = document.getElementById('controls');
        const stopBtn = document.getElementById('stop-all-btn');
        const progressDiv = document.getElementById('global-progress');
        const iterBtns = controls.querySelectorAll('.iter-btn:not(.stop-btn)');

        // Show progress, disable other buttons
        stopBtn.style.display = 'inline-block';
        progressDiv.style.display = 'inline-block';
        iterBtns.forEach(btn => btn.disabled = true);

        const totalTests = HIGH_LEVEL_TESTS.length;
        let currentTest = 0;
        let currentIter = 0;
        let totalPassed = 0;
        let totalFailed = 0;

        // Reset all sections
        this.results = { passed: 0, failed: 0 };
        this.testElements.forEach(section => {
            section.dataset.hasRun = 'false';
        });

        this.globalRunState = {
            running: true,
            iterCount,
            totalTests,
            currentTest,
            currentIter
        };

        const runFrame = () => {
            if (!this.globalRunState.running) {
                this.finishAllIterations(totalPassed, totalFailed, iterCount);
                return;
            }

            // Update progress
            const totalOps = totalTests * iterCount;
            const currentOp = currentTest * iterCount + currentIter + 1;
            progressDiv.textContent = `Test ${currentTest + 1}/${totalTests}, Iter ${currentIter + 1}/${iterCount} (${currentOp}/${totalOps})`;

            // Run current test iteration
            const test = HIGH_LEVEL_TESTS[currentTest];
            const passed = this.runTest(test, currentIter + 1);
            if (passed) {
                totalPassed++;
            } else {
                totalFailed++;
            }

            // Move to next
            currentIter++;
            if (currentIter >= iterCount) {
                currentIter = 0;
                currentTest++;
            }

            // Check if done
            if (currentTest >= totalTests) {
                this.finishAllIterations(totalPassed, totalFailed, iterCount);
                return;
            }

            this.globalRunState.currentTest = currentTest;
            this.globalRunState.currentIter = currentIter;

            // Schedule next frame
            requestAnimationFrame(runFrame);
        };

        // Start running
        requestAnimationFrame(runFrame);
    }

    /**
     * Stop all iterations
     */
    static stopAllIterations() {
        if (this.globalRunState) {
            this.globalRunState.running = false;
        }
        // Also stop individual test iterations
        HIGH_LEVEL_TESTS.forEach(test => {
            this.stopIterations(test);
        });
    }

    /**
     * Finish all iterations and show summary
     */
    static finishAllIterations(totalPassed, totalFailed, iterCount) {
        this.globalRunState = null;

        // Reset UI
        const controls = document.getElementById('controls');
        const stopBtn = document.getElementById('stop-all-btn');
        const progressDiv = document.getElementById('global-progress');
        const iterBtns = controls.querySelectorAll('.iter-btn:not(.stop-btn)');

        stopBtn.style.display = 'none';
        iterBtns.forEach(btn => btn.disabled = false);

        // Show final summary
        const total = totalPassed + totalFailed;
        const allPassed = totalFailed === 0;
        progressDiv.className = 'global-progress ' + (allPassed ? 'iter-pass' : 'iter-fail');
        progressDiv.textContent = `${totalPassed}/${total} passed (${HIGH_LEVEL_TESTS.length} tests × ${iterCount} iterations)`;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.HighLevelTestRunner = HighLevelTestRunner;
}
