/**
 * StateStack - Manages save/restore state snapshots for Context2D
 *
 * Uses Snapshot/Memento pattern: stores complete state snapshots
 * without affecting hot-path property access performance.
 *
 * Design rationale:
 * - Context2D keeps active state as direct properties for O(1) access
 * - StateStack only handles storage during save()/restore() operations
 * - This avoids performance regression from property indirection on hot paths
 */
class StateStack {
    constructor() {
        this._stack = [];
    }

    /**
     * Push a state snapshot onto the stack
     * @param {Object} snapshot - Complete state snapshot
     */
    push(snapshot) {
        this._stack.push(snapshot);
    }

    /**
     * Pop and return the top state snapshot
     * @returns {Object|undefined} The snapshot or undefined if empty
     */
    pop() {
        return this._stack.pop();
    }

    /**
     * Check if stack is empty
     * @returns {boolean} True if no saved states
     */
    isEmpty() {
        return this._stack.length === 0;
    }

    /**
     * Get current stack depth (for debugging/testing)
     * @returns {number} Number of saved states
     */
    get depth() {
        return this._stack.length;
    }
}
