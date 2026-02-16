'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp } from 'lucide-react';
import { getStaffMetrics, getStaffAvailability, updateStaffAvailability, StaffMetrics, StaffAvailability } from '@/utils/staffManagement';
import { StaffLeaderboard } from '@/components/admin/StaffLeaderboard';
import { StaffMetricsCard } from '@/components/admin/StaffMetricsCard';
import { AvailabilityManager } from '@/components/admin/AvailabilityManager';

export default function StaffPerformancePage() {
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const [metrics, setMetrics] = useState<StaffMetrics[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<StaffMetrics | null>(null);
    const [availability, setAvailability] = useState<StaffAvailability[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [profile, authLoading, router]);

    useEffect(() => {
        loadMetrics();
    }, []);

    useEffect(() => {
        if (selectedStaff) {
            loadAvailability(selectedStaff.staffId);
        }
    }, [selectedStaff]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const data = await getStaffMetrics();
            setMetrics(data);
            if (data.length > 0) {
                setSelectedStaff(data[0]);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailability = async (staffId: string) => {
        try {
            const data = await getStaffAvailability(staffId);
            setAvailability(data);
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    };

    const handleUpdateAvailability = async (newAvailability: Omit<StaffAvailability, 'id' | 'staff_id'>[]) => {
        if (!selectedStaff) return;

        try {
            await updateStaffAvailability(selectedStaff.staffId, newAvailability);
            await loadAvailability(selectedStaff.staffId);
            alert('Availability updated successfully!');
        } catch (error) {
            console.error('Error updating availability:', error);
            alert('Failed to update availability');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium">Loading staff performance...</p>
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
                        <TrendingUp size={32} className="text-primary" />
                        Staff Performance & Management
                    </h1>
                    <p className="text-text-secondary mt-1">Track metrics, manage schedules, and view leaderboards</p>
                </div>

                {/* Summary Stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Users size={24} />
                            <span className="text-blue-200 text-sm font-medium">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold">{metrics.length}</h3>
                        <p className="text-blue-100 text-sm mt-1">Staff Members</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={24} />
                            <span className="text-green-200 text-sm font-medium">Average</span>
                        </div>
                        <h3 className="text-3xl font-bold">
                            {metrics.length > 0
                                ? (metrics.reduce((sum, m) => sum + m.averageRating, 0) / metrics.length).toFixed(1)
                                : '0.0'}
                        </h3>
                        <p className="text-green-100 text-sm mt-1">Rating</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={24} />
                            <span className="text-purple-200 text-sm font-medium">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold">
                            {metrics.reduce((sum, m) => sum + m.totalAppointments, 0)}
                        </h3>
                        <p className="text-purple-100 text-sm mt-1">Appointments</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={24} />
                            <span className="text-pink-200 text-sm font-medium">Average</span>
                        </div>
                        <h3 className="text-3xl font-bold">
                            {metrics.length > 0
                                ? Math.round(metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length)
                                : 0}%
                        </h3>
                        <p className="text-pink-100 text-sm mt-1">Completion Rate</p>
                    </div>
                </div>

                {/* Leaderboards */}
                <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Leaderboards</h2>
                    <StaffLeaderboard metrics={metrics} />
                </div>

                {/* Individual Staff Metrics */}
                <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Individual Performance</h2>

                    {/* Staff Selector */}
                    <div className="mb-6">
                        <select
                            value={selectedStaff?.staffId || ''}
                            onChange={(e) => {
                                const staff = metrics.find(m => m.staffId === e.target.value);
                                setSelectedStaff(staff || null);
                            }}
                            className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-medium"
                        >
                            {metrics.map(m => (
                                <option key={m.staffId} value={m.staffId}>
                                    {m.staffName} - {m.role.replace('-', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedStaff && (
                        <div className="grid lg:grid-cols-2 gap-6">
                            <StaffMetricsCard metrics={selectedStaff} />
                            <AvailabilityManager
                                staffId={selectedStaff.staffId}
                                staffName={selectedStaff.staffName}
                                availability={availability}
                                onUpdate={handleUpdateAvailability}
                            />
                        </div>
                    )}
                </div>

                {/* All Staff Overview */}
                <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">All Staff Overview</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.map(metric => (
                            <StaffMetricsCard key={metric.staffId} metrics={metric} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
