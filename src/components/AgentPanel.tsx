/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { MessageContent } from './MessageContent';
import './AgentPanel.css';
import {
    currentChatAtom,
    agentMessagesAtom,
    agentUserInputAtom,
    isAgentLoadingAtom,
    handleSendToAgentAtom,
    aiAtom,
    isActionLogViewerOpenAtom,
    handleDeleteLogEntryAtom,
    handleAnalyzeChatAtom,
    handleDeleteAgentMessageAtom,
    handleRegenerateAgentResponseAtom,
    handleClearAgentChatAtom,
    isMac,
    agentRegeneratingIndexAtom,
    handleStopAgentGenerationAtom,
    handleClearActionLogAtom,
} from '../store';
import type { ActionLogEntry, Message } from "../types";

export const ActionLogViewerModal = () => {
    const [isOpen, setIsOpen] = useAtom(isActionLogViewerOpenAtom);
    const currentChat = useAtomValue(currentChatAtom);
    const handleClearLog = useSetAtom(handleClearActionLogAtom);

    const getRolePrefix = (payload: Record<string, any>): string => {
        const message = payload.content || payload.originalContent;
        if (message && message.role) {
            return message.role === 'user' ? 'User' : 'AI';
        }
        return '';
    };

    const formatLogSummary = (log: ActionLogEntry) => {
        const role = getRolePrefix(log.payload);
        switch (log.type) {
            case 'new_chat': return `Created new chat`;
            case 'rename_chat': return `Renamed chat`;
            case 'fork_chat': return `Branched chat`;
            case 'edit_message': return `Edited ${role} message`;
            case 'agent_edit_message': return `Agent edited ${role} message`;
            case 'edit_and_regenerate': return `Edited & regenerated ${role} message`;
            case 'delete_message': return `Deleted ${role} message`;
            case 'regenerate_response': return `Regenerated response`;
            case 'change_system_prompt': return `Changed system prompt`;
            case 'agent_edit_system_prompt': return `Agent changed system prompt`;
            case 'change_model': return `Switched model to <strong>${log.payload.to}</strong>`;
            case 'toggle_web_search': return `Web search ${log.payload.value ? 'enabled' : 'disabled'}`;
            default: return `Action: ${log.type}`;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`action-log-viewer-overlay ${isOpen ? "visible" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <div className="action-log-viewer">
                <div className="action-log-viewer-header">
                    <h3>Action Log for "{currentChat?.title}"</h3>
                    <div className="action-log-header-actions">
                         <button onClick={() => handleClearLog()} title="Clear entire log">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                        <button onClick={() => setIsOpen(false)} aria-label="Close action log viewer">&times;</button>
                    </div>
                </div>
                <div className="action-log-viewer-content">
                    {currentChat?.actionLog?.map((log) => (
                        <details key={log.id} className="action-log-item">
                            <summary>
                                <span className="action-log-summary-content">
                                    <span className="action-log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    <span className="action-log-text" dangerouslySetInnerHTML={{ __html: formatLogSummary(log) }}></span>
                                </span>
                            </summary>
                            <div className="action-log-details">
                                <pre><code>{JSON.stringify(log.payload, null, 2)}</code></pre>
                            </div>
                        </details>
                    ))}
                    {(!currentChat?.actionLog || currentChat.actionLog.length === 0) && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No actions logged for this chat yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const AgentChatMessage = React.memo(({ msg, index }: { msg: Message, index: number }) => {
    const [isAgentLoading] = useAtom(isAgentLoadingAtom);
    const [agentRegeneratingIndex] = useAtom(agentRegeneratingIndexAtom);
    const deleteMessage = useSetAtom(handleDeleteAgentMessageAtom);
    const regenerateResponse = useSetAtom(handleRegenerateAgentResponseAtom);
    const canRegenerate = msg.role === 'user' || (msg.role === 'model' && index > 0);

    const isRegenerating = agentRegeneratingIndex === index;
    const hasTextContent = useMemo(() => msg.parts.some(p => p.text?.trim()), [msg.parts]);
    
    return (
        <div className={`chat-message role-${msg.role}`}>
            <div className="message-bubble">
                <div className="agent-message-actions">
                    <button title="Regenerate" onClick={() => regenerateResponse(index)} disabled={isAgentLoading || !canRegenerate}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="1 1 14 14"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
                    </button>
                    <button title="Delete" onClick={() => deleteMessage(index)} disabled={isAgentLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                    </button>
                </div>
                <div className="message-header">
                    <span className="message-author">{msg.role === 'user' ? 'You' : 'Agent'}</span>
                </div>
                 <div className="message-body">
                    {isRegenerating && !hasTextContent && <div className="loading-indicator"><span></span><span></span><span></span></div>}
                    <div style={{ minHeight: isRegenerating && !hasTextContent ? '1.6em' : 'auto' }}>
                        <MessageContent parts={msg.parts} />
                    </div>
                </div>
            </div>
        </div>
    );
});


const AgentChatInterface = () => {
    const [messages] = useAtom(agentMessagesAtom);
    const [userInput, setUserInput] = useAtom(agentUserInputAtom);
    const [isLoading] = useAtom(isAgentLoadingAtom);
    const [ai] = useAtom(aiAtom);
    const sendMessage = useSetAtom(handleSendToAgentAtom);
    const stopGeneration = useSetAtom(handleStopAgentGenerationAtom);
    const clearChat = useSetAtom(handleClearAgentChatAtom);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [userInput]);

    const lastMessage = messages[messages.length - 1];

    return (
        <div className="agent-chat-section">
            <label>Agent Chat</label>
            <div className="agent-chat-messages-wrapper">
                <div className="agent-chat-messages">
                    {messages.map((msg, index) => (
                         <AgentChatMessage key={`${currentChatAtom.toString()}-${index}`} msg={msg} index={index} />
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <div className="chat-message role-model">
                            <div className="message-bubble">
                                <div className="message-header"><span className="message-author">Agent</span></div>
                                <div className="message-body"><div className="loading-indicator"><span></span><span></span><span></span></div></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <button
                    className="agent-chat-clear-btn"
                    onClick={() => clearChat()}
                    title="Clear agent chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            </div>
            <div className="agent-input-row">
                <div className="agent-textarea-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={!ai ? "Agent offline" : "Ask the agent..."}
                        rows={1}
                        disabled={!ai}
                    />
                </div>
                {isLoading ? (
                     <button onClick={stopGeneration} className="agent-send-button stop-generating-btn" title="Stop generation">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="stop-icon" viewBox="0 0 16 16">
                            <rect width="16" height="16" rx="2" />
                        </svg>
                    </button>
                ) : (
                    <button 
                        className="agent-send-button"
                        onClick={() => sendMessage()} 
                        disabled={!ai || (!userInput.trim() && lastMessage?.role !== 'user')} 
                        title="Send to Agent (Cmd/Ctrl+Enter)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export const AgentPanel = () => {
    const setIsActionLogOpen = useSetAtom(isActionLogViewerOpenAtom);
    const analyzeChat = useSetAtom(handleAnalyzeChatAtom);
    const currentChat = useAtomValue(currentChatAtom);
    const logCount = currentChat?.actionLog?.length || 0;

    return (
        <div className="agent-panel">
            <div className="agent-panel-header">
                 <button 
                    className="agent-action-button" 
                    onClick={() => analyzeChat()}
                    disabled={!currentChat}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                    <span>Analyze Chat</span>
                </button>
                <button 
                    className="agent-action-button" 
                    onClick={() => setIsActionLogOpen(true)}
                    disabled={!currentChat}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM8 7a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 7zm2-3H6a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z"/>
                    </svg>
                    <span>Log ({logCount})</span>
                </button>
            </div>
            <AgentChatInterface />
        </div>
    );
};