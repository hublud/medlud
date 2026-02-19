'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

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
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="space-y-2">
                        <p className="text-text-primary text-xl font-bold animate-pulse">Connecting to MedLud...</p>
                        <p className="text-text-secondary text-sm">This usually takes a few seconds. If it stays like this, please try refreshing the page.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user || !profile || profile.onboarding_completed === false) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="space-y-4">
                        <p className="text-text-primary text-xl font-bold">Verifying account...</p>
                        <p className="text-text-secondary text-sm">
                            We're setting up your workspace. This usually takes just a few seconds.
                        </p>
                        <div className="pt-4 flex flex-col gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                Refresh Page
                            </Button>
                            <p className="text-[10px] text-text-secondary">
                                If you're stuck here, try clearing your browser cache or logging out and back in.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
