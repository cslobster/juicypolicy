import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, ArrowUp, Paperclip, ChevronLeft, Citrus, Maximize2, Minimize2 } from 'lucide-react';
import { dispatchChatMessage, hasChatHandler, registerChatPusher, registerBotPusher } from '../lib/chatBus';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: string[];
}

const SUGGESTED_TOPICS = [
    '我该如何选择保险方案？',
    '我能享受哪些补贴？',
];

const ChatInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'bot', text: '👋 您好！我是鲜橙保险顾问。请告诉我您今天想了解的内容。' }
    ]);
    const [input, setInput] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }, [input]);

    const sendMessageRef = useRef<(text: string) => void>(() => {});

    useEffect(() => {
        registerChatPusher((text) => {
            setIsOpen(true);
            sendMessageRef.current(text);
        });
        registerBotPusher((msg) => {
            setIsOpen(true);
            setMessages(prev => [...prev, {
                id: `bot-push-${Date.now()}`,
                sender: 'bot',
                text: msg.text,
                options: msg.options,
            }]);
        });
        return () => {
            registerChatPusher(null);
            registerBotPusher(null);
        };
    }, []);

    const sendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isBusy) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: trimmed,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsBusy(true);

        if (hasChatHandler()) {
            try {
                const result = await dispatchChatMessage(trimmed);
                if (result?.reply) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        sender: 'bot',
                        text: result.reply,
                    }]);
                }
            } catch {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '抱歉，暂时无法回复，请稍后再试。',
                }]);
            } finally {
                setIsBusy(false);
            }
            return;
        }

        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: '收到！我们的顾问会尽快为您解答。在此期间，您也可以查看下方推荐的话题。',
            }]);
            setIsBusy(false);
        }, 700);
    };

    sendMessageRef.current = sendMessage;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const lastBotIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'bot') return i;
        }
        return -1;
    })();

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Panel */}
            <div
                className={`bg-white rounded-2xl shadow-[0_8px_24px_-4px_rgba(15,23,42,0.18),0_24px_48px_-8px_rgba(15,23,42,0.22)] ring-1 ring-black/5 mb-3 overflow-hidden origin-bottom-right transition-transform duration-200 ${
                    isExpanded
                        ? 'w-[min(760px,calc(100vw-2rem))] h-[calc(100vh-5rem)]'
                        : 'w-[380px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-5rem)]'
                } ${
                    isOpen ? 'pointer-events-auto flex flex-col scale-100' : 'hidden'
                }`}
            >
                {/* Header */}
                <div className="px-3 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                    <button
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                        aria-label="返回"
                        onClick={() => setIsOpen(false)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Citrus size={18} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">鲜橙保险顾问</h3>
                    </div>
                    <button
                        onClick={() => setIsExpanded(v => !v)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-orange-100 transition-colors shrink-0"
                        aria-label={isExpanded ? '缩小窗口' : '展开窗口'}
                        aria-pressed={isExpanded}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                        aria-label="关闭聊天"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-3 bg-white font-[Inter,system-ui,sans-serif]">
                    {messages.map((msg, idx) => {
                        const showOptions = msg.sender === 'bot' && msg.options && msg.options.length > 0;
                        const showSuggested = msg.sender === 'bot' && !showOptions && idx === lastBotIndex && idx === 0;
                        const optionList = showOptions ? msg.options! : showSuggested ? SUGGESTED_TOPICS : null;
                        return (
                            <React.Fragment key={msg.id}>
                                <div className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                                            msg.sender === 'bot'
                                                ? 'bg-slate-100 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                                                : 'bg-slate-900 text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)]'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                                {optionList && (
                                    <div className="flex flex-col items-end gap-2 mt-1">
                                        {optionList.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => sendMessage(opt)}
                                                disabled={isBusy}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[14px] text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_2px_5px_rgba(15,23,42,0.10),0_1px_2px_rgba(15,23,42,0.05)] disabled:opacity-50 transition-all"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Footer */}
                <div className="px-3 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-end gap-1 rounded-2xl border border-slate-200 px-2 py-1.5 focus-within:border-slate-400 transition-colors">
                        <button
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            aria-label="附件"
                        >
                            <Paperclip size={16} />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder="发送消息…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isBusy}
                            className="flex-1 bg-transparent border-none outline-none text-sm py-1.5 text-slate-900 placeholder:text-slate-400 resize-none max-h-[120px] leading-5 disabled:opacity-60"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isBusy}
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                input.trim() && !isBusy
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            aria-label="发送"
                        >
                            <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Toggle */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto h-14 w-14 rounded-full shadow-[0_12px_30px_-8px_rgba(15,23,42,0.4)] hover:scale-105 transition-transform bg-slate-900 text-white flex items-center justify-center"
                    aria-label="打开聊天"
                >
                    <MessageSquare size={22} />
                </button>
            )}
        </div>
    );
};

export default ChatInterface;
