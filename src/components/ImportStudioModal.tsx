/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import './ImportStudioModal.css';
import {
    isImportStudioModalOpenAtom,
    handleImportFromStudioAtom,
} from '../store';
import type { Message } from '../types';

/**
 * Parses AI Studio conversation text into Message[] array.
 * Format: Lines starting with "User:" or "Model:" delimit messages.
 * Everything between delimiters belongs to that message.
 */
function parseStudioConversation(text: string): Message[] {
    const messages: Message[] = [];
    if (!text.trim()) return messages;

    const lines = text.split('\n');
    let currentRole: 'user' | 'model' | null = null;
    let currentContent: string[] = [];

    const flushCurrent = () => {
        if (currentRole && currentContent.length > 0) {
            const text = currentContent.join('\n').trim();
            if (text) {
                messages.push({
                    role: currentRole,
                    parts: [{ text }],
                });
            }
        }
        currentContent = [];
    };

    for (const line of lines) {
        // Check if line starts with "User:" or "Model:" (case-insensitive for the marker)
        const userMatch = line.match(/^User:\s?(.*)/i);
        const modelMatch = line.match(/^Model:\s?(.*)/i);

        if (userMatch) {
            flushCurrent();
            currentRole = 'user';
            if (userMatch[1]) currentContent.push(userMatch[1]);
        } else if (modelMatch) {
            flushCurrent();
            currentRole = 'model';
            if (modelMatch[1]) currentContent.push(modelMatch[1]);
        } else if (currentRole) {
            currentContent.push(line);
        }
    }
    flushCurrent();

    return messages;
}

export const ImportStudioModal = () => {
    const [isOpen, setIsOpen] = useAtom(isImportStudioModalOpenAtom);
    const handleImport = useSetAtom(handleImportFromStudioAtom);

    const [rawText, setRawText] = useState('');
    const [title, setTitle] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parsedMessages = useMemo(() => parseStudioConversation(rawText), [rawText]);

    const userCount = parsedMessages.filter(m => m.role === 'user').length;
    const modelCount = parsedMessages.filter(m => m.role === 'model').length;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            if (typeof text === 'string') {
                setRawText(text);
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    const handleConfirm = () => {
        handleImport(parsedMessages, title);
        handleClose();
    };

    const handleClose = () => {
        setIsOpen(false);
        setRawText('');
        setTitle('');
        setFileName('');
    };

    if (!isOpen) return null;

    return (
        <div className="import-studio-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
            <div className="import-studio-modal">
                <div className="import-studio-header">
                    <h3>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
                            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                        </svg>
                        从 AI Studio 导入对话
                    </h3>
                    <div className="import-studio-header-actions">
                        <button onClick={handleClose} aria-label="关闭" title="关闭">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="import-studio-content">
                    <input
                        type="text"
                        className="import-studio-title-input"
                        placeholder="对话标题（可选，留空自动生成）"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="import-studio-upload-area">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt"
                            style={{ display: 'none' }}
                        />
                        <button
                            className="import-studio-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                            </svg>
                            上传 .txt 文件
                        </button>
                        {fileName && <span className="import-studio-file-name">{fileName}</span>}
                    </div>

                    <div className="import-studio-textarea-wrapper">
                        <label>对话内容（格式：User: ... / Model: ...）</label>
                        <textarea
                            className="import-studio-textarea"
                            placeholder={'粘贴或编辑对话内容...\n\n格式示例：\nUser: 你好\nModel: 你好！有什么可以帮助你的吗？\nUser: 请写一首诗\nModel: 春风拂面柳丝长...'}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="import-studio-footer">
                    <div className="import-studio-preview">
                        {parsedMessages.length > 0 ? (
                            <>
                                <span className="import-studio-preview-tag user">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z" /></svg>
                                    {userCount} 条用户消息
                                </span>
                                <span className="import-studio-preview-tag model">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25.14 25.14 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135z" /><path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5z" /></svg>
                                    {modelCount} 条AI消息
                                </span>
                            </>
                        ) : (
                            <span>请上传文件或粘贴对话内容</span>
                        )}
                    </div>
                    <div className="import-studio-actions">
                        <button className="import-studio-cancel-btn" onClick={handleClose}>取消</button>
                        <button
                            className="import-studio-confirm-btn"
                            onClick={handleConfirm}
                            disabled={parsedMessages.length === 0}
                        >
                            导入 {parsedMessages.length > 0 ? `(${parsedMessages.length})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
