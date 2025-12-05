/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActionLogEntry, Message } from "./types";

const DB_NAME = "ChatHistoryDB";
const STORE_NAME = "chatMessages";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const getMessages = async (id: string): Promise<{ messages: Message[], agentMessages: Message[], actionLog: ActionLogEntry[] }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve({
        messages: request.result?.messages || [],
        agentMessages: request.result?.agentMessages || [],
        actionLog: request.result?.actionLog || [],
    });
  });
};

export const saveMessages = async (id: string, messages: Message[], agentMessages: Message[], actionLog: ActionLogEntry[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, messages, agentMessages, actionLog });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const deleteMessages = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};