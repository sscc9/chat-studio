/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './TrashModal.css';
import {
    isTrashModalOpenAtom,
    trashedChatsAtom,
    handleRestoreChatAtom,
    handleDeletePermanentlyAtom,
    handleEmptyTrashAtom
} from '../store';
import type { Chat } from '../types';

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

export const TrashModal = () => {
    const [isOpen, setIsOpen] = useAtom(isTrashModalOpenAtom);
    const trashedChats = useAtomValue(trashedChatsAtom);
    const restoreChat = useSetAtom(handleRestoreChatAtom);
    const deletePermanently = useSetAtom(handleDeletePermanentlyAtom);
    const emptyTrash = useSetAtom(handleEmptyTrashAtom);

    const getTimeRemaining = (timestamp: number) => {
        const timeSinceDeletion = Date.now() - timestamp;
        const timeRemaining = FIFTEEN_DAYS_MS - timeSinceDeletion;
        if (timeRemaining <= 0) {
            return "Will be deleted soon";
        }
        const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
        return `Deletes in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    };

    if (!isOpen) return null;

    return (
        <div className="trash-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <div className="trash-modal">
                <div className="trash-modal-header">
                    <h3>Trash</h3>
                    <div className="trash-header-actions">
                        <button title="Empty Trash" onClick={() => emptyTrash()} disabled={trashedChats.length === 0}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zm2-8h6v8H5zM14 5h-3l-1-1H6L5 5H2v2h12z"/></svg>
                        </button>
                        <button onClick={() => setIsOpen(false)} aria-label="Close trash viewer">&times;</button>
                    </div>
                </div>
                <div className="trash-modal-content">
                    {trashedChats.length > 0 ? (
                        trashedChats.sort((a,b) => (b.deletedTimestamp || 0) - (a.deletedTimestamp || 0)).map((chat: Chat) => (
                            <div key={chat.id} className="trash-item">
                                <div className="trash-item-info">
                                    <span className="trash-item-title">{chat.title}</span>
                                    <span className="trash-item-countdown">{getTimeRemaining(chat.deletedTimestamp!)}</span>
                                </div>
                                <div className="trash-item-actions">
                                    <button title="Restore" onClick={() => restoreChat(chat.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z"/></svg>
                                    </button>
                                    <button title="Delete permanently" onClick={() => deletePermanently(chat.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="trash-empty-message">Trash is empty.</p>
                    )}
                </div>
            </div>
        </div>
    );
};