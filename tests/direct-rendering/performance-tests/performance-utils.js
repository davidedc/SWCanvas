// Performance testing utilities for SWCanvas Direct Rendering

// Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
let FRAME_BUDGET = 16.7; // Default milliseconds (60fps), will be updated after detection
let DETECTED_FPS = 60; // Default, will be updated after detection
const STARTING_SHAPE_COUNT = 10;

// Set up test state
let currentTest = null;
let abortRequested = false;
let animationFrameId = null;
let refreshRateDetected = false;

// Blit SWCanvas content to the visible display canvas
function blitSwCanvasToDisplay() {
  const displayCanvas = swCtx._displayCanvas;
  if (!displayCanvas) return;

  const visibleCtx = displayCanvas.getContext('2d');
  const swImageData = swCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Create a native browser ImageData from SWCanvas data
  const nativeImageData = visibleCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
  nativeImageData.data.set(swImageData.data);
  visibleCtx.putImageData(nativeImageData, 0, 0);
}

// Detect display refresh rate and update frame budget
function detectRefreshRate(callback) {
  let times = [];
  let lastTime = performance.now();
  let frameCount = 0;

  // Standard refresh rates in Hz
  const STANDARD_REFRESH_RATES = [60, 75, 90, 120, 144, 165, 240, 360, 500];

  // Helper function to find closest standard refresh rate
  function findClosestRefreshRate(detectedFPS) {
    let closestRate = STANDARD_REFRESH_RATES[0];
    let minDifference = Math.abs(detectedFPS - closestRate);

    for (let i = 1; i < STANDARD_REFRESH_RATES.length; i++) {
      const currentDifference = Math.abs(detectedFPS - STANDARD_REFRESH_RATES[i]);
      if (currentDifference < minDifference) {
        closestRate = STANDARD_REFRESH_RATES[i];
        minDifference = currentDifference;
      }
    }

    return closestRate;
  }

  function measureFrames(timestamp) {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (frameCount > 0) {
      times.push(deltaTime);
    }

    frameCount++;

    if (frameCount <= 20) {
      requestAnimationFrame(measureFrames);
    } else {
      times.sort((a, b) => a - b);
      const startIdx = Math.floor(times.length * 0.2);
      const endIdx = Math.ceil(times.length * 0.8);
      const reliableTimes = times.slice(startIdx, endIdx);

      const avgFrameTime = reliableTimes.reduce((sum, time) => sum + time, 0) / reliableTimes.length;
      const rawDetectedFPS = Math.round(1000 / avgFrameTime);
      const closestStandardFPS = findClosestRefreshRate(rawDetectedFPS);

      window.RAW_DETECTED_FPS = rawDetectedFPS;
      DETECTED_FPS = closestStandardFPS;
      FRAME_BUDGET = 1000 / closestStandardFPS;
      refreshRateDetected = true;

      document.getElementById('detected-fps').textContent = `${DETECTED_FPS} (raw: ${RAW_DETECTED_FPS})`;
      document.getElementById('frame-budget').textContent = FRAME_BUDGET.toFixed(2);

      if (callback) callback();
    }
  }

  requestAnimationFrame(measureFrames);
}

// Helper function to log results based on quiet mode
function logResult(message) {
  if (!quietModeCheckbox.checked) {
    resultsContainer.innerHTML += message;
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }
}

// Find the maximum number of shapes that stayed within the frame budget
function findMaxShapes(shapeCounts, timings) {
  if (shapeCounts.length === 0) {
    return 0;
  }
  return shapeCounts[shapeCounts.length - 1];
}

