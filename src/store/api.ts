/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { atom, PrimitiveAtom } from 'jotai';
import { providersAtom } from './settings';
import { streamGenerateContent } from '../llm';
import type { Message, Chat, TokenUsage } from '../types';
import { chatsAtom, currentChatAtom, handleAutoRenameChatAtom } from './chat';
import { isLoadingAtom, regeneratingIndexAtom, tokenCountAtom, showToastAtom } from './ui';

// =================================================================
// API ATOMS
// =================================================================
export const activeRequestRefAtom = atom(React.createRef<number | null>());
export const activeAbortControllerAtom: PrimitiveAtom<AbortController | null> = atom<AbortController | null>(null);

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
            return reject(new Error("此模型未配置供应商。请检查设置。"));
        }

        // Check if OpenAI compatible provider is receiving non-image attachments
        if (provider.type === 'openai-compatible') {
            const hasNonImageAttachment = contents.some(msg => 
                msg.parts.some(p => p.inlineData && !p.inlineData.mimeType.startsWith('image/'))
            );
            if (hasNonImageAttachment) {
                set(showToastAtom, "OpenAI 兼容模型目前仅支持图片附件，其他格式文件已被忽略。");
            }
        }

        // Initialize a new AbortController
        const controller = new AbortController();
        set(activeAbortControllerAtom, controller);

        try {
            set(chatsAtom, prevChats => prevChats.map(c =>
                c.id === chat.id
                    ? {
                        ...c,
                        updatedAt: Date.now(),
                        messages: c.messages.map((msg: Message, idx: number) =>
                            idx === targetIndex ? { ...msg, parts: [{ text: "" }], groundingChunks: [] } : msg
                        )
                    } : c
            ));

            const stream = streamGenerateContent(
                provider, 
                modelId, 
                contents, 
                chat.config.systemInstruction, 
                chat.config.useGoogleSearch,
                controller.signal
            );

            if (activeRequestRef.current !== requestId) return reject(new Error('Request cancelled'));

            let text = "";
            let allGroundingChunks: any[] = [];
            let lastUsage: TokenUsage | undefined;
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

                // Track the latest usage data (typically arrives on the last chunk)
                if (chunk.usage) {
                    lastUsage = chunk.usage;
                }

                set(chatsAtom, (prevChats) => prevChats.map((c) => {
                    if (c.id === chat.id) {
                        const newMessages = [...c.messages];
                        const messageToUpdate = { ...newMessages[targetIndex] };
                        messageToUpdate.parts = [{ text: text }];
                        messageToUpdate.groundingChunks = allGroundingChunks;
                        newMessages[targetIndex] = messageToUpdate;
                        return { ...c, messages: newMessages, updatedAt: Date.now() };
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
                // Save usage data to the model message
                if (lastUsage) {
                    set(chatsAtom, (prevChats) => prevChats.map((c) => {
                        if (c.id === chat.id) {
                            const newMessages = [...c.messages];
                            newMessages[targetIndex] = { ...newMessages[targetIndex], usage: lastUsage };
                            return { ...c, messages: newMessages };
                        }
                        return c;
                    }));
                    set(tokenCountAtom, lastUsage.totalTokens);
                }
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
                        newMessages[targetIndex] = { ...newMessages[targetIndex], parts: [{ text: `**错误:** ${error.message}` }] };
                        return { ...c, messages: newMessages, updatedAt: Date.now() };
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
                set(activeAbortControllerAtom, null);
            }
        }
    });
});

export const handleStopGenerationAtom = atom(null, (get, set) => {
    const activeRequestRef = get(activeRequestRefAtom);
    activeRequestRef.current = null;
    set(isLoadingAtom, false);
    set(regeneratingIndexAtom, null);

    const controller = get(activeAbortControllerAtom);
    if (controller) {
        controller.abort();
        set(activeAbortControllerAtom, null);
    }
});

// Reads token count from the last model message's stored usage data.
// This is called when switching chats to restore the displayed token count.
export const updateTokenCountAtom = atom(null, (get, set) => {
    const currentChat = get(currentChatAtom);

    if (!currentChat || currentChat.messages.length === 0) {
        set(tokenCountAtom, 0);
        return;
    }

    // Find the last model message with usage data
    for (let i = currentChat.messages.length - 1; i >= 0; i--) {
        const msg = currentChat.messages[i];
        if (msg.role === 'model' && msg.usage) {
            set(tokenCountAtom, msg.usage.totalTokens);
            return;
        }
    }

    set(tokenCountAtom, 0);
});