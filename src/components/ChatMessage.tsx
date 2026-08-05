/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import type { Message } from '../types';
import { MessageContent } from './MessageContent';
import './ChatMessage.css';
import {
    editingMessageIndexAtom,
    editingMessageContentAtom,
    isLoadingAtom,
    regeneratingIndexAtom,
    handleStartEditMessageAtom,
    handleCancelEditAtom,
    handleSaveEditAtom,
    handleSaveAndRegenerateAtom,
    handleRegenerateResponseAtom,
    handleDeleteMessageAtom,
    handleCopyMessageAtom,
    handleForkChatAtom,
    isAIReadyAtom,
    trackActiveInputAtom,
    isMobileAtom,
    isMac
} from '../store';
import { Check, RotateCw, X, Pencil, Copy, GitFork, Trash2 } from 'lucide-react';

interface ChatMessageProps {
    msg: Message;
    index: number;
}

export const ChatMessage = React.memo(({
    msg,
    index,
}: ChatMessageProps) => {
    const [editingMessageIndex] = useAtom(editingMessageIndexAtom);
    const [editingMessageContent, setEditingMessageContent] = useAtom(editingMessageContentAtom);
    const [isLoading] = useAtom(isLoadingAtom);
    const [regeneratingIndex] = useAtom(regeneratingIndexAtom);
    const isAIReady = useAtomValue(isAIReadyAtom);
    const isMobile = useAtomValue(isMobileAtom);

    const handleStartEditMessage = useSetAtom(handleStartEditMessageAtom);
    const handleCancelEdit = useSetAtom(handleCancelEditAtom);
    const handleSaveEdit = useSetAtom(handleSaveEditAtom);
    const handleSaveAndRegenerate = useSetAtom(handleSaveAndRegenerateAtom);
    const handleRegenerateResponse = useSetAtom(handleRegenerateResponseAtom);
    const handleDeleteMessage = useSetAtom(handleDeleteMessageAtom);
    const handleCopyMessage = useSetAtom(handleCopyMessageAtom);
    const handleForkChat = useSetAtom(handleForkChatAtom);
    const trackActiveInput = useSetAtom(trackActiveInputAtom);

    const isEditing = editingMessageIndex === index;
    const isRegenerating = regeneratingIndex === index;
    const isAnyMessageEditing = editingMessageIndex !== null;

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const scrollRestoreRef = useRef<{ scrollTop: number } | null>(null);

    useEffect(() => {
        if (!showMobileActions) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (messageRef.current && !messageRef.current.contains(e.target as Node)) {
                setShowMobileActions(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [showMobileActions]);

    const handleBubbleClick = (e: React.MouseEvent) => {
        if (isMobile) {
            const target = e.target as HTMLElement;
            if (target.closest('.message-actions') || target.closest('.message-editor-textarea')) {
                return;
            }
            setShowMobileActions(prev => !prev);
        }
    };

    const hasTextContent = useMemo(() => msg.parts.some(p => p.text?.trim()), [msg.parts]);
    const canRegenerate = (msg.role === 'model' && index > 0) || (msg.role === 'user');
    const hasEditableText = msg.parts.some(p => 'text' in p);
    const disableActions = isAnyMessageEditing && !isEditing;

    const startEditAndCaptureScroll = () => {
        const scrollContainer = messageRef.current?.closest('.chat-messages');
        if (scrollContainer) {
            scrollRestoreRef.current = { scrollTop: scrollContainer.scrollTop };
        }
        handleStartEditMessage(index);
    };

    useEffect(() => {
        setConfirmingDelete(false);
    }, [msg, index]);

    useEffect(() => {
        if (!confirmingDelete) return;
        const timer = setTimeout(() => setConfirmingDelete(false), 3000);
        return () => clearTimeout(timer);
    }, [confirmingDelete]);


    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            if (window.innerWidth > 768) {
                textarea.focus({ preventScroll: true });
            }
            const len = textarea.value.length;
            textarea.setSelectionRange(len, len);
            trackActiveInput({ currentTarget: textarea } as React.SyntheticEvent<HTMLTextAreaElement>, 'editor');
        }
    }, [isEditing, trackActiveInput]);

    useLayoutEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            const scrollContainer = textarea.closest('.chat-messages');

            let scrollTopToRestore;

            if (scrollRestoreRef.current) {
                scrollTopToRestore = scrollRestoreRef.current.scrollTop;
                scrollRestoreRef.current = null;
            } else if (scrollContainer) {
                scrollTopToRestore = scrollContainer.scrollTop;
            }

            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;

            if (scrollContainer && scrollTopToRestore !== undefined) {
                scrollContainer.scrollTop = scrollTopToRestore;
            }
        }
    }, [isEditing, editingMessageContent]);

    return (
        <div
            ref={messageRef}
            className={`chat-message role-${msg.role}${isEditing ? ' is-editing' : ''}`}
            onMouseLeave={() => setConfirmingDelete(false)}
        >
            <div className="message-bubble" onClick={handleBubbleClick}>
                {!isRegenerating && (
                    <div className={`message-actions${showMobileActions ? ' mobile-visible' : ''}`}>
                        {isEditing ? (
                            <>
                                <button title="保存" onClick={() => handleSaveEdit()} disabled={!editingMessageContent.trim()}>
                                    <Check size={14} strokeWidth={1.75} />
                                </button>
                                {msg.role === 'user' && (
                                    <button title="保存并重新生成" onClick={() => handleSaveAndRegenerate()} disabled={!editingMessageContent.trim() || isLoading || !isAIReady}>
                                        <RotateCw size={14} strokeWidth={1.75} />
                                    </button>
                                )}
                                <button title="取消" onClick={() => handleCancelEdit()} className="cancel-edit-btn">
                                    <X size={14} strokeWidth={1.75} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button title="编辑" onClick={startEditAndCaptureScroll} disabled={!hasEditableText || isLoading || disableActions || (isMobile && !showMobileActions)}>
                                    <Pencil size={14} strokeWidth={1.75} />
                                </button>
                                <button title="复制" onClick={() => handleCopyMessage(msg.parts)} disabled={!hasTextContent || isLoading || disableActions || (isMobile && !showMobileActions)}>
                                    <Copy size={14} strokeWidth={1.75} />
                                </button>
                                <button title="重新生成" onClick={() => handleRegenerateResponse(index)} disabled={!canRegenerate || isLoading || disableActions || !isAIReady || (isMobile && !showMobileActions)}>
                                    <RotateCw size={14} strokeWidth={1.75} />
                                </button>
                                <button title="从此处派生对话" onClick={() => handleForkChat(index)} disabled={isLoading || disableActions || (isMobile && !showMobileActions)}>
                                    <GitFork size={14} strokeWidth={1.75} />
                                </button>
                                <button
                                    title={confirmingDelete ? "确认删除" : "删除"}
                                    onClick={() => confirmingDelete ? handleDeleteMessage(index) : setConfirmingDelete(true)}
                                    className={confirmingDelete ? 'confirm-delete' : ''}
                                    disabled={isLoading || disableActions || (isMobile && !showMobileActions)}
                                >
                                    <Trash2 size={14} strokeWidth={1.75} />
                                </button>
                            </>
                        )}
                    </div>
                )}
                <div className="message-header">
                    <span className="message-author">{msg.role === 'user' ? '用户' : 'AI'}</span>
                </div>
                <div className="message-body">
                    {isRegenerating && !hasTextContent && <div className="loading-indicator"><span></span><span></span><span></span></div>}
                    {isEditing ? (
                        <textarea
                            ref={textareaRef}
                            className="message-editor-textarea"
                            value={editingMessageContent}
                            onChange={(e) => setEditingMessageContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || (isMac ? e.altKey : (e.ctrlKey || e.altKey)))) {
                                    e.preventDefault();
                                    if (editingMessageContent.trim() && isAIReady) {
                                        if (msg.role === 'user') {
                                            handleSaveAndRegenerate();
                                        } else {
                                            handleSaveEdit();
                                        }
                                    }
                                }
                                if (e.key === 'Escape') { handleCancelEdit(); }
                            }}
                            onFocus={(e) => trackActiveInput(e, 'editor')}
                            onKeyUp={(e) => trackActiveInput(e, 'editor')}
                            onMouseUp={(e) => trackActiveInput(e, 'editor')}
                            onSelect={(e) => trackActiveInput(e, 'editor')}
                            rows={1}
                        />
                    ) : (
                        <div style={{ minHeight: isRegenerating && !hasTextContent ? '1.6em' : 'auto' }}>
                            <MessageContent parts={msg.parts} />
                        </div>
                    )}
                </div>
                {!isEditing && msg.role === 'model' && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="grounding-sources">
                        <strong>引用来源:</strong>
                        <ol>
                            {msg.groundingChunks.map((chunk, chunkIndex) => (
                                chunk.web?.uri && (
                                    <li key={`${index}-${chunkIndex}-${chunk.web.uri}`}>
                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer">
                                            {chunk.web.title || chunk.web.uri}
                                        </a>
                                    </li>
                                )
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
});