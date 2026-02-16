'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { useAuth } from '@/context/AuthContext';
import { PersonalInfoCard } from '@/components/profile/PersonalInfoCard';
import { HealthInfoCard } from '@/components/profile/HealthInfoCard';
import { EmergencyContactsCard } from '@/components/profile/EmergencyContactsCard';
import { SecurityPrivacyCard } from '@/components/profile/SecurityPrivacyCard';
import { NotificationsCard } from '@/components/profile/NotificationsCard';
import { PermissionsCard } from '@/components/profile/PermissionsCard';
import { AccountActionsCard } from '@/components/profile/AccountActionsCard';

export default function ProfilePage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Dashboard layout handles redirect, but safe to return null here
    }

    const getFirstName = () => {
        // 1. Try profile table first
        if (profile?.full_name) return profile.full_name.split(' ')[0];

        // 2. Try Auth metadata (from signup)
        const metaName = user?.user_metadata?.full_name;
        if (metaName) return metaName.split(' ')[0];

        // 3. Fallback to email prefix
        return user?.email?.split('@')[0] || 'User';
    };

    const rawName = getFirstName();
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    const userData = {
        name: formattedName,
        role: profile?.role === 'admin' ? 'Admin' : 'Patient',
        medludId: profile?.med_id ? `PAT-${profile.med_id}` : 'N/A',
        isVerified: !!profile?.onboarding_completed,
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* 1. Header Section */}
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
                    <ProfileHeader
                        name={userData.name}
                        role={userData.role}
                        medludId={userData.medludId}
                        isVerified={userData.isVerified}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Personal & Health Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <PersonalInfoCard />
                        <HealthInfoCard role="PATIENT" />
                        <EmergencyContactsCard />
                    </div>

                    {/* Right Column: Settings & Preferences */}
                    <div className="space-y-6">
                        <SecurityPrivacyCard />
                        <NotificationsCard />
                        <PermissionsCard />
                        <AccountActionsCard />
                    </div>
                </div>

                <div className="text-center pt-8 text-xs text-text-secondary">
                    <p>MedLud v1.0.2 • Powered by HubLud Technology</p>
                </div>
            </div>
        </div>
    );
}
