/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChatMessage } from './ChatMessage';
import './MessageList.css';
import {
    currentChatAtom,
    isLoadingAtom,
    isAIReadyAtom,
    updateTokenCountAtom,
    chatMessagesRefAtom,
} from '../store';

declare const marked: any;

export const MessageList = () => {
    const currentChat = useAtomValue(currentChatAtom);
    const isLoading = useAtomValue(isLoadingAtom);
    const isAIReady = useAtomValue(isAIReadyAtom);
    const updateTokenCount = useSetAtom(updateTokenCountAtom);
    const chatMessagesRef = useAtomValue(chatMessagesRefAtom);
    const contentRef = useRef<HTMLDivElement>(null);

    // --- Refactored & Robust Scroll Logic ---
    const autoScrollEnabled = useRef(true);
    const lastScrollTop = useRef(0);

    // Memoized function to programmatically scroll to the bottom.
    const scrollToBottom = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return;

        el.scrollTop = el.scrollHeight;
        lastScrollTop.current = el.scrollTop;
    }, [chatMessagesRef]);

    // Memoized scroll event handler to detect user scrolls.
    const handleScroll = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return;

        const currentScrollTop = el.scrollTop;
        const isScrollingUp = currentScrollTop < lastScrollTop.current;

        // Add a class for styling the scrollbar thumb during user scroll.
        el.classList.add('is-scrolling');
        const timer = setTimeout(() => el.classList.remove('is-scrolling'), 1500);

        // Logic: 
        // 1. If user scrolls UP, disable auto-scroll.
        // 2. If user is AT THE BOTTOM, enable auto-scroll.
        const isAtBottom = Math.abs(el.scrollHeight - currentScrollTop - el.clientHeight) < 10;

        if (isScrollingUp) {
            autoScrollEnabled.current = false;
        } else if (isAtBottom) {
            autoScrollEnabled.current = true;
        }

        lastScrollTop.current = currentScrollTop;
        return () => clearTimeout(timer);
    }, [chatMessagesRef]);

    // Effect to attach and clean up the scroll event listener.
    useEffect(() => {
        const el = chatMessagesRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll, { passive: true });
            return () => el.removeEventListener('scroll', handleScroll);
        }
    }, [chatMessagesRef, handleScroll]);

    // Effect to scroll to bottom when new messages are added.
    useLayoutEffect(() => {
        if (autoScrollEnabled.current) {
            scrollToBottom();
        }
    }, [currentChat?.messages, scrollToBottom]);

    // Effect to observe content size changes (e.g., images loading) and scroll if needed.
    useEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl) return;

        const observer = new ResizeObserver(() => {
            if (autoScrollEnabled.current) {
                scrollToBottom();
            }
        });

        observer.observe(contentEl);
        return () => observer.disconnect();
    }, [scrollToBottom]);
    // --- End of Refactored Scroll Logic ---

    useEffect(() => {
        updateTokenCount();
    }, [currentChat?.messages, updateTokenCount]);

    useEffect(() => {
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
        }
    }, []);

    return (
        <div className="chat-messages" ref={chatMessagesRef}>
            <div className="scroll-fog top-scroll-fog"></div>
            {currentChat?.messages.length === 0 && !isLoading ? (
                <div className="welcome-container">
                    <h1 className="welcome-title">Chat Studio</h1>
                    <p className="welcome-subtitle">
                        {!isAIReady ? "由于未配置 API Key，应用暂时无法提供服务。" : "您好！今天我能为您做些什么？"}
                    </p>
                </div>
            ) : (
                <div className="message-list-content" ref={contentRef}>
                    {currentChat?.messages.map((msg, index) => (
                        <div className="message-list-item" key={`${currentChat?.id}-${index}`}>
                            <ChatMessage
                                msg={msg}
                                index={index}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="scroll-fog bottom-scroll-fog"></div>
        </div>
    );
};
