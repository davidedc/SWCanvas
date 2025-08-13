// Shared color definitions for visual tests
// This ensures HTML5 Canvas CSS colors match SWCanvas RGB values exactly

(function(global) {
    'use strict';

    // Standard CSS colors mapped to their exact RGB values
    const TestColors = {
        // Basic colors
        red: { r: 255, g: 0, b: 0, css: '#FF0000' },
        green: { r: 0, g: 128, b: 0, css: '#008000' },
        blue: { r: 0, g: 0, b: 255, css: '#0000FF' },
        white: { r: 255, g: 255, b: 255, css: '#FFFFFF' },
        black: { r: 0, g: 0, b: 0, css: '#000000' },
        
        // Extended colors
        yellow: { r: 255, g: 255, b: 0, css: '#FFFF00' },
        magenta: { r: 255, g: 0, b: 255, css: '#FF00FF' },
        cyan: { r: 0, g: 255, b: 255, css: '#00FFFF' },
        
        // Light/dark variants
        lightblue: { r: 173, g: 216, b: 230, css: '#ADD8E6' },
        lightgreen: { r: 144, g: 238, b: 144, css: '#90EE90' },
        lightcyan: { r: 224, g: 255, b: 255, css: '#E0FFFF' },
        lightgray: { r: 211, g: 211, b: 211, css: '#D3D3D3' },
        lime: { r: 0, g: 255, b: 0, css: '#00FF00' },
        
        // Common web colors
        orange: { r: 255, g: 165, b: 0, css: '#FFA500' },
        pink: { r: 255, g: 192, b: 203, css: '#FFC0CB' },
        purple: { r: 128, g: 0, b: 128, css: '#800080' },
        brown: { r: 165, g: 42, b: 42, css: '#A52A2A' },
        gray: { r: 128, g: 128, b: 128, css: '#808080' },
        grey: { r: 128, g: 128, b: 128, css: '#808080' },
        
        // Additional commonly used colors
        navy: { r: 0, g: 0, b: 128, css: '#000080' },
        maroon: { r: 128, g: 0, b: 0, css: '#800000' },
        darkblue: { r: 0, g: 0, b: 139, css: '#00008B' },
        darkgreen: { r: 0, g: 100, b: 0, css: '#006400' },
        gold: { r: 255, g: 215, b: 0, css: '#FFD700' },
        silver: { r: 192, g: 192, b: 192, css: '#C0C0C0' },
        lightcoral: { r: 240, g: 128, b: 128, css: '#F08080' },
        indigo: { r: 75, g: 0, b: 130, css: '#4B0082' },
        
        // Custom test colors (for cases where we need specific values)
        testLightBlue: { r: 0, g: 128, b: 255, css: '#0080FF' },
        testDarkGreen: { r: 0, g: 100, b: 0, css: '#006400' }
    };

    // Helper functions for different contexts
    const ColorHelpers = {
        // Set fill style for SWCanvas context
        setSWCanvasFill: function(ctx, colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            ctx.setFillStyle(color.r, color.g, color.b, 255);
        },
        
        // Set fill style for HTML5 Canvas context
        setHTML5CanvasFill: function(ctx, colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            ctx.fillStyle = color.css;
        },
        
        // Set stroke style for SWCanvas context
        setSWCanvasStroke: function(ctx, colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            ctx.setStrokeStyle(color.r, color.g, color.b, 255);
        },
        
        // Set stroke style for HTML5 Canvas context  
        setHTML5CanvasStroke: function(ctx, colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            ctx.strokeStyle = color.css;
        },
        
        // Get RGB values
        getRGB: function(colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            return { r: color.r, g: color.g, b: color.b };
        },
        
        // Get CSS color string
        getCSS: function(colorName) {
            const color = TestColors[colorName];
            if (!color) throw new Error(`Unknown color: ${colorName}`);
            return color.css;
        }
    };

    // Export the color system
    const TestColorSystem = {
        colors: TestColors,
        helpers: ColorHelpers
    };

    // Universal module definition (UMD) pattern
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js
        module.exports = TestColorSystem;
    } else {
        // Browser
        global.TestColorSystem = TestColorSystem;
    }

})(typeof window !== 'undefined' ? window : global);