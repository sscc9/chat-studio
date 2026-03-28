/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { getMessages, saveMessages, deleteMessages } from '../db';
import type { Chat, ChatConfig, Message, ActionLogEntry, ActionLogEntryType, SystemPrompt } from '../types';

import { showToastAtom, isHistoryPanelOpenAtom, importFileRefAtom } from './ui';
import { documentContentAtom, presetPromptsAtom, presetGroupsAtom } from './tools';
import { allModelsAtom, providersAtom, titleModelIdAtom } from './settings';
import { isInitializedAtom } from './core';
import { streamGenerateContent } from '../llm';

// =================================================================
// ACTION LOG ATOM (Moved here to break circular dependency)
// =================================================================
export const logActionAtom = atom(
    null,
    (get, set, type: ActionLogEntryType, payload: Record<string, any>, chatId?: string) => {
        const targetChatId = chatId || get(currentChatIdAtom);
        if (!targetChatId) return;

        const newLogEntry: ActionLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            type,
            payload,
        };

        set(chatsAtom, prev => prev.map(chat => {
            if (chat.id === targetChatId) {
                const currentLog = chat.actionLog || [];
                let updatedLog = [...currentLog, newLogEntry];
                if (updatedLog.length > 1000) {
                    updatedLog = updatedLog.slice(updatedLog.length - 1000);
                }
                return { ...chat, actionLog: updatedLog };
            }
            return chat;
        }
        ));
    }
);

// =================================================================
// CONFIGURATION ATOMS (Active Config)
// =================================================================
// Global Config State (also used by tools)
export const modelAtom = atomWithStorage("ai-chat-default-model", "");
export const useGoogleSearchAtom = atomWithStorage("ai-chat-default-search", false);
export const systemInstructionAtom = atom("");

// Action to sync the global config atoms with a specific chat's config
export const syncConfigWithChatAtom = atom(null, (get, set, chat: Chat | undefined) => {
    if (chat?.config) {
        set(systemInstructionAtom, chat.config.systemInstruction || '');
        set(useGoogleSearchAtom, chat.config.useGoogleSearch || false);
        set(modelAtom, chat.config.model || "");
    } else {
        // Reset to defaults if no chat is active
        set(systemInstructionAtom, "");
        set(useGoogleSearchAtom, get(useGoogleSearchAtom)); // Keep stored default
        set(modelAtom, get(modelAtom)); // Keep stored default
    }
});


export const handleConfigChangeAtom = atom(null, (get, set, newConfig: Partial<ChatConfig>, chatId?: string) => {
    const id = chatId || get(currentChatIdAtom);
    if (!id) return;

    const targetChat = get(chatsAtom).find(c => c.id === id);
    if (!targetChat) return;

    if (newConfig.model !== undefined && newConfig.model !== targetChat.config.model) {
        set(logActionAtom, 'change_model', { from: targetChat.config.model, to: newConfig.model }, id);
        if (id === get(currentChatIdAtom)) set(modelAtom, newConfig.model);
    }
    if (newConfig.useGoogleSearch !== undefined && newConfig.useGoogleSearch !== targetChat.config.useGoogleSearch) {
        set(logActionAtom, 'toggle_web_search', { value: newConfig.useGoogleSearch }, id);
        if (id === get(currentChatIdAtom)) set(useGoogleSearchAtom, newConfig.useGoogleSearch);
    }
    if (newConfig.systemInstruction !== undefined && newConfig.systemInstruction !== targetChat.config.systemInstruction) {
        set(logActionAtom, 'change_system_prompt', { from: targetChat.config.systemInstruction, to: newConfig.systemInstruction }, id);
        if (id === get(currentChatIdAtom)) {
            set(systemInstructionAtom, newConfig.systemInstruction);
        }
    }

    set(chatsAtom, prev => prev.map(chat =>
        // FIX: Explicitly create a new config object with a type annotation to satisfy the ChatConfig type, preventing errors where `model` could be inferred as optional.
        chat.id === id ? { ...chat, config: { ...chat.config, ...newConfig } as ChatConfig } : chat
    ));
});

