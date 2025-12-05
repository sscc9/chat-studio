/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import './ChatInputArea.css';
import {
    userInputAtom,
    attachedFilesAtom,
    handleRemoveFileAtom,
    chatInputRefAtom,
    fileInputRefAtom,
    handleFileChangeAtom,
    isLoadingAtom,
    handleStopGenerationAtom,
    handleSendMessageAtom,
    handleSendUserMessageOnlyAtom,
    aiAtom,
    editingMessageIndexAtom,
    trackActiveInputAtom,
    currentChatAtom,
    isMac,
} from '../store';

export const ChatInputArea = () => {
    const [userInput, setUserInput] = useAtom(userInputAtom);
    const [attachedFiles] = useAtom(attachedFilesAtom);
    const handleRemoveFile = useSetAtom(handleRemoveFileAtom);
    const chatInputRef = useAtom(chatInputRefAtom)[0];
    const fileInputRef = useAtom(fileInputRefAtom)[0];
    const handleFileChange = useSetAtom(handleFileChangeAtom);
    const [isLoading] = useAtom(isLoadingAtom);
    const handleStopGeneration = useSetAtom(handleStopGenerationAtom);
    const handleSendMessage = useSetAtom(handleSendMessageAtom);
    const handleSendUserMessageOnly = useSetAtom(handleSendUserMessageOnlyAtom);
    const [ai] = useAtom(aiAtom);
    const [editingMessageIndex] = useAtom(editingMessageIndexAtom);
    const trackActiveInput = useSetAtom(trackActiveInputAtom);
    const [currentChat] = useAtom(currentChatAtom);

    const lastMessage = currentChat?.messages[currentChat.messages.length - 1];

    useEffect(() => {
        if (chatInputRef.current) {
            const textarea = chatInputRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [userInput, chatInputRef]);

    return (
        <div className="chat-input-area">
            {attachedFiles.length > 0 && (
            <div className="file-previews">
                {attachedFiles.map((file, index) => (
                <div key={index} className="file-pill">
                    <span>{file.name}</span>
                    <button onClick={() => handleRemoveFile(file.name)}>×</button>
                </div>
                ))}
            </div>
            )}
            <div className={`input-row${!userInput ? ' is-empty' : ''}`}>
                <textarea
                    ref={chatInputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={!ai ? "API key not configured" : "Type your message..."}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) {
                        e.preventDefault();
                        handleSendMessage();
                        } else if (e.altKey) {
                        e.preventDefault();
                        handleSendUserMessageOnly();
                        }
                    }
                    }}
                    onFocus={(e) => trackActiveInput(e, 'main')}
                    onKeyUp={(e) => trackActiveInput(e, 'main')}
                    onMouseUp={(e) => trackActiveInput(e, 'main')}
                    onSelect={(e) => trackActiveInput(e, 'main')}
                    rows={1}
                    disabled={!ai}
                ></textarea>
                <div className="input-controls">
                    <div className="input-controls-left">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleFileChange(e)}
                            multiple
                            accept="image/*,audio/*,video/*,text/plain"
                            style={{ display: 'none' }}
                            disabled={!ai}
                        />
                        <button
                            className="attach-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach files"
                            disabled={!ai}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" /></svg>
                        </button>
                    </div>
                    <div className="input-controls-right">
                        {isLoading ? (
                            <button onClick={handleStopGeneration} className="stop-generating-btn" title="Stop generation">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="stop-icon" viewBox="0 0 16 16">
                                <rect width="16" height="16" rx="2" />
                            </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!ai || (!userInput.trim() && attachedFiles.length === 0 && lastMessage?.role !== 'user') || editingMessageIndex !== null}
                                title="Send message"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}