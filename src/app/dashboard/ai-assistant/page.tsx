'use client';

import React from 'react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import Link from 'next/link';
import { ArrowLeft, Bot, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AIAssistantPage() {
    const { profile, updateProfile } = useAuth();
    const hasConsent = profile?.ai_consent_accepted === true;

    const handleAcceptConsent = async () => {
        try {
            await updateProfile({ ai_consent_accepted: true });
        } catch (err) {
            console.error('Failed to save AI consent:', err);
        }
    };

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

                {!hasConsent ? (
                    <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6 mt-12 animate-in zoom-in-95 duration-250">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-50">
                            <Bot size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900">AI Health Assistant Consent</h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Our AI Health Assistant provides symptoms analysis and wellness guidance. By enabling this service, you consent to processing anonymized inputs through automated systems.
                            </p>
                            <div className="p-3.5 bg-slate-50 rounded-2xl text-[11px] text-slate-500 text-left border border-slate-150 flex items-start gap-2.5">
                                <ShieldAlert size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <p>
                                    <strong>Disclaimer:</strong> This assistant is for informational purposes only. It is not a replacement for professional medical advice, diagnosis, or treatment.
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleAcceptConsent} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl"
                        >
                            Agree & Proceed to Chat
                        </Button>
                    </div>
                ) : (
                    <ChatInterface />
                )}
            </div>
        </div>
    );
}