// =================================================================
// CHAT HISTORY ATOMS
// =================================================================

export const chatsAtom = atom<Chat[]>([]);
export const currentChatIdAtom = atomWithStorage<string | null>('ai-chat-current-id', null);
export const editingChatIdAtom = atom<string | null>(null);
export const editingTitleAtom = atom('');
export const draggedChatRefAtom = atom(React.createRef<Chat | null>());

// Message editing state, moved here to break circular dependency with message.ts
export const editingMessageIndexAtom = atom<number | null>(null);
export const editingMessageContentAtom = atom('');

// --- DERIVED ---
export const currentChatAtom = atom(get => {
    const chats = get(chatsAtom);
    const id = get(currentChatIdAtom);
    return chats.find(chat => chat.id === id);
});

export const sortedChatsAtom = atom(get => {
    const chats = get(chatsAtom);
    const nonTrashedChats = chats.filter(chat => !chat.deletedTimestamp);
    
    // Sort all non-trashed chats by updatedAt first (fallback to creation time from ID)
    const sorted = [...nonTrashedChats].sort((a, b) => {
        const timeA = a.updatedAt || parseInt(a.id.split('-')[1]) || 0;
        const timeB = b.updatedAt || parseInt(b.id.split('-')[1]) || 0;
        return timeB - timeA;
    });

    const pinned: Chat[] = [];
    const unpinned: Chat[] = [];
    for (const chat of sorted) {
        if (chat.isPinned) {
            pinned.push(chat);
        } else {
            unpinned.push(chat);
        }
    }
    return [...pinned, ...unpinned];
});

export const trashedChatsAtom = atom(get =>
    get(chatsAtom).filter(chat => !!chat.deletedTimestamp)
);

// --- ACTIONS ---

export const handleNewChatAtom = atom(null, (get, set, title: string = 'New Chat') => {
    const allModels = get(allModelsAtom);
    const defaultModel = (get(modelAtom) || (allModels.length > 0 ? allModels[0].id : '')) as string;

    const newChat: Chat = {
        id: `chat-${Date.now()}`,
        title: title,
        messages: [],
        isPinned: false,
        config: {
            systemInstruction: '',
            useGoogleSearch: get(useGoogleSearchAtom),
            model: defaultModel,
        },
        actionLog: [],
        autoTitled: false,
        updatedAt: Date.now(),
    };
    set(chatsAtom, prev => [newChat, ...prev]);
    set(currentChatIdAtom, newChat.id);
    set(syncConfigWithChatAtom, newChat);
    set(logActionAtom, 'new_chat', { title: newChat.title }, newChat.id);
    return newChat;
});

