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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
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