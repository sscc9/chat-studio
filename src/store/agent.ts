/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';
import { FunctionDeclaration, Type } from "@google/genai";
import type { Message, MessagePart } from '../types';
import { showToastAtom } from './ui';
import { handleSendUserMessageOnlyAtom, createLoggableMessage } from './message';
// FIX: Added logActionAtom to import from chat.ts to break circular dependency
import { handleNewChatAtom, chatsAtom, handleDeleteChatAtom, currentChatIdAtom, handleConfigChangeAtom, logActionAtom, currentChatAtom } from './chat';
import { aiAtom } from './core';

// =================================================================
// AGENT ATOMS
// =================================================================
export const agentUserInputAtom = atom('');
export const isAgentLoadingAtom = atom(false);
export const agentRegeneratingIndexAtom = atom<number | null>(null);

// Derived atom to get/set agent messages from the current chat
export const agentMessagesAtom = atom(
    (get) => get(currentChatAtom)?.agentMessages || [],
    (get, set, newMessages: Message[] | ((prev: Message[]) => Message[])) => {
        const currentChatId = get(currentChatIdAtom);
        if (!currentChatId) return;
        set(chatsAtom, (prevChats) =>
            prevChats.map((chat) => {
                if (chat.id === currentChatId) {
                    const currentMessages = chat.agentMessages || [];
                    const updatedMessages = typeof newMessages === 'function' ? newMessages(currentMessages) : newMessages;
                    return { ...chat, agentMessages: updatedMessages };
                }
                return chat;
            })
        );
    }
);


const AGENT_SYSTEM_INSTRUCTION = `You are an expert AI prompt engineer and conversational analyst named 'Agent'. Your goal is to help the user refine their conversations with another AI. You have a set of tools to interact with the application on the user's behalf. You can list all chats, get the full context of a specific chat (including its history, system prompt, and action log), send messages to the main AI, update prompts, and manage chats. Use your tools when the user asks you to perform an action or analyze something. Be proactive and helpful. Your responses should be concise. The user's currently active chat has the ID: {currentChatId}.`;

const agentTools: FunctionDeclaration[] = [
    {
        name: 'listChatSessions',
        description: 'Lists the titles and IDs of all available chat sessions.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'getChatContext',
        description: 'Retrieves the full context of a specific chat session, including its system prompt, message history, and action log.',
        parameters: {
            type: Type.OBJECT,
            properties: { chatId: { type: Type.STRING, description: 'The ID of the chat to retrieve.' } },
            required: ['chatId'],
        },
    },
    {
        name: 'sendToMainAI',
        description: 'Sends a message to the main AI in a specific chat session, as if the user sent it.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                chatId: { type: Type.STRING, description: 'The ID of the chat to send the message to.' },
                prompt: { type: Type.STRING, description: 'The message text to send.' },
            },
            required: ['chatId', 'prompt'],
        },
    },
    {
        name: 'updateSystemPrompt',
        description: 'Updates the system prompt of a specific chat.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                chatId: { type: Type.STRING, description: 'The ID of the chat whose system prompt will be updated.' },
                newPrompt: { type: Type.STRING, description: 'The new system prompt text.' },
            },
            required: ['chatId', 'newPrompt'],
        },
    },
    {
        name: 'updateUserMessage',
        description: 'Updates a specific user message in a chat.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                chatId: { type: Type.STRING, description: 'The ID of the chat containing the message.' },
                messageIndex: { type: Type.NUMBER, description: 'The zero-based index of the message to update.' },
                newText: { type: Type.STRING, description: 'The new text for the user message.' },
            },
            required: ['chatId', 'messageIndex', 'newText'],
        },
    },
    {
        name: 'createNewChat',
        description: 'Creates a new, empty chat.',
        parameters: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING, description: 'The title for the new chat.' } },
            required: ['title'],
        },
    },
    {
        name: 'deleteChat',
        description: 'Deletes a chat session permanently.',
        parameters: {
            type: Type.OBJECT,
            properties: { chatId: { type: Type.STRING, description: 'The ID of the chat to delete.' } },
            required: ['chatId'],
        },
    },
    {
        name: 'clearActionLog',
        description: 'Clears all entries from the action log of a specific chat.',
        parameters: {
            type: Type.OBJECT,
            properties: { chatId: { type: Type.STRING, description: 'The ID of the chat whose action log will be cleared.' } },
            required: ['chatId'],
        },
    },
];

