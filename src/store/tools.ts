/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { PresetPrompt, PresetGroup, DocumentChapter } from '../types';
import { lastActiveInputRefAtom, isDocumentEditorOpenAtom, documentFileInputRefAtom } from './ui';

// =================================================================
// WRITING TOOLS ATOMS
// =================================================================

// --- State ---
export const presetPromptsAtom = atomWithStorage<PresetPrompt[]>('ai-chat-preset-prompts', []);
export const presetGroupsAtom = atomWithStorage<PresetGroup[]>('ai-chat-preset-groups', []);
export const documentContentAtom = atomWithStorage('ai-chat-document-content', '');
export const activePresetGroupIdAtom = atom<string>('all');
export const editingGroupIdAtom = atom<string | null>(null);
export const editingGroupNameAtom = atom('');
export const isCreatingGroupAtom = atom(false);
export const newGroupNameAtom = atom('');
export const renamingInputRefAtom = atom(React.createRef<HTMLInputElement>());
export const creatingInputRefAtom = atom(React.createRef<HTMLInputElement>());

// --- Preset Editor Modal State ---
export const isPresetEditorOpenAtom = atom(false);
export const editingPresetIdAtom = atom<string | null>(null);
export const editingPresetTextAtom = atom('');
export const editingPresetGroupIdAtom = atom<string | null>(null);
export const presetEditorPositionAtom = atom({ top: 0, left: 0 });


// --- DERIVED ---
export const filteredPromptsAtom = atom(get => {
    const activeId = get(activePresetGroupIdAtom);
    const prompts = get(presetPromptsAtom);
    if (activeId === 'all') {
        return prompts.filter(p => !p.groupId);
    }
    return prompts.filter(p => p.groupId === activeId);
});

export const documentChaptersAtom = atom<DocumentChapter[]>(get => {
    const content = get(documentContentAtom);
    if (!content) return [];
    
    const chapterRegex = /^\s*(第\s*[一二三四五六七八九十百千万亿零\d]+\s*[章集]|\d+\.|\d+)\s*$/gm;
    const matches = [...content.matchAll(chapterRegex)];
    const finalChapters: DocumentChapter[] = [];
    if (matches.length > 0) {
        finalChapters.push({
            number: matches[0][1],
            startIndex: 0,
            endIndex: matches[1] ? matches[1].index : content.length,
        });
        for (let i = 1; i < matches.length; i++) {
            finalChapters.push({
                number: matches[i][1],
                startIndex: matches[i].index!,
                endIndex: matches[i + 1] ? matches[i + 1].index : content.length,
            });
        }
    } else if (content.trim()) {
        finalChapters.push({ number: '1', startIndex: 0, endIndex: content.length });
    }
    return finalChapters;
});

// --- ACTIONS ---

