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
                    <h3>系统提示词</h3>
                    <button onClick={() => setIsSystemPromptEditorOpen(false)} aria-label="关闭系统提示词编辑器" title="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </button>
                </div>
                <div className="system-prompt-editor-body">
                    <textarea
                        ref={systemPromptTextareaRef}
                        placeholder="例如：你是一个乐于助人的助手，说话像个海盗。"
                        value={systemInstruction ?? ''}
                        onChange={(e) => handleConfigChange({ systemInstruction: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};