export const initChatHistoryAtom = atom(
    null,
    async (get, set) => {
        try {
            const savedChatsJSON = localStorage.getItem('ai-chat-history');
            // FIX: Add type assertion to resolve potential `unknown` type from `atomWithStorage`.
            const savedCurrentId = get(currentChatIdAtom) as string | null;

            if (!savedChatsJSON) {
                set(handleNewChatAtom);
                return;
            }

            let chatMetadata: Partial<Chat>[] = JSON.parse(savedChatsJSON);

            const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
            const chatsToDeletePermanently = chatMetadata.filter(
                (chat): chat is Chat => !!chat.id && !!chat.deletedTimestamp && chat.deletedTimestamp < fifteenDaysAgo
            );
            const chatsToKeep = chatMetadata.filter(
                (chat) => !chatsToDeletePermanently.some(deleted => deleted.id === chat.id)
            );

            if (chatsToDeletePermanently.length > 0) {
                console.log(`Auto-purging ${chatsToDeletePermanently.length} old chats from trash.`);
                await Promise.all(chatsToDeletePermanently.map(c => deleteMessages(c.id!)));
                chatMetadata = chatsToKeep;
                localStorage.setItem('ai-chat-history', JSON.stringify(chatMetadata));
            }

            if (chatMetadata.length > 0 && (chatMetadata[0].messages || chatMetadata[0].actionLog)) {
                console.log('Migrating chat history to IndexedDB...');
                set(showToastAtom, 'Upgrading storage...');
                const newMetadata = [];
                for (const chat of chatMetadata) {
                    await saveMessages(chat.id!, chat.messages || [], chat.actionLog || []);
                    const { messages, actionLog, ...meta } = chat;
                    newMetadata.push(meta);
                }
                localStorage.setItem('ai-chat-history', JSON.stringify(newMetadata));
                chatMetadata = newMetadata;
                set(showToastAtom, 'Storage upgraded successfully!');
            }

            const allModels = get(allModelsAtom);
            const availableModelIds = allModels.map(m => m.id);
            const fallbackModel = availableModelIds.length > 0 ? availableModelIds[0] : '';

            const chatsWithUpdates: Chat[] = chatMetadata.map((chat: Partial<Chat>) => {
                const newChatDefaults: ChatConfig = {
                    systemInstruction: '',
                    useGoogleSearch: false,
                    model: fallbackModel,
                };
                const existingModel = chat.config?.model;
                const config: ChatConfig = {
                    ...newChatDefaults,
                    ...(chat.config || {}),
                    model: (existingModel && availableModelIds.includes(existingModel)) ? existingModel : fallbackModel,
                };
                return {
                    id: chat.id!,
                    title: chat.title!,
                    messages: [],
                    isPinned: chat.isPinned || false,
                    config: config,
                    actionLog: [],
                    autoTitled: chat.autoTitled || (chat.title !== 'New Chat'),
                    deletedTimestamp: chat.deletedTimestamp,
                    updatedAt: chat.updatedAt || parseInt(chat.id!.split('-')[1]) || Date.now(),
                };
            });

            const finalCurrentId = savedCurrentId && chatsWithUpdates.some((c: Chat) => c.id === savedCurrentId)
                ? savedCurrentId
                : (chatsWithUpdates.length > 0 ? chatsWithUpdates[0].id : null);

            if (finalCurrentId) {
                const { messages, actionLog } = await getMessages(finalCurrentId);
                const finalChatsState = chatsWithUpdates.map((chat: Chat) =>
                    chat.id === finalCurrentId
                        ? { ...chat, messages: messages || [], actionLog: actionLog || [] }
                        : chat
                );
                set(chatsAtom, finalChatsState);
                set(currentChatIdAtom, finalCurrentId);
                const currentChat = finalChatsState.find(c => c.id === finalCurrentId);
                set(syncConfigWithChatAtom, currentChat);
            } else {
                set(handleNewChatAtom);
            }
        } catch (error) {
            console.error('Failed to load or migrate from local storage', error);
            localStorage.removeItem('ai-chat-history');
            localStorage.removeItem('ai-chat-current-id');
            set(handleNewChatAtom);
        } finally {
            set(isInitializedAtom, true);
        }
    }
);
initChatHistoryAtom.onMount = (init) => { init() };


export const handleSelectChatAtom = atom(
    null,
    async (get, set, id: string) => {
        const chats = get(chatsAtom);
        const chatInState = chats.find(c => c.id === id);

        if (chatInState && chatInState.messages.length === 0) {
            const { messages, actionLog } = await getMessages(id);
            set(chatsAtom, prev => prev.map(c => c.id === id ? { ...c, messages: messages || [], actionLog: actionLog || [] } : c));
        }

        set(currentChatIdAtom, id);
        const updatedChat = get(chatsAtom).find(c => c.id === id);
        set(syncConfigWithChatAtom, updatedChat);

        set(editingMessageIndexAtom, null);
        set(isHistoryPanelOpenAtom, false);
    }
);

