/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import './PresetPromptEditorModal.css'; // Reusing the same CSS
import {
    isSystemPresetEditorOpenAtom,
    editingSystemPresetIdAtom,
    editingSystemPresetTextAtom,
    handleSaveSystemPresetAtom,
    handleCancelSystemPresetAtom,
    systemPresetEditorPositionAtom,
    systemPresetGroupsAtom,
    editingSystemPresetGroupIdAtom,
    isMac,
} from '../store';


export const SystemPresetEditorModal = () => {
    const [isOpen] = useAtom(isSystemPresetEditorOpenAtom);
    const [editingPresetId] = useAtom(editingSystemPresetIdAtom);
    const [text, setText] = useAtom(editingSystemPresetTextAtom);
    const [currentGroupId, setCurrentGroupId] = useAtom(editingSystemPresetGroupIdAtom);
    const [position] = useAtom(systemPresetEditorPositionAtom);
    const [groups] = useAtom(systemPresetGroupsAtom);
    const onSave = useSetAtom(handleSaveSystemPresetAtom);
    const onClose = useSetAtom(handleCancelSystemPresetAtom);

    const isEditing = editingPresetId !== 'new';
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none', transform: 'scale(0.95)' });
    const isInitialOpenRender = useRef(true);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const groupDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            isInitialOpenRender.current = true;
        }
    }, [isOpen]);

    useLayoutEffect(() => {
        if (isOpen && modalRef.current && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;

            const modal = modalRef.current;
            const rect = modal.getBoundingClientRect();
            const PADDING = 15;

            if (isInitialOpenRender.current) {
                let top = position.top - rect.height / 2;
                let left = position.left - rect.width - PADDING;

                if (left < PADDING) left = PADDING;
                if (top < PADDING) top = PADDING;
                if (top + rect.height > window.innerHeight - PADDING) {
                    top = window.innerHeight - rect.height - PADDING;
                }

                setStyle({ top: `${top}px`, left: `${left}px`, opacity: 1, pointerEvents: 'auto', transform: 'scale(1)' });
                textarea.focus();
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
                isInitialOpenRender.current = false;
            } else {
                setStyle(prevStyle => {
                    if (!prevStyle.top) return prevStyle;

                    const currentTop = parseFloat(prevStyle.top as string);
                    let newTop = currentTop;

                    if (currentTop + rect.height > window.innerHeight - PADDING) {
                        newTop = window.innerHeight - rect.height - PADDING;
                    }

                    if (newTop !== currentTop) {
                        return { ...prevStyle, top: `${newTop}px` };
                    }

                    return prevStyle;
                });
            }
        } else {
            setStyle(prev => ({ ...prev, opacity: 0, pointerEvents: 'none', transform: 'scale(0.95)' }));
        }
    }, [isOpen, position, text]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
                setIsGroupDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={`preset-prompt-editor-overlay ${isOpen ? 'visible' : ''}`}
        >
            <div
                className="preset-prompt-editor"
                ref={modalRef}
                style={style}
            >
                <div className="preset-prompt-editor-header">
                    <div className="preset-prompt-editor-header-main">
                        <h3>{isEditing ? "编辑系统提示词" : "新建系统提示词"}</h3>
                        <div className="group-selector-wrapper" ref={groupDropdownRef}>
                            <button className={`group-selector-trigger ${isGroupDropdownOpen ? 'is-open' : ''}`} onClick={() => setIsGroupDropdownOpen(o => !o)}>
                                <span>{groups.find(g => g.id === currentGroupId)?.name || '未分组'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708 .708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" /></svg>
                            </button>
                            {isGroupDropdownOpen && (
                                <div className="group-selector-options">
                                    <div className="group-selector-option" onClick={() => { (setCurrentGroupId as any)(() => null); setIsGroupDropdownOpen(false); }}>未分组</div>
                                    {groups.map(g => (
                                        <div key={g.id} className="group-selector-option" onClick={() => { (setCurrentGroupId as any)(g.id); setIsGroupDropdownOpen(false); }}>{g.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="preset-prompt-editor-header-actions">
                        <button onClick={() => onSave()} disabled={!text.trim()} title={`保存 (${isMac ? 'Cmd' : 'Ctrl'}+Enter)`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                            </svg>
                        </button>
                        <button onClick={() => onClose()} title="取消 (Esc)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="preset-prompt-editor-body">
                    <textarea
                        ref={textareaRef}
                        placeholder="输入系统提示词内容..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
                                e.preventDefault();
                                if (text.trim()) {
                                    onSave();
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
