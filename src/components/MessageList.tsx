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
    const programmaticScroll = useRef(false);
    const scrollTimer = useRef<number | null>(null);
    const programmaticScrollTimer = useRef<number | null>(null);

    // Memoized function to programmatically scroll to the bottom.
    const scrollToBottom = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return;

        programmaticScroll.current = true;
        el.scrollTop = el.scrollHeight;

        if (programmaticScrollTimer.current) {
            clearTimeout(programmaticScrollTimer.current);
        }
        // Use a timer to flag when the programmatic scroll has likely finished.
        programmaticScrollTimer.current = window.setTimeout(() => {
            programmaticScroll.current = false;
        }, 150);
    }, [chatMessagesRef]);

    // Memoized scroll event handler to detect user scrolls.
    const handleScroll = useCallback(() => {
        const el = chatMessagesRef.current;
        if (!el) return;

        // If this scroll event was triggered by our code, ignore it.
        if (programmaticScroll.current) return;

        // Add a class for styling the scrollbar thumb during user scroll.
        el.classList.add('is-scrolling');
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => {
            el.classList.remove('is-scrolling');
        }, 1500);

        // Disable auto-scrolling if the user scrolls up.
        const isAtBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10; // Increased tolerance
        autoScrollEnabled.current = isAtBottom;
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
    // useLayoutEffect prevents flicker by running synchronously after DOM mutations.
    useLayoutEffect(() => {
        if (autoScrollEnabled.current) {
            scrollToBottom();
        }
    }, [currentChat?.messages, scrollToBottom]);

    // Effect to observe content size changes (e.g., images loading) and scroll if needed.
    // This makes the scroll behavior robust against asynchronous content changes.
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
        </div>
    );
};
