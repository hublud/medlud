'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
    id: string;
    sender: 'user' | 'nurse';
    content: string;
    timestamp: Date;
}

const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        sender: 'nurse',
        content: 'Hello! I\'m Nurse Amina. How can I help you today?',
        timestamp: new Date(Date.now() - 60000)
    }
];

export default function MaternalChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
    const [input, setInput] = useState('');

    const handleSendMessage = () => {
        if (!input.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Mock nurse response
        setTimeout(() => {
            const nurseResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'nurse',
                content: 'Thank you for sharing that. Let me help you with your concern. Remember, if you experience any danger signs like vaginal bleeding, severe headache, or reduced fetal movement, please go to the hospital immediately.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, nurseResponse]);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard/maternal"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Maternal Health</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white rounded-xl border border-border p-6 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <User size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-text-primary">Nurse Amina</h2>
                        <p className="text-sm text-text-secondary">Certified Midwife • Online now</p>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: '500px' }}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-text-primary'
                                    }`}>
                                    <p className="text-sm">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}
                                        suppressHydrationWarning
                                    >
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <Button onClick={handleSendMessage} disabled={!input.trim()}>
                                <Send size={20} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                    <p className="font-medium mb-1">💬 Professional Support</p>
                    <p className="text-blue-700">
                        This is a secure, private chat with a certified nurse/midwife specializing in maternal health.
                    </p>
                </div>
            </div>
        </div>
    );
}
