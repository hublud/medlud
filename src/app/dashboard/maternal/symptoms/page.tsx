'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Stethoscope, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { assessMaternalSymptoms } from '@/utils/maternalRiskAssessment';
import { MaternalSymptomResult } from '@/types/user';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export default function MaternalSymptomCheckerPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: '⚠️ **Important Medical Disclaimer**\n\nThis symptom checker is designed to provide pregnancy-specific guidance but does NOT replace professional medical care.\n\n**When to seek immediate help:**\n• Vaginal bleeding\n• Severe headache with vision changes\n• Reduced fetal movement\n• Severe abdominal pain\n• Fever with chills\n\n**If you experience any of the above, go to the nearest hospital immediately.**'
        },
        {
            role: 'assistant',
            content: 'Hello! I\'m here to help assess your pregnancy symptoms. Please describe what you\'re experiencing, and I\'ll ask a few questions to better understand your situation.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [result, setResult] = useState<MaternalSymptomResult | null>(null);
    const [gestationalAge, setGestationalAge] = useState(20);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load gestational age from localStorage
        const profileData = localStorage.getItem('pregnancyProfile');
        if (profileData) {
            const profile = JSON.parse(profileData);
            setGestationalAge(profile.gestationalAge);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat/maternal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.filter(m => m.role !== 'system'),
                    gestationalAge
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            const aiMessage: Message = { role: 'assistant', content: data.reply };

            setMessages(prev => [...prev, aiMessage]);

            // Analyze all symptoms for the result card
            // We still use local assessment for the risk card to maintain UI consistency and safety triggers
            const allSymptoms = updatedMessages
                .filter(m => m.role === 'user')
                .map(m => m.content)
                .join(' ');

            const assessment = assessMaternalSymptoms([allSymptoms], gestationalAge);

            // Show assessment result card if danger or after several interactions
            if (assessment.riskLevel !== 'normal' || updatedMessages.length > 5) {
                setResult(assessment);
            }

        } catch (error: any) {
            console.error('Chat Error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'I apologize, but I encountered an error connecting to the assessment assistant. Please try again or seek medical attention if your symptoms are urgent.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const getRiskIcon = () => {
        if (!result) return null;

        switch (result.riskLevel) {
            case 'danger':
                return <AlertTriangle size={24} className="text-white" />;
            case 'needs_review':
                return <Stethoscope size={24} className="text-white" />;
            case 'normal':
                return <CheckCircle size={24} className="text-white" />;
        }
    };

    const getRiskColor = () => {
        if (!result) return '';

        switch (result.riskLevel) {
            case 'danger':
                return 'from-red-500 to-red-600';
            case 'needs_review':
                return 'from-yellow-500 to-orange-500';
            case 'normal':
                return 'from-green-500 to-green-600';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
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
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-primary">Maternal Symptom Checker</h1>
                    <p className="text-text-secondary">Pregnancy-aware symptom assessment</p>
                </div>

                {/* Chat Interface */}
                <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: '500px' }}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-primary text-white'
                                        : message.role === 'system'
                                            ? 'bg-red-50 border border-red-200 text-red-900'
                                            : 'bg-gray-100 text-text-primary'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    {!result && (
                        <div className="border-t border-border p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Describe your symptoms..."
                                    className="flex-1 px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <Button onClick={handleSendMessage} disabled={!input.trim()}>
                                    <Send size={20} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assessment Result */}
                {result && (
                    <div className="space-y-4">
                        {/* Risk Level Card */}
                        <div className={`bg-gradient-to-r ${getRiskColor()} rounded-xl p-6 text-white`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                    {getRiskIcon()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {result.riskLevel === 'danger' && '🚨 Danger Signs Detected'}
                                        {result.riskLevel === 'needs_review' && 'Clinical Review Needed'}
                                        {result.riskLevel === 'normal' && 'Normal Pregnancy Symptoms'}
                                    </h3>
                                    <p className="text-white/90 text-sm mt-1">{result.assessment}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-bold text-text-primary mb-4">Recommendations</h3>
                            <ul className="space-y-2">
                                {result.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2 text-text-secondary">
                                        <span className={`mt-1 ${result.riskLevel === 'danger' ? 'text-red-600' :
                                            result.riskLevel === 'needs_review' ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Danger Signs Warning */}
                        {result.dangerSigns && result.dangerSigns.length > 0 && (
                            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-red-900 mb-2">Danger Signs Detected:</h3>
                                        <ul className="space-y-1">
                                            {result.dangerSigns.map((sign, index) => (
                                                <li key={index} className="text-red-700">• {sign}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <Button className="w-full bg-red-600 hover:bg-red-700">
                                    <Phone size={20} className="mr-2" />
                                    Call Emergency Services
                                </Button>
                            </div>
                        )}

                        {/* Actions */}
                        {result.action === 'book_consult' && (
                            <Link href="/dashboard/maternal/chat">
                                <Button className="w-full">
                                    Talk to a Nurse
                                </Button>
                            </Link>
                        )}

                        {result.action === 'emergency_referral' && (
                            <Link href="/dashboard/hospitals">
                                <Button className="w-full bg-red-600 hover:bg-red-700">
                                    Find Nearest Hospital
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
