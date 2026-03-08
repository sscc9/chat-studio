/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './ConfigPanel.css';
import {
    isConfigPanelVisibleAtom,
    isConfigPanelOpenAtom,
    activeConfigTabAtom,
    themeAtom,
    modelAtom,
    isModelDropdownOpenAtom,
    systemInstructionAtom,
    isSystemPromptEditorOpenAtom,
    useGoogleSearchAtom,
    documentContentAtom,
    isDocumentEditorOpenAtom,
    activePresetGroupIdAtom,
    presetGroupsAtom,
    editingGroupIdAtom,
    editingGroupNameAtom,
    isCreatingGroupAtom,
    newGroupNameAtom,
    documentChaptersAtom,

    handleConfigChangeAtom,
    handleDocumentFileChangeAtom,
    handleDocumentUploadClickAtom,
    handleClearDocumentAtom,
    handleStartAddPresetAtom,
    handleStartRenameGroupAtom,
    handleUpdateGroupNameAtom,
    handleDeletePresetGroupAtom,
    handleAddPresetGroupAtom,
    handlePresetClickAtom,
    handleStartEditPresetAtom,
    handleDeletePresetPromptAtom,

    filteredPromptsAtom,

    modelDropdownRefAtom,
    renamingInputRefAtom,
    creatingInputRefAtom,
    documentFileInputRefAtom,
    isSettingsModalOpenAtom,
    allModelsAtom,
} from '../store';
import { SettingsModal } from './SettingsModal';


