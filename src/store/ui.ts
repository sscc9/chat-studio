/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom, PrimitiveAtom, SetStateAction } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// =================================================================
// UI STATE ATOMS
// =================================================================

// --- Global UI State (used by API atoms) ---
export const isLoadingAtom: PrimitiveAtom<boolean> = atom(false);
export const regeneratingIndexAtom: PrimitiveAtom<number | null> = atom<number | null>(null);
export const tokenCountAtom: PrimitiveAtom<number> = atom(0);

// --- Toast ---
export const toastAtom: PrimitiveAtom<{ show: boolean; message: string }> = atom<{ show: boolean; message: string }>({ show: false, message: "" });
export const setToastAtom = atom(
    (get) => get(toastAtom),
    (_get, set, newToast: SetStateAction<{ show: boolean; message: string }>) => {
        set(toastAtom, newToast)
    }
);
export const showToastAtom = atom(
    null,
    (_get, set, message: string) => {
        set(toastAtom, { show: true, message });
    }
);

// --- Panels & Modals ---
export const isHistoryPanelOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const setIsHistoryPanelOpenAtom = atom(
    (get) => get(isHistoryPanelOpenAtom),
    (_get, set, value: boolean) => set(isHistoryPanelOpenAtom, value)
);
export const isConfigPanelOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const setIsConfigPanelOpenAtom = atom(
    (get) => get(isConfigPanelOpenAtom),
    (_get, set, value: boolean) => set(isConfigPanelOpenAtom, value)
);
export const isHistoryPanelVisibleAtom: PrimitiveAtom<boolean> = atom(true);
export const setIsHistoryPanelVisibleAtom = atom(
    (get) => get(isHistoryPanelVisibleAtom),
    (_get, set, value: boolean) => set(isHistoryPanelVisibleAtom, value)
);
export const isConfigPanelVisibleAtom: PrimitiveAtom<boolean> = atom(true);
export const setIsConfigPanelVisibleAtom = atom(
    (get) => get(isConfigPanelVisibleAtom),
    (_get, set, value: boolean) => set(isConfigPanelVisibleAtom, value)
);
export const isSystemPromptEditorOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const setIsSystemPromptEditorOpenAtom = atom(
    (get) => get(isSystemPromptEditorOpenAtom),
    (_get, set, value: boolean) => set(isSystemPromptEditorOpenAtom, value)
);
export const isDocumentEditorOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const setIsDocumentEditorOpenAtom = atom(
    (get) => get(isDocumentEditorOpenAtom),
    (_get, set, value: boolean) => set(isDocumentEditorOpenAtom, value)
);
export const isModelDropdownOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const setIsModelDropdownOpenAtom = atom(
    (get) => get(isModelDropdownOpenAtom),
    (_get, set, value: boolean) => set(isModelDropdownOpenAtom, value)
);
export const isActionLogViewerOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const isTrashModalOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const isImportStudioModalOpenAtom: PrimitiveAtom<boolean> = atom(false);
export const activeConfigTabAtom: PrimitiveAtom<string> = atom('configuration');

// --- Theme & Mobile ---
export const themeAtom = atomWithStorage('ai-chat-theme', 'system');
export const setThemeAtom = atom(
    (get) => get(themeAtom),
    (_get, set, newTheme: string) => set(themeAtom, newTheme)
);
export const isMobileAtom: PrimitiveAtom<boolean> = atom(window.innerWidth <= 900);
export const setIsMobileAtom = atom(
    (get) => get(isMobileAtom),
    (_get, set, value: boolean) => set(isMobileAtom, value)
);


// --- Refs ---
export const modelDropdownRefAtom = atom(React.createRef<HTMLDivElement>());
export const chatMessagesRefAtom = atom(React.createRef<HTMLDivElement>());
export const systemPromptTextareaRefAtom = atom(React.createRef<HTMLTextAreaElement>());
export const chatInputRefAtom = atom(React.createRef<HTMLTextAreaElement>());
export const fileInputRefAtom = atom(React.createRef<HTMLInputElement>());
export const importFileRefAtom = atom(React.createRef<HTMLInputElement>());
export const documentFileInputRefAtom = atom(React.createRef<HTMLInputElement>());

// --- Input Tracking ---
export const lastActiveInputRefAtom = atom(React.createRef<{ id: string; selectionStart: number; selectionEnd: number; element: HTMLTextAreaElement | null }>());
export const trackActiveInputAtom = atom(null, (get, set, e: React.SyntheticEvent<HTMLTextAreaElement>, id: string) => {
    const target = e.currentTarget;
    if (get(lastActiveInputRefAtom).current) {
        get(lastActiveInputRefAtom).current = {
            id,
            selectionStart: target.selectionStart,
            selectionEnd: target.selectionEnd,
            element: target,
        };
    }
});