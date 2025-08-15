#!/usr/bin/env node

/**
 * SWCanvas Test Renumbering Utility
 * 
 * This script shifts test file numbers to make space for inserting new tests.
 * All test files from position N onwards are renamed to N+1, N+2, etc.
 * 
 * Usage Examples:
 *   node tests/build/renumber-tests.js --type visual --position 25 --shift forward
 *   node tests/build/renumber-tests.js --type core --position 15 --shift forward --dry-run
 *   node tests/build/renumber-tests.js --type visual --position 21 --shift backward
 * 
 * Arguments:
 *   --type       Test type: 'core' or 'visual' (required)
 *   --position   Position to insert/remove at (required)
 *   --shift      Direction: 'forward' (make space) or 'backward' (close gap) (required)
 *   --dry-run    Show what would be done without making changes
 *   --git        Use git mv instead of regular mv (auto-detected if in git repo)
 *   --help       Show this help message
 * 
 * The script will:
 * - Rename test files (e.g., 025-test.js -> 026-test.js)
 * - Update internal test number comments (// Test 25: -> // Test 26:)
 * - Update test function calls when applicable
 * - Generate undo script for reverting changes
 * - Preserve git history when possible
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestRenumberer {
    constructor(options) {
        this.type = options.type;
        this.position = parseInt(options.position);
        this.shift = options.shift;
        this.dryRun = options.dryRun || false;
        this.useGit = options.git || this.isGitRepo();
        this.undoCommands = [];
        
        this.testDir = this.type === 'core' ? 'tests/core' : 'tests/visual';
        this.testDirPath = path.join(process.cwd(), this.testDir);
        
        this.validateInputs();
    }
    
    validateInputs() {
        if (!['core', 'visual'].includes(this.type)) {
            throw new Error(`Invalid test type: ${this.type}. Must be 'core' or 'visual'.`);
        }
        
        if (!['forward', 'backward'].includes(this.shift)) {
            throw new Error(`Invalid shift direction: ${this.shift}. Must be 'forward' or 'backward'.`);
        }
        
        if (!Number.isInteger(this.position) || this.position < 1 || this.position > 999) {
            throw new Error(`Invalid position: ${this.position}. Must be an integer between 1 and 999.`);
        }
        
        if (!fs.existsSync(this.testDirPath)) {
            throw new Error(`Test directory not found: ${this.testDirPath}`);
        }
    }
    
    isGitRepo() {
        try {
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Scans the test directory and returns info about existing test files
     */
    scanTestFiles() {
        const files = fs.readdirSync(this.testDirPath)
            .filter(file => file.match(/^\d{3}-.+\.js$/))
            .map(file => {
                const match = file.match(/^(\d{3})-(.+\.js)$/);
                if (!match) return null;
                
                return {
                    originalName: file,
                    originalPath: path.join(this.testDirPath, file),
                    number: parseInt(match[1]),
                    suffix: match[2] // everything after the number and dash
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.number - b.number);
        
        return files;
    }
    
    /**
     * Determines which files need to be renumbered based on position and shift direction
     */
    getFilesToRenumber(files) {
        if (this.shift === 'forward') {
            // Make space: shift all files >= position forward by 1
            return files.filter(file => file.number >= this.position);
        } else {
            // Close gap: shift all files > position backward by 1
            return files.filter(file => file.number > this.position);
        }
    }
    
    /**
     * Calculate new numbers for files
     */
    calculateNewNumbers(filesToRenumber) {
        const shiftAmount = this.shift === 'forward' ? 1 : -1;
        
        return filesToRenumber.map(file => ({
            ...file,
            newNumber: file.number + shiftAmount,
            newName: this.formatTestNumber(file.number + shiftAmount) + '-' + file.suffix,
            newPath: path.join(this.testDirPath, this.formatTestNumber(file.number + shiftAmount) + '-' + file.suffix)
        }));
    }
    
    /**
     * Format test number as 3-digit string
     */
    formatTestNumber(number) {
        return number.toString().padStart(3, '0');
    }
    
    /**
     * Check for conflicts before renaming
     */
    checkForConflicts(renamedFiles) {
        const conflicts = [];
        
        for (const file of renamedFiles) {
            if (fs.existsSync(file.newPath) && file.originalPath !== file.newPath) {
                // Check if this is a file we're also renaming (which would be handled)
                const isAlsoBeingRenamed = renamedFiles.some(f => f.originalPath === file.newPath);
                if (!isAlsoBeingRenamed) {
                    conflicts.push(`${file.newName} already exists`);
                }
            }
        }
        
        return conflicts;
    }
    
    /**
     * Update the internal content of a test file (test number comments)
     */
    updateFileContent(filePath, oldNumber, newNumber) {
        if (this.dryRun) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Update comment lines like "// Test 025: Description"
        content = content.replace(
            new RegExp(`^// Test ${this.formatTestNumber(oldNumber)}:`, 'gm'),
            `// Test ${this.formatTestNumber(newNumber)}:`
        );
        modified = true;
        
        // Update comment lines like "// Test 25: Description" (without leading zeros)
        content = content.replace(
            new RegExp(`^// Test ${oldNumber}:`, 'gm'),
            `// Test ${newNumber}:`
        );
        modified = true;
        
        // Update comment lines like "// Test 025" (without colon)
        content = content.replace(
            new RegExp(`^// Test ${this.formatTestNumber(oldNumber)}$`, 'gm'),
            `// Test ${this.formatTestNumber(newNumber)}`
        );
        modified = true;
        
        // Update comment lines like "// Test 25" (without leading zeros, without colon)
        content = content.replace(
            new RegExp(`^// Test ${oldNumber}$`, 'gm'),
            `// Test ${newNumber}`
        );
        modified = true;
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
    
    /**
     * Rename a single file and update its content
     */
    renameFile(fileInfo) {
        if (this.dryRun) {
            console.log(`  [DRY RUN] ${fileInfo.originalName} -> ${fileInfo.newName}`);
            console.log(`    Update content: Test ${fileInfo.number} -> Test ${fileInfo.newNumber}`);
            return;
        }
        
        try {
            if (this.useGit && fileInfo.originalPath !== fileInfo.newPath) {
                // Use git mv to preserve history
                execSync(`git mv "${fileInfo.originalPath}" "${fileInfo.newPath}"`, { stdio: 'inherit' });
                this.undoCommands.push(`git mv "${fileInfo.newPath}" "${fileInfo.originalPath}"`);
                console.log(`  ${fileInfo.originalName} -> ${fileInfo.newName} (git mv)`);
            } else if (fileInfo.originalPath !== fileInfo.newPath) {
                // Use regular fs rename
                fs.renameSync(fileInfo.originalPath, fileInfo.newPath);
                this.undoCommands.push(`mv "${fileInfo.newPath}" "${fileInfo.originalPath}"`);
                console.log(`  ${fileInfo.originalName} -> ${fileInfo.newName}`);
            }
            
            // Update the file content with new test numbers
            this.updateFileContent(fileInfo.newPath, fileInfo.number, fileInfo.newNumber);
            
        } catch (error) {
            throw new Error(`Failed to rename ${fileInfo.originalName}: ${error.message}`);
        }
    }
    
    /**
     * Generate an undo script
     */
    generateUndoScript() {
        if (this.dryRun || this.undoCommands.length === 0) return;
        
        const undoScriptPath = path.join(process.cwd(), 'undo-renumber.sh');
        const script = [
            '#!/bin/bash',
            '# Undo script for test renumbering',
            `# Generated on ${new Date().toISOString()}`,
            '# Run this script to revert the renumbering operation',
            '',
            ...this.undoCommands.reverse(), // Reverse to undo in opposite order
            '',
            '# Remove this undo script',
            `rm "${undoScriptPath}"`
        ].join('\n');
        
        fs.writeFileSync(undoScriptPath, script, { mode: 0o755 });
        console.log(`\n📝 Undo script generated: ${undoScriptPath}`);
        console.log('   Run ./undo-renumber.sh to revert changes');
    }
    
    /**
     * Main execution method
     */
    execute() {
        console.log(`🔄 SWCanvas Test Renumberer`);
        console.log(`   Type: ${this.type}`);
        console.log(`   Position: ${this.position}`);
        console.log(`   Shift: ${this.shift}`);
        console.log(`   Directory: ${this.testDir}`);
        console.log(`   Git mode: ${this.useGit ? 'enabled' : 'disabled'}`);
        console.log(`   Dry run: ${this.dryRun ? 'enabled' : 'disabled'}`);
        console.log('');
        
        // Step 1: Scan existing files
        const files = this.scanTestFiles();
        console.log(`📁 Found ${files.length} test files in ${this.testDir}/`);
        
        if (files.length === 0) {
            console.log('❌ No test files found. Nothing to do.');
            return;
        }
        
        // Step 2: Determine which files to renumber
        const filesToRenumber = this.getFilesToRenumber(files);
        
        if (filesToRenumber.length === 0) {
            console.log(`ℹ️  No files need to be renumbered at position ${this.position}.`);
            return;
        }
        
        // Step 3: Calculate new numbers
        const renamedFiles = this.calculateNewNumbers(filesToRenumber);
        
        // Step 4: Check for conflicts
        const conflicts = this.checkForConflicts(renamedFiles);
        if (conflicts.length > 0) {
            console.log('❌ Conflicts detected:');
            conflicts.forEach(conflict => console.log(`   - ${conflict}`));
            throw new Error('Cannot proceed due to conflicts');
        }
        
        // Step 5: Show the plan
        console.log(`📋 Renumbering plan (${this.shift} shift from position ${this.position}):`);
        
        if (this.shift === 'forward') {
            // Process in reverse order to avoid conflicts
            renamedFiles.sort((a, b) => b.number - a.number);
        } else {
            // Process in forward order
            renamedFiles.sort((a, b) => a.number - b.number);
        }
        
        // Step 6: Execute the renaming
        console.log(`\n🚀 ${this.dryRun ? 'Would rename' : 'Renaming'} ${renamedFiles.length} files:`);
        
        for (const fileInfo of renamedFiles) {
            this.renameFile(fileInfo);
        }
        
        // Step 7: Generate undo script
        this.generateUndoScript();
        
        console.log('\n✅ Renumbering completed successfully!');
        
        if (this.shift === 'forward') {
            console.log(`\n💡 You can now add your new test as: ${this.formatTestNumber(this.position)}-your-test-name.js`);
        }
        
        console.log('⚠️  Remember to run "npm run build" to regenerate the built test files.');
    }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
            case '--type':
                options.type = args[++i];
                break;
            case '--position':
                options.position = args[++i];
                break;
            case '--shift':
                options.shift = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--git':
                options.git = true;
                break;
            case '--no-git':
                options.git = false;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.error(`Unknown option: ${arg}`);
                    process.exit(1);
                }
                break;
        }
    }
    
    return options;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
