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
        let url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

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

        const isDeepSeekV4 = modelId.startsWith('deepseek-v4');
        const bodyPayload: any = {
            model: modelId,
            messages: openAIMessages,
            stream: true,
            max_tokens: 16000,
        };

        if (isDeepSeekV4) {
            // DeepSeek V4 reasoning parameters
            bodyPayload.thinking = { type: 'enabled' };
            bodyPayload.reasoning_effort = 'high';
        } else {
            // Adaptive thinking: Claude 4.6+ will automatically determine
            // how much reasoning to apply based on task complexity.
            bodyPayload.reasoning = { enabled: true };
            // Prompt caching (5-min TTL): automatically caches conversation
            // history to reduce cost and latency on repeated content.
            bodyPayload.cache_control = { type: 'ephemeral' };
        }

        // Web search is currently disabled for openai-compatible providers (Doubao/Claude)
        // because standard endpoints do not support server-side search directly.

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
