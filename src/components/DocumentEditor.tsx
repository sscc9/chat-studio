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
        <div className={`document-editor-overlay ${isDocumentEditorOpen ? "visible" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) { setIsDocumentEditorOpen(false) }}}>
            <div className={`document-editor ${isDocumentEditorOpen ? "open" : ""}`}>
                <div className="document-editor-header">
                    <h3>Local Document</h3>
                    <button onClick={() => setIsDocumentEditorOpen(false)} aria-label="Close document editor">&times;</button>
                </div>
                <div className="document-editor-body">
                    {documentChapters.length > 0 && (
                        <div className="document-chapters">
                            {documentChapters.map(ch => (
                                <button key={ch.number} onClick={() => handleChapterClick(ch)} title={`Chapter ${ch.number}`}>{ch.number}</button>
                            ))}
                        </div>
                    )}
                    <textarea
                        className="document-textarea"
                        placeholder="Paste your document here..."
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};