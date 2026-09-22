'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRedirectPath } from '@/utils/redirects';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, loading } = useAuth();

    const [showWelcome, setShowWelcome] = React.useState(false);

    useEffect(() => {
        if (loading) return;

        // 1. If NOT logged in and on a protected step page, send to login
        const protectedStepPages = ['/health-profile', '/emergency-contact', '/permissions', '/completion'];
        if (!user && protectedStepPages.includes(pathname)) {
            console.log('[OnboardingLayout] Not logged in on protected page, redirecting to login');
            router.push('/login');
            return;
        }

        // 2. If logged in, handle routing dynamically based on profile
        if (user && profile) {
            const redirectPath = getRedirectPath(profile);
            const preAuthPages = ['/welcome', '/account-type', '/login', '/signup', '/verify-email', '/basic-info'];

            // Redirect away from pre-auth pages if logged in
            if (preAuthPages.includes(pathname)) {
                console.log(`[OnboardingLayout] Redirecting from pre-auth page ${pathname} to: ${redirectPath}`);
                router.push(redirectPath);
                return;
            }

            // Pages that are always accessible regardless of onboarding status
            const alwaysAccessible = ['/forgot-password', '/completion'];

            // Redirect if onboarding is complete but they are still on onboarding step pages
            if (profile.onboarding_completed === true && !alwaysAccessible.includes(pathname)) {
                console.log(`[OnboardingLayout] Onboarding complete, redirecting to: ${redirectPath}`);
                router.push(redirectPath);
                return;
            }

            // Show welcome toast on step pages once on first load
            if (profile.onboarding_completed !== true) {
                setShowWelcome(true);
                const timer = setTimeout(() => setShowWelcome(false), 4000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, profile, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'User';

    // Progress Bar Logic
    const steps = [
        { id: 'basic-info', label: 'Basic Info', path: '/basic-info' },
        { id: 'health-profile', label: 'Health Profile', path: '/health-profile' },
        { id: 'emergency-contact', label: 'Emergency Contact', path: '/emergency-contact' },
        { id: 'permissions', label: 'Permissions', path: '/permissions' }
    ];

    const currentStepIndex = steps.findIndex(step => pathname.includes(step.path));
    const showProgress = currentStepIndex !== -1;
    const progress = showProgress ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -z-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl opacity-30" />

            {/* Success Toast */}
            {showWelcome && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-full duration-500">
                    <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400">
                        <div className="bg-white/20 p-1 rounded-full">
                            <span className="text-sm">✓</span>
                        </div>
                        <p className="font-medium">{firstName}, you are logged in!</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md space-y-6">
                {/* Progress Bar */}
                {showProgress && (
                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-widest">
                            <span>Step {currentStepIndex + 1} of {steps.length}</span>
                            <span className="text-primary">{steps[currentStepIndex].label}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-700 ease-out shadow-sm shadow-primary/30"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= currentStepIndex ? 'bg-primary' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg border border-border">
                    {children}
                </div>
            </div>
        </div>
    );
}
