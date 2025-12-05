/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ProviderConfig } from '../types';

const defaultProviders: ProviderConfig[] = [];

// Initialize with default Gemini provider if API key is available in env
if (process.env.API_KEY) {
    defaultProviders.push({
        id: 'google-default',
        name: 'Google Gemini',
        type: 'google',
        apiKey: process.env.API_KEY,
        models: [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
            { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking' },
        ]
    });
}

export const providersAtom = atomWithStorage<ProviderConfig[]>('chat-studio-providers', defaultProviders);

export const allModelsAtom = atom((get) => {
    const providers = get(providersAtom);
    return providers.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id, providerName: p.name })));
});

export const isSettingsModalOpenAtom = atom(false);
