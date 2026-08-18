/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Message, ProviderConfig, TokenUsage } from "./types";

export interface GenerationChunk {
    text: string;
    groundingChunks?: any[];
    usage?: TokenUsage;
}

export async function* streamGenerateContent(
    provider: ProviderConfig,
    modelId: string,
    messages: Message[],
    systemInstruction?: string,
    useWebSearch?: boolean,
    signal?: AbortSignal
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
        if (signal) {
            config.abortSignal = signal;
        }

        const stream = await ai.models.generateContentStream({
            model: modelId,
            contents: messages as any,
            config: config,
        });

        for await (const chunk of stream) {
            const text = chunk.text || '';
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const chunkResult: GenerationChunk = { text, groundingChunks };
            // Extract usage metadata from Google GenAI stream (typically on the last chunk)
            const meta = chunk.usageMetadata as any;
            if (meta) {
                chunkResult.usage = {
                    promptTokens: meta.promptTokenCount || 0,
                    completionTokens: meta.candidatesTokenCount || 0,
                    totalTokens: meta.totalTokenCount || 0,
                };
            }
            yield chunkResult;
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
            
            // Check if there are any inlineData (images/files)
            const hasAttachments = m.parts.some(p => p.inlineData);
            
            if (!hasAttachments) {
                const content = m.parts.map(p => p.text).join('');
                openAIMessages.push({ role, content });
            } else {
                const contentParts: any[] = [];
                for (const p of m.parts) {
                    if (p.text) {
                        contentParts.push({ type: 'text', text: p.text });
                    }
                    if (p.inlineData) {
                        if (p.inlineData.mimeType.startsWith('image/')) {
                            contentParts.push({
                                type: 'image_url',
                                image_url: {
                                    url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
                                }
                            });
                        } else {
                            console.warn(`OpenAI compatible provider ignores non-image attachment: ${p.inlineData.name || 'file'}`);
                        }
                    }
                }
                openAIMessages.push({ role, content: contentParts });
            }
        }

        const bodyPayload: any = {
            model: modelId,
            messages: openAIMessages,
            stream: true,
            stream_options: { include_usage: true },
        };

        // Merge custom body parameters from provider settings if present
        if (provider.customBodyParams) {
            try {
                const parsedParams = JSON.parse(provider.customBodyParams);
                Object.assign(bodyPayload, parsedParams);
            } catch (e) {
                console.error("Failed to parse customBodyParams JSON:", e);
            }
        }

        // When useProxy is enabled, route through /api/proxy to avoid CORS
        let fetchUrl: string;
        let fetchHeaders: Record<string, string>;

        if (provider.useProxy) {
            fetchUrl = '/api/proxy';
            fetchHeaders = {
                'Content-Type': 'application/json',
                'x-target-url': url,
                'x-api-key': provider.apiKey,
            };
        } else {
            fetchUrl = url;
            fetchHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
            };
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(bodyPayload),
            signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${err}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Cancel the stream reader if abort is triggered
        const onAbort = () => {
            try {
                reader.cancel();
            } catch (e) {
                // ignore
            }
        };
        if (signal) {
            signal.addEventListener('abort', onAbort);
        }

        try {
            while (true) {
                if (signal?.aborted) break;
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
                            const chunkResult: GenerationChunk = { text: content };
                            // Extract usage from the final SSE chunk (OpenAI stream_options.include_usage)
                            if (json.usage) {
                                chunkResult.usage = {
                                    promptTokens: json.usage.prompt_tokens || 0,
                                    completionTokens: json.usage.completion_tokens || 0,
                                    totalTokens: json.usage.total_tokens || 0,
                                };
                            }
                            if (content || chunkResult.usage) yield chunkResult;
                        } catch (e) {
                            console.error("Error parsing SSE:", e);
                        }
                    }
                }
            }
        } finally {
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
        }
    } else if (provider.type === 'vertex-ai') {
        const region = provider.region || 'us-east5';
        const host = region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;
        const projectId = (provider.projectId || '').trim();

        if (!projectId) {
            throw new Error("请在设置中填写 Google Cloud 项目 ID (Project ID)");
        }

        // Check if calling Anthropic Claude on Vertex AI or Google Gemini on Vertex AI
        if (modelId.toLowerCase().includes('claude')) {
            const url = `https://${host}/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`;

            const anthropicMessages: any[] = [];
            for (const m of messages) {
                const role = m.role === 'model' ? 'assistant' : m.role;
                const contentParts: any[] = [];
                for (const p of m.parts) {
                    if (p.text) {
                        contentParts.push({ type: 'text', text: p.text });
                    }
                    if (p.inlineData) {
                        contentParts.push({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: p.inlineData.mimeType,
                                data: p.inlineData.data,
                            }
                        });
                    }
                }
                anthropicMessages.push({
                    role,
                    content: contentParts.length === 1 && contentParts[0].type === 'text' ? contentParts[0].text : contentParts
                });
            }

            const bodyPayload: any = {
                anthropic_version: "vertex-2023-10-16",
                messages: anthropicMessages,
                max_tokens: 8192,
                stream: true,
            };

            if (systemInstruction) {
                bodyPayload.system = systemInstruction;
            }

            if (provider.customBodyParams) {
                try {
                    const parsedParams = JSON.parse(provider.customBodyParams);
                    Object.assign(bodyPayload, parsedParams);
                } catch (e) {
                    console.error("Failed to parse customBodyParams JSON:", e);
                }
            }

            const isGcpApiKey = provider.apiKey.startsWith('AIzaSy');
            let fetchUrl = url;
            const fetchHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (isGcpApiKey) {
                fetchHeaders['x-goog-api-key'] = provider.apiKey;
                fetchHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
            } else {
                fetchHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
            }

            // Default useProxy to true for Vertex AI to prevent browser CORS block
            if (provider.useProxy !== false) {
                fetchUrl = '/api/proxy';
                fetchHeaders['x-target-url'] = url;
                fetchHeaders['x-api-key'] = provider.apiKey;
                if (isGcpApiKey) {
                    fetchHeaders['x-goog-api-key'] = provider.apiKey;
                }
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: fetchHeaders,
                body: JSON.stringify(bodyPayload),
                signal
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Vertex AI Error: ${response.status} ${response.statusText} - ${err}`);
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const onAbort = () => {
                try {
                    reader.cancel();
                } catch (e) {
                    // ignore
                }
            };
            if (signal) {
                signal.addEventListener('abort', onAbort);
            }

            let promptTokens = 0;
            let completionTokens = 0;

            try {
                while (true) {
                    if (signal?.aborted) break;
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            let text = '';
                            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                                text = json.delta.text || '';
                            } else if (json.type === 'content_block_start' && json.content_block?.text) {
                                text = json.content_block.text || '';
                            }

                            if (json.type === 'message_start' && json.message?.usage) {
                                promptTokens = json.message.usage.input_tokens || 0;
                                completionTokens = json.message.usage.output_tokens || 0;
                            } else if (json.type === 'message_delta' && json.usage) {
                                completionTokens = json.usage.output_tokens || completionTokens;
                            }

                            const chunkResult: GenerationChunk = { text };
                            if (promptTokens || completionTokens) {
                                chunkResult.usage = {
                                    promptTokens,
                                    completionTokens,
                                    totalTokens: promptTokens + completionTokens,
                                };
                            }
                            if (text || chunkResult.usage) yield chunkResult;
                        } catch (e) {
                            // ignore non-json stream lines
                        }
                    }
                }
            } finally {
                if (signal) {
                    signal.removeEventListener('abort', onAbort);
                }
            }
        } else {
            // Gemini on Vertex AI
            const ai = new GoogleGenAI({
                apiKey: provider.apiKey,
                vertexai: true,
                project: projectId,
                location: region,
            } as any);

            const config: any = {};
            if (systemInstruction) {
                config.systemInstruction = systemInstruction;
            }
            if (useWebSearch) {
                config.tools = [{ googleSearch: {} }];
            }
            if (signal) {
                config.abortSignal = signal;
            }

            const stream = await ai.models.generateContentStream({
                model: modelId,
                contents: messages as any,
                config: config,
            });

            for await (const chunk of stream) {
                const text = chunk.text || '';
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                const chunkResult: GenerationChunk = { text, groundingChunks };
                const meta = chunk.usageMetadata as any;
                if (meta) {
                    chunkResult.usage = {
                        promptTokens: meta.promptTokenCount || 0,
                        completionTokens: meta.candidatesTokenCount || 0,
                        totalTokens: meta.totalTokenCount || 0,
                    };
                }
                yield chunkResult;
            }
        }
    } else {
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
}

