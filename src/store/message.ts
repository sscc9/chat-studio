/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom } from 'jotai';
import type { AttachedFile, Message, MessagePart, ActionLogEntry } from '../types';
import { streamAndGetResponseAtom, activeRequestRefAtom } from './api';
import { currentChatIdAtom, currentChatAtom, chatsAtom, logActionAtom, editingMessageIndexAtom, editingMessageContentAtom } from './chat';
import { showToastAtom, isLoadingAtom, regeneratingIndexAtom } from './ui';
import { isAIReadyAtom } from './api';

// =================================================================
// HELPERS
// =================================================================
export const createLoggableMessage = (message: Message): Partial<Message> => {
    if (!message) return {};
    // Return a new message object where large file data is stripped
    return {
        role: message.role,
        parts: message.parts.map(part => {
            if (part.inlineData) {
                const { mimeType } = part.inlineData;
                if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
                    // Strip data, keep metadata
                    const { data, ...metadata } = part.inlineData;
                    // FIX: The original code removed the 'data' property, causing a type error. A placeholder is added to satisfy the MessagePart type.
                    return { inlineData: { ...metadata, data: '[stripped]' } };
                }
            }
            return part; // Keep text and other file types as is
        })
    };
};

// =================================================================
// MESSAGE ATOMS
// =================================================================
export const userInputAtom = atom("");
export const attachedFilesAtom = atom<AttachedFile[]>([]);

export const handleFileChangeAtom = atom(null, (get, set, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            if (typeof loadEvent.target?.result === 'string') {
                const base64Data = loadEvent.target.result.split(',')[1];
                set(attachedFilesAtom, prev => [...prev, { name: file.name, type: file.type, data: base64Data }]);
            }
        };
        reader.readAsDataURL(file);
    });
    if (event.target) event.target.value = '';
});

export const handleRemoveFileAtom = atom(null, (get, set, fileName: string) => {
    set(attachedFilesAtom, prev => prev.filter(f => f.name !== fileName));
});

export const handleStartEditMessageAtom = atom(null, (get, set, index: number) => {
    const currentChat = get(currentChatAtom);
    if (!currentChat) return;
    const textPart = currentChat.messages[index].parts.find((p: MessagePart) => 'text' in p);
    set(editingMessageIndexAtom, index);
    set(editingMessageContentAtom, textPart?.text || "");
});

export const handleCancelEditAtom = atom(null, (get, set) => {
    set(editingMessageIndexAtom, null);
    set(editingMessageContentAtom, '');
});

export const handleSaveEditAtom = atom(null, (get, set) => {
    const index = get(editingMessageIndexAtom);
    const content = get(editingMessageContentAtom);
    const id = get(currentChatIdAtom);
    const chat = get(currentChatAtom);

    if (index === null || !content.trim() || !chat) return;

    const originalText = chat.messages[index]?.parts.find(p => 'text' in p)?.text || '';
    if (originalText === content) {
        set(handleCancelEditAtom);
        return;
    }

    const messageBeingEdited = chat.messages[index];
    const loggableMessage = createLoggableMessage(messageBeingEdited);
    set(logActionAtom, 'edit_message', { index, from: originalText, to: content, originalContent: loggableMessage });

    set(chatsAtom, prev => prev.map(chat => {
        if (chat.id === id) {
            const newMessages = [...chat.messages];
            const newParts = [...newMessages[index].parts];
            const textPartIndex = newParts.findIndex((p: MessagePart) => 'text' in p);

            if (textPartIndex !== -1) {
                newParts[textPartIndex] = { ...newParts[textPartIndex], text: content };
            } else {
                newParts.unshift({ text: content });
            }

            newMessages[index] = { ...newMessages[index], parts: newParts };
            return { ...chat, messages: newMessages };
        }
        return chat;
    }));
    set(handleCancelEditAtom);
});

