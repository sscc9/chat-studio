/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import './DocumentEditor.css';
import {
    isDocumentEditorOpenAtom,
    documentContentAtom,
    documentChaptersAtom,
    handleChapterClickAtom,
} from '../store';

export const DocumentEditor = () => {
    const [isDocumentEditorOpen, setIsDocumentEditorOpen] = useAtom(isDocumentEditorOpenAtom);
    const [documentContent, setDocumentContent] = useAtom(documentContentAtom);
    const documentChapters = useAtomValue(documentChaptersAtom);
    const handleChapterClick = useSetAtom(handleChapterClickAtom);

    return (
        <div className={`document-editor-overlay ${isDocumentEditorOpen ? "visible" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) { setIsDocumentEditorOpen(false) } }}>
            <div className={`document-editor ${isDocumentEditorOpen ? "open" : ""}`}>
                <div className="document-editor-header">
                    <h3>本地文档</h3>
                    <button onClick={() => setIsDocumentEditorOpen(false)} aria-label="关闭文档编辑器" title="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </button>
                </div>
                <div className="document-editor-body">
                    {documentChapters.length > 0 && (
                        <div className="document-chapters">
                            {documentChapters.map(ch => (
                                <button key={ch.number} onClick={() => handleChapterClick(ch)} title={`第 ${ch.number} 章`}>{ch.number}</button>
                            ))}
                        </div>
                    )}
                    <textarea
                        className="document-textarea"
                        placeholder="在此粘贴您的文档..."
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};