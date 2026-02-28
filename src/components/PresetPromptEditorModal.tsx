/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import './PresetPromptEditorModal.css';
import {
    isPresetEditorOpenAtom,
    editingPresetIdAtom,
    editingPresetTextAtom,
    handleSavePresetAtom,
    handleCancelPresetAtom,
    presetEditorPositionAtom,
    presetGroupsAtom,
    editingPresetGroupIdAtom,
    isMac,
} from '../store';


export const PresetPromptEditorModal = () => {
    const [isOpen] = useAtom(isPresetEditorOpenAtom);
    const [editingPresetId] = useAtom(editingPresetIdAtom);
    const [text, setText] = useAtom(editingPresetTextAtom);
    const [currentGroupId, setCurrentGroupId] = useAtom(editingPresetGroupIdAtom);
    const [position] = useAtom(presetEditorPositionAtom);
    const [groups] = useAtom(presetGroupsAtom);
    const onSave = useSetAtom(handleSavePresetAtom);
    const onClose = useSetAtom(handleCancelPresetAtom);

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
                        <h3>{isEditing ? "编辑预设 Prompt" : "新建预设 Prompt"}</h3>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                        </button>
                        <button onClick={() => onClose()} title="取消 (Esc)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="preset-prompt-editor-body">
                    <textarea
                        ref={textareaRef}
                        placeholder="输入预设 Prompt..."
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