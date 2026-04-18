/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
    isImportStudioModalOpenAtom,
    allModelsAtom,

    // System Presets
    activeSystemPresetGroupIdAtom,
    systemPresetGroupsAtom,
    editingSystemGroupIdAtom,
    editingSystemGroupNameAtom,
    isCreatingSystemGroupAtom,
    newSystemGroupNameAtom,
    filteredSystemPromptsAtom,
    renamingSystemInputRefAtom,
    creatingSystemInputRefAtom,

    handleAddSystemPresetGroupAtom,
    handleStartRenameSystemGroupAtom,
    handleUpdateSystemGroupNameAtom,
    handleDeleteSystemPresetGroupAtom,
    handleStartAddSystemPresetAtom,
    handleStartEditSystemPresetAtom,
    handleDeleteSystemPresetPromptAtom,
} from '../store';
import { SettingsModal } from './SettingsModal';
import { SystemPresetEditorModal } from './SystemPresetEditorModal';
import { ImportStudioModal } from './ImportStudioModal';


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
    const [isDeletingPresetGroup, setIsDeletingPresetGroup] = useState(false);

    // Read/Write State (System Presets)
    const [activeSystemPresetGroupId, setActiveSystemPresetGroupId] = useAtom(activeSystemPresetGroupIdAtom);
    const [editingSystemGroupId, setEditingSystemGroupId] = useAtom(editingSystemGroupIdAtom);
    const [editingSystemGroupName, setEditingSystemGroupName] = useAtom(editingSystemGroupNameAtom);
    const [isCreatingSystemGroup, setIsCreatingSystemGroup] = useAtom(isCreatingSystemGroupAtom);
    const [newSystemGroupName, setNewSystemGroupName] = useAtom(newSystemGroupNameAtom);
    const [isDeletingSystemGroup, setIsDeletingSystemGroup] = useState(false);

    // Read-Only State
    const model = useAtomValue(modelAtom);
    const systemInstruction = useAtomValue(systemInstructionAtom);
    const useGoogleSearch = useAtomValue(useGoogleSearchAtom);
    const documentContent = useAtomValue(documentContentAtom);
    const presetGroups = useAtomValue(presetGroupsAtom);
    const filteredPrompts = useAtomValue(filteredPromptsAtom);
    const allModels = useAtomValue(allModelsAtom);

    // Read-Only State (System Presets)
    const systemPresetGroups = useAtomValue(systemPresetGroupsAtom);
    const filteredSystemPrompts = useAtomValue(filteredSystemPromptsAtom);

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
    const setIsImportStudioModalOpen = useSetAtom(isImportStudioModalOpenAtom);

    // Write-Only Functions (System Presets)
    const handleAddSystemPresetGroup = useSetAtom(handleAddSystemPresetGroupAtom);
    const handleStartRenameSystemGroup = useSetAtom(handleStartRenameSystemGroupAtom);
    const handleUpdateSystemGroupName = useSetAtom(handleUpdateSystemGroupNameAtom);
    const handleDeleteSystemPresetGroup = useSetAtom(handleDeleteSystemPresetGroupAtom);
    const handleStartAddSystemPreset = useSetAtom(handleStartAddSystemPresetAtom);
    const handleStartEditSystemPreset = useSetAtom(handleStartEditSystemPresetAtom);
    const handleDeleteSystemPresetPrompt = useSetAtom(handleDeleteSystemPresetPromptAtom);

    // Refs
    const modelDropdownRef = useAtomValue(modelDropdownRefAtom);
    const renamingInputRef = useAtomValue(renamingInputRefAtom);
    const creatingInputRef = useAtomValue(creatingInputRefAtom);
    const documentFileInputRef = useAtomValue(documentFileInputRefAtom);

    // Refs (System Presets)
    const renamingSystemInputRef = useAtomValue(renamingSystemInputRefAtom);
    const creatingSystemInputRef = useAtomValue(creatingSystemInputRefAtom);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [modelDropdownRef, setIsModelDropdownOpen]);

    // Auto-focus logic for normal presets
    useEffect(() => {
        if (isCreatingGroup && creatingInputRef.current) {
            creatingInputRef.current.focus();
        }
    }, [isCreatingGroup, creatingInputRef]);

    useEffect(() => {
        if (editingGroupId && renamingInputRef.current) {
            renamingInputRef.current.focus();
            renamingInputRef.current.select();
        }
    }, [editingGroupId, renamingInputRef]);

    // Auto-focus logic for system presets
    useEffect(() => {
        if (isCreatingSystemGroup && creatingSystemInputRef.current) {
            creatingSystemInputRef.current.focus();
        }
    }, [isCreatingSystemGroup, creatingSystemInputRef]);

    useEffect(() => {
        if (editingSystemGroupId && renamingSystemInputRef.current) {
            renamingSystemInputRef.current.focus();
            renamingSystemInputRef.current.select();
        }
    }, [editingSystemGroupId, renamingSystemInputRef]);

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

                                <div className="config-item">
                                    <label>导入对话</label>
                                    <button
                                        className="import-studio-upload-btn"
                                        onClick={() => setIsImportStudioModalOpen(true)}
                                        style={{ width: '100%', justifyContent: 'center', padding: '0.6rem 1rem' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
                                            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                                        </svg>
                                        从 AI Studio 导入对话
                                    </button>
                                </div>

                                <div className="config-item preset-prompts-manager">
                                    <div className="preset-prompts-header">
                                        <label>管理系统提示词</label>
                                        <button className="icon-btn" onClick={(e) => handleStartAddSystemPreset(e)} title="添加新系统提示词">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className={`preset-group-tag-list ${isDeletingSystemGroup ? 'delete-mode' : ''}`}>
                                        <div
                                            className={`preset-group-tag ${activeSystemPresetGroupId === 'all' ? 'is-active' : ''}`}
                                            onClick={() => setActiveSystemPresetGroupId('all')}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            未分组
                                        </div>
                                        {systemPresetGroups.map(group => (
                                            editingSystemGroupId === group.id ? (
                                                <input
                                                    type="text"
                                                    ref={renamingSystemInputRef}
                                                    key={group.id}
                                                    className="preset-group-tag-input"
                                                    value={editingSystemGroupName}
                                                    onChange={(e) => setEditingSystemGroupName(e.target.value)}
                                                    onBlur={handleUpdateSystemGroupName}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') { e.preventDefault(); handleUpdateSystemGroupName(); }
                                                        if (e.key === 'Escape') (setEditingSystemGroupId as any)(() => null);
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    key={group.id}
                                                    className={`preset-group-tag ${activeSystemPresetGroupId === group.id ? 'is-active' : ''}`}
                                                    onClick={() => setActiveSystemPresetGroupId(group.id)}
                                                    onDoubleClick={() => handleStartRenameSystemGroup(group)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <span className="preset-group-tag-name" title={group.name}>{group.name}</span>
                                                    <button className="preset-group-tag-delete" title="删除分组" onClick={(e) => { e.stopPropagation(); handleDeleteSystemPresetGroup(group.id); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                        {isCreatingSystemGroup ? (
                                            <input
                                                type="text"
                                                ref={creatingSystemInputRef}
                                                className="preset-group-tag-input"
                                                placeholder="新分组"
                                                value={newSystemGroupName}
                                                onChange={(e) => setNewSystemGroupName(e.target.value)}
                                                onBlur={() => { handleAddSystemPresetGroup(newSystemGroupName); setNewSystemGroupName(''); }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddSystemPresetGroup(newSystemGroupName); setNewSystemGroupName(''); }
                                                    if (e.key === 'Escape') { setIsCreatingSystemGroup(false); setNewSystemGroupName(''); }
                                                }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button className="icon-btn" title="添加新分组" onClick={() => setIsCreatingSystemGroup(true)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className={`icon-btn ${isDeletingSystemGroup ? 'destructive-active' : ''}`}
                                                    onClick={() => setIsDeletingSystemGroup(!isDeletingSystemGroup)}
                                                    title="删除模式"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="preset-prompts-help">双击替换当前系统提示词。</p>
                                    <div className="preset-prompts-list">
                                        {filteredSystemPrompts.map(p => (
                                            <div key={p.id} className="preset-prompt-item" onDoubleClick={() => handleConfigChange({ systemInstruction: p.text })} title="双击替换">
                                                <span className="preset-prompt-text">{p.text}</span>
                                                <div className="preset-prompt-actions">
                                                    <button title="编辑" onClick={(e) => { e.stopPropagation(); handleStartEditSystemPreset(p, e); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z" /></svg>
                                                    </button>
                                                    <button title="删除" className="delete-preset-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSystemPresetPrompt(p.id); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredSystemPrompts.length === 0 && <div className="no-presets-message">暂无预设。</div>}
                                    </div>
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

                            </>
                        )}

                    </div>
                </div>
            </aside>
            <SettingsModal />
            <SystemPresetEditorModal />
            <ImportStudioModal />
        </>
    );
};