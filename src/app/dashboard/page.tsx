import React from 'react';
import { Header } from '@/components/dashboard/Header';
import { ActionGrid } from '@/components/dashboard/ActionGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { HealthTips } from '@/components/dashboard/HealthTips';
import { EmergencyButton } from '@/components/dashboard/EmergencyButton';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans">
                <Header />

                <section className="mt-6">
                    <ActionGrid />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2 space-y-8">
                        <RecentActivity />
                    </div>

                    <div className="lg:col-span-1">
                        <HealthTips />
                        {/* Could add calendar or alerts here */}
                    </div>
                </div>
            </div>

            <EmergencyButton />
        </div>
    );
}
