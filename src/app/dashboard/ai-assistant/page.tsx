'use client';

import React from 'react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AIAssistantPage() {
    return (
        <div className="min-h-screen bg-background pb-8 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-2 group"
                    >
                        <div className="p-1.5 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="font-medium text-sm">Back to Dashboard</span>
                    </Link>
                </div>

                <ChatInterface />
            </div>
        </div>
    );
}
