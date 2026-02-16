'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, Heart, Coffee, BookOpen, Loader2 } from 'lucide-react';

interface CopingTechnique {
    id: string;
    name: string;
    description: string;
    steps: string[];
    duration: string;
    category: string;
}

interface Organization {
    id: string;
    name: string;
    description: string;
    contact: string;
}

interface SelfCareTip {
    id: string;
    tip: string;
}

export default function MentalHealthResourcesPage() {
    const [copingTechniques, setCopingTechniques] = useState<CopingTechnique[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selfCareTips, setSelfCareTips] = useState<SelfCareTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchResources() {
            try {
                const [techRes, orgsRes, tipsRes] = await Promise.all([
                    supabase.from('coping_techniques').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('mental_health_organizations').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('self_care_tips').select('*').eq('is_active', true).order('display_order')
                ]);

                if (techRes.error) throw techRes.error;
                if (orgsRes.error) throw orgsRes.error;
                if (tipsRes.error) throw tipsRes.error;

                setCopingTechniques(techRes.data || []);
                setOrganizations(orgsRes.data || []);
                setSelfCareTips(tipsRes.data || []);
            } catch (err: any) {
                console.error('Error fetching resources:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchResources();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-text-secondary">Loading resources...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p>Error loading resources: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

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

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-primary">Mental Health Resources</h1>
                    <p className="text-text-secondary">Coping techniques and self-care strategies</p>
                </div>

                {/* Coping Techniques */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Brain size={24} className="text-purple-600" />
                        Coping Techniques
                    </h2>

                    {copingTechniques.map((technique) => (
                        <div key={technique.id} className="bg-white rounded-xl border border-border p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-text-primary">{technique.name}</h3>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    {technique.duration}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary mb-4">{technique.description}</p>
                            <div className="space-y-2">
                                {technique.steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                                        <span className="text-purple-600 font-medium">{index + 1}.</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Self-Care Tips */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Heart size={24} className="text-pink-600" />
                        Self-Care Tips
                    </h2>

                    <div className="bg-white rounded-xl border border-border p-6">
                        <ul className="space-y-3">
                            {selfCareTips.map((item) => (
                                <li key={item.id} className="flex items-start gap-2 text-text-secondary">
                                    <span className="text-pink-600 mt-1">•</span>
                                    <span>{item.tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Nigeria Resources */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <BookOpen size={24} className="text-green-600" />
                        Mental Health Organizations in Nigeria
                    </h2>

                    {organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-xl border border-border p-5">
                            <h3 className="font-bold text-text-primary mb-1">{org.name}</h3>
                            <p className="text-sm text-text-secondary mb-2">{org.description}</p>
                            <p className="text-xs text-green-600 font-medium">{org.contact}</p>
                        </div>
                    ))}
                </div>

                {/* Emergency */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h3 className="font-bold text-red-900 mb-2">🚨 In Crisis?</h3>
                    <p className="text-red-700 mb-3">
                        If you're experiencing a mental health emergency or having thoughts of self-harm:
                    </p>
                    <ul className="space-y-1 text-sm text-red-600 mb-4">
                        <li>• Reach out to a trusted person immediately</li>
                        <li>• Contact a mental health professional</li>
                        <li>• Go to the nearest hospital emergency room</li>
                    </ul>
                    <Link href="/dashboard/appointments/book?category=mental-health">
                        <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                            Connect with Professional Now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
