'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Video, Stethoscope, Calendar, AlertCircle, Heart } from 'lucide-react';
import { WeeklyTracker } from '@/components/maternal/WeeklyTracker';
import { Button } from '@/components/ui/Button';
import { PregnancyProfile } from '@/types/user';
import { getNextANCVisit, getWeeklyEncouragement } from '@/utils/maternalHealth';

export default function MaternalDashboardPage() {
    const router = useRouter();
    const [pregnancyProfile, setPregnancyProfile] = useState<PregnancyProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load pregnancy profile from localStorage
        const profileData = localStorage.getItem('pregnancyProfile');
        if (profileData) {
            setPregnancyProfile(JSON.parse(profileData));
        } else {
            // Redirect to setup if no profile
            router.push('/dashboard/maternal/setup');
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-text-secondary">Loading...</p>
            </div>
        );
    }

    if (!pregnancyProfile) {
        return null;
    }

    // Get dynamic ANC visit and encouragement
    const nextVisit = getNextANCVisit(pregnancyProfile.gestationalAge);
    const encouragement = getWeeklyEncouragement(pregnancyProfile.gestationalAge);

    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

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
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-text-primary">Maternal Health</h1>
                    <p className="text-text-secondary text-lg">Your pregnancy support and guidance</p>
                </div>

                {/* Weekly Encouragement */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5 flex items-start gap-4">
                    <div className="bg-pink-100 p-2 rounded-full flex-shrink-0">
                        <Heart size={24} className="text-pink-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-pink-900 mb-1">Week {pregnancyProfile.gestationalAge}</h3>
                        <p className="text-pink-700">{encouragement}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/dashboard/maternal/symptoms">
                        <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group">
                            <div className="bg-pink-100 p-3 rounded-full w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Stethoscope size={24} className="text-pink-600" />
                            </div>
                            <h3 className="font-bold text-text-primary mb-1">Symptom Checker</h3>
                            <p className="text-sm text-text-secondary">Pregnancy-aware assessment</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/appointments/book?category=maternal">
                        <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group">
                            <div className="bg-blue-100 p-3 rounded-full w-fit mb-3 group-hover:scale-110 transition-transform">
                                <MessageSquare size={24} className="text-blue-600" />
                            </div>
                            <h3 className="font-bold text-text-primary mb-1">Nurse Chat</h3>
                            <p className="text-sm text-text-secondary">Talk to a midwife</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/telemedicine">
                        <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group">
                            <div className="bg-purple-100 p-3 rounded-full w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Video size={24} className="text-purple-600" />
                            </div>
                            <h3 className="font-bold text-text-primary mb-1">Telenursing</h3>
                            <p className="text-sm text-text-secondary">Video consultation</p>
                        </div>
                    </Link>
                </div>

                {/* Upcoming ANC Reminder */}
                {nextVisit && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                            <AlertCircle size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-900 mb-1">Upcoming ANC Visit</h3>
                            <p className="text-blue-700">{nextVisit.week} Weeks - {nextVisit.label}</p>
                        </div>
                    </div>
                )}

                {/* Weekly Tracker */}
                <WeeklyTracker gestationalAge={pregnancyProfile.gestationalAge} />
            </div>
        </div>
    );
}
