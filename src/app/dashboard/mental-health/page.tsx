import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Calendar, BookOpen, Brain } from 'lucide-react';

export default function MentalHealthHub() {
    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <Brain size={40} className="text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary">Mental Health Support</h1>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                        Take care of your emotional well-being. You're not alone.
                    </p>
                </div>

                {/* Main Options */}
                <div className="grid gap-6 max-w-2xl mx-auto">

                    {/* Talk to AI */}
                    <Link href="/dashboard/mental-health/ai-chat">
                        <div className="bg-white rounded-2xl border-2 border-border p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group">
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                    <MessageCircle size={28} className="text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Talk to AI</h3>
                                    <p className="text-text-secondary mb-3">
                                        Private, anonymous emotional support available 24/7
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                                        <span>Start conversation</span>
                                        <span>→</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Private</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Anonymous</span>
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">24/7</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Book Consultation */}
                    <Link href="/dashboard/appointments/book?category=mental-health">
                        <div className="bg-white rounded-2xl border-2 border-border p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                    <Calendar size={28} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Start New Consultation</h3>
                                    <p className="text-text-secondary mb-3">
                                        Connect with licensed mental health professionals
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                        <span>View available slots</span>
                                        <span>→</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Resources */}
                    <Link href="/dashboard/mental-health/resources">
                        <div className="bg-white rounded-2xl border-2 border-border p-6 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer group">
                            <div className="flex items-start gap-4">
                                <div className="bg-green-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                                    <BookOpen size={28} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Mental Health Resources</h3>
                                    <p className="text-text-secondary mb-3">
                                        Educational content, coping strategies, and self-care tips
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                        <span>Explore resources</span>
                                        <span>→</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Disclaimer */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-sm text-purple-900 max-w-2xl mx-auto">
                    <p className="font-medium mb-2">💜 Your Mental Health Matters</p>
                    <p className="text-purple-700">
                        This service offers emotional support and guidance. For clinical diagnosis or emergency situations,
                        please contact a licensed mental health professional or visit your nearest hospital.
                    </p>
                </div>
            </div>
        </div>
    );
}
