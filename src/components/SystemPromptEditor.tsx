/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './SystemPromptEditor.css';
import {
    isSystemPromptEditorOpenAtom,
    systemInstructionAtom,
    handleConfigChangeAtom,
    systemPromptTextareaRefAtom,
} from '../store';

export const SystemPromptEditor = () => {
    const [isSystemPromptEditorOpen, setIsSystemPromptEditorOpen] = useAtom(isSystemPromptEditorOpenAtom);
    const systemInstruction = useAtomValue(systemInstructionAtom);
    const handleConfigChange = useSetAtom(handleConfigChangeAtom);
    const systemPromptTextareaRef = useAtomValue(systemPromptTextareaRefAtom);
    
    return (
        <div className={`system-prompt-overlay ${isSystemPromptEditorOpen ? "visible" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) { setIsSystemPromptEditorOpen(false); } }}>
            <div className={`system-prompt-editor ${isSystemPromptEditorOpen ? "open" : ""}`}>
            <div className="system-prompt-editor-header">
                <h3>System Prompt</h3>
                <button onClick={() => setIsSystemPromptEditorOpen(false)} aria-label="Close system prompt editor">&times;</button>
            </div>
            <div className="system-prompt-editor-body">
                <textarea
                ref={systemPromptTextareaRef}
                placeholder="e.g., You are a helpful assistant who speaks like a pirate."
                value={systemInstruction ?? ''}
                onChange={(e) => handleConfigChange({ systemInstruction: e.target.value })}
                />
            </div>
            </div>
        </div>
    );
};