// SWCanvas Ramp Test
function runSWCanvasRampTest(testType, startCount, incrementSize, includeBlitting, requiredExceedances, testData, callback) {
  let currentShapeCount = startCount;
  let exceededBudget = false;
  let totalPhaseSteps = 1000;
  let currentPhaseStep = 0;
  let consecutiveExceedances = 0;
  let lastLoggedShapeCount = 0;
  const isQuietMode = testData.isQuietMode;

  resultsContainer.innerHTML += "PHASE 1: Testing SWCanvas...\n";
  if (isQuietMode) {
    resultsContainer.innerHTML += "(Running in quieter mode, suppressing frame-by-frame logs)\n";
  }
  resultsContainer.scrollTop = resultsContainer.scrollHeight;

  function testNextShapeCount() {
    if (abortRequested || exceededBudget) {
      testData.swMaxShapes = findMaxShapes(testData.swShapeCounts, testData.swTimings);
      resultsContainer.innerHTML += `SWCanvas Maximum Shapes: ${testData.swMaxShapes}\n`;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      callback();
      return;
    }

    currentPhaseStep++;
    const progress = Math.min(100, Math.round((currentPhaseStep / totalPhaseSteps) * 50));
    currentTestProgressBar.style.width = `${progress}%`;
    currentTestProgressBar.textContent = `${progress}%`;

    if (progress > 0) {
      currentTestProgressBar.style.color = 'white';
    }

    // Clear and redraw on SWCanvas
    swCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Seed random for consistent shapes
    SeededRandom.seedWithInteger(currentPhaseStep);

    let startTime = performance.now();

    // Draw shapes using the test function
    testType.drawFunction(swCtx, 0, currentShapeCount);

    // Include blitting time if requested
    if (includeBlitting) {
      blitSwCanvasToDisplay();
    }

    let endTime = performance.now();
    let elapsedTime = endTime - startTime;

    // Always blit for visual feedback (if not already done above)
    if (!includeBlitting) {
      blitSwCanvasToDisplay();
    }

    testData.swShapeCounts.push(currentShapeCount);
    testData.swTimings.push(elapsedTime);

    if (!isQuietMode || (isQuietMode && (currentShapeCount - lastLoggedShapeCount >= 100) && consecutiveExceedances === 0)) {
      resultsContainer.innerHTML += `SWCanvas with ${currentShapeCount} shapes: ${elapsedTime.toFixed(2)}ms\n`;
      lastLoggedShapeCount = currentShapeCount;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    if (elapsedTime > FRAME_BUDGET) {
      consecutiveExceedances++;

      if (!isQuietMode || consecutiveExceedances === 1 || consecutiveExceedances === requiredExceedances) {
        if (isQuietMode) {
          resultsContainer.innerHTML += `SWCanvas with ${currentShapeCount} shapes: ${elapsedTime.toFixed(2)}ms\n`;
        }
        resultsContainer.innerHTML += `  Exceeded budget (${consecutiveExceedances}/${requiredExceedances})\n`;
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
      }

      if (consecutiveExceedances >= requiredExceedances) {
        exceededBudget = true;
      }
    } else {
      consecutiveExceedances = 0;
      currentShapeCount += incrementSize;
    }

    animationFrameId = requestAnimationFrame(testNextShapeCount);
  }

  testNextShapeCount();
}

// HTML5 Canvas Ramp Test
function runHTML5CanvasRampTest(testType, startCount, incrementSize, requiredExceedances, testData, callback) {
  let currentShapeCount = startCount;
  let exceededBudget = false;
  let totalPhaseSteps = 1000;
  let currentPhaseStep = 0;
  let consecutiveExceedances = 0;
  let lastLoggedShapeCount = 0;
  const isQuietMode = testData.isQuietMode;

  resultsContainer.innerHTML += "\nPHASE 2: Testing HTML5 Canvas...\n";
  if (isQuietMode) {
    resultsContainer.innerHTML += "(Running in quieter mode, suppressing frame-by-frame logs)\n";
  }
  resultsContainer.scrollTop = resultsContainer.scrollHeight;

  function testNextShapeCount() {
    if (abortRequested || exceededBudget) {
      testData.canvasMaxShapes = findMaxShapes(testData.canvasShapeCounts, testData.canvasTimings);
      resultsContainer.innerHTML += `HTML5 Canvas Maximum Shapes: ${testData.canvasMaxShapes}\n`;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      callback();
      return;
    }

    currentPhaseStep++;
    const progress = Math.min(100, 50 + Math.round((currentPhaseStep / totalPhaseSteps) * 50));
    currentTestProgressBar.style.width = `${progress}%`;
    currentTestProgressBar.textContent = `${progress}%`;

    if (progress > 0) {
      currentTestProgressBar.style.color = 'white';
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    SeededRandom.seedWithInteger(currentPhaseStep);

    let startTime = performance.now();

    testType.drawFunction(ctx, 0, currentShapeCount);

    let endTime = performance.now();
    let elapsedTime = endTime - startTime;

    testData.canvasShapeCounts.push(currentShapeCount);
    testData.canvasTimings.push(elapsedTime);

    if (!isQuietMode || (isQuietMode && (currentShapeCount - lastLoggedShapeCount >= 1000) && consecutiveExceedances === 0)) {
      resultsContainer.innerHTML += `HTML5 Canvas with ${currentShapeCount} shapes: ${elapsedTime.toFixed(2)}ms\n`;
      lastLoggedShapeCount = currentShapeCount;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    if (elapsedTime > FRAME_BUDGET) {
      consecutiveExceedances++;

      if (!isQuietMode || consecutiveExceedances === 1 || consecutiveExceedances === requiredExceedances) {
        if (isQuietMode) {
          resultsContainer.innerHTML += `HTML5 Canvas with ${currentShapeCount} shapes: ${elapsedTime.toFixed(2)}ms\n`;
        }
        resultsContainer.innerHTML += `  Exceeded budget (${consecutiveExceedances}/${requiredExceedances})\n`;
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
      }

      if (consecutiveExceedances >= requiredExceedances) {
        exceededBudget = true;
      }
    } else {
      consecutiveExceedances = 0;
      currentShapeCount += incrementSize;
    }

    animationFrameId = requestAnimationFrame(testNextShapeCount);
  }

  testNextShapeCount();
}

// Results display functions
function displayRampTestResults(testData) {
  let results = "";
  results += `\n=== ${testData.testDisplayName.toUpperCase()} TEST RESULTS ===\n`;
  if (testData.numRuns && testData.numRuns > 1) {
      results += `(Averaged over ${testData.numRuns} runs)\n`;
  }
  results += `Test Parameters:\n`;
  results += `- Display refresh rate: ${DETECTED_FPS} fps (standard rate, raw detected: ${window.RAW_DETECTED_FPS || DETECTED_FPS} fps)\n`;
  results += `- Frame budget: ${FRAME_BUDGET.toFixed(2)}ms\n`;
  results += `- SW Canvas start count: ${testData.swStartCount}\n`;
  results += `- SW Canvas increment: ${testData.swIncrement}\n`;
  results += `- HTML5 Canvas start count: ${testData.htmlStartCount}\n`;
  results += `- HTML5 Canvas increment: ${testData.htmlIncrement}\n`;
  results += `- Consecutive exceedances required: ${testData.requiredExceedances}\n`;
  results += `- Blitting time: ${testData.includeBlitting ? "Included" : "Excluded"}\n`;
  if (testData.isQuietMode) {
    results += `- Log mode: Quieter (frame-by-frame logs suppressed)\n`;
  } else {
    results += `- Log mode: Verbose (all frames logged)\n`;
  }
  results += `\n`;

  results += `SWCanvas Performance:\n`;
  results += `- Maximum shapes per frame: ${testData.swMaxShapes}\n\n`;

  results += `HTML5 Canvas Performance:\n`;
  results += `- Maximum shapes per frame: ${testData.canvasMaxShapes}\n\n`;

  results += `Performance Ratio (HTML5 / SWCanvas): ${testData.ratio.toFixed(2)}x`;

  if (testData.numRuns && testData.numRuns > 1 && testData.individualRatios && testData.individualRatios.length > 0) {
    const individualRatiosFormatted = testData.individualRatios.map(r => isNaN(r) ? 'NaN' : r.toFixed(2)).join(', ');
    results += ` (average of: ${individualRatiosFormatted})`;
  }
  results += `\n`;

  results += `HTML5 canvas can render ${testData.ratio.toFixed(2)}x ${testData.ratio > 1 ? "more" : "fewer"} shapes than SWCanvas within frame budget.\n\n`;

  resultsContainer.innerHTML += results;
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

function displayOverallResults(allResults) {
  const avgSwMaxShapes = calculateAverage(allResults.swMaxShapes);
  const avgCanvasMaxShapes = calculateAverage(allResults.canvasMaxShapes);
  const avgRatio = calculateAverage(allResults.ratios);

  let results = "\n=== OVERALL TEST RESULTS ===\n";
  results += `Display refresh rate: ${DETECTED_FPS} fps (standard rate, raw detected: ${window.RAW_DETECTED_FPS || DETECTED_FPS} fps)\n`;
  results += `Frame budget: ${FRAME_BUDGET.toFixed(2)}ms\n`;
  results += `Tests run: ${allResults.tests.length}\n`;
  results += `Log mode: ${quietModeCheckbox.checked ? "Quiet" : "Verbose"}\n\n`;

  results += "Test Summary:\n";
  for (let i = 0; i < allResults.tests.length; i++) {
    results += `- ${allResults.tests[i].toUpperCase()}: SWCanvas ${allResults.swMaxShapes[i]} shapes, HTML5 Canvas ${allResults.canvasMaxShapes[i]} shapes, Ratio ${allResults.ratios[i].toFixed(2)}x\n`;
  }
  results += "\n";

  results += "Average Performance Across All Tests:\n";
  results += `- SWCanvas: ${Math.round(avgSwMaxShapes)} shapes/frame\n`;
  results += `- HTML5 Canvas: ${Math.round(avgCanvasMaxShapes)} shapes/frame\n`;
  results += `- Average Ratio: ${avgRatio.toFixed(2)}x\n`;
  results += `HTML5 canvas can render on average ${avgRatio.toFixed(2)}x ${avgRatio > 1 ? "more" : "fewer"} shapes than SWCanvas within frame budget.\n\n`;

  resultsContainer.innerHTML += results;
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

// Simple chart generation function
function generatePerformanceChart(testData) {
  chartContainer.innerHTML = '';

  const chartCanvas = document.createElement('canvas');
  chartCanvas.width = chartContainer.clientWidth - 20;
  chartCanvas.height = chartContainer.clientHeight - 20;
  chartContainer.appendChild(chartCanvas);

  const chartCtx = chartCanvas.getContext('2d');

  const chartPadding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartWidth = chartCanvas.width - chartPadding.left - chartPadding.right;
  const chartHeight = chartCanvas.height - chartPadding.top - chartPadding.bottom;

  const maxShapeCount = Math.max(
    ...testData.swShapeCounts,
    ...testData.canvasShapeCounts
  );

  const maxTime = Math.max(
    ...testData.swTimings,
    ...testData.canvasTimings,
    FRAME_BUDGET * 1.5
  );

  // Draw chart background
  chartCtx.fillStyle = '#f8f8f8';
  chartCtx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);

  // Draw frame budget line
  const budgetY = chartPadding.top + chartHeight - (FRAME_BUDGET / maxTime) * chartHeight;

  chartCtx.beginPath();
  chartCtx.moveTo(chartPadding.left, budgetY);
  chartCtx.lineTo(chartPadding.left + chartWidth, budgetY);
  chartCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  chartCtx.lineWidth = 2;
  chartCtx.setLineDash([5, 5]);
  chartCtx.stroke();
  chartCtx.setLineDash([]);

  chartCtx.fillStyle = 'rgba(255, 0, 0, 0.9)';
  chartCtx.font = '12px Arial';
  chartCtx.textAlign = 'right';
  const rawFpsDisplay = window.RAW_DETECTED_FPS ? `, raw: ${window.RAW_DETECTED_FPS}fps` : '';
  chartCtx.fillText(`Frame Budget (${FRAME_BUDGET.toFixed(2)}ms @ ${DETECTED_FPS}fps${rawFpsDisplay})`, chartPadding.left + chartWidth - 10, budgetY - 5);

  // Draw axes
  chartCtx.beginPath();
  chartCtx.moveTo(chartPadding.left, chartPadding.top);
  chartCtx.lineTo(chartPadding.left, chartPadding.top + chartHeight);
  chartCtx.lineTo(chartPadding.left + chartWidth, chartPadding.top + chartHeight);
  chartCtx.strokeStyle = '#333';
  chartCtx.lineWidth = 2;
  chartCtx.stroke();

  // Draw axis labels
  chartCtx.fillStyle = '#333';
  chartCtx.font = '14px Arial';
  chartCtx.textAlign = 'center';
  chartCtx.fillText('Number of Shapes', chartPadding.left + chartWidth / 2, chartPadding.top + chartHeight + 30);

  chartCtx.save();
  chartCtx.translate(15, chartPadding.top + chartHeight / 2);
  chartCtx.rotate(-Math.PI / 2);
  chartCtx.textAlign = 'center';
  chartCtx.fillText('Render Time (ms)', 0, 0);
  chartCtx.restore();

  // Draw title
  chartCtx.font = '16px Arial';
  chartCtx.textAlign = 'center';
  const chartTitle = testData.numRuns && testData.numRuns > 1
      ? `${testData.testDisplayName} Test: Render Time vs. Shape Count (Last Run Data)`
      : `${testData.testDisplayName} Test: Render Time vs. Shape Count`;
  chartCtx.fillText(chartTitle, chartPadding.left + chartWidth / 2, 20);

  // Draw SWCanvas data points
  drawChartLine(
    chartCtx,
    testData.swShapeCounts,
    testData.swTimings,
    maxShapeCount,
    maxTime,
    chartPadding,
    chartWidth,
    chartHeight,
    'rgba(0, 0, 255, 0.8)',
    'SWCanvas'
  );

  // Draw HTML5 Canvas data points
  drawChartLine(
    chartCtx,
    testData.canvasShapeCounts,
    testData.canvasTimings,
    maxShapeCount,
    maxTime,
    chartPadding,
    chartWidth,
    chartHeight,
    'rgba(0, 128, 0, 0.8)',
    'HTML5 Canvas'
  );

  // Draw legend
  const legendY = chartPadding.top + 20;

  chartCtx.fillStyle = 'rgba(0, 0, 255, 0.8)';
  chartCtx.fillRect(chartPadding.left + 10, legendY, 20, 10);
  chartCtx.fillStyle = '#333';
  chartCtx.textAlign = 'left';
  chartCtx.fillText('SWCanvas', chartPadding.left + 40, legendY + 9);

  chartCtx.fillStyle = 'rgba(0, 128, 0, 0.8)';
  chartCtx.fillRect(chartPadding.left + 130, legendY, 20, 10);
  chartCtx.fillStyle = '#333';
  chartCtx.fillText('HTML5 Canvas', chartPadding.left + 160, legendY + 9);
}

function drawChartLine(ctx, xValues, yValues, maxX, maxY, padding, width, height, color, label) {
  if (xValues.length < 2) return;

  ctx.beginPath();

  for (let i = 0; i < xValues.length; i++) {
    const x = padding.left + (xValues[i] / maxX) * width;
    const y = padding.top + height - (yValues[i] / maxY) * height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    ctx.fillStyle = color;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Utility functions
function calculateAverage(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values, avg) {
  if (values.length <= 1) return 0;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Canvas visibility management functions
function showSwCanvas() {
  document.getElementById("sw-canvas-container").style.display = "block";
  document.getElementById("html5-canvas-container").style.display = "none";
  document.getElementById("canvas-label").textContent = "SWCanvas";
}

function showHtml5Canvas() {
  document.getElementById("sw-canvas-container").style.display = "none";
  document.getElementById("html5-canvas-container").style.display = "block";
  document.getElementById("canvas-label").textContent = "HTML5 Canvas";
}

function hideAllCanvases() {
  document.getElementById("sw-canvas-container").style.display = "none";
  document.getElementById("html5-canvas-container").style.display = "none";
  document.getElementById("canvas-label").textContent = "Graphics will be shown here when tests start";
}
