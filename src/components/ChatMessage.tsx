/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useAtom, useSetAtom } from 'jotai';
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
    aiAtom,
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
    const [ai] = useAtom(aiAtom);
    
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
    const scrollRestoreRef = useRef<{scrollTop: number} | null>(null);

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
                                <button title="Save" onClick={() => handleSaveEdit()} disabled={!editingMessageContent.trim()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="1 1 14 14">
                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                    </svg>
                                </button>
                                {msg.role === 'user' && (
                                     <button title="Save & Regenerate" onClick={() => handleSaveAndRegenerate()} disabled={!editingMessageContent.trim() || isLoading || !ai}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="1 1 14 14"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
                                     </button>
                                )}
                                <button title="Cancel" onClick={() => handleCancelEdit()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="1 1 14 14">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button title="Edit" onClick={startEditAndCaptureScroll} disabled={!hasEditableText || isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="-0.5 -0.5 17 17"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z"/></svg>
                                </button>
                                <button title="Copy" onClick={() => handleCopyMessage(msg.parts)} disabled={!hasTextContent || isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                                <button title="Regenerate" onClick={() => handleRegenerateResponse(index)} disabled={!canRegenerate || isLoading || disableActions || !ai}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="1 1 14 14"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
                                </button>
                                <button title="Branch from here" onClick={() => handleForkChat(index)} disabled={isLoading || disableActions}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="18" r="3"/>
                                        <circle cx="6" cy="6" r="3"/>
                                        <circle cx="18" cy="6" r="3"/>
                                        <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/>
                                        <path d="M12 12v3"/>
                                    </svg>
                                </button>
                                <button
                                    title={confirmingDelete ? "Confirm Delete" : "Delete"}
                                    onClick={() => confirmingDelete ? handleDeleteMessage(index) : setConfirmingDelete(true)}
                                    className={confirmingDelete ? 'confirm-delete' : ''}
                                    disabled={isLoading || disableActions}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                )}
                <div className="message-header">
                    <span className="message-author">{msg.role === 'user' ? 'User' : 'Ai'}</span>
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
                                     if (editingMessageContent.trim() && ai) {
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
                        <strong>Sources:</strong>
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