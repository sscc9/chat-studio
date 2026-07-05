/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';

// =================================================================
// HELPERS
// =================================================================
export const isMac = /Mac/i.test(navigator.platform);

// =================================================================
// CORE APP ATOMS
// =================================================================
export const isInitializedAtom = atom(false);
