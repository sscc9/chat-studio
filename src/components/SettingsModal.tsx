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
                    <h3>设置</h3>
                    <button className="settings-modal-close-btn" onClick={() => setIsOpen(false)} title="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </button>
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
                                    {p.type === 'google' ? (
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" /></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                                    )}
                                    <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="settings-sidebar-footer">
                            <button className="add-provider-btn" onClick={() => { setIsAddingProvider(true); setSelectedProviderId(null); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                </svg>
                                添加模型商
                            </button>
                        </div>
                    </div>
                    <div className="settings-content">
                        {isAddingProvider ? (
                            <div className="provider-type-selection-container">
                                <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>选择模型商类型</h4>
                                <div className="provider-type-selection">
                                    <div className="provider-type-card" onClick={() => handleAddProvider('google')}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" /></svg>
                                        <span className="provider-type-name">Google Gemini</span>
                                    </div>
                                    <div className="provider-type-card" onClick={() => handleAddProvider('openai-compatible')}>
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                                        <span className="provider-type-name">OpenAI Compatible</span>
                                    </div>
                                </div>
                            </div>
                        ) : selectedProvider ? (
                            <>
                                <div className="settings-form-group">
                                    <label>名称</label>
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
                                        placeholder="输入 API Key"
                                    />
                                </div>
                                {selectedProvider.type === 'openai-compatible' && (
                                    <div className="settings-form-group">
                                        <label>接口地址 (选填)</label>
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
                                    <label>模型列表</label>
                                    <div className="models-list">
                                        {selectedProvider.models.map(m => (
                                            <div key={m.id} className={`model-item ${editingModelId === m.id ? 'editing' : ''}`}>
                                                <div className="model-item-name">
                                                    <span>{m.name || m.id}</span>
                                                    <span className="model-item-id">{m.id}</span>
                                                </div>
                                                <div className="model-item-actions">
                                                    <button className="model-edit-btn" onClick={() => startEditModel(m)} title="编辑">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z" /></svg>
                                                    </button>
                                                    <button className="model-delete-btn" onClick={() => removeModel(selectedProvider.id, m.id)} title="删除">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedProvider.models.length === 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>暂无已添加的模型</div>
                                        )}
                                    </div>
                                    <div className="add-model-section">
                                        <div className="add-model-section-title">添加新模型</div>
                                        <div className="add-model-row">
                                            <input
                                                type="text"
                                                className="settings-input add-model-input"
                                                placeholder="模型 ID (例如: gpt-4)"
                                                value={newModelId}
                                                onChange={(e) => setNewModelId(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="settings-input add-model-input"
                                                placeholder="显示名称 (选填)"
                                                value={newModelName}
                                                onChange={(e) => setNewModelName(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {editingModelId && (
                                                    <button className="icon-btn" onClick={cancelEditModel} title="取消编辑" style={{ padding: '8px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg>
                                                    </button>
                                                )}
                                                <button className="icon-btn add-model-submit-btn" onClick={() => addModel(selectedProvider.id)} disabled={!newModelId} title={editingModelId ? "更新模型" : "添加模型"}>
                                                    {editingModelId ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {!editingModelId && selectedProvider.type === 'google' && (
                                            <div className="quick-add-models">
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('gemini-2.0-flash-exp'); setNewModelName('Gemini 2.0 Flash'); }}>+ Gemini 2.0 Flash</span>
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('gemini-2.0-pro-exp'); setNewModelName('Gemini 2.0 Pro'); }}>+ Gemini 2.0 Pro</span>
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('gemini-2.0-flash-thinking-exp'); setNewModelName('Gemini Thinking'); }}>+ Gemini Thinking</span>
                                            </div>
                                        )}
                                        {!editingModelId && selectedProvider.type === 'openai-compatible' && (
                                            <div className="quick-add-models">
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('gpt-4o'); setNewModelName('GPT-4o'); }}>+ GPT-4o</span>
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('gpt-4-turbo'); setNewModelName('GPT-4 Turbo'); }}>+ GPT-4 Turbo</span>
                                                <span className="quick-add-tag" onClick={() => { setNewModelId('claude-3-5-sonnet-latest'); setNewModelName('Claude 3.5 Sonnet'); }}>+ Claude 3.5 Sonnet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button className="delete-provider-btn" onClick={() => deleteProvider(selectedProvider.id)}>
                                    删除模型商
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                                请选择一个模型商或添加新模型商
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
