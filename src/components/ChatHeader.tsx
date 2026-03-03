/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './ChatHeader.css';
import {
    isHistoryPanelVisibleAtom,
    setIsHistoryPanelVisibleAtom,
    isConfigPanelVisibleAtom,
    setIsConfigPanelVisibleAtom,
    isHistoryPanelOpenAtom,
    setIsHistoryPanelOpenAtom,
    isConfigPanelOpenAtom,
    setIsConfigPanelOpenAtom,
    currentChatAtom,
    tokenCountAtom,
    handleNewChatAtom,
} from '../store';

export const ChatHeader = () => {
    const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useAtom(isHistoryPanelVisibleAtom);
    const [isConfigPanelVisible, setIsConfigPanelVisible] = useAtom(isConfigPanelVisibleAtom);
    const setIsHistoryPanelOpen = useSetAtom(setIsHistoryPanelOpenAtom);
    const setIsConfigPanelOpen = useSetAtom(setIsConfigPanelOpenAtom);
    const handleNewChat = useSetAtom(handleNewChatAtom);

    const currentChat = useAtomValue(currentChatAtom);
    const tokenCount = useAtomValue(tokenCountAtom);

    return (
        <header className="chat-header">
            <div className="header-side-controls">
                {!isHistoryPanelVisible && (
                    <button
                        className="panel-toggle-btn panel-show-btn history-show-btn"
                        onClick={() => setIsHistoryPanelVisible(true)}
                        aria-label="显示历史面板"
                        title="显示历史面板"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" /></svg>
                    </button>
                )}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsHistoryPanelOpen(true)}
                    aria-label="打开历史记录"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" /></svg>
                </button>
            </div>
            <div className="header-main-content">
                <h2>{currentChat?.title || "对话"}</h2>
                <div className="header-actions">
                    {tokenCount > 0 && <div className="token-count">Token 数量: {tokenCount}</div>}
                    <button className="icon-btn new-chat-header-btn" onClick={() => handleNewChat()} title="新建对话">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="header-side-controls">
                <button
                    className="mobile-config-btn"
                    onClick={() => setIsConfigPanelOpen(true)}
                    aria-label="打开配置"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708 .708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" /></svg>
                </button>
                {!isConfigPanelVisible && (
                    <button
                        className="panel-toggle-btn panel-show-btn config-show-btn"
                        onClick={() => setIsConfigPanelVisible(true)}
                        aria-label="显示配置面板"
                        title="显示配置面板"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708 .708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" /></svg>
                    </button>
                )}
            </div>
        </header>
    );
};