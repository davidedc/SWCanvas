# Documentation Index

## Documentation Strategy

Each document has a **single responsibility** to avoid duplication:

### Primary Responsibilities

- **README.md**: Quick start, API examples, build instructions, brief testing overview
- **ARCHITECTURE.md**: System design, component organization, architectural patterns, OO design
- **tests/README.md**: Complete test system documentation, adding tests, build utilities
- **tests/build/README.md**: Build utility scripts documentation (concat-tests.js, renumber-tests.js)
- **debug/README.md**: Debug utilities, investigation scripts, and debugging workflows
- **CLAUDE.md**: Claude-specific development context and workflow tips ONLY

### What NOT to Include (Anti-Duplication Rules)

**README.md should NOT contain:**
- Detailed test architecture (→ tests/README.md)
- Detailed build utility instructions (→ tests/build/README.md)
- Architecture implementation details (→ ARCHITECTURE.md)

**CLAUDE.md should NOT contain:**
- API usage examples (→ README.md)
- Test architecture details (→ tests/README.md) 
- Build instruction details (→ README.md)
- Architecture explanations (→ ARCHITECTURE.md)

**ARCHITECTURE.md should NOT contain:**
- API usage examples (→ README.md)
- Test development instructions (→ tests/README.md)

**tests/README.md should NOT contain:**
- API examples (→ README.md)
- Architecture theory (→ ARCHITECTURE.md)

### Cross-Reference Pattern

**Instead of duplicating content, use references:**
- "See README.md for API examples"
- "See ARCHITECTURE.md for design details" 
- "See tests/README.md for test documentation"
- "See tests/build/README.md for build utilities"

### Single Source of Truth

- **API examples**: README.md only
- **Architecture details**: ARCHITECTURE.md only
- **Test documentation**: tests/README.md only
- **Build utilities**: tests/build/README.md only
- **Debug utilities**: debug/README.md only
- **Claude guidance**: CLAUDE.md only (no duplication from other docs)

## Quick Navigation

- **Getting started** → README.md
- **Understanding the design** → ARCHITECTURE.md  
- **Adding/running tests** → tests/README.md
- **Build utilities** → tests/build/README.md
- **Debug utilities** → debug/README.md
- **Examples and demos** → examples/README.md
- **Development with Claude** → CLAUDE.md

## Documentation Maintenance

### Automated Test Count Synchronization

**Command**: `npm run update-test-counts`

Single command automatically synchronizes all test count references across the entire documentation suite, ensuring perpetual accuracy with zero manual effort.

**Usage**: Run this command whenever test files are added or removed to keep all documentation (README.md, CLAUDE.md, tests/README.md) accurate with current test counts. The script scans actual filesystem and updates 15+ different reference patterns throughout the documentation.