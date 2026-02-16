'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity } from 'lucide-react';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { SystemHealthDashboard } from '@/components/admin/SystemHealthDashboard';

export default function MonitoringPage() {
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [profile, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium">Loading monitoring...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                        <Activity size={32} className="text-primary" />
                        System Monitoring
                    </h1>
                    <p className="text-text-secondary mt-1">Real-time notifications, activity, and system health</p>
                </div>

                {/* System Health */}
                <SystemHealthDashboard />

                {/* Notifications & Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <NotificationCenter />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