SWCanvas Test Renumbering Utility

This script shifts test file numbers to make space for inserting new tests.

USAGE:
  node tests/build/renumber-tests.js [OPTIONS]

OPTIONS:
  --type TYPE        Test type: 'core' or 'visual' (required)
  --position N       Position to insert/remove at (required)
  --shift DIRECTION  'forward' (make space) or 'backward' (close gap) (required)
  --dry-run          Show what would be done without making changes
  --git              Use git mv instead of regular mv
  --no-git           Force regular mv even in git repositories
  --help             Show this help message

EXAMPLES:
  # Make space for a new visual test at position 25
  node tests/build/renumber-tests.js --type visual --position 25 --shift forward

  # Close a gap after removing test 15 in core tests
  node tests/build/renumber-tests.js --type core --position 15 --shift backward

  # Preview changes without executing
  node tests/build/renumber-tests.js --type visual --position 30 --shift forward --dry-run

WHAT IT DOES:
  - Renames test files (e.g., 025-test.js -> 026-test.js)
  - Updates internal test number comments (// Test 25: -> // Test 26:)
  - Preserves git history when possible
  - Generates undo script for reverting changes
  - Checks for conflicts before making changes

AFTER RUNNING:
  - Remember to run "npm run build" to regenerate built test files
  - Use the generated undo script to revert if needed
`);
}

/**
 * Main entry point
 */
function main() {
    try {
        const options = parseArgs();
        
        // Validate required arguments
        if (!options.type || !options.position || !options.shift) {
            console.error('❌ Missing required arguments. Use --help for usage information.');
            process.exit(1);
        }
        
        const renumberer = new TestRenumberer(options);
        renumberer.execute();
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = { TestRenumberer, parseArgs, showHelp };