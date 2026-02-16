'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, AlertTriangle, Heart, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { assessMentalHealth, RiskLevel } from '@/utils/mentalHealthRiskAssessment';
import { getCopingTechnique } from '@/data/copingTechniques';
import { aiService } from '@/services/aiService';

interface Message {
    role: 'system' | 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export default function AITherapyChatPage() {
    const [step, setStep] = useState<'consent' | 'chat'>('consent');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentRisk, setCurrentRisk] = useState<RiskLevel>('low');
    const [conversationCount, setConversationCount] = useState(0);
    const [showProfessionalPrompt, setShowProfessionalPrompt] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startChat = () => {
        setStep('chat');
        const welcomeMessage: Message = {
            role: 'ai',
            content: 'Hello, I\'m here to listen and support you. This is a safe, private space. How have you been feeling lately?',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        // Local Crisis Assessment (Safety Layer)
        // We still run this locally to ensure immediate detection of critical keywords without network latency
        const assessment = assessMentalHealth(input);
        setCurrentRisk(assessment.riskLevel);

        if (assessment.riskLevel === 'crisis') {
            // Immediate crisis response override
            const crisisResponse = `${assessment.suggestedResponse}\n\n**Please reach out for immediate help:**\n• Talk to a trusted person right now\n• Contact a mental health professional\n• If you're in immediate danger, go to the nearest hospital\n\nYou deserve support. Let me connect you with someone who can help.`;

            setMessages(prev => [...prev, {
                role: 'ai',
                content: crisisResponse,
                timestamp: new Date()
            }]);
            setShowProfessionalPrompt(true);
            setIsTyping(false);
            return;
        }

        // Use OpenAI for conversation if not in crisis
        try {
            // Prepare messages for API
            const apiMessages = updatedMessages.map(msg => ({
                role: (msg.role === 'user' ? 'user' : msg.role === 'ai' ? 'assistant' : 'system') as 'user' | 'assistant' | 'system',
                content: msg.content
            }));

            const systemPrompt = "You are a compassionate, empathetic mental health AI support companion. Your goal is to listen, validate feelings, and offer gentle coping strategies. You are NOT a doctor or therapist. DO NOT diagnose. If the user seems to be in danger, urge them to seek professional help. Keep responses concise, warm, and supportive.";

            const response = await aiService.sendMessage(apiMessages, systemPrompt);

            const aiMessage: Message = {
                role: 'ai',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setConversationCount(prev => prev + 1);

            // Heuristic to show professional prompt based on assessment risk even if chat continues
            if (assessment.riskLevel === 'moderate' && conversationCount >= 2) {
                setShowProfessionalPrompt(true);
            }

        } catch (error) {
            console.error("AI Error", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "I'm having trouble connecting right now, but I'm here simply to say: your feelings are valid.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleBreathingExercise = () => {
        const breathingTechnique = getCopingTechnique('breathing');
        if (!breathingTechnique) return;

        const exerciseMessage: Message = {
            role: 'ai',
            content: `Great! Let's do a quick breathing exercise together.\n\n**${breathingTechnique.name}**\n${breathingTechnique.description}\n\n${breathingTechnique.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nTake your time. When you're done, let me know how you feel.`,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, exerciseMessage]);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard/mental-health"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Mental Health</span>
                    </Link>
                </div>

                {/* Consent Screen */}
                {step === 'consent' && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Heart size={32} className="text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-3">Before We Begin</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
                            <div className="space-y-3 text-text-secondary">
                                <p className="text-lg font-medium text-text-primary">This AI offers emotional support and guidance.</p>
                                <p>✓ Your conversation is private and anonymous</p>
                                <p>✓ Available 24/7 for immediate support</p>
                                <p>✓ No judgement, just listening</p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
                                <p className="font-medium mb-1">⚠️ Important</p>
                                <p className="text-yellow-800">
                                    This AI does not replace a mental health professional. For clinical diagnosis,
                                    treatment, or emergency situations, please contact a licensed professional.
                                </p>
                            </div>
                        </div>

                        <Button onClick={startChat} className="w-full">
                            Continue to Chat
                        </Button>
                    </div>
                )}

                {/* Chat Interface */}
                {step === 'chat' && (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                                <Heart size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">AI Support</h3>
                                <p className="text-xs text-text-secondary">Private & Anonymous</p>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: '500px' }}>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-purple-600 text-white'
                                            : message.role === 'system'
                                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                                                : 'bg-gray-100 text-text-primary'
                                            }`}>
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
                            <div className="border-t border-border p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <Button onClick={handleSendMessage} disabled={!input.trim()}>
                                        <Send size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Crisis Warning / Professional Prompt */}
                        {currentRisk === 'crisis' && (
                            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-5">
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-red-900 mb-2">You deserve immediate support</h3>
                                        <p className="text-red-700 mb-4">
                                            Please reach out to someone who can help you right now. You don't have to face this alone.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Link href="/dashboard/mental-health/book">
                                        <Button className="w-full bg-red-600 hover:bg-red-700">
                                            Connect with Mental Health Professional Now
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/hospitals">
                                        <Button variant="outline" className="w-full border-red-300 text-red-700">
                                            Find Nearest Hospital
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Professional Prompt (Moderate) */}
                        {showProfessionalPrompt && currentRisk === 'moderate' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <h3 className="font-bold text-blue-900 mb-2">Professional Support Available</h3>
                                <p className="text-blue-700 mb-4">
                                    A licensed mental health professional can provide personalized care and treatment.
                                </p>
                                <Link href="/dashboard/mental-health/book">
                                    <Button className="w-full">
                                        Book Mental Health Consultation
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Coping Technique Suggestion */}
                        {currentRisk === 'low' && conversationCount >= 2 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                                <h3 className="font-bold text-green-900 mb-2">Try a Coping Technique</h3>
                                <p className="text-green-700 mb-4">
                                    A quick breathing exercise can help calm your mind and body.
                                </p>
                                <Button
                                    onClick={handleBreathingExercise}
                                    variant="outline"
                                    className="w-full border-green-300 text-green-700"
                                >
                                    Start Breathing Exercise
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
