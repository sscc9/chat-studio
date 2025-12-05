/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttachedFile {
  name: string;
  type: string;
  data: string;
}

export interface MessagePart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
        name?: string;
    };
    // FIX: Add functionResponse property to support tool/function call responses.
    functionResponse?: {
        name: string;
        response: object;
    };
}

export interface Message {
    // FIX: Add 'tool' to the role to support function call responses.
    role: 'user' | 'model' | 'tool';
    parts: MessagePart[];
    groundingChunks?: any[];
}

export interface PresetPrompt {
    id: string;
    text: string;
    groupId?: string;
}

export interface PresetGroup {
    id:string;
    name: string;
}

export interface DocumentChapter {
    number: string;
    startIndex: number;
    endIndex: number;
}

export interface SystemPrompt {
    id: string;
    title: string;
    text: string;
}

export interface ChatConfig {
    systemInstruction?: string;
    useGoogleSearch?: boolean;
    model: string;
}

export type ActionLogEntryType =
  | 'new_chat'
  | 'rename_chat'
  | 'fork_chat'
  | 'edit_message'
  | 'edit_and_regenerate'
  | 'delete_message'
  | 'regenerate_response'
  | 'change_system_prompt'
  | 'change_model'
  | 'toggle_web_search'
  | 'agent_edit_message'
  | 'agent_edit_system_prompt';

export interface ActionLogEntry {
    id: string;
    timestamp: number;
    type: ActionLogEntryType;
    payload: Record<string, any>;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    agentMessages?: Message[];
    isPinned: boolean;
    config: ChatConfig;
    actionLog: ActionLogEntry[];
    autoTitled?: boolean;
    deletedTimestamp?: number;
}