/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { providersAtom, isSettingsModalOpenAtom } from '../store';
import { ProviderConfig, ModelConfig } from '../types';
import './SettingsModal.css';

export const SettingsModal = () => {
    const [isOpen, setIsOpen] = useAtom(isSettingsModalOpenAtom);
    const [providers, setProviders] = useAtom(providersAtom);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [isAddingProvider, setIsAddingProvider] = useState(false);

    // Form states
    const [newModelId, setNewModelId] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [editingModelId, setEditingModelId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && providers.length > 0 && !selectedProviderId && !isAddingProvider) {
            setSelectedProviderId(providers[0].id);
        }
    }, [isOpen, providers, selectedProviderId, isAddingProvider]);

    if (!isOpen) return null;

    const handleAddProvider = (type: 'google' | 'openai-compatible') => {
        const newProvider: ProviderConfig = {
            id: `${type}-${Date.now()}`,
            name: type === 'google' ? 'Google Gemini' : 'OpenAI Compatible',
            type,
            apiKey: '',
            models: []
        };
        setProviders([...providers, newProvider]);
        setSelectedProviderId(newProvider.id);
        setIsAddingProvider(false);
    };

    const updateProvider = (id: string, updates: Partial<ProviderConfig>) => {
        setProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProvider = (id: string) => {
        setProviders(providers.filter(p => p.id !== id));
        if (selectedProviderId === id) {
            setSelectedProviderId(null);
        }
    };

    const addModel = (providerId: string) => {
        if (!newModelId) return;
        const provider = providers.find(p => p.id === providerId);
        if (!provider) return;

        if (editingModelId) {
            const updatedModels = provider.models.map(m =>
                m.id === editingModelId
                    ? { ...m, id: newModelId, name: newModelName || newModelId }
                    : m
            );
            updateProvider(providerId, { models: updatedModels });
            setEditingModelId(null);
        } else {
            const newModel: ModelConfig = {
                id: newModelId,
                name: newModelName || newModelId
            };
            updateProvider(providerId, { models: [...provider.models, newModel] });
        }

        setNewModelId('');
        setNewModelName('');
    };

    const startEditModel = (model: ModelConfig) => {
        setEditingModelId(model.id);
        setNewModelId(model.id);
        setNewModelName(model.name);
    };

    const cancelEditModel = () => {
        setEditingModelId(null);
        setNewModelId('');
        setNewModelName('');
    };

    const removeModel = (providerId: string, modelId: string) => {
        const provider = providers.find(p => p.id === providerId);
        if (!provider) return;
        if (editingModelId === modelId) cancelEditModel();
        updateProvider(providerId, { models: provider.models.filter(m => m.id !== modelId) });
    };

    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    return (
        <div className="settings-modal-overlay" onClick={() => setIsOpen(false)}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h3>Settings</h3>
                    <button className="settings-modal-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                </div>
                <div className="settings-modal-body">
                    <div className="settings-sidebar">
                        <div className="settings-sidebar-list">
                            {providers.map(p => (
                                <div
                                    key={p.id}
                                    className={`settings-provider-item ${selectedProviderId === p.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedProviderId(p.id); setIsAddingProvider(false); }}
                                >
                                    {p.name}
                                </div>
                            ))}
                        </div>
                        <div className="settings-sidebar-footer">
                            <button className="add-provider-btn" onClick={() => { setIsAddingProvider(true); setSelectedProviderId(null); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                </svg>
                                Add Provider
                            </button>
                        </div>
                    </div>
                    <div className="settings-content">
                        {isAddingProvider ? (
                            <div>
                                <h4>Select Provider Type</h4>
                                <div className="provider-type-selection">
                                    <div className="provider-type-card" onClick={() => handleAddProvider('google')}>
                                        Google Gemini
                                    </div>
                                    <div className="provider-type-card" onClick={() => handleAddProvider('openai-compatible')}>
                                        OpenAI Compatible
                                    </div>
                                </div>
                            </div>
                        ) : selectedProvider ? (
                            <>
                                <div className="settings-form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        className="settings-input"
                                        value={selectedProvider.name}
                                        onChange={(e) => updateProvider(selectedProvider.id, { name: e.target.value })}
                                    />
                                </div>
                                <div className="settings-form-group">
                                    <label>API Key</label>
                                    <input
                                        type="password"
                                        className="settings-input"
                                        value={selectedProvider.apiKey}
                                        onChange={(e) => updateProvider(selectedProvider.id, { apiKey: e.target.value })}
                                        placeholder="Enter API Key"
                                    />
                                </div>
                                {selectedProvider.type === 'openai-compatible' && (
                                    <div className="settings-form-group">
                                        <label>Base URL (Optional)</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={selectedProvider.baseUrl || ''}
                                            onChange={(e) => updateProvider(selectedProvider.id, { baseUrl: e.target.value })}
                                            placeholder="https://api.openai.com/v1"
                                        />
                                    </div>
                                )}
                                <div className="settings-form-group">
                                    <label>Models</label>
                                    <div className="models-list">
                                        {selectedProvider.models.map(m => (
                                            <div key={m.id} className={`model-item ${editingModelId === m.id ? 'editing' : ''}`}>
                                                <span className="model-item-name">{m.name || m.id} <small style={{ opacity: 0.7 }}>({m.id})</small></span>
                                                <div className="model-item-actions">
                                                    <button className="model-edit-btn" onClick={() => startEditModel(m)} title="Edit">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z" /></svg>
                                                    </button>
                                                    <button className="model-delete-btn" onClick={() => removeModel(selectedProvider.id, m.id)} title="Delete">&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedProvider.models.length === 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No models added</div>
                                        )}
                                    </div>
                                    <div className="add-model-row">
                                        <input
                                            type="text"
                                            className="settings-input add-model-input"
                                            placeholder="Model ID (e.g. gpt-4)"
                                            value={newModelId}
                                            onChange={(e) => setNewModelId(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="settings-input add-model-input"
                                            placeholder="Display Name (Optional)"
                                            value={newModelName}
                                            onChange={(e) => setNewModelName(e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {editingModelId && (
                                                <button className="icon-btn" onClick={cancelEditModel} title="Cancel Edit">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg>
                                                </button>
                                            )}
                                            <button className="icon-btn" onClick={() => addModel(selectedProvider.id)} disabled={!newModelId} title={editingModelId ? "Update Model" : "Add Model"}>
                                                {editingModelId ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button className="delete-provider-btn" onClick={() => deleteProvider(selectedProvider.id)}>
                                    Delete Provider
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                                Select a provider or add a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
