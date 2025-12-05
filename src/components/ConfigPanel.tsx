/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { AgentPanel } from "./AgentPanel";
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
} from '../store';


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
        <aside className={`config-panel ${isConfigPanelOpen ? 'mobile-open' : ''}`}>
            <div className="panel-content-wrapper">
                <div className="config-panel-tabs">
                    <button className={`config-tab ${activeConfigTab === 'configuration' ? 'active' : ''}`} onClick={() => setActiveConfigTab('configuration')}>
                        Configuration
                    </button>
                    <button className={`config-tab ${activeConfigTab === 'writing' ? 'active' : ''}`} onClick={() => setActiveConfigTab('writing')}>
                        Writing
                    </button>
                    <button className={`config-tab ${activeConfigTab === 'agent' ? 'active' : ''}`} onClick={() => setActiveConfigTab('agent')}>
                        Agent
                    </button>
                    <div className="config-panel-header-actions">
                        <button
                            className="panel-toggle-btn"
                            onClick={() => setIsConfigPanelVisible(false)}
                            aria-label="Hide configuration panel"
                            title="Hide configuration panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                        </button>
                        <button
                            className="mobile-close-btn"
                            onClick={() => setIsConfigPanelOpen(false)}
                            aria-label="Close configuration panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L7.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                        </button>
                    </div>
                </div>
                <div className="config-content">
                    {activeConfigTab === 'configuration' && (
                        <>
                            <div className="config-item">
                                <label>Theme</label>
                                <div className="theme-toggle">
                                    <button
                                        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => setTheme('light')}
                                        title="Light Mode"
                                        aria-pressed={theme === 'light'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z"/>
                                        </svg>
                                    </button>
                                    <button
                                        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => setTheme('dark')}
                                        title="Dark Mode"
                                        aria-pressed={theme === 'dark'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                                        </svg>
                                    </button>
                                    <button
                                        className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                                        onClick={() => setTheme('system')}
                                        title="System Default"
                                        aria-pressed={theme === 'system'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="config-item">
                                <label>Model</label>
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
                                        <span>{model}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708 .708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>
                                    </div>
                                    {isModelDropdownOpen && (
                                        <div className="custom-select-options" role="listbox">
                                            <div
                                                className={`custom-select-option ${model === 'gemini-2.5-flash' ? 'selected' : ''}`}
                                                onClick={() => { handleConfigChange({ model: 'gemini-2.5-flash' }); setIsModelDropdownOpen(false); }}
                                                role="option"
                                                aria-selected={model === 'gemini-2.5-flash'}
                                            >
                                                gemini-2.5-flash
                                            </div>
                                            <div
                                                className={`custom-select-option ${model === 'gemini-2.5-pro' ? 'selected' : ''}`}
                                                onClick={() => { handleConfigChange({ model: 'gemini-2.5-pro' }); setIsModelDropdownOpen(false); }}
                                                role="option"
                                                aria-selected={model === 'gemini-2.5-pro'}
                                            >
                                                gemini-2.5-pro
                                            </div>
                                            <div
                                                className={`custom-select-option ${model === 'gemini-3-pro-preview' ? 'selected' : ''}`}
                                                onClick={() => { handleConfigChange({ model: 'gemini-3-pro-preview' }); setIsModelDropdownOpen(false); }}
                                                role="option"
                                                aria-selected={model === 'gemini-3-pro-preview'}
                                            >
                                                gemini-3-pro-preview
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="config-item">
                            <label htmlFor="system-instruction">System Prompt</label>
                            <div
                                id="system-instruction"
                                className={`system-prompt-preview ${!systemInstruction ? 'placeholder' : ''}`}
                                onClick={() => setIsSystemPromptEditorOpen(true)}
                                role="button"
                                tabIndex={0}
                            >
                                {systemInstruction || "e.g., You are a helpful assistant who speaks like a pirate."}
                            </div>
                            </div>
                            <div className="config-item">
                            <label htmlFor="google-search">Web Search</label>
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
                                    <label>Local Document</label>
                                    <div className="local-document-actions">
                                        <input type="file" ref={documentFileInputRef} onChange={handleDocumentFileChange} accept=".txt,.md,text/*" style={{ display: 'none' }} />
                                        <button className="icon-btn" onClick={handleDocumentUploadClick} title="Upload Document">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                                        </button>
                                        <button className="icon-btn" onClick={handleClearDocument} disabled={!documentContent} title="Clear Document">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
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
                                    {documentContent || "Upload or paste a document for local context..."}
                                </div>
                                <p className="local-document-help">This document is stored locally and is not sent to the AI.</p>
                            </div>
                            <div className="config-item preset-prompts-manager">
                                <div className="preset-prompts-header">
                                    <label>Preset Meta Prompts</label>
                                    <button className="icon-btn" onClick={(e) => handleStartAddPreset(e)} title="Add new meta prompt">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
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
                                        Ungrouped
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
                                                    if (e.key === 'Escape') setEditingGroupId(null);
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
                                                <button className="preset-group-tag-delete" title="Delete group" onClick={(e) => { e.stopPropagation(); handleDeletePresetGroup(group.id); }}>&times;</button>
                                            </div>
                                        )
                                    ))}
                                    {isCreatingGroup ? (
                                        <input
                                            type="text"
                                            ref={creatingInputRef}
                                            className="preset-group-tag-input"
                                            placeholder="New Group"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            onBlur={() => { handleAddPresetGroup(newGroupName); setNewGroupName(''); }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleAddPresetGroup(newGroupName); setNewGroupName(''); }
                                                if (e.key === 'Escape') { setIsCreatingGroup(false); setNewGroupName(''); }
                                            }}
                                        />
                                    ) : (
                                        <button className="icon-btn" title="Add new group" onClick={() => setIsCreatingGroup(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="preset-prompts-help">Click to insert into the active input.</p>
                                <div className="preset-prompts-list">
                                    {filteredPrompts.map(p => (
                                        <div key={p.id} className="preset-prompt-item" onClick={() => handlePresetClick(p.text)} title="Click to insert">
                                            <span className="preset-prompt-text">{p.text}</span>
                                            <div className="preset-prompt-actions">
                                                <button title="Edit" onClick={(e) => { e.stopPropagation(); handleStartEditPreset(p, e); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z"/></svg>
                                                </button>
                                                <button title="Delete" className="delete-preset-btn" onClick={(e) => { e.stopPropagation(); handleDeletePresetPrompt(p.id); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredPrompts.length === 0 && <div className="no-presets-message">No prompts yet.</div>}
                                </div>
                            </div>
                        </>
                    )}
                    {activeConfigTab === 'agent' && (
                       <AgentPanel />
                    )}
                </div>
            </div>
        </aside>
    );
};