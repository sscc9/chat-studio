/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file serves as the single entry point for all state management modules.
// It re-exports all atoms from the new, smaller files in the /store directory.
// The order is important to prevent circular dependency issues during module initialization.

// Level 0: Core atoms with no internal store dependencies
export * from './core';
export * from './ui';

// Level 1: Atoms that depend on Level 0
export * from './tools';
export * from './settings';
export * from './systemPresets';

// Level 2: Atoms that depend on Level 1
export * from './chat';

// Level 3: Atoms that depend on Level 2
export * from './api';
export * from './log';

// Level 4: Atoms that depend on Level 3
export * from './message';

// Level 5: Atoms that depend on Level 4
// (agent module removed)
// FIX: This redundant export can cause circular dependency issues with module resolution.
// It is already exported by `export * from './log'`.
// export { handleClearActionLogAtom } from './log';
