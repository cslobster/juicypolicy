import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
}

const ChatInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'bot', text: '您好！我是您的鲜橙保险顾问。请问您今天想了解哪种保险？' }
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: '正在分析您的信息... 您能提供更多详细信息吗，以便我为您找到最佳的报价？'
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Panel */}
            <div className={`w-[370px] h-[500px] bg-white rounded-2xl shadow-[0_15px_50px_-12px_rgba(15,23,42,0.25)] mb-3 overflow-hidden flex flex-col border border-slate-200 origin-bottom-right transition-all duration-200 ${!isOpen ? 'opacity-0 scale-95 pointer-events-none' : ''}`}>
                <div className="px-5 py-4 bg-slate-950 text-white font-semibold flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Bot size={20} />
                        <span>保险顾问</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors" aria-label="关闭聊天">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed animate-in slide-in-from-bottom-2 duration-300 ${
                                msg.sender === 'bot'
                                    ? 'bg-white text-foreground self-start rounded-bl-sm shadow-sm'
                                    : 'bg-primary text-primary-foreground self-end rounded-br-sm'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 mb-1 opacity-70 text-xs">
                                {msg.sender === 'bot' ? <Bot size={12} /> : <User size={12} />}
                                {msg.sender === 'bot' ? '鲜橙保险' : '您'}
                            </div>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input
                        type="text"
                        placeholder="请输入您的回答..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                    />
                    <Button size="icon" onClick={handleSend} className="rounded-lg shrink-0" aria-label="发送消息">
                        <Send size={16} />
                    </Button>
                </div>
            </div>

            {/* Floating Toggle */}
            {!isOpen && (
                <Button
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-xl shadow-lg hover:scale-105 transition-transform"
                    aria-label="打开聊天"
                >
                    <MessageSquare size={22} />
                </Button>
            )}
        </div>
    );
};

export default ChatInterface;
