'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, profile, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            const staffRoles = ['doctor', 'nurse', 'nurse-assistant', 'mental-health', 'admin'];
            const isStaffOrAdmin = profile && staffRoles.includes(profile.role || 'patient');

            if (!user) {
                // Not logged in, go to login
                router.push('/login');
            } else if (profile && !profile.onboarding_completed && !isStaffOrAdmin) {
                // ONLY redirect to onboarding if NOT staff/admin
                let currentStep = profile.onboarding_step || 'health-profile';

                const stepPaths = {
                    'health-profile': '/health-profile',
                    'emergency-contact': '/emergency-contact',
                    'permissions': '/permissions',
                    'completed': '/completion'
                };
                const targetPath = stepPaths[currentStep as keyof typeof stepPaths] || '/health-profile';
                router.push(targetPath);
            } else if (!profile && user) {
                // Defensive: If loading is false but profile is missing
                console.warn('[Dashboard] Auth loading finished but profile still null.');
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium animate-pulse">Loading MedLud...</p>
                </div>
            </div>
        );
    }

    if (!user || !profile || !profile.onboarding_completed) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium">Verifying account...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
