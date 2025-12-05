/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { useAtom, useSetAtom, useAtomValue } from 'jotai';

import { ChatInputArea } from "./ChatInputArea";
import { PresetPromptEditorModal } from "./PresetPromptEditorModal";
import { ActionLogViewerModal } from "./AgentPanel";
import { HistoryPanel } from './HistoryPanel';
import { ConfigPanel } from './ConfigPanel';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { SystemPromptEditor } from './SystemPromptEditor';
import { DocumentEditor } from './DocumentEditor';
import { TrashModal } from "./TrashModal";
import './ChatLayout.css';

import { saveMessages } from '../db';
import {
    isInitializedAtom,
    chatsAtom,
    currentChatAtom,
    isHistoryPanelVisibleAtom,
    isConfigPanelVisibleAtom,
    isHistoryPanelOpenAtom,
    isConfigPanelOpenAtom,
    setIsHistoryPanelOpenAtom,
    setIsConfigPanelOpenAtom,
    toastAtom,
    setToastAtom,
    themeAtom,
    isMobileAtom,
    setIsMobileAtom,
    isPresetEditorOpenAtom,
    isActionLogViewerOpenAtom,
    isTrashModalOpenAtom,
    initChatHistoryAtom,
} from '../store';

const PersistState = () => {
    const isInitialized = useAtomValue(isInitializedAtom);
    const chats = useAtomValue(chatsAtom);
    const currentChat = useAtomValue(currentChatAtom);

    // Persist chat metadata (title, config, etc.) to localStorage
    useEffect(() => {
        if (!isInitialized) return;
        const chatsMetadata = chats.map(({ messages, agentMessages, actionLog, ...meta }) => meta);
        try {
            localStorage.setItem('ai-chat-history', JSON.stringify(chatsMetadata));
        } catch (error) {
            console.error('Failed to save chat history to local storage', error);
        }
    }, [isInitialized, chats]);

    // Persist the current chat's messages to IndexedDB
    useEffect(() => {
        if (!isInitialized) return;
        if (currentChat?.id && currentChat.messages) {
            saveMessages(
                currentChat.id,
                currentChat.messages,
                currentChat.agentMessages || [],
                currentChat.actionLog || []
            ).catch(err => {
                console.error("Failed to save messages to DB", err);
            });
        }
    }, [isInitialized, currentChat?.id, currentChat?.messages, currentChat?.agentMessages, currentChat?.actionLog]);

    return null;
};

export const ChatLayout = () => {
    const [isHistoryPanelVisible] = useAtom(isHistoryPanelVisibleAtom);
    const [isConfigPanelVisible] = useAtom(isConfigPanelVisibleAtom);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useAtom(isHistoryPanelOpenAtom);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useAtom(isConfigPanelOpenAtom);
    const [theme] = useAtom(themeAtom);
    const [toast] = useAtom(toastAtom);
    const setToast = useSetAtom(setToastAtom);
    const setIsMobile = useSetAtom(setIsMobileAtom);
    const initChats = useSetAtom(initChatHistoryAtom);

    const isPresetEditorOpen = useAtomValue(isPresetEditorOpenAtom);
    const isActionLogViewerOpen = useAtomValue(isActionLogViewerOpenAtom);
    const isTrashModalOpen = useAtomValue(isTrashModalOpenAtom);

    // Initial data load
    useEffect(() => {
        initChats();
    }, [initChats]);

    // Side Effects (DOM, Timers, etc.)
    useEffect(() => {
        if (toast.show) {
            // FIX: The setter for setToastAtom was too restrictive. It is now fixed in the store.
            const timer = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, setToast]);

    useEffect(() => {
        const applyTheme = (t: string) => {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', t === 'system' ? (isSystemDark ? 'dark' : 'light') : t);
        };
        applyTheme(theme);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme(theme);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', checkIsMobile);
        checkIsMobile(); // Initial check
        return () => window.removeEventListener('resize', checkIsMobile);
    }, [setIsMobile]);

    return (
        <>
            <PersistState />
            <div className={`chat-app ${!isHistoryPanelVisible ? 'history-collapsed' : ''} ${!isConfigPanelVisible ? 'config-collapsed' : ''}`}>
                <div
                    className={`mobile-backdrop ${isHistoryPanelOpen || isConfigPanelOpen ? "visible" : ""}`}
                    onClick={() => {
                        setIsHistoryPanelOpen(false);
                        setIsConfigPanelOpen(false);
                    }}
                ></div>

                <HistoryPanel />

                <main className="chat-panel">
                    <ChatHeader />
                    <MessageList />
                    <ChatInputArea />
                </main>

                <ConfigPanel />

                <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.message}</div>
                
                <SystemPromptEditor />
                <DocumentEditor />

                {isPresetEditorOpen && <PresetPromptEditorModal />}
                {isActionLogViewerOpen && <ActionLogViewerModal />}
                {isTrashModalOpen && <TrashModal />}
            </div>
        </>
    );
};