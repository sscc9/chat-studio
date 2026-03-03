/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ProviderConfig } from '../types';

const defaultProviders: ProviderConfig[] = [];

export const providersAtom = atomWithStorage<ProviderConfig[]>('chat-studio-providers', defaultProviders);

export const allModelsAtom = atom((get) => {
    const providers = get(providersAtom);
    return providers.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id, providerName: p.name })));
});

export const isSettingsModalOpenAtom = atom(false);
