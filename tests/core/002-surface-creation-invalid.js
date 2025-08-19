// Test: Surface creation with invalid dimensions throws
// This file will be concatenated into the main test suite

test('Surface creation with invalid dimensions throws', () => {
    assertThrows(() => SWCanvas.Core.Surface(0, 100), 'positive');
    assertThrows(() => SWCanvas.Core.Surface(100, 0), 'positive');
    assertThrows(() => SWCanvas.Core.Surface(-10, 100), 'positive');
});