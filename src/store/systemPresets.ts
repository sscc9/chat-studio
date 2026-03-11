/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { PresetPrompt, PresetGroup } from '../types';

// =================================================================
// SYSTEM PRESET TOOLS ATOMS
// =================================================================

// --- State ---
export const systemPresetPromptsAtom = atomWithStorage<PresetPrompt[]>('ai-chat-sys-preset-prompts', []);
export const systemPresetGroupsAtom = atomWithStorage<PresetGroup[]>('ai-chat-sys-preset-groups', []);
export const activeSystemPresetGroupIdAtom = atom<string>('all');
export const editingSystemGroupIdAtom = atom<string | null>(null);
export const editingSystemGroupNameAtom = atom('');
export const isCreatingSystemGroupAtom = atom(false);
export const newSystemGroupNameAtom = atom('');
export const renamingSystemInputRefAtom = atom(React.createRef<HTMLInputElement>());
export const creatingSystemInputRefAtom = atom(React.createRef<HTMLInputElement>());

// --- Preset Editor Modal State ---
export const isSystemPresetEditorOpenAtom = atom(false);
export const editingSystemPresetIdAtom = atom<string | null>(null);
export const editingSystemPresetTextAtom = atom('');
export const editingSystemPresetGroupIdAtom = atom<string | null>(null);
export const systemPresetEditorPositionAtom = atom({ top: 0, left: 0 });

// --- DERIVED ---
export const filteredSystemPromptsAtom = atom(get => {
    const activeId = get(activeSystemPresetGroupIdAtom);
    const prompts = get(systemPresetPromptsAtom);
    if (activeId === 'all') {
        return prompts.filter(p => !p.groupId);
    }
    return prompts.filter(p => p.groupId === activeId);
});

// --- ACTIONS ---

export const handleAddSystemPresetGroupAtom = atom(null, (get, set, name: string) => {
    if (!name.trim()) {
        set(isCreatingSystemGroupAtom, false);
        return;
    }
    const newGroup: PresetGroup = { id: `sys-group-${Date.now()}`, name: name.trim() };
    set(systemPresetGroupsAtom, prev => [...prev, newGroup]);
    set(isCreatingSystemGroupAtom, false);
    set(activeSystemPresetGroupIdAtom, newGroup.id);
});

export const handleStartRenameSystemGroupAtom = atom(null, (get, set, group: PresetGroup) => {
    set(editingSystemGroupIdAtom, group.id);
    set(editingSystemGroupNameAtom, group.name);
});

export const handleUpdateSystemGroupNameAtom = atom(null, (get, set) => {
    const name = get(editingSystemGroupNameAtom);
    const id = get(editingSystemGroupIdAtom);
    if (!name.trim() || !id) {
        set(editingSystemGroupIdAtom, null);
        return;
    }
    set(systemPresetGroupsAtom, prev => prev.map(g => g.id === id ? { ...g, name: name.trim() } : g));
    set(editingSystemGroupIdAtom, null);
    set(editingSystemGroupNameAtom, '');
});

export const handleDeleteSystemPresetGroupAtom = atom(null, (get, set, groupId: string) => {
    set(systemPresetGroupsAtom, prev => prev.filter(g => g.id !== groupId));
    set(systemPresetPromptsAtom, prev => prev.map(p => p.groupId === groupId ? { ...p, groupId: undefined } : p));
    if (get(activeSystemPresetGroupIdAtom) === groupId) {
        set(activeSystemPresetGroupIdAtom, 'all');
    }
});

export const handleStartAddSystemPresetAtom = atom(null, (get, set, e: React.MouseEvent) => {
    set(systemPresetEditorPositionAtom, { top: e.clientY, left: e.clientX });
    set(editingSystemPresetIdAtom, 'new');
    set(editingSystemPresetTextAtom, '');
    const activeId = get(activeSystemPresetGroupIdAtom);
    set(editingSystemPresetGroupIdAtom, activeId === 'all' || activeId === 'ungrouped' ? null : activeId);
    set(isSystemPresetEditorOpenAtom, true);
});

export const handleStartEditSystemPresetAtom = atom(null, (get, set, prompt: PresetPrompt, e: React.MouseEvent) => {
    set(systemPresetEditorPositionAtom, { top: e.clientY, left: e.clientX });
    set(editingSystemPresetIdAtom, prompt.id);
    set(editingSystemPresetTextAtom, prompt.text);
    set(editingSystemPresetGroupIdAtom, prompt.groupId || null);
    set(isSystemPresetEditorOpenAtom, true);
});

export const handleCancelSystemPresetAtom = atom(null, (get, set) => {
    set(editingSystemPresetIdAtom, null);
    set(editingSystemPresetTextAtom, '');
    set(editingSystemPresetGroupIdAtom, null);
    set(isSystemPresetEditorOpenAtom, false);
});

export const handleSaveSystemPresetAtom = atom(null, (get, set) => {
    const text = get(editingSystemPresetTextAtom);
    const id = get(editingSystemPresetIdAtom);
    if (!text.trim()) return;

    if (id === 'new') {
        const newPrompt: PresetPrompt = {
            id: `sys-prompt-${Date.now()}`,
            text: text,
            groupId: get(editingSystemPresetGroupIdAtom) || undefined,
        };
        set(systemPresetPromptsAtom, prev => [...prev, newPrompt]);
    } else {
        set(systemPresetPromptsAtom, prev => prev.map(p =>
            p.id === id ? { ...p, text: text, groupId: get(editingSystemPresetGroupIdAtom) || undefined } : p
        ));
    }
    set(handleCancelSystemPresetAtom);
});

export const handleDeleteSystemPresetPromptAtom = atom(null, (get, set, id: string) => {
    set(systemPresetPromptsAtom, prev => prev.filter(p => p.id !== id));
});
