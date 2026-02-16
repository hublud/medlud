'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types/appointment';
import { ChatBubble } from '@/components/shared/ChatBubble';

interface DoctorChatProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
}

export const DoctorChat: React.FC<DoctorChatProps> = ({ messages, onSendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue('');
    };

    return (
        <div className="flex flex-col h-[400px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <User size={16} /> Patient Consultation History
                </h3>
                <span className="text-xs text-gray-400">Live Secure Channel</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <p className="text-sm">No messages yet. Start the consultation.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} viewingAs="DOCTOR" />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your medical response..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <Button type="submit" disabled={!inputValue.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Send size={16} />
                    </Button>
                </form>
            </div>
        </div>
    );
};
