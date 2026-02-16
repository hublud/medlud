'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { aiService } from '@/services/aiService';

interface Message {
    id: string;
    role: 'USER' | 'AI';
    content: string;
    timestamp: Date;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'AI',
            content: "Hello! I'm your MedLud AI Health Assistant. I can help you check symptoms, understand medical terms, or provide general wellness advice. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);


    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'USER',
            content: inputValue,
            timestamp: new Date()
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInputValue('');
        setIsTyping(true);

        try {
            // Convert messages to format expected by API (excluding IDs and timestamps for the API call if needed, 
            // but for simplicity we'll just map them here or in the service. 
            // The service expects { role: 'user' | 'assistant', content: string }
            const apiMessages = updatedMessages.map(msg => ({
                role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: msg.content
            }));


            const response = await aiService.sendMessage(apiMessages, "You are MedLud AI, a helpful health assistant. You are not a doctor. Always advise users to seek professional medical advice for serious conditions.");

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'AI',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'AI',
                content: "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };


    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-primary/5 p-4 border-b border-border flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Bot size={24} className="text-primary" />
                </div>
                <div>
                    <h2 className="font-bold text-text-primary">MedLud Assistant</h2>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Online
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${msg.role === 'USER' ? 'bg-blue-100' : 'bg-primary/10'}
                        `}>
                            {msg.role === 'USER' ? <User size={16} className="text-blue-600" /> : <Bot size={16} className="text-primary" />}
                        </div>

                        <div className={`
                            max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                            ${msg.role === 'USER'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-text-primary border border-border rounded-tl-none'}
                        `}>
                            {msg.content}
                            <p className={`text-[10px] mt-1 opacity-70 ${msg.role === 'USER' ? 'text-blue-100' : 'text-text-secondary'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-primary" />
                        </div>
                        <div className="bg-white border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your health question..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-400"
                    />

                    <Button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${!inputValue.trim() ? 'opacity-50' : ''}`}
                    >
                        {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                    </Button>
                </form>
                <p className="text-xs text-center text-text-secondary mt-2">
                    AI responses are for informational purposes only. In emergencies, call 112.
                </p>
            </div>
        </div>
    );
};
