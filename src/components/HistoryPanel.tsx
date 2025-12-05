/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './HistoryPanel.css';
import {
    // State Atoms
    chatsAtom, currentChatIdAtom, editingChatIdAtom, editingTitleAtom, isHistoryPanelVisibleAtom,
    isHistoryPanelOpenAtom, setIsHistoryPanelOpenAtom, isTrashModalOpenAtom,
    
    // Action Atoms
    handleNewChatAtom, handleImportFileAtom, handleImportClickAtom, handleExportChatsAtom,
    handleSelectChatAtom, handleDragStartAtom, handleDropAtom, handleDragEndAtom,
    handleStartEditingAtom, handleTogglePinAtom, handleDeleteChatAtom, handleTitleUpdateAtom,
    
    // Derived Atoms
    sortedChatsAtom,
    trashedChatsAtom,
    
    // Ref Atoms
    importFileRefAtom,
} from '../store';

export const HistoryPanel = () => {
    // Read/Write State
    const [currentChatId] = useAtom(currentChatIdAtom);
    const [editingChatId, setEditingChatId] = useAtom(editingChatIdAtom);
    const [editingTitle, setEditingTitle] = useAtom(editingTitleAtom);
    const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useAtom(isHistoryPanelVisibleAtom);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useAtom(isHistoryPanelOpenAtom);

    // Read-Only State
    const sortedChats = useAtomValue(sortedChatsAtom);
    const trashedChats = useAtomValue(trashedChatsAtom);
    
    // Write-Only Functions (Actions)
    const handleNewChat = useSetAtom(handleNewChatAtom);
    const handleImportFile = useSetAtom(handleImportFileAtom);
    const handleImportClick = useSetAtom(handleImportClickAtom);
    const handleExportChats = useSetAtom(handleExportChatsAtom);
    const handleSelectChat = useSetAtom(handleSelectChatAtom);
    const handleDragStart = useSetAtom(handleDragStartAtom);
    const handleDrop = useSetAtom(handleDropAtom);
    const handleDragEnd = useSetAtom(handleDragEndAtom);
    const handleStartEditing = useSetAtom(handleStartEditingAtom);
    const handleTogglePin = useSetAtom(handleTogglePinAtom);
    const handleDeleteChat = useSetAtom(handleDeleteChatAtom);
    const handleTitleUpdate = useSetAtom(handleTitleUpdateAtom);
    const setIsTrashModalOpen = useSetAtom(isTrashModalOpenAtom);
    
    // Refs
    const importFileRef = useAtomValue(importFileRefAtom);
    const hasTrashedItems = trashedChats.length > 0;

    return (
        <aside className={`history-panel ${isHistoryPanelOpen ? 'mobile-open' : ''}`}>
            <div className="panel-content-wrapper">
                <div className="history-panel-header">
                    <div className="history-header-left">
                        <button className="new-chat-btn" onClick={() => handleNewChat()}>
                            + New Chat
                        </button>
                        <input type="file" ref={importFileRef} onChange={handleImportFile} accept=".json" style={{ display: 'none' }} />
                        <button className="icon-btn" title="Import Data" onClick={handleImportClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                        </button>
                        <button className="icon-btn" title="Export All Data" onClick={handleExportChats}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
                        </button>
                        <button
                            className="icon-btn trash-btn"
                            title="Trash"
                            onClick={() => setIsTrashModalOpen(true)}
                        >
                            {hasTrashedItems ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            )}
                        </button>
                    </div>
                <div className="history-header-right">
                    <button
                        className="panel-toggle-btn"
                        onClick={() => setIsHistoryPanelVisible(false)}
                        aria-label="Hide history panel"
                        title="Hide history panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708 .708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                    </button>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsHistoryPanelOpen(false)}
                        aria-label="Close history panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708 .708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                    </button>
                </div>
                </div>
                <nav onDragOver={(e) => e.preventDefault()}>
                {sortedChats.map((chat) => (
                    <div
                    key={chat.id}
                    className={`history-item ${chat.id === currentChatId ? "active" : ""}`}
                    onClick={() => editingChatId !== chat.id && handleSelectChat(chat.id)}
                    aria-current={chat.id === currentChatId}
                    draggable={editingChatId !== chat.id}
                    onDragStart={(e) => handleDragStart(e, chat)}
                    onDrop={() => handleDrop(chat)}
                    onDragEnd={handleDragEnd}
                    >
                    {editingChatId === chat.id ? (
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleTitleUpdate(chat.id, editingTitle)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleUpdate(chat.id, editingTitle);
                                if (e.key === 'Escape') setEditingChatId(null);
                            }}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                        />
                    ) : (
                        <span onDoubleClick={() => handleStartEditing(chat)}>{chat.title}</span>
                    )}
                    <button
                        className={`pin-btn ${chat.isPinned ? "pinned" : ""}`}
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(chat.id); }}
                        title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1 -.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>
                        </svg>
                    </button>
                    {!chat.isPinned && (
                        <button className="delete-btn" title="Delete chat" onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    )}
                    </div>
                ))}
                </nav>
            </div>
        </aside>
    );
};