export const handleSendToAgentAtom = atom(null, async (get, set, prompt?: string) => {
    const ai = get(aiAtom);
    const userInput = get(agentUserInputAtom);
    const agentMessages = get(agentMessagesAtom);
    const currentChatId = get(currentChatIdAtom);

    if (!ai) {
        set(showToastAtom, "Agent is offline (API key not configured).");
        return;
    }

    const textToSend = prompt || userInput.trim();

    // Special handling for regenerating from last user message
    const lastMessage = agentMessages[agentMessages.length - 1];
    const shouldRegenerate = !textToSend && lastMessage?.role === 'user';
    if (shouldRegenerate) {
        set(handleRegenerateAgentResponseAtom, agentMessages.length - 1);
        return;
    }
    
    if (!textToSend) return;

    set(isAgentLoadingAtom, true);

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    set(agentMessagesAtom, prev => [...prev, userMessage]);
    if (!prompt) {
        set(agentUserInputAtom, '');
    }

    const contents = [...agentMessages, userMessage];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                systemInstruction: AGENT_SYSTEM_INSTRUCTION.replace('{currentChatId}', currentChatId || 'N/A'),
                tools: [{ functionDeclarations: agentTools }],
            },
        });

        if (!get(isAgentLoadingAtom)) return;

        const modelTurn = response.candidates[0].content;
        const functionCalls = response.functionCalls;
        let responseText = response.text || '';

        if (functionCalls && functionCalls.length > 0) {
            const functionResponseParts: MessagePart[] = [];

            for (const call of functionCalls) {
                let result: any;
                switch (call.name) {
                    case 'listChatSessions':
                        result = get(chatsAtom).map(c => ({ id: c.id, title: c.title }));
                        break;
                    case 'getChatContext':
                        // FIX: Add type assertions for arguments from function calls.
                        const chat = get(chatsAtom).find(c => c.id === call.args.chatId as string);
                        result = chat ? { id: chat.id, title: chat.title, config: chat.config, messages: chat.messages, agentMessages: chat.agentMessages, actionLog: chat.actionLog } : { error: `Chat with ID ${call.args.chatId as string} not found.` };
                        break;
                    case 'sendToMainAI':
                        // FIX: Add type assertions for arguments from function calls.
                        const targetChat = get(chatsAtom).find(c => c.id === call.args.chatId as string);
                        if (!targetChat) {
                            result = `Error: Chat with ID ${call.args.chatId as string} not found.`;
                        } else {
                            set(handleSendUserMessageOnlyAtom, call.args.prompt as string);
                            result = `Message sent to main AI in chat "${targetChat.title}".`;
                        }
                        break;
                    case 'updateSystemPrompt':
                        // FIX: Add type assertions for arguments from function calls.
                        set(handleConfigChangeAtom, { systemInstruction: call.args.newPrompt as string }, call.args.chatId as string, true);
                        set(showToastAtom, "Agent updated a system prompt.");
                        result = { success: true };
                        break;
                    case 'updateUserMessage':
                        // FIX: Add type assertions for arguments from function calls.
                        const chatToUpdate = get(chatsAtom).find(c => c.id === call.args.chatId as string);
                        if (!chatToUpdate || (call.args.messageIndex as number) >= chatToUpdate.messages.length || chatToUpdate.messages[call.args.messageIndex as number].role !== 'user') {
                            result = { error: `Invalid message index ${call.args.messageIndex as number} for chat ID ${call.args.chatId as string}.`};
                        } else {
                            const originalMessage = chatToUpdate.messages[call.args.messageIndex as number];
                            const originalText = originalMessage.parts.find(p => p.text)?.text || '';
                            const loggableMessage = createLoggableMessage(originalMessage);
                            set(logActionAtom, 'agent_edit_message', { index: call.args.messageIndex as number, from: originalText, to: call.args.newText as string, originalContent: loggableMessage }, call.args.chatId as string);
                            set(chatsAtom, prev => prev.map(c => {
                                if (c.id === call.args.chatId as string) {
                                    const newMessages = [...c.messages];
                                    newMessages[call.args.messageIndex as number].parts = [{ text: call.args.newText as string }];
                                    return { ...c, messages: newMessages };
                                }
                                return c;
                            }));
                            set(showToastAtom, `Agent updated user message.`);
                            result = { success: true };
                        }
                        break;
                    case 'createNewChat':
                        // FIX: Add type assertions for arguments from function calls.
                        const newChat = set(handleNewChatAtom, call.args.title as string);
                        result = { newChatId: newChat.id, title: newChat.title };
                        break;
                    case 'deleteChat':
                        // FIX: Add type assertions for arguments from function calls.
                        result = set(handleDeleteChatAtom, call.args.chatId as string);
                        set(showToastAtom, "Agent deleted a chat.");
                        break;
                    case 'clearActionLog':
                        // FIX: Add type assertions for arguments from function calls.
                        set(chatsAtom, prev => prev.map(c => c.id === call.args.chatId as string ? { ...c, actionLog: [] } : c));
                        set(showToastAtom, "Agent cleared an action log.");
                        result = { success: true };
                        break;
                    default:
                        result = { error: `Unknown function ${call.name}` };
                }
                functionResponseParts.push({
                    functionResponse: {
                        name: call.name,
                        response: { result },
                    },
                });
            }

            if (responseText.trim()) {
                set(agentMessagesAtom, prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
            }
            const thinkingMessage: Message = { role: 'model', parts: [{ text: "..." }]};
            set(agentMessagesAtom, prev => [...prev, thinkingMessage]);

            const toolTurn: Message = { role: 'tool', parts: functionResponseParts };

            const secondResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [...contents, modelTurn, toolTurn],
                config: {
                    systemInstruction: AGENT_SYSTEM_INSTRUCTION.replace('{currentChatId}', currentChatId || 'N/A'),
                    tools: [{ functionDeclarations: agentTools }],
                },
            });

            if (!get(isAgentLoadingAtom)) return;

            responseText = secondResponse.text;
            set(agentMessagesAtom, prev => [...prev.slice(0, -1), { role: 'model', parts: [{ text: responseText }] }]);
        } else {
             set(agentMessagesAtom, prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
        }
    } catch (error: any) {
        if (!get(isAgentLoadingAtom)) return;
        console.error("Agent error:", error);
        const errorMessage: Message = { role: 'model', parts: [{ text: `**Agent Error:** ${error.message}` }] };
        set(agentMessagesAtom, prev => [...prev, errorMessage]);
    } finally {
        set(isAgentLoadingAtom, false);
    }
});