export const ConfigPanel = () => {
    // Read/Write State
    const [isConfigPanelVisible, setIsConfigPanelVisible] = useAtom(isConfigPanelVisibleAtom);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useAtom(isConfigPanelOpenAtom);
    const [activeConfigTab, setActiveConfigTab] = useAtom(activeConfigTabAtom);
    const [theme, setTheme] = useAtom(themeAtom);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useAtom(isModelDropdownOpenAtom);
    const setIsSystemPromptEditorOpen = useSetAtom(isSystemPromptEditorOpenAtom);
    const setIsDocumentEditorOpen = useSetAtom(isDocumentEditorOpenAtom);
    const [activePresetGroupId, setActivePresetGroupId] = useAtom(activePresetGroupIdAtom);
    const [editingGroupId, setEditingGroupId] = useAtom(editingGroupIdAtom);
    const [editingGroupName, setEditingGroupName] = useAtom(editingGroupNameAtom);
    const [isCreatingGroup, setIsCreatingGroup] = useAtom(isCreatingGroupAtom);
    const [newGroupName, setNewGroupName] = useAtom(newGroupNameAtom);

    // Read-Only State
    const model = useAtomValue(modelAtom);
    const systemInstruction = useAtomValue(systemInstructionAtom);
    const useGoogleSearch = useAtomValue(useGoogleSearchAtom);
    const documentContent = useAtomValue(documentContentAtom);
    const presetGroups = useAtomValue(presetGroupsAtom);
    const filteredPrompts = useAtomValue(filteredPromptsAtom);
    const allModels = useAtomValue(allModelsAtom);

    // Write-Only Functions (Actions)
    const handleConfigChange = useSetAtom(handleConfigChangeAtom);
    const handleDocumentFileChange = useSetAtom(handleDocumentFileChangeAtom);
    const handleDocumentUploadClick = useSetAtom(handleDocumentUploadClickAtom);
    const handleClearDocument = useSetAtom(handleClearDocumentAtom);
    const setDocumentContent = useSetAtom(documentContentAtom);
    const handleStartAddPreset = useSetAtom(handleStartAddPresetAtom);
    const handleStartRenameGroup = useSetAtom(handleStartRenameGroupAtom);
    const handleUpdateGroupName = useSetAtom(handleUpdateGroupNameAtom);
    const handleDeletePresetGroup = useSetAtom(handleDeletePresetGroupAtom);
    const handleAddPresetGroup = useSetAtom(handleAddPresetGroupAtom);
    const handlePresetClick = useSetAtom(handlePresetClickAtom);
    const handleStartEditPreset = useSetAtom(handleStartEditPresetAtom);
    const handleDeletePresetPrompt = useSetAtom(handleDeletePresetPromptAtom);
    const setIsSettingsModalOpen = useSetAtom(isSettingsModalOpenAtom);

    // Refs
    const modelDropdownRef = useAtomValue(modelDropdownRefAtom);
    const renamingInputRef = useAtomValue(renamingInputRefAtom);
    const creatingInputRef = useAtomValue(creatingInputRefAtom);
    const documentFileInputRef = useAtomValue(documentFileInputRefAtom);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [modelDropdownRef, setIsModelDropdownOpen]);

    return (
        <>
            <aside className={`config-panel ${isConfigPanelOpen ? 'mobile-open' : ''}`}>
                <div className="panel-content-wrapper">
                    <div className="config-panel-tabs">
                        <button className={`config-tab ${activeConfigTab === 'configuration' ? 'active' : ''}`} onClick={() => setActiveConfigTab('configuration')}>
                            通用配置
                        </button>
                        <button className={`config-tab ${activeConfigTab === 'writing' ? 'active' : ''}`} onClick={() => setActiveConfigTab('writing')}>
                            辅助创作
                        </button>

                        <div className="config-panel-header-actions">
                            <button
                                className="panel-toggle-btn"
                                onClick={() => setIsConfigPanelVisible(false)}
                                aria-label="隐藏配置面板"
                                title="隐藏配置面板"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" /></svg>
                            </button>
                            <button
                                className="mobile-close-btn"
                                onClick={() => setIsConfigPanelOpen(false)}
                                aria-label="关闭配置面板"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="config-content">
                        {activeConfigTab === 'configuration' && (
                            <>
                                <div className="config-item">
                                    <label>主题</label>
                                    <div className="theme-toggle">
                                        <button
                                            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                            onClick={() => setTheme('light')}
                                            title="亮色模式"
                                            aria-pressed={theme === 'light'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z" />
                                            </svg>
                                        </button>
                                        <button
                                            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                            onClick={() => setTheme('dark')}
                                            title="暗色模式"
                                            aria-pressed={theme === 'dark'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                                            </svg>
                                        </button>
                                        <button
                                            className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                                            onClick={() => setTheme('system')}
                                            title="跟随系统"
                                            aria-pressed={theme === 'system'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="config-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ marginBottom: 0 }}>模型</label>
                                        <button
                                            className="icon-btn"
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            title="管理模型"
                                            style={{ padding: '4px', borderRadius: '6px' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="custom-select-container" ref={modelDropdownRef}>
                                        <div
                                            className="custom-select-trigger"
                                            onClick={() => setIsModelDropdownOpen(prev => !prev)}
                                            role="button"
                                            aria-haspopup="listbox"
                                            aria-expanded={isModelDropdownOpen}
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsModelDropdownOpen(prev => !prev); }}
                                        >
                                            <span>{allModels.find(m => m.id === model)?.name || model}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708 .708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" /></svg>
                                        </div>
                                        {isModelDropdownOpen && (
                                            <div className="custom-select-options" role="listbox">
                                                {allModels.length > 0 ? (
                                                    allModels.map(m => (
                                                        <div
                                                            key={m.id}
                                                            className={`custom-select-option ${model === m.id ? 'selected' : ''}`}
                                                            onClick={() => { handleConfigChange({ model: m.id }); setIsModelDropdownOpen(false); }}
                                                            role="option"
                                                            aria-selected={model === m.id}
                                                        >
                                                            {m.name || m.id}
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
                                <div className="config-item">
                                    <label htmlFor="system-instruction">系统提示词</label>
                                    <div
                                        id="system-instruction"
                                        className={`system-prompt-preview ${!systemInstruction ? 'placeholder' : ''}`}
                                        onClick={() => setIsSystemPromptEditorOpen(true)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {systemInstruction || "例如：你是一个乐于助人的助手，说话像个海盗。"}
                                    </div>
                                </div>
                                <div className="config-item">
                                    <label htmlFor="google-search">网页搜索</label>
                                    <label className="switch">
                                        <input
                                            id="google-search"
                                            type="checkbox"
                                            checked={useGoogleSearch}
                                            onChange={(e) => handleConfigChange({ useGoogleSearch: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </>
                        )}
                        {activeConfigTab === 'writing' && (
                            <>
                                <div className="config-item">
                                    <div className="local-document-header">
                                        <label>本地参考文档</label>
                                        <div className="local-document-actions">
                                            <input type="file" ref={documentFileInputRef} onChange={handleDocumentFileChange} accept=".txt,.md,text/*" style={{ display: 'none' }} />
                                            <button className="icon-btn" onClick={handleDocumentUploadClick} title="上传文档">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" /><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" /></svg>
                                            </button>
                                            <button className="icon-btn" onClick={handleClearDocument} disabled={!documentContent} title="清除文档">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        id="local-document"
                                        className={`local-document-preview ${!documentContent ? 'placeholder' : ''}`}
                                        onClick={() => setIsDocumentEditorOpen(true)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {documentContent || "上传或粘贴文档作为本地上下文..."}
                                    </div>
                                    <p className="local-document-help">此文档仅存储在本地，不会发送给 AI。</p>
                                </div>
                                <div className="config-item preset-prompts-manager">
                                    <div className="preset-prompts-header">
                                        <label>预设 Prompt</label>
                                        <button className="icon-btn" onClick={(e) => handleStartAddPreset(e)} title="添加新 Prompt">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="preset-group-tag-list">
                                        <div
                                            className={`preset-group-tag ${activePresetGroupId === 'all' ? 'is-active' : ''}`}
                                            onClick={() => setActivePresetGroupId('all')}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            未分组
                                        </div>
                                        {presetGroups.map(group => (
                                            editingGroupId === group.id ? (
                                                <input
                                                    type="text"
                                                    ref={renamingInputRef}
                                                    key={group.id}
                                                    className="preset-group-tag-input"
                                                    value={editingGroupName}
                                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                                    onBlur={handleUpdateGroupName}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') { e.preventDefault(); handleUpdateGroupName(); }
                                                        if (e.key === 'Escape') (setEditingGroupId as any)(() => null);
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    key={group.id}
                                                    className={`preset-group-tag ${activePresetGroupId === group.id ? 'is-active' : ''}`}
                                                    onClick={() => setActivePresetGroupId(group.id)}
                                                    onDoubleClick={() => handleStartRenameGroup(group)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <span className="preset-group-tag-name" title={group.name}>{group.name}</span>
                                                    <button className="preset-group-tag-delete" title="删除分组" onClick={(e) => { e.stopPropagation(); handleDeletePresetGroup(group.id); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                        {isCreatingGroup ? (
                                            <input
                                                type="text"
                                                ref={creatingInputRef}
                                                className="preset-group-tag-input"
                                                placeholder="新分组"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                onBlur={() => { handleAddPresetGroup(newGroupName); setNewGroupName(''); }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddPresetGroup(newGroupName); setNewGroupName(''); }
                                                    if (e.key === 'Escape') { setIsCreatingGroup(false); setNewGroupName(''); }
                                                }}
                                            />
                                        ) : (
                                            <button className="icon-btn" title="添加新分组" onClick={() => setIsCreatingGroup(true)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className="preset-prompts-help">点击插入到当前输入框。</p>
                                    <div className="preset-prompts-list">
                                        {filteredPrompts.map(p => (
                                            <div key={p.id} className="preset-prompt-item" onClick={() => handlePresetClick(p.text)} title="点击插入">
                                                <span className="preset-prompt-text">{p.text}</span>
                                                <div className="preset-prompt-actions">
                                                    <button title="编辑" onClick={(e) => { e.stopPropagation(); handleStartEditPreset(p, e); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z" /></svg>
                                                    </button>
                                                    <button title="删除" className="delete-preset-btn" onClick={(e) => { e.stopPropagation(); handleDeletePresetPrompt(p.id); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredPrompts.length === 0 && <div className="no-presets-message">暂无预设。</div>}
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </aside>
            <SettingsModal />
        </>
    );
};