export const handlePresetClickAtom = atom(null, (get, set, text: string) => {
    const ref = get(lastActiveInputRefAtom).current;
    if (!ref || !ref.element) return;
    
    const { element, selectionStart, selectionEnd } = ref;
    element.focus();
    element.setSelectionRange(selectionStart, selectionEnd);
    
    const isSuccess = document.execCommand('insertText', false, text);
    if (!isSuccess) { // Fallback for Firefox
        const newText = element.value.substring(0, selectionStart) + text + element.value.substring(selectionEnd);
        element.value = newText;
    }
    
    const event = new Event('input', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    
    const newCursorPos = selectionStart + text.length;
    if (get(lastActiveInputRefAtom).current) {
        get(lastActiveInputRefAtom).current!.selectionStart = newCursorPos;
        get(lastActiveInputRefAtom).current!.selectionEnd = newCursorPos;
    }
});

export const handleChapterClickAtom = atom(null, (get, set, chapter: DocumentChapter) => {
    const content = get(documentContentAtom);
    const chapterContent = content.substring(chapter.startIndex, chapter.endIndex);
    set(handlePresetClickAtom, chapterContent);
    set(isDocumentEditorOpenAtom, false);
});

export const handleDocumentUploadClickAtom = atom(null, (get, set) => get(documentFileInputRefAtom).current?.click());
export const handleDocumentFileChangeAtom = atom(null, (get, set, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => set(documentContentAtom, event.target?.result as string);
    reader.readAsText(file);
    if (e.target) e.target.value = '';
});
export const handleClearDocumentAtom = atom(null, (get, set) => set(documentContentAtom, ''));

export const handleAddPresetGroupAtom = atom(null, (get, set, name: string) => {
    if (!name.trim()) {
        set(isCreatingGroupAtom, false);
        return;
    }
    const newGroup: PresetGroup = { id: `group-${Date.now()}`, name: name.trim() };
    set(presetGroupsAtom, prev => [...prev, newGroup]);
    set(isCreatingGroupAtom, false);
    set(activePresetGroupIdAtom, newGroup.id);
});

export const handleStartRenameGroupAtom = atom(null, (get, set, group: PresetGroup) => {
    set(editingGroupIdAtom, group.id);
    set(editingGroupNameAtom, group.name);
});

export const handleUpdateGroupNameAtom = atom(null, (get, set) => {
    const name = get(editingGroupNameAtom);
    const id = get(editingGroupIdAtom);
    if (!name.trim() || !id) {
        set(editingGroupIdAtom, null);
        return;
    }
    set(presetGroupsAtom, prev => prev.map(g => g.id === id ? { ...g, name: name.trim() } : g));
    set(editingGroupIdAtom, null);
    set(editingGroupNameAtom, '');
});

export const handleDeletePresetGroupAtom = atom(null, (get, set, groupId: string) => {
    set(presetGroupsAtom, prev => prev.filter(g => g.id !== groupId));
    set(presetPromptsAtom, prev => prev.map(p => p.groupId === groupId ? { ...p, groupId: undefined } : p));
    if (get(activePresetGroupIdAtom) === groupId) {
        set(activePresetGroupIdAtom, 'all');
    }
});

export const handleStartAddPresetAtom = atom(null, (get, set, e: React.MouseEvent) => {
    set(presetEditorPositionAtom, { top: e.clientY, left: e.clientX });
    set(editingPresetIdAtom, 'new');
    set(editingPresetTextAtom, '');
    const activeId = get(activePresetGroupIdAtom);
    set(editingPresetGroupIdAtom, activeId === 'all' || activeId === 'ungrouped' ? null : activeId);
    set(isPresetEditorOpenAtom, true);
});

export const handleStartEditPresetAtom = atom(null, (get, set, prompt: PresetPrompt, e: React.MouseEvent) => {
    set(presetEditorPositionAtom, { top: e.clientY, left: e.clientX });
    set(editingPresetIdAtom, prompt.id);
    set(editingPresetTextAtom, prompt.text);
    set(editingPresetGroupIdAtom, prompt.groupId || null);
    set(isPresetEditorOpenAtom, true);
});

export const handleCancelPresetAtom = atom(null, (get, set) => {
    set(editingPresetIdAtom, null);
    set(editingPresetTextAtom, '');
    set(editingPresetGroupIdAtom, null);
    set(isPresetEditorOpenAtom, false);
});

export const handleSavePresetAtom = atom(null, (get, set) => {
    const text = get(editingPresetTextAtom);
    const id = get(editingPresetIdAtom);
    if (!text.trim()) return;

    if (id === 'new') {
        const newPrompt: PresetPrompt = {
            id: `prompt-${Date.now()}`,
            text: text,
            groupId: get(editingPresetGroupIdAtom) || undefined,
        };
        set(presetPromptsAtom, prev => [...prev, newPrompt]);
    } else {
        set(presetPromptsAtom, prev => prev.map(p => 
            p.id === id ? { ...p, text: text, groupId: get(editingPresetGroupIdAtom) || undefined } : p
        ));
    }
    set(handleCancelPresetAtom);
});

export const handleDeletePresetPromptAtom = atom(null, (get, set, id: string) => {
    set(presetPromptsAtom, prev => prev.filter(p => p.id !== id));
});