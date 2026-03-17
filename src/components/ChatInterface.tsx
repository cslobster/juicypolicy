import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
}

const ChatInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'bot', text: '您好！我是您的 AI 保险顾问。请问您今天想了解哪种保险？' }
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI response
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
        <div className="chat-widget">
            {/* The Chat Panel */}
            <div className={`chat-panel ${!isOpen ? 'hidden' : ''}`}>
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bot size={20} />
                        <span>保险顾问</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} aria-label="关闭聊天">
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-body">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-msg ${msg.sender === 'bot' ? 'chat-bot' : 'chat-user'}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', opacity: 0.8, fontSize: '0.75rem' }}>
                                {msg.sender === 'bot' ? <Bot size={12} /> : <User size={12} />}
                                {msg.sender === 'bot' ? 'AI' : '您'}
                            </div>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="请输入您的回答..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button className="chat-send-btn" onClick={handleSend} aria-label="发送消息">
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                className="chat-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{ display: isOpen ? 'none' : 'flex' }}
                aria-label="打开聊天"
            >
                <MessageSquare size={24} />
            </button>
        </div>
    );
};

export default ChatInterface;
