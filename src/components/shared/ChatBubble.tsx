'use client';

import React from 'react';
import { User, Stethoscope } from 'lucide-react';
import { ChatMessage } from '@/types/appointment';
import Image from 'next/image';

interface ChatBubbleProps {
    message: ChatMessage;
    viewingAs: 'DOCTOR' | 'PATIENT'; // Determines alignment
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, viewingAs }) => {
    // If viewingAs DOCTOR: DOCTOR is 'Me' (Right), USER is 'Other' (Left)
    // If viewingAs PATIENT: USER is 'Me' (Right), DOCTOR is 'Other' (Left)

    // Note: message.role is 'DOCTOR' | 'USER' | 'AI'
    const isMe = (viewingAs === 'DOCTOR' && message.role === 'DOCTOR') ||
        (viewingAs === 'PATIENT' && message.role === 'USER');

    const isSystem = message.role === 'AI';

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
            {/* Avatar */}
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${message.role === 'DOCTOR'
                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                    : 'bg-blue-100 text-blue-600 border border-blue-200'}
            `}>
                {message.role === 'DOCTOR' ? <Stethoscope size={16} /> : <User size={16} />}
            </div>

            {/* Bubble */}
            <div className={`
                max-w-[80%] rounded-2xl px-1 py-1 text-sm shadow-sm overflow-hidden
                ${isMe
                    ? 'bg-emerald-600' // Me
                    : 'bg-white border border-gray-200' // Them
                }
                ${isMe && viewingAs === 'PATIENT' ? 'bg-blue-600' : ''}
            `}>
                {message.image_url && (
                    <div className="mb-1 rounded-xl overflow-hidden bg-gray-100 max-w-sm">
                        <img
                            src={message.image_url}
                            alt="Attached image"
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            loading="lazy"
                        />
                    </div>
                )}

                <div className={`px-3 py-2 ${message.image_url ? 'pt-1' : ''}`}>
                    <div className={`whitespace-pre-wrap ${isMe ? 'text-white' : 'text-gray-800'}`}>
                        {/* Basic Markdown Formatting for Bold and Newlines */}
                        {message.content.split('\n').map((line, i) => (
                            <div key={i} className="min-h-[1.2em]">
                                {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                                    }
                                    return <span key={j}>{part}</span>;
                                })}
                            </div>
                        ))}
                    </div>

                    <span className={`text-[10px] block mt-1 text-right ${isMe ? 'opacity-80' : 'text-gray-400'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};
