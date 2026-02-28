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
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708 .708L8.707 8l2.647 2.646a.5.5 0 0 1-.708 .708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
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