export const handleDeleteMessageAtom = atom(null, (get, set, index: number) => {
    const id = get(currentChatIdAtom);
    const chat = get(currentChatAtom);
    if (!chat) return;

    const messageToDelete = chat.messages[index];
    const loggableMessage = createLoggableMessage(messageToDelete);
    set(logActionAtom, 'delete_message', { index, content: loggableMessage });

    set(chatsAtom, prev => prev.map(chat =>
        chat.id === id
            ? { ...chat, messages: chat.messages.filter((_: Message, i: number) => i !== index) }
            : chat
    ));
});

export const handleCopyMessageAtom = atom(null, (get, set, parts: MessagePart[]) => {
    const textToCopy = parts.filter(p => 'text' in p).map(p => p.text).join('\n\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
        set(showToastAtom, "已复制到剪贴板！");
    });
});

export const handleSendUserMessageOnlyAtom = atom(null, (get, set, messageText?: string) => {
    const userInput = get(userInputAtom);
    const attachedFiles = get(attachedFilesAtom);
    const currentChatId = get(currentChatIdAtom);
    const editingMessageIndex = get(editingMessageIndexAtom);

    const textToSend = typeof messageText === 'string' ? messageText : userInput.trim();
    const filesToSend = typeof messageText === 'string' ? [] : attachedFiles;

    if ((!textToSend && filesToSend.length === 0) || !currentChatId || editingMessageIndex !== null) return;

    const userParts: MessagePart[] = [];
    if (textToSend) userParts.push({ text: textToSend });
    filesToSend.forEach(file => {
        userParts.push({ inlineData: { mimeType: file.type, data: file.data, name: file.name } });
    });

    const userMessage: Message = { role: "user", parts: userParts };

    set(chatsAtom, prev => prev.map((chat) =>
        chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, userMessage] }
            : chat
    ));

    if (typeof messageText !== 'string') {
        set(userInputAtom, "");
        set(attachedFilesAtom, []);
    }
});

export const handleSendMessageAtom = atom(null, async (get, set) => {
    const currentChat = get(currentChatAtom);
    if (!currentChat) return;

    const userInput = get(userInputAtom);
    const attachedFiles = get(attachedFilesAtom);
    const hasInput = userInput.trim() || attachedFiles.length > 0;
    const lastMessage = currentChat.messages[currentChat.messages.length - 1];

    if (!get(isAIReadyAtom) || !get(currentChatIdAtom) || (!hasInput && lastMessage?.role !== 'user') || get(isLoadingAtom) || get(editingMessageIndexAtom) !== null) return;

    set(isLoadingAtom, true);

    const requestId = Date.now();
    get(activeRequestRefAtom).current = requestId;

    let contentsForApi: Message[];
    let newLogEntry: ActionLogEntry | null = null;

    if (hasInput) {
        const userParts: MessagePart[] = [];
        if (userInput.trim()) userParts.push({ text: userInput.trim() });
        attachedFiles.forEach(file => {
            userParts.push({ inlineData: { mimeType: file.type, data: file.data, name: file.name } });
        });
        const userMessage: Message = { role: "user", parts: userParts };
        contentsForApi = [...currentChat.messages, userMessage];
    } else { // Regeneration case
        contentsForApi = [...currentChat.messages];
        newLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            type: 'regenerate_response',
            payload: { index: currentChat.messages.length - 1 },
        };
    }

    const modelMessage: Message = { role: "model", parts: [{ text: "" }], groundingChunks: [] };
    const messagesForState = [...contentsForApi, modelMessage];

    set(chatsAtom, prev => prev.map(c => {
        if (c.id === currentChat.id) {
            return {
                ...c,
                messages: messagesForState,
                actionLog: newLogEntry ? [...(c.actionLog || []), newLogEntry] : c.actionLog,
            };
        }
        return c;
    }));

    const updatedCurrentChat = get(currentChatAtom)!;
    const targetIndex = updatedCurrentChat.messages.length - 1;
    set(regeneratingIndexAtom, targetIndex);

    set(userInputAtom, "");
    set(attachedFilesAtom, []);

    try {
        await set(streamAndGetResponseAtom, { chat: updatedCurrentChat, contents: contentsForApi, targetIndex, requestId });
    } catch (e: any) {
        if (e?.message !== 'Request cancelled') {
            console.warn("Message generation failed.", e);
        }
    }
});


