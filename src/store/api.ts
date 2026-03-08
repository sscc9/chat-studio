/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom } from 'jotai';
import { aiAtom } from './core';
import { providersAtom } from './settings';
import { streamGenerateContent, countTokens } from '../llm';
import type { Message, Chat } from '../types';
import { chatsAtom, currentChatAtom, handleAutoRenameChatAtom } from './chat';
import { isLoadingAtom, regeneratingIndexAtom, tokenCountAtom } from './ui';

// =================================================================
// API ATOMS
// =================================================================
export const activeRequestRefAtom = atom(React.createRef<number | null>());

export const isAIReadyAtom = atom((get) => {
    const providers = get(providersAtom);
    return providers.some(p => p.apiKey && p.apiKey.length > 0);
});

// A complex atom that encapsulates the streaming logic and returns the final text
export const streamAndGetResponseAtom = atom(null, (get, set, { chat, contents, targetIndex, requestId }: { chat: Chat, contents: Message[], targetIndex: number, requestId: number }): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const activeRequestRef = get(activeRequestRefAtom);

        const providers = get(providersAtom);
        const modelId = chat.config.model;
        let provider = providers.find(p => p.models.some(m => m.id === modelId));

        if (!provider) {
            set(isLoadingAtom, false);
            set(regeneratingIndexAtom, null);
            return reject(new Error("No provider configured for this model. Please check Settings."));
        }

        try {
            set(chatsAtom, prevChats => prevChats.map(c =>
                c.id === chat.id
                    ? {
                        ...c, messages: c.messages.map((msg: Message, idx: number) =>
                            idx === targetIndex ? { ...msg, parts: [{ text: "" }], groundingChunks: [] } : msg
                        )
                    } : c
            ));

            const stream = streamGenerateContent(provider, modelId, contents, chat.config.systemInstruction, chat.config.useGoogleSearch);

            if (activeRequestRef.current !== requestId) return reject(new Error('Request cancelled'));

            let text = "";
            let allGroundingChunks: any[] = [];
            let renameTriggered = false;
            for await (const chunk of stream) {
                if (activeRequestRef.current !== requestId) break;

                text += (chunk.text || "");

                if (chunk.groundingChunks) {
                    const newChunks = chunk.groundingChunks;
                    newChunks.forEach((newChunk: any) => {
                        if (newChunk.web?.uri && !allGroundingChunks.some(existing => existing.web?.uri === newChunk.web?.uri)) {
                            allGroundingChunks.push(newChunk);
                        }
                    });
                }

                set(chatsAtom, (prevChats) => prevChats.map((c) => {
                    if (c.id === chat.id) {
                        const newMessages = [...c.messages];
                        const messageToUpdate = { ...newMessages[targetIndex] };
                        messageToUpdate.parts = [{ text: text }];
                        messageToUpdate.groundingChunks = allGroundingChunks;
                        newMessages[targetIndex] = messageToUpdate;
                        return { ...c, messages: newMessages };
                    }
                    return c;
                }));

                // Trigger auto-rename after receiving the first bit of text.
                if (!renameTriggered && text.trim()) {
                    set(handleAutoRenameChatAtom, chat.id);
                    renameTriggered = true;
                }
            }
            if (activeRequestRef.current === requestId) {
                // The original call remains as a fallback for empty streams etc.
                // handleAutoRenameChatAtom has its own guards so this is safe.
                set(handleAutoRenameChatAtom, chat.id);
                resolve(text);
            } else {
                reject(new Error('Request cancelled'));
            }
        } catch (error: any) {
            console.error("Error streaming response:", error);
            if (activeRequestRef.current === requestId) {
                set(chatsAtom, (prevChats) => prevChats.map((c) => {
                    if (c.id === chat.id) {
                        const newMessages = [...c.messages];
                        newMessages[targetIndex] = { ...newMessages[targetIndex], parts: [{ text: `**Error:** ${error.message}` }] };
                        return { ...c, messages: newMessages };
                    }
                    return c;
                }));
            }
            reject(error);
        } finally {
            if (activeRequestRef.current === requestId) {
                set(isLoadingAtom, false);
                set(regeneratingIndexAtom, null);
                activeRequestRef.current = null;
            }
        }
    });
});

export const handleStopGenerationAtom = atom(null, (get, set) => {
    const activeRequestRef = get(activeRequestRefAtom);
    activeRequestRef.current = null;
    set(isLoadingAtom, false);
    set(regeneratingIndexAtom, null);
});

export const updateTokenCountAtom = atom(null, async (get, set) => {
    const isLoading = get(isLoadingAtom);
    const currentChat = get(currentChatAtom);

    if (!currentChat || currentChat.messages.length === 0 || isLoading) {
        set(tokenCountAtom, 0);
        return;
    }
    try {
        const messagesToCount = currentChat.messages.filter((msg: Message) => msg.parts.some(p => p.text?.trim() || p.inlineData));
        if (messagesToCount.length === 0) {
            set(tokenCountAtom, 0);
            return;
        }

        const providers = get(providersAtom);
        const modelId = currentChat.config.model;
        let provider = providers.find(p => p.models.some(m => m.id === modelId));

        if (!provider) {
            set(tokenCountAtom, 0);
            return;
        }

        const totalTokens = await countTokens(provider, modelId, messagesToCount);
        set(tokenCountAtom, totalTokens);
    } catch (error) {
        console.error("Error counting tokens:", error);
        set(tokenCountAtom, 0);
    }
});