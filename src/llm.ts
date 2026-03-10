/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Message, ProviderConfig } from "./types";

export interface GenerationChunk {
    text: string;
    groundingChunks?: any[];
}

export async function* streamGenerateContent(
    provider: ProviderConfig,
    modelId: string,
    messages: Message[],
    systemInstruction?: string,
    useWebSearch?: boolean
): AsyncGenerator<GenerationChunk, void, unknown> {
    if (provider.type === 'google') {
        const ai = new GoogleGenAI({ apiKey: provider.apiKey });

        const config: any = {};
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }
        if (useWebSearch) {
            // @google/genai syntax for enabling Google Search tool
            config.tools = [{ googleSearch: {} }];
        }

        // The @google/genai SDK expects contents in a specific format.
        // Assuming messages are already in a compatible format or close to it.
        // api.ts passes `contents` directly, so we assume `Message[]` is compatible.

        const stream = await ai.models.generateContentStream({
            model: modelId,
            contents: messages as any, // Cast to any to avoid strict type checks against SDK types for now
            config: config,
        });

        for await (const chunk of stream) {
            const text = chunk.text;
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            yield { text, groundingChunks };
        }
    } else if (provider.type === 'openai-compatible') {
        const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
        const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

        const openAIMessages = [];
        if (systemInstruction) {
            openAIMessages.push({ role: 'system', content: systemInstruction });
        }

        for (const m of messages) {
            const role = m.role === 'model' ? 'assistant' : m.role;
            // OpenAI expects content to be a string (usually)
            const content = m.parts.map(p => p.text).join('');
            openAIMessages.push({ role, content });
        }

        const bodyPayload: any = {
            model: modelId,
            messages: openAIMessages,
            stream: true
        };

        if (useWebSearch) {
            const isDoubao = modelId.toLowerCase().includes('doubao') || modelId.toLowerCase().includes('ep-');
            if (isDoubao) {
                // Use Doubao 2.0's reasoning/thought search exclusively
                // as requested by user to fix it to "search while thinking"
                bodyPayload.tools = [
                    {
                        type: "function",
                        function: {
                            name: "reasoning_search",
                            description: "深度思考下的推理搜索/边想边搜"
                        }
                    }
                ];
            }
            // Skipping Claude logic as requested by user
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${err}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '') continue;
                if (trimmed.startsWith('data: ')) {
                    const data = trimmed.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content || '';
                        if (content) yield { text: content };
                    } catch (e) {
                        console.error("Error parsing SSE:", e);
                    }
                }
            }
        }
    } else {
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
}

export async function countTokens(
    provider: ProviderConfig,
    modelId: string,
    messages: Message[]
): Promise<number> {
    if (provider.type === 'google') {
        const ai = new GoogleGenAI({ apiKey: provider.apiKey });
        const { totalTokens } = await ai.models.countTokens({
            model: modelId,
            contents: messages as any
        });
        return totalTokens || 0;
    }
    // For OpenAI, token counting is local usually, or via API?
    // OpenAI doesn't have a cheap countTokens API.
    // We'll return 0 or implement a rough estimator later.
    return 0;
}