export const handleSaveAndRegenerateAtom = atom(null, async (get, set) => {
    const editingMessageIndex = get(editingMessageIndexAtom);
    const editingMessageContent = get(editingMessageContentAtom);
    const currentChat = get(currentChatAtom);

    if (editingMessageIndex === null || !editingMessageContent.trim() || get(isLoadingAtom) || !currentChat || !get(isAIReadyAtom)) return;

    set(handleCancelEditAtom);
    set(isLoadingAtom, true);

    const requestId = Date.now();
    get(activeRequestRefAtom).current = requestId;

    const index = editingMessageIndex;

    const newLogEntry: ActionLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'edit_and_regenerate',
        payload: { index },
    };

    const savedMessages = currentChat.messages.map((msg: Message, i: number) => {
        if (i === index) {
            const newParts = [...msg.parts];
            const textPartIndex = newParts.findIndex(p => 'text' in p);
            if (textPartIndex !== -1) {
                newParts[textPartIndex] = { ...newParts[textPartIndex], text: editingMessageContent };
            } else {
                newParts.unshift({ text: editingMessageContent });
            }
            return { ...msg, parts: newParts };
        }
        return msg;
    });

    const contents = savedMessages.slice(0, index + 1);
    const targetIndex = index + 1;
    let messagesForState;

    if (savedMessages[targetIndex]?.role === 'model') {
        messagesForState = savedMessages;
    } else {
        const newModelMessage: Message = { role: "model", parts: [{ text: "" }], groundingChunks: [] };
        messagesForState = [...savedMessages.slice(0, targetIndex), newModelMessage, ...savedMessages.slice(targetIndex)];
    }

    set(chatsAtom, prev => prev.map(c => {
        if (c.id === currentChat.id) {
            return {
                ...c,
                messages: messagesForState,
                actionLog: [...(c.actionLog || []), newLogEntry]
            };
        }
        return c;
    }));

    const updatedChat = get(currentChatAtom)!;
    set(regeneratingIndexAtom, targetIndex);

    try {
        await set(streamAndGetResponseAtom, { chat: updatedChat, contents, targetIndex, requestId });
    } catch (e: any) {
        if (e?.message !== 'Request cancelled') {
            console.warn("Message generation failed.", e);
        }
    }
});

export const handleRegenerateResponseAtom = atom(null, async (get, set, index: number) => {
    const currentChat = get(currentChatAtom);
    if (get(isLoadingAtom) || !currentChat || !get(isAIReadyAtom)) return;

    set(isLoadingAtom, true);

    const requestId = Date.now();
    get(activeRequestRefAtom).current = requestId;

    const messages = [...currentChat.messages];
    const messageToRegenFrom = messages[index];

    let contents;
    let targetIndex;
    let messagesForState;

    if (messageToRegenFrom.role === 'model') {
        contents = messages.slice(0, index);
        targetIndex = index;
        messagesForState = messages;
    } else { // user
        contents = messages.slice(0, index + 1);
        targetIndex = index + 1;
        if (messages[targetIndex]?.role === 'model') {
            messagesForState = messages;
        } else {
            const newModelMessage: Message = { role: "model", parts: [{ text: "" }], groundingChunks: [] };
            messagesForState = [...messages.slice(0, targetIndex), newModelMessage, ...messages.slice(targetIndex)];
        }
    }

    const newLogEntry: ActionLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        type: 'regenerate_response',
        payload: { index },
    };

    set(chatsAtom, prev => prev.map(c => {
        if (c.id === currentChat.id) {
            return {
                ...c,
                messages: messagesForState,
                actionLog: [...(c.actionLog || []), newLogEntry],
            };
        }
        return c;
    }));

    const updatedChat = get(currentChatAtom)!;
    set(regeneratingIndexAtom, targetIndex);

    try {
        await set(streamAndGetResponseAtom, { chat: updatedChat, contents, targetIndex, requestId });
    } catch (e: any) {
        if (e?.message !== 'Request cancelled') {
            console.warn("Message generation failed.", e);
        }
    }
});