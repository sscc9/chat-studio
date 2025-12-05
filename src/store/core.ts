/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';
import { GoogleGenAI } from "@google/genai";

// =================================================================
// HELPERS
// =================================================================
export const isMac = /Mac/i.test(navigator.platform);

// =================================================================
// CORE APP ATOMS
// =================================================================
export const isInitializedAtom = atom(false);

export const aiAtom = atom(() => {
    if (!process.env.API_KEY) return null;
    try {
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        return null;
    }
});
