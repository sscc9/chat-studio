/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { providersAtom, isSettingsModalOpenAtom, allModelsAtom, titleModelIdAtom } from '../store';
import { ProviderConfig, ModelConfig } from '../types';
import './SettingsModal.css';

export const SettingsModal = () => {
    const [isOpen, setIsOpen] = useAtom(isSettingsModalOpenAtom);
    const [providers, setProviders] = useAtom(providersAtom);
    const allModels = useAtomValue(allModelsAtom);
    const [titleModelId, setTitleModelId] = useAtom(titleModelIdAtom);
    const [selectedProviderId, setSelectedProviderId] = useState<string | 'general' | null>(null);
    const [isAddingProvider, setIsAddingProvider] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    // Form states
    const [newModelId, setNewModelId] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [editingModelId, setEditingModelId] = useState<string | null>(null);

    // Custom dropdown for title generation model
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const titleDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !selectedProviderId && !isAddingProvider) {
            if (providers.length > 0) {
                setSelectedProviderId(providers[0].id);
            } else {
                setSelectedProviderId('general');
            }
        }
    }, [isOpen, providers, selectedProviderId, isAddingProvider]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
                setIsTitleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setMobileView('list'), 300);
        }
    }, [isOpen]);

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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {mobileView === 'detail' ? (
                            <button 
                                className="icon-btn mobile-only"
                                onClick={() => setMobileView('list')}
                                title="返回"
                                style={{ padding: 0, marginRight: '0.25rem', color: 'var(--text-primary)' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                                </svg>
                            </button>
                        ) : (
                            <div 
                                className="mobile-only"
                                style={{ display: 'flex', alignItems: 'center', padding: 0, marginRight: '0.4rem', color: 'var(--text-secondary)' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-10h-6v10H5a2 2 0 0 1-2-2z"></path>
                                </svg>
                            </div>
                        )}
                        <h3 className="modal-title-desktop">设置</h3>
                        <h3 className="modal-title-mobile">
                            {mobileView === 'list' ? '设置' : 
                                (isAddingProvider ? '添加模型商' : selectedProviderId === 'general' ? '通用配置' : selectedProvider?.name || '设置')}
                        </h3>
                    </div>
                    <button className="settings-modal-close-btn" onClick={() => setIsOpen(false)} title="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </button>
                </div>
                <div className={`settings-modal-body ${mobileView === 'detail' ? 'show-detail' : ''}`}>
                    <div className="settings-sidebar">
                        <div className="settings-sidebar-list">
                            <div
                                className={`settings-provider-item ${selectedProviderId === 'general' ? 'active' : ''}`}
                                onClick={() => { setSelectedProviderId('general'); setIsAddingProvider(false); setMobileView('detail'); }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.13,5.91,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.85,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12c0,0.31,0.02,0.65,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></svg>
                                <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>通用配置</span>
                                <svg className="provider-item-chevron mobile-only" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M9.29 15.88L13.17 12 9.29 8.12a.996.996 0 1 1 1.41-1.41l4.59 4.59c.39.39.39 1.02 0 1.41L10.7 17.3a.996.996 0 0 1-1.41 0c-.38-.39-.39-1.03 0-1.42z"/>
                                </svg>
                            </div>
                            <div className="settings-sidebar-divider"></div>
                            {providers.map(p => (
                                <div
                                    key={p.id}
                                    className={`settings-provider-item ${selectedProviderId === p.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedProviderId(p.id); setIsAddingProvider(false); setMobileView('detail'); }}
                                >
                                    {p.type === 'google' ? (
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" /></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                                    )}
                                    <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                    <svg className="provider-item-chevron mobile-only" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M9.29 15.88L13.17 12 9.29 8.12a.996.996 0 1 1 1.41-1.41l4.59 4.59c.39.39.39 1.02 0 1.41L10.7 17.3a.996.996 0 0 1-1.41 0c-.38-.39-.39-1.03 0-1.42z"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                        <div className="settings-sidebar-footer">
                            <button className="add-provider-btn" onClick={() => { setIsAddingProvider(true); setSelectedProviderId(null); setMobileView('detail'); }}>
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
                        ) : selectedProviderId === 'general' ? (
                            <div className="general-settings">
                                <div className="settings-form-group">
                                    <label>标题生成模型</label>
                                    <div className="settings-hint">请选择一个专门用于自动生成对话标题的模型。</div>
                                    <div className="custom-select-container" ref={titleDropdownRef}>
                                        <div
                                            className="custom-select-trigger"
                                            onClick={() => setIsTitleDropdownOpen(prev => !prev)}
                                            role="button"
                                            aria-haspopup="listbox"
                                            aria-expanded={isTitleDropdownOpen}
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsTitleDropdownOpen(prev => !prev); }}
                                        >
                                            <span>{allModels.find(m => m.id === titleModelId)?.name || titleModelId || '未选择'}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708 .708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" /></svg>
                                        </div>
                                        {isTitleDropdownOpen && (
                                            <div className="custom-select-options" role="listbox">
                                                {allModels.length > 0 ? (
                                                    allModels.map(m => (
                                                        <div
                                                            key={m.id}
                                                            className={`custom-select-option ${titleModelId === m.id ? 'selected' : ''}`}
                                                            onClick={() => { setTitleModelId(m.id); setIsTitleDropdownOpen(false); }}
                                                            role="option"
                                                            aria-selected={titleModelId === m.id}
                                                        >
                                                            {m.providerName}: {m.name || m.id}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-models-message" style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                        无可用模型，请点管理添加。
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                                                        </svg>
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
                                                    <button className="icon-btn add-model-cancel-btn" onClick={cancelEditModel} title="取消编辑">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button className="icon-btn add-model-submit-btn" onClick={() => addModel(selectedProvider.id)} disabled={!newModelId} title={editingModelId ? "更新模型" : "添加模型"}>
                                                    {editingModelId ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
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