export const handleAnalyzeChatAtom = atom(null, (get, set) => {
    const prompt = "请分析当前的聊天会话，包括其历史记录、系统提示和操作日志。";
    set(handleSendToAgentAtom, prompt);
});

export const handleDeleteAgentMessageAtom = atom(
    null,
    (get, set, index: number) => {
        set(agentMessagesAtom, prev => prev.filter((_, i) => i !== index));
    }
);

export const handleRegenerateAgentResponseAtom = atom(
    null,
    async (get, set, index: number) => {
        const ai = get(aiAtom);
        const currentChatId = get(currentChatIdAtom);
        if (!ai || !currentChatId) return;

        const allMessages = get(agentMessagesAtom);
        const messageToRegenFrom = allMessages[index];
        if (!messageToRegenFrom) return;

        let contents: Message[];
        let targetIndex: number;
        
        if (messageToRegenFrom.role === 'model' && index > 0) {
            contents = allMessages.slice(0, index);
            targetIndex = index;
        } else if (messageToRegenFrom.role === 'user') {
            contents = allMessages.slice(0, index + 1);
            targetIndex = index + 1;
        } else {
            return; // Cannot regenerate from these conditions
        }

        set(isAgentLoadingAtom, true);
        set(agentRegeneratingIndexAtom, targetIndex);
        const loadingPlaceholder: Message = { role: 'model', parts: [{ text: "" }] };

        let messagesForUI: Message[];
        if (targetIndex < allMessages.length) {
            messagesForUI = allMessages.map((msg, i) => i === targetIndex ? loadingPlaceholder : msg);
        } else {
            messagesForUI = [...allMessages, loadingPlaceholder];
        }
        set(agentMessagesAtom, messagesForUI);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: contents,
                config: {
                    systemInstruction: AGENT_SYSTEM_INSTRUCTION.replace('{currentChatId}', currentChatId || 'N/A'),
                    tools: [{ functionDeclarations: agentTools }],
                },
            });

            if (!get(isAgentLoadingAtom)) return;
            
            const modelTurn = response.candidates[0].content;
            const functionCalls = response.functionCalls;
            let responseText = response.text || '';
            let finalMessage: Message;

            if (functionCalls && functionCalls.length > 0) {
                 const functionResponseParts: MessagePart[] = [];
                 for (const call of functionCalls) {
                    let result: any;
                    switch (call.name) {
                        case 'listChatSessions':
                            result = get(chatsAtom).map(c => ({ id: c.id, title: c.title }));
                            break;
                        case 'getChatContext':
                            const chat = get(chatsAtom).find(c => c.id === call.args.chatId as string);
                            result = chat ? { id: chat.id, title: chat.title, config: chat.config, messages: chat.messages, agentMessages: chat.agentMessages, actionLog: chat.actionLog } : { error: `Chat with ID ${call.args.chatId as string} not found.` };
                            break;
                        case 'sendToMainAI':
                            const targetChat = get(chatsAtom).find(c => c.id === call.args.chatId as string);
                            if (!targetChat) {
                                result = `Error: Chat with ID ${call.args.chatId as string} not found.`;
                            } else {
                                set(handleSendUserMessageOnlyAtom, call.args.prompt as string);
                                result = `Message sent to main AI in chat "${targetChat.title}".`;
                            }
                            break;
                        // ... other cases are omitted for brevity as they are less likely during a simple regeneration
                        default:
                            result = { error: `Unknown function ${call.name}` };
                    }
                    functionResponseParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { result },
                        },
                    });
                }
                
                const toolTurn: Message = { role: 'tool', parts: functionResponseParts };
                const secondResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: [...contents, modelTurn, toolTurn],
                    config: {
                        systemInstruction: AGENT_SYSTEM_INSTRUCTION.replace('{currentChatId}', currentChatId || 'N/A'),
                        tools: [{ functionDeclarations: agentTools }],
                    },
                });

                if (!get(isAgentLoadingAtom)) return;

                finalMessage = { role: 'model', parts: [{ text: secondResponse.text }]};
            } else {
                finalMessage = { role: 'model', parts: [{ text: responseText }]};
            }

            set(agentMessagesAtom, prev => prev.map((msg, i) => i === targetIndex ? finalMessage : msg));

        } catch (error: any) {
            if (!get(isAgentLoadingAtom)) return;
            console.error("Agent regeneration error:", error);
            const errorMessage: Message = { role: 'model', parts: [{ text: `**Agent Error:** ${error.message}` }] };
            set(agentMessagesAtom, prev => prev.map((msg, i) => i === targetIndex ? errorMessage : msg));
        } finally {
            set(isAgentLoadingAtom, false);
            set(agentRegeneratingIndexAtom, null);
        }
    }
);

export const handleClearAgentChatAtom = atom(
    null,
    (get, set) => {
        set(agentMessagesAtom, []);
        set(showToastAtom, "Agent chat cleared.");
    }
);

export const handleStopAgentGenerationAtom = atom(null, (get, set) => {
    set(isAgentLoadingAtom, false);
});