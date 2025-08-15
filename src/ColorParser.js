/**
 * ColorParser for SWCanvas
 * 
 * Parses CSS color strings into RGBA values for use with Core API.
 * Supports hex, RGB/RGBA functions, and named colors.
 * Includes caching for performance optimization.
 */
class ColorParser {
    constructor() {
        this._cache = new Map();
        
        // CSS Color names to RGB mapping
        this._namedColors = {
            // Basic colors
            black: { r: 0, g: 0, b: 0 },
            white: { r: 255, g: 255, b: 255 },
            red: { r: 255, g: 0, b: 0 },
            green: { r: 0, g: 128, b: 0 },
            blue: { r: 0, g: 0, b: 255 },
            yellow: { r: 255, g: 255, b: 0 },
            magenta: { r: 255, g: 0, b: 255 },
            cyan: { r: 0, g: 255, b: 255 },
            
            // Extended colors
            lime: { r: 0, g: 255, b: 0 },
            orange: { r: 255, g: 165, b: 0 },
            pink: { r: 255, g: 192, b: 203 },
            purple: { r: 128, g: 0, b: 128 },
            brown: { r: 165, g: 42, b: 42 },
            gray: { r: 128, g: 128, b: 128 },
            grey: { r: 128, g: 128, b: 128 },
            
            // Light/dark variants
            lightblue: { r: 173, g: 216, b: 230 },
            lightgreen: { r: 144, g: 238, b: 144 },
            lightcyan: { r: 224, g: 255, b: 255 },
            lightgray: { r: 211, g: 211, b: 211 },
            lightgrey: { r: 211, g: 211, b: 211 },
            darkblue: { r: 0, g: 0, b: 139 },
            darkgreen: { r: 0, g: 100, b: 0 },
            
            // Additional common colors
            navy: { r: 0, g: 0, b: 128 },
            maroon: { r: 128, g: 0, b: 0 },
            gold: { r: 255, g: 215, b: 0 },
            silver: { r: 192, g: 192, b: 192 },
            lightcoral: { r: 240, g: 128, b: 128 },
            indigo: { r: 75, g: 0, b: 130 }
        };
    }
    
    /**
     * Parse a CSS color string to RGBA values
     * @param {string} color - CSS color string
     * @returns {Object} {r, g, b, a} with values 0-255
     */
    parse(color) {
        // Check cache first
        if (this._cache.has(color)) {
            return this._cache.get(color);
        }
        
        let result;
        
        if (typeof color !== 'string') {
            result = { r: 0, g: 0, b: 0, a: 255 };
        } else {
            const trimmed = color.trim().toLowerCase();
            
            if (trimmed.startsWith('#')) {
                result = this._parseHex(trimmed);
            } else if (trimmed.startsWith('rgb')) {
                result = this._parseRGB(trimmed);
            } else if (this._namedColors[trimmed]) {
                const named = this._namedColors[trimmed];
                result = { r: named.r, g: named.g, b: named.b, a: 255 };
            } else {
                // Unknown color - default to black
                result = { r: 0, g: 0, b: 0, a: 255 };
            }
        }
        
        // Cache the result
        this._cache.set(color, result);
        return result;
    }
    
    /**
     * Parse hex color (#RGB, #RRGGBB, #RRGGBBAA)
     * @private
     */
    _parseHex(hex) {
        // Remove the #
        hex = hex.substring(1);
        
        if (hex.length === 3) {
            // #RGB -> #RRGGBB
            hex = hex.split('').map(c => c + c).join('');
        }
        
        if (hex.length === 6) {
            // #RRGGBB
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return { r, g, b, a: 255 };
        } else if (hex.length === 8) {
            // #RRGGBBAA
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const a = parseInt(hex.substring(6, 8), 16);
            return { r, g, b, a };
        }
        
        // Invalid hex - default to black
        return { r: 0, g: 0, b: 0, a: 255 };
    }
    
    /**
     * Parse RGB/RGBA function notation
     * @private
     */
    _parseRGB(rgb) {
        // Extract the content inside parentheses
        const match = rgb.match(/rgba?\s*\(\s*([^)]+)\s*\)/);
        if (!match) {
            return { r: 0, g: 0, b: 0, a: 255 };
        }
        
        const parts = match[1].split(',').map(s => s.trim());
        
        if (parts.length < 3) {
            return { r: 0, g: 0, b: 0, a: 255 };
        }
        
        const r = Math.max(0, Math.min(255, parseInt(parts[0]) || 0));
        const g = Math.max(0, Math.min(255, parseInt(parts[1]) || 0));
        const b = Math.max(0, Math.min(255, parseInt(parts[2]) || 0));
        
        let a = 255;
        if (parts.length >= 4) {
            const alpha = parseFloat(parts[3]);
            if (!isNaN(alpha)) {
                a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
            }
        }
        
        return { r, g, b, a };
    }
    
    /**
     * Clear the color cache
     */
    clearCache() {
        this._cache.clear();
    }
}