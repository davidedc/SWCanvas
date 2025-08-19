// Test: Surface creation with too large dimensions throws
// This file will be concatenated into the main test suite

test('Surface creation with too large dimensions throws', () => {
    assertThrows(() => SWCanvas.Core.Surface(20000, 20000), 'SurfaceTooLarge');
});