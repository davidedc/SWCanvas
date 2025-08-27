#!/usr/bin/env node

/**
 * Automated Test Count Update Script
 * 
 * Updates test count references throughout all documentation files to match
 * the actual number of test files in the codebase.
 * 
 * This script:
 * 1. Counts actual test files in /tests/core/ and /tests/visual/
 * 2. Updates all documentation files with correct counts
 * 3. Maintains consistency across README.md, tests/README.md, CLAUDE.md
 * 
 * Usage:
 *   node tests/build/update-test-counts.js
 *   npm run update-test-counts  (if npm script is configured)
 */

const fs = require('fs');
const path = require('path');

class TestCountUpdater {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.testDirs = {
            core: path.join(this.projectRoot, 'tests/core'),
            visual: path.join(this.projectRoot, 'tests/visual')
        };
        this.docFiles = [
            'README.md',
            'CLAUDE.md', 
            'tests/README.md'
        ];
        this.counts = { core: 0, visual: 0 };
    }

    /**
     * Count test files in a directory
     * @param {string} dir - Directory to count files in
     * @returns {number} Number of test files
     */
    countTestFiles(dir) {
        if (!fs.existsSync(dir)) {
            console.warn(`Directory ${dir} does not exist`);
            return 0;
        }

        const files = fs.readdirSync(dir)
            .filter(file => file.endsWith('.js') && /^\d{3}-/.test(file))
            .length;

        console.log(`Found ${files} test files in ${path.basename(dir)}/`);
        return files;
    }

    /**
     * Get current test counts from filesystem
     */
    getCurrentCounts() {
        this.counts.core = this.countTestFiles(this.testDirs.core);
        this.counts.visual = this.countTestFiles(this.testDirs.visual);
        
        console.log(`\nCurrent test counts:`);
        console.log(`- Core tests: ${this.counts.core}`);
        console.log(`- Visual tests: ${this.counts.visual}`);
        console.log(`- Total: ${this.counts.core + this.counts.visual}`);
    }

    /**
     * Update test count references in a file
     * @param {string} filePath - Path to the documentation file
     */
    updateDocumentationFile(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.warn(`Documentation file ${filePath} does not exist`);
            return false;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        let updated = false;

        // Patterns to match and replace
        const patterns = [
            // "X core tests + Y visual tests" pattern
            {
                regex: /\b\d+\s+core\s+tests?\s*\+\s*\d+\s+visual\s+tests?/gi,
                replacement: `${this.counts.core} core tests + ${this.counts.visual} visual tests`
            },
            // "X individual core test files" pattern
            {
                regex: /\b\d+\s+individual\s+core\s+test\s+files?/gi,
                replacement: `${this.counts.core} individual core test files`
            },
            // "X individual visual test files" pattern  
            {
                regex: /\b\d+\s+individual\s+visual\s+test\s+files?/gi,
                replacement: `${this.counts.visual} individual visual test files`
            },
            // "X modular core functionality tests" pattern
            {
                regex: /\b\d+\s+modular\s+core\s+functionality\s+tests?/gi,
                replacement: `${this.counts.core} modular core functionality tests`
            },
            // "X visual rendering tests" pattern
            {
                regex: /\b\d+\s+visual\s+rendering\s+tests?/gi,  
                replacement: `${this.counts.visual} visual rendering tests`
            },
            // "X modular core tests" pattern
            {
                regex: /\b\d+\s+modular\s+core\s+tests?/gi,
                replacement: `${this.counts.core} modular core tests`
            },
            // "X modular visual tests" pattern
            {
                regex: /\b\d+\s+modular\s+visual\s+tests?/gi,
                replacement: `${this.counts.visual} modular visual tests`
            },
            // "X unit tests" pattern (for core tests)
            {
                regex: /\b\d+\s+unit\s+tests?\s+using/gi,
                replacement: `${this.counts.core} unit tests using`
            },
            // "X visual tests that generate" pattern
            {
                regex: /\b\d+\s+visual\s+tests?\s+that\s+generate/gi,
                replacement: `${this.counts.visual} visual tests that generate`
            },
            // File count patterns: "from X individual test files"
            {
                regex: /from\s+\d+\s+individual\s+test\s+files\s+in\s+`\/tests\/core\/`/gi,
                replacement: `from ${this.counts.core} individual test files in \`/tests/core/\``
            },
            {
                regex: /from\s+\d+\s+individual\s+test\s+files\s+in\s+`\/tests\/visual\/`/gi,
                replacement: `from ${this.counts.visual} individual test files in \`/tests/visual/\``
            },
            // Directory structure comments: "# X individual core test files"
            {
                regex: /#\s*\d+\s+individual\s+core\s+test\s+files/gi,
                replacement: `# ${this.counts.core} individual core test files`
            },
            {
                regex: /#\s*\d+\s+individual\s+visual\s+test\s+files/gi,
                replacement: `# ${this.counts.visual} individual visual test files`
            },
            // Specific range patterns - preserve markdown formatting
            {
                regex: /(\*\*\d+\s+individual\s+test\s+files\*\*).*numbered\s+001-\d{3}\s+with\s+descriptive\s+names/gi,
                replacement: (match, prefix) => {
                    if (match.includes('36 individual')) {
                        return `${prefix} numbered 001-${String(this.counts.core).padStart(3, '0')} with descriptive names`;
                    } else if (match.includes('138 individual')) {
                        return `${prefix} numbered 001-${String(this.counts.visual).padStart(3, '0')} with descriptive names`;
                    }
                    return match;
                }
            },
            // Output file patterns: "X+ files"
            {
                regex: /\d+\+\s+PNG\s+files?\)/gi,
                replacement: `${this.counts.visual}+ PNG files)`
            },
            {
                regex: /\d+\+\s+visual\s+tests?(?!\s+that\s+generate)/gi,
                replacement: `${this.counts.visual}+ visual tests`
            }
        ];

        // Apply each pattern
        patterns.forEach(({ regex, replacement }) => {
            const originalContent = content;
            if (typeof replacement === 'function') {
                content = content.replace(regex, replacement);
            } else {
                content = content.replace(regex, replacement);
            }
            if (content !== originalContent) {
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✓ Updated ${filePath}`);
            return true;
        } else {
            console.log(`- No changes needed in ${filePath}`);
            return false;
        }
    }

    /**
     * Update all documentation files
     */
    updateAllDocumentation() {
        console.log(`\nUpdating documentation files...`);
        let totalUpdated = 0;

        this.docFiles.forEach(filePath => {
            if (this.updateDocumentationFile(filePath)) {
                totalUpdated++;
            }
        });

        console.log(`\nUpdated ${totalUpdated} documentation files.`);
        return totalUpdated;
    }

    /**
     * Validate that counts are reasonable
     */
    validateCounts() {
        if (this.counts.core < 1 || this.counts.visual < 1) {
            console.error('Error: Test counts seem too low. Check that test directories exist.');
            return false;
        }

        if (this.counts.core > 200 || this.counts.visual > 500) {
            console.warn('Warning: Test counts seem unusually high. Proceeding anyway.');
        }

        return true;
    }

    /**
     * Main execution function
     */
    run() {
        console.log('SWCanvas Test Count Updater');
        console.log('============================\n');

        // Count current test files
        this.getCurrentCounts();

        // Validate counts
        if (!this.validateCounts()) {
            process.exit(1);
        }

        // Update documentation
        const updatedFiles = this.updateAllDocumentation();

        // Summary
        console.log('\n============================');
        console.log('Update Summary:');
        console.log(`- Core tests: ${this.counts.core}`);
        console.log(`- Visual tests: ${this.counts.visual}`);
        console.log(`- Documentation files updated: ${updatedFiles}`);
        console.log('\nTest count references are now synchronized with actual file counts.');

        if (updatedFiles > 0) {
            console.log('\nRecommendation: Review the changes and commit them with a message like:');
            console.log(`  "Update test count references to ${this.counts.core} core + ${this.counts.visual} visual tests"`);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const updater = new TestCountUpdater();
    updater.run();
}

module.exports = TestCountUpdater;