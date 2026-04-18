/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './ActionLogViewerModal.css';
import {
    currentChatAtom,
    isActionLogViewerOpenAtom,
    handleClearActionLogAtom,
} from '../store';
import type { ActionLogEntry } from "../types";

export const ActionLogViewerModal = () => {
    const [isOpen, setIsOpen] = useAtom(isActionLogViewerOpenAtom);
    const currentChat = useAtomValue(currentChatAtom);
    const handleClearLog = useSetAtom(handleClearActionLogAtom);

    const getRolePrefix = (payload: Record<string, any>): string => {
        const message = payload.content || payload.originalContent;
        if (message && message.role) {
            return message.role === 'user' ? '用户' : 'AI';
        }
        return '';
    };

    const formatLogSummary = (log: ActionLogEntry) => {
        const role = getRolePrefix(log.payload);
        switch (log.type) {
            case 'new_chat': return `创建了新对话`;
            case 'rename_chat': return `重命名了对话`;
            case 'fork_chat': return `派生了对话`;
            case 'edit_message': return `编辑了 ${role} 消息`;
            case 'edit_and_regenerate': return `编辑并重新生成了 ${role} 消息`;
            case 'delete_message': return `删除了 ${role} 消息`;
            case 'regenerate_response': return `重新生成了回答`;
            case 'change_system_prompt': return `修改了系统提示词`;
            case 'change_model': return `将模型切换为 <strong>${log.payload.to}</strong>`;
            case 'toggle_web_search': return `网页搜索已${log.payload.value ? '开启' : '关闭'}`;
            default: return `操作: ${log.type}`;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`action-log-viewer-overlay ${isOpen ? "visible" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
            <div className="action-log-viewer">
                <div className="action-log-viewer-header">
                    <h3>"{currentChat?.title}" 的操作日志</h3>
                    <div className="action-log-header-actions">
                        <button onClick={() => handleClearLog()} title="清空所有日志">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                        </button>
                        <button onClick={() => setIsOpen(false)} aria-label="关闭操作日志查看器" title="关闭">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="action-log-viewer-content">
                    {currentChat?.actionLog?.map((log) => (
                        <details key={log.id} className="action-log-item">
                            <summary>
                                <span className="action-log-summary-content">
                                    <span className="action-log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    <span className="action-log-text" dangerouslySetInnerHTML={{ __html: formatLogSummary(log) }}></span>
                                </span>
                            </summary>
                            <div className="action-log-details">
                                <pre><code>{JSON.stringify(log.payload, null, 2)}</code></pre>
                            </div>
                        </details>
                    ))}
                    {(!currentChat?.actionLog || currentChat.actionLog.length === 0) && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>此对话暂无操作记录。</p>
                    )}
                </div>
            </div>
        </div>
    );
};
