/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { MessagePart } from '../types';

declare const marked: any;

export const MessageContent = React.memo(({ parts }: {parts: MessagePart[]}) => (
  <>
    {parts.map((part, partIndex) => {
      if (part.text) {
        return <div key={partIndex} className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(part.text) }} />;
      }
      if (part.inlineData) {
        const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        if (part.inlineData.mimeType.startsWith('image/')) {
          return <img key={partIndex} src={src} alt="Uploaded content" className="message-image-attachment" />;
        }
        if (part.inlineData.mimeType.startsWith('audio/')) {
          return <audio key={partIndex} controls src={src} className="message-audio-attachment" />;
        }
        if (part.inlineData.mimeType.startsWith('video/')) {
          return <video key={partIndex} controls src={src} className="message-video-attachment" />;
        }
        return (
          <div key={partIndex} className="message-file-attachment">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/><path d="M4.5 3.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm0 3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5zm0 3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5z"/></svg>
            <span>{part.inlineData.name || 'file'}</span>
          </div>
        );
      }
      return null;
    })}
  </>
));