export const handleDeleteChatAtom = atom(null, (get, set, id: string) => {
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === id ? { ...chat, isPinned: false, deletedTimestamp: Date.now() } : chat
    ));
    set(showToastAtom, "对话已移至回收站。");

    if (get(currentChatIdAtom) === id) {
        const availableChats = get(sortedChatsAtom);
        if (availableChats.length > 0) {
            const nextChat = availableChats.find(c => c.isPinned) || availableChats[0];
            set(handleSelectChatAtom, nextChat.id);
        } else {
            set(handleNewChatAtom);
        }
    }
    return `Chat with ID ${id} has been moved to trash.`;
});

export const handleRestoreChatAtom = atom(null, (get, set, id: string) => {
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === id ? { ...chat, deletedTimestamp: undefined } : chat
    ));
    set(showToastAtom, "对话已恢复。");
});

export const handleDeletePermanentlyAtom = atom(null, (get, set, id: string) => {
    deleteMessages(id).catch(err => console.error("Failed to delete from DB", err));
    set(chatsAtom, prev => prev.filter(chat => chat.id !== id));
    set(showToastAtom, "对话已永久删除。");
});

export const handleEmptyTrashAtom = atom(null, async (get, set) => {
    const trashedChats = get(trashedChatsAtom);
    if (trashedChats.length === 0) return;

    await Promise.all(
        trashedChats.map(chat => deleteMessages(chat.id))
    ).catch(err => console.error("Failed to empty trash from DB", err));

    set(chatsAtom, prev => prev.filter(chat => !chat.deletedTimestamp));
    set(showToastAtom, "回收站已清空。");
});

export const handleForkChatAtom = atom(null, async (get, set, index: number) => {
    const currentChatId = get(currentChatIdAtom);
    if (!currentChatId) return;

    let originalChat = get(currentChatAtom);
    if (!originalChat) return;

    if (originalChat.messages.length === 0) {
        const { messages, actionLog } = await getMessages(originalChat.id);
        originalChat = { ...originalChat, messages: messages || [], actionLog: actionLog || [] };
    }

    if (index >= originalChat.messages.length) return;

    const forkedMessages = originalChat.messages.slice(0, index + 1);

    const newChat: Chat = {
        ...originalChat,
        id: `chat-${Date.now()}`,
        title: `${originalChat.title} 的分支`,
        messages: forkedMessages,
        isPinned: false,
        actionLog: [],
        autoTitled: true,
    };

    const messageAtFork = originalChat.messages[index];
    set(logActionAtom, 'fork_chat', { from: originalChat.title, to: newChat.title, atMessage: index, content: messageAtFork });
    set(chatsAtom, prev => [newChat, ...prev]);
    set(currentChatIdAtom, newChat.id);
    set(showToastAtom, `已从 "${originalChat.title}" 创建分支`);
});

export const handleTogglePinAtom = atom(null, (get, set, id: string) => {
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
});

export const handleStartEditingAtom = atom(null, (get, set, chat: Chat) => {
    set(editingChatIdAtom, chat.id);
    set(editingTitleAtom, chat.title);
});

export const handleTitleUpdateAtom = atom(null, (get, set, chatId: string, newTitle: string) => {
    const oldTitle = get(chatsAtom).find(c => c.id === chatId)?.title || '';
    if (!newTitle.trim() || newTitle.trim() === oldTitle) {
        set(editingChatIdAtom, null);
        return;
    }
    set(logActionAtom, 'rename_chat', { from: oldTitle, to: newTitle.trim() });
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle.trim(), updatedAt: Date.now() } : chat
    ));
    set(editingChatIdAtom, null);
});


export const handleDragStartAtom = atom(null, (get, set, e: React.DragEvent, chat: Chat) => {
    const ref = get(draggedChatRefAtom);
    if (ref.current) ref.current = chat;
});

