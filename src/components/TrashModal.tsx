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
            return "即将删除";
        }
        const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
        return `${daysRemaining} 天后删除`;
    };

    if (!isOpen) return null;

    return (
        <div className="trash-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <div className="trash-modal">
                <div className="trash-modal-header">
                    <h3>回收站</h3>
                    <div className="trash-header-actions">
                        <button title="清空回收站" onClick={() => emptyTrash()} disabled={trashedChats.length === 0}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                        </button>
                        <button onClick={() => setIsOpen(false)} aria-label="关闭回收站查看器" title="关闭">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="trash-modal-content">
                    {trashedChats.length > 0 ? (
                        trashedChats.sort((a, b) => (b.deletedTimestamp || 0) - (a.deletedTimestamp || 0)).map((chat: Chat) => (
                            <div key={chat.id} className="trash-item">
                                <div className="trash-item-info">
                                    <span className="trash-item-title">{chat.title}</span>
                                    <span className="trash-item-countdown">{getTimeRemaining(chat.deletedTimestamp!)}</span>
                                </div>
                                <div className="trash-item-actions">
                                    <button title="恢复" onClick={() => restoreChat(chat.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z" /></svg>
                                    </button>
                                    <button title="永久删除" onClick={() => deletePermanently(chat.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="trash-empty-message">回收站是空的。</p>
                    )}
                </div>
            </div>
        </div>
    );
};