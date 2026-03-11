/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import type { MessagePart } from '../types';

declare const marked: any;

export const MessageContent = React.memo(({ parts }: {parts: MessagePart[]}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const preElements = containerRef.current.querySelectorAll('pre');
    preElements.forEach((pre) => {
      // Check if already wrapped
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode?.insertBefore(wrapper, pre);

      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.title = '复制代码';
      // MDI content-copy icon path
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
        </svg>
      `;

      button.onclick = async () => {
        const code = pre.querySelector('code');
        if (code) {
          try {
            await navigator.clipboard.writeText(code.innerText);
            
            // Visual feedback
            button.classList.add('copied');
            const originalHTML = button.innerHTML;
            // MDI check icon path
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
              </svg>
            `;

            // Simple toast
            let toast = document.querySelector('.code-copy-toast') as HTMLElement;
            if (!toast) {
              toast = document.createElement('div');
              toast.className = 'toast code-copy-toast';
              document.body.appendChild(toast);
            }
            toast.innerText = '已复制到剪贴板';
            toast.classList.add('show');
            
            setTimeout(() => {
              button.classList.remove('copied');
              button.innerHTML = originalHTML;
              toast.classList.remove('show');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy: ', err);
          }
        }
      };

      wrapper.appendChild(button);
      wrapper.appendChild(pre);
    });
  }, [parts]);

  return (
    <div ref={containerRef}>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z" /></svg>
              <span>{part.inlineData.name || 'file'}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
});