export const handleDropAtom = atom(null, (get, set, droppedOnChat: Chat) => {
    const ref = get(draggedChatRefAtom);
    const draggedChat = ref.current;
    if (!draggedChat || draggedChat.id === droppedOnChat.id || draggedChat.isPinned !== droppedOnChat.isPinned) {
        return;
    }

    set(chatsAtom, prevChats => {
        const updatedChats = [...prevChats];
        const draggedIndex = updatedChats.findIndex(c => c.id === draggedChat.id);
        const droppedOnIndex = updatedChats.findIndex(c => c.id === droppedOnChat.id);

        const [removed] = updatedChats.splice(draggedIndex, 1);
        updatedChats.splice(droppedOnIndex, 0, removed);

        return updatedChats;
    });
});

export const handleDragEndAtom = atom(null, (get, set) => {
    const ref = get(draggedChatRefAtom);
    if (ref.current) ref.current = null;
});



export const handleExportChatsAtom = atom(null, async (get, set) => {
    try {
        set(showToastAtom, "正在导出数据...");

        const chats = get(chatsAtom);
        const fullChats = await Promise.all(chats.map(async (chat) => {
            if (chat.messages.length === 0) {
                const { messages, actionLog } = await getMessages(chat.id);
                return { ...chat, messages: messages || [], actionLog: actionLog || [] };
            }
            return chat;
        }));

        const exportData = {
            version: 2,
            chats: fullChats,
            writingModeData: {
                documentContent: get(documentContentAtom),
                presetPrompts: get(presetPromptsAtom),
                presetGroups: get(presetGroupsAtom),
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `ai-chat-studio-backup-${timestamp}.json`;
        a.click();

        URL.revokeObjectURL(url);

        set(showToastAtom, "应用数据导出成功！");
    } catch (error) {
        console.error("Failed to export data:", error);
        set(showToastAtom, "导出数据出错。");
    }
});

export const handleImportClickAtom = atom(null, (get, set) => {
    const ref = get(importFileRefAtom);
    ref.current?.click();
});

export const handleImportFileAtom = atom(null, (get, set, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
        if (event.target) event.target.value = '';

        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("Failed to read file contents.");

            set(showToastAtom, "正在导入，请稍候...");
            const importedJson = JSON.parse(text);

            let chatsToImport = (importedJson && Array.isArray(importedJson.chats)) ? importedJson.chats : Array.isArray(importedJson) ? importedJson : [];
            const writingDataToImport = importedJson?.writingModeData;

            const validChats: Partial<Chat>[] = chatsToImport.filter((c: Partial<Chat>) => c?.id && c.title);

            if (validChats.length > 0) {
                const allModels = get(allModelsAtom);
                const availableModelIds = allModels.map(m => m.id);
                const fallbackModel = availableModelIds.length > 0 ? availableModelIds[0] : '';
                const existingChatIds = new Set(get(chatsAtom).map(c => c.id));

                const resolvedChats: Chat[] = validChats.map((chat, i) => {
                    const newChatDefaults: ChatConfig = {
                        systemInstruction: '',
                        useGoogleSearch: false,
                        model: fallbackModel,
                    };
                    const existingModel = chat.config?.model;
                    const config: ChatConfig = {
                        ...newChatDefaults,
                        ...(chat.config || {}),
                        model: (existingModel && availableModelIds.includes(existingModel)) ? existingModel : fallbackModel,
                    };

                    return {
                        id: existingChatIds.has(chat.id!) ? `chat-${Date.now()}-${i}` : chat.id!,
                        title: existingChatIds.has(chat.id!) ? `${chat.title} (已导入)` : chat.title!,
                        messages: chat.messages || [],
                        isPinned: chat.isPinned || false,
                        config: config,
                        actionLog: chat.actionLog || [],
                        autoTitled: chat.autoTitled ?? (chat.title !== 'New Chat'),
                        updatedAt: chat.updatedAt || Date.now(),
                    };
                });
                await Promise.all(resolvedChats.map(chat => saveMessages(chat.id, chat.messages || [], chat.actionLog || [])));
                set(chatsAtom, prevChats => {
                    const chatMap = new Map(prevChats.map(c => [c.id, c]));
                    resolvedChats.forEach(importedChat => chatMap.set(importedChat.id, { ...importedChat, messages: [], actionLog: [] }));
                    return Array.from(chatMap.values());
                });
            }

            if (writingDataToImport) {
                if (typeof writingDataToImport.documentContent === 'string') set(documentContentAtom, writingDataToImport.documentContent);
                if (Array.isArray(writingDataToImport.presetPrompts)) set(presetPromptsAtom, writingDataToImport.presetPrompts);
                if (Array.isArray(writingDataToImport.presetGroups)) set(presetGroupsAtom, writingDataToImport.presetGroups);
            }

            set(showToastAtom, "导入成功。");

        } catch (error: any) {
            console.error("Failed to import data:", error);
            set(showToastAtom, error.message || "导入失败。");
        }
    };
    reader.onerror = () => { set(showToastAtom, "读取内容时出错。"); if (event.target) event.target.value = ''; };
    reader.readAsText(file);
});


