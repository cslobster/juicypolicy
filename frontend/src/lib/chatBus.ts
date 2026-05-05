export interface ChatBusReply {
    reply: string;
}

export type ChatBusHandler = (text: string) => Promise<ChatBusReply | null> | ChatBusReply | null;
export type ChatPushHandler = (text: string) => void;
export interface BotPushMessage {
    text: string;
    options?: string[];
}
export type BotPushHandler = (msg: BotPushMessage) => void;

let handler: ChatBusHandler | null = null;
let pushHandler: ChatPushHandler | null = null;
let botPushHandler: BotPushHandler | null = null;

export const registerChatHandler = (h: ChatBusHandler | null) => {
    handler = h;
};

export const hasChatHandler = () => handler !== null;

export const dispatchChatMessage = async (text: string): Promise<ChatBusReply | null> => {
    if (!handler) return null;
    const result = await handler(text);
    return result ?? { reply: '已收到您的消息。' };
};

export const registerChatPusher = (h: ChatPushHandler | null) => {
    pushHandler = h;
};

export const pushChatMessage = (text: string) => {
    pushHandler?.(text);
};

export const registerBotPusher = (h: BotPushHandler | null) => {
    botPushHandler = h;
};

export const pushBotMessage = (msg: BotPushMessage) => {
    botPushHandler?.(msg);
};

// Visibility — ChatInterface only renders when this flag is true.
let chatVisible = false;
const visibilitySubs = new Set<(v: boolean) => void>();

export const setChatVisible = (v: boolean) => {
    if (chatVisible === v) return;
    chatVisible = v;
    visibilitySubs.forEach(cb => cb(v));
};

export const subscribeChatVisibility = (cb: (v: boolean) => void): (() => void) => {
    visibilitySubs.add(cb);
    cb(chatVisible);
    return () => { visibilitySubs.delete(cb); };
};
