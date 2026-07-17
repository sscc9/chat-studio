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
    isMac
} from '../store';

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const scrollRestoreRef = useRef<{ scrollTop: number } | null>(null);

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
            <div className="message-bubble">
                {!isRegenerating && (
                    <div className="message-actions">
                        {isEditing ? (
                            <>
                                <button title="保存" onClick={() => handleSaveEdit()} disabled={!editingMessageContent.trim()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>
                                </button>
                                {msg.role === 'user' && (
                                    <button title="保存并重新生成" onClick={() => handleSaveAndRegenerate()} disabled={!editingMessageContent.trim() || isLoading || !isAIReady}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" /></svg>
                                    </button>
                                )}
                                <button title="取消" onClick={() => handleCancelEdit()} className="cancel-edit-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button title="编辑" onClick={startEditAndCaptureScroll} disabled={!hasEditableText || isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg>
                                </button>
                                <button title="复制" onClick={() => handleCopyMessage(msg.parts)} disabled={!hasTextContent || isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>
                                </button>
                                <button title="重新生成" onClick={() => handleRegenerateResponse(index)} disabled={!canRegenerate || isLoading || disableActions || !isAIReady}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" /></svg>
                                </button>
                                <button title="从此处派生对话" onClick={() => handleForkChat(index)} disabled={isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z" /></svg>
                                </button>
                                <button
                                    title={confirmingDelete ? "确认删除" : "删除"}
                                    onClick={() => confirmingDelete ? handleDeleteMessage(index) : setConfirmingDelete(true)}
                                    className={confirmingDelete ? 'confirm-delete' : ''}
                                    disabled={isLoading || disableActions}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
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