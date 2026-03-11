/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { atom } from 'jotai';
import { showToastAtom } from './ui';
import { currentChatIdAtom, chatsAtom } from './chat';

// =================================================================
// ACTION LOG ATOMS
// =================================================================
// Note: logActionAtom was moved to chat.ts to break a circular dependency.

export const handleClearActionLogAtom = atom(null, (get, set) => {
    const currentChatId = get(currentChatIdAtom);
    if (!currentChatId) return;
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, actionLog: [] } : chat
    ));
    set(showToastAtom, "操作日志已清空。");
});

export const handleDeleteLogEntryAtom = atom(null, (get, set, logId: string) => {
    const currentChatId = get(currentChatIdAtom);
    if (!currentChatId) return;
    set(chatsAtom, prev => prev.map(chat =>
        chat.id === currentChatId
            ? { ...chat, actionLog: chat.actionLog.filter(log => log.id !== logId) }
            : chat
    ));
});
