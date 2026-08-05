import React, { useEffect, useRef } from "react";
import type { MessagePart } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Configure block and inline math extensions for marked
const blockMath = {
  name: 'blockMath',
  level: 'block' as const,
  start(src: string) { return src.indexOf('$$'); },
  tokenizer(src: string) {
    const nextBlock = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$/);
    if (nextBlock) {
      return {
        type: 'blockMath',
        raw: nextBlock[0],
        formula: nextBlock[1].trim()
      };
    }
  },
  renderer(token: any) {
    try {
      return `<div class="katex-block-wrapper">${katex.renderToString(token.formula, { displayMode: true, throwOnError: false })}</div>`;
    } catch (err) {
      return `<div class="katex-error">${token.raw}</div>`;
    }
  }
};

const inlineMath = {
  name: 'inlineMath',
  level: 'inline' as const,
  start(src: string) { return src.indexOf('$'); },
  tokenizer(src: string) {
    const nextInline = src.match(/^\$(?!\s)([^\$\n]+?)(?<!\s)\$(?!\d)/);
    if (nextInline) {
      return {
        type: 'inlineMath',
        raw: nextInline[0],
        formula: nextInline[1].trim()
      };
    }
  },
  renderer(token: any) {
    try {
      return katex.renderToString(token.formula, { displayMode: false, throwOnError: false });
    } catch (err) {
      return `<span class="katex-error">${token.raw}</span>`;
    }
  }
};

// Configure marked options and register math extensions
marked.setOptions({ breaks: true, gfm: true });
marked.use({
  extensions: [blockMath, inlineMath]
});

export const MessageContent = React.memo(({ parts }: {parts: MessagePart[]}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const preElements = containerRef.current.querySelectorAll('pre');
    preElements.forEach((pre) => {
      // Check if already wrapped
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      // Extract language class if present
      const code = pre.querySelector('code');
      let lang = 'code';
      if (code) {
        const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
        if (langClass) {
          lang = langClass.replace('language-', '');
        }
      }

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode?.insertBefore(wrapper, pre);

      // Create premium header bar
      const header = document.createElement('div');
      header.className = 'code-block-header';
      
      const langSpan = document.createElement('span');
      langSpan.className = 'code-block-lang';
      langSpan.innerText = lang.toUpperCase();
      header.appendChild(langSpan);

      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.title = '复制代码';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
        </svg>
        <span>复制</span>
      `;

      button.onclick = async () => {
        if (code) {
          try {
            await navigator.clipboard.writeText(code.innerText);
            button.classList.add('copied');
            const btnText = button.querySelector('span');
            if (btnText) btnText.innerText = '已复制';
            
            setTimeout(() => {
              button.classList.remove('copied');
              if (btnText) btnText.innerText = '复制';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy: ', err);
          }
        }
      };

      header.appendChild(button);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      // Apply syntax highlighting
      if (code) {
        try {
          hljs.highlightElement(code);
        } catch (e) {
          console.error('Highlighting failed', e);
        }
      }
    });

    // Wrap tables in a scroll container for mobile horizontal scrolling
    const tables = containerRef.current.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-wrapper';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }, [parts]);

  return (
    <div ref={containerRef}>
      {parts.map((part, partIndex) => {
        if (part.text) {
          const rawHtml = marked.parse(part.text) as string;
          const cleanHtml = DOMPurify.sanitize(rawHtml, {
            USE_PROFILES: { html: true, mathMl: true, svg: true },
            ADD_ATTR: ['class', 'style', 'mathvariant', 'display'],
          });
          return <div key={partIndex} className="prose" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
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
              <span>{part.inlineData.name || '文件'}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
});