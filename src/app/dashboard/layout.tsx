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
            const userRole = profile?.role || 'patient';
            const isStaffOrAdmin = staffRoles.includes(userRole);

            console.log('[DashboardLayout] Auth State:', {
                hasUser: !!user,
                hasProfile: !!profile,
                role: userRole,
                onboarding_completed: profile?.onboarding_completed,
                isStaffOrAdmin
            });

            if (!user) {
                console.log('[DashboardLayout] No user found, redirecting to login');
                router.push('/login');
            } else if (profile && profile.onboarding_completed === false && !isStaffOrAdmin) {
                // ONLY redirect to onboarding if NOT staff/admin AND onboarding_completed is EXPLICITLY false
                let currentStep = profile.onboarding_step || 'health-profile';
                console.log('[DashboardLayout] Profile incomplete, redirecting to step:', currentStep);

                const stepPaths = {
                    'health-profile': '/health-profile',
                    'emergency-contact': '/emergency-contact',
                    'permissions': '/permissions',
                    'completed': '/completion'
                };
                const targetPath = stepPaths[currentStep as keyof typeof stepPaths] || '/health-profile';
                router.push(targetPath);
            } else if (profile && profile.onboarding_completed === true) {
                console.log('[DashboardLayout] Profile complete, staying on dashboard');
            } else if (!profile && user) {
                console.warn('[DashboardLayout] Profile missing for authenticated user');
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

    if (!user || !profile || profile.onboarding_completed === false) {
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
