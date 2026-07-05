import React, { useEffect, useRef } from "react";
import { useAtom, useSetAtom, useAtomValue } from 'jotai';

import { ChatInputArea } from "./ChatInputArea";
import { PresetPromptEditorModal } from "./PresetPromptEditorModal";
import { ActionLogViewerModal } from "./ActionLogViewerModal";
import { HistoryPanel } from './HistoryPanel';
import { ConfigPanel } from './ConfigPanel';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { SystemPromptEditor } from './SystemPromptEditor';
import { DocumentEditor } from './DocumentEditor';
import { TrashModal } from "./TrashModal";
import './ChatLayout.css';

import { saveMessages } from '../db';
import type { Message } from '../types';
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

    // Keep track of what we have successfully persisted to prevent redundant writes
    const lastSavedMetadataRef = useRef<string>('');
    const lastSavedMessagesRef = useRef<Record<string, Message[]>>({});
    const lastSavedActionLogRef = useRef<Record<string, any[]>>({});
    const timerRef = useRef<number | null>(null);

    const flushSave = () => {
        if (!isInitialized) return;
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        // 1. Persist chat metadata (title, config, etc.) to localStorage if changed
        const chatsMetadata = chats.map(({ messages, actionLog, ...meta }) => meta);
        const metadataStr = JSON.stringify(chatsMetadata);
        if (metadataStr !== lastSavedMetadataRef.current) {
            try {
                localStorage.setItem('ai-chat-history', metadataStr);
                lastSavedMetadataRef.current = metadataStr;
            } catch (error) {
                console.error('Failed to save chat history to local storage', error);
            }
        }

        // 2. Persist changed chat messages/actionLog to IndexedDB (even background streaming ones)
        chats.forEach((chat) => {
            const prevMessages = lastSavedMessagesRef.current[chat.id];
            const prevActionLog = lastSavedActionLogRef.current[chat.id];

            if (prevMessages !== chat.messages || prevActionLog !== chat.actionLog) {
                saveMessages(
                    chat.id,
                    chat.messages,
                    chat.actionLog || []
                ).then(() => {
                    lastSavedMessagesRef.current[chat.id] = chat.messages;
                    lastSavedActionLogRef.current[chat.id] = chat.actionLog || [];
                }).catch(err => {
                    console.error(`Failed to save messages to DB for chat ${chat.id}`, err);
                });
            }
        });
    };

    // When chats are loaded for the first time, populate the refs so we don't write them again
    useEffect(() => {
        if (isInitialized && Object.keys(lastSavedMessagesRef.current).length === 0) {
            chats.forEach((chat) => {
                lastSavedMessagesRef.current[chat.id] = chat.messages;
                lastSavedActionLogRef.current[chat.id] = chat.actionLog || [];
            });
            const chatsMetadata = chats.map(({ messages, actionLog, ...meta }) => meta);
            lastSavedMetadataRef.current = JSON.stringify(chatsMetadata);
        }
    }, [isInitialized, chats]);

    // Persist changes with 1-second debounce
    useEffect(() => {
        if (!isInitialized) return;

        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
            flushSave();
        }, 1000);

        return () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [isInitialized, chats]);

    const flushSaveRef = useRef(flushSave);
    flushSaveRef.current = flushSave;

    // Flush immediately when tab goes to background, is closed or refreshed
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushSaveRef.current();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            flushSaveRef.current(); // 这样只在真正卸载时执行
        };
    }, []); // 空依赖，只注册一次

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