export const handleAutoRenameChatAtom = atom(null, async (get, set, chatId: string) => {
    const chat = get(chatsAtom).find(c => c.id === chatId);

    if (!chat || chat.title.trim() !== 'New Chat' || chat.autoTitled) {
        return;
    }

    // Find the first user message and the first model message that follows it.
    let firstUserMessage: Message | undefined;
    let firstModelMessage: Message | undefined;

    const userMessageIndex = chat.messages.findIndex(m => m.role === 'user');
    if (userMessageIndex > -1) {
        firstUserMessage = chat.messages[userMessageIndex];
        const modelMessageIndex = chat.messages.findIndex((m, i) => i > userMessageIndex && m.role === 'model');
        if (modelMessageIndex > -1) {
            firstModelMessage = chat.messages[modelMessageIndex];
        }
    }

    if (!firstUserMessage || !firstModelMessage) {
        return; // Not enough context yet.
    }

    const userText = firstUserMessage.parts.find(p => p.text)?.text || '';
    const modelText = firstModelMessage.parts.find(p => p.text)?.text || '';

    // Mark as attempted immediately to prevent race conditions / re-runs.
    set(chatsAtom, prev => prev.map(c =>
        c.id === chatId ? { ...c, autoTitled: true } : c
    ));

    if (!userText.trim() || !modelText.trim()) {
        return; // Not enough text context, but we've marked it so we don't try again.
    }

    const prompt = `Based on the following conversation, create a short, descriptive title (5 words or less) for the chat session. The title must be in the same language as the conversation (e.g., if the user speaks Chinese, the title should be Chinese). Do not include quotes or any introductory text in your response. Just provide the title text itself.\n\nUser: ${userText.substring(0, 200)}\nAI: ${modelText.substring(0, 200)}`;

    try {
        const titleModel = get(titleModelIdAtom);
        const generatingModel = titleModel || 'gemini-flash-lite-latest';
        if (!generatingModel) return;

        const providers = get(providersAtom);
        const provider = providers.find(p => p.models.some(m => m.id === generatingModel));

        if (!provider) return;

        const stream = streamGenerateContent(
            provider, 
            generatingModel, 
            [{ role: 'user', parts: [{ text: prompt }] } as Message],
            undefined, // No system instruction
            false      // No web search
        );

        let newTitle = "";
        for await (const chunk of stream) {
             newTitle += (chunk.text || "");
        }

        newTitle = newTitle.trim();

        if (newTitle) {
            newTitle = newTitle.replace(/^["']|["']$/g, ''); // Clean up quotes
            set(logActionAtom, 'rename_chat', { from: 'New Chat', to: newTitle }, chatId);
            set(chatsAtom, prev => prev.map(c =>
                c.id === chatId ? { ...c, title: newTitle } : c
            ));
        }
    } catch (error) {
        console.error("Failed to auto-rename chat:", error);
        // Do not revert autoTitled flag. Treat this as a single attempt.
    }
});