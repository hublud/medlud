'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react';
import { fetchAnalyticsData, getDateRange, TimeRange, AnalyticsData } from '@/utils/analytics';
import { UserRegistrationChart, AppointmentCategoryChart, AppointmentHourChart } from '@/components/admin/AnalyticsCharts';
import { TimeRangeFilter } from '@/components/admin/TimeRangeFilter';
import { ExportButton } from '@/components/admin/ExportButton';

export default function AnalyticsPage() {
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [profile, authLoading, router]);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const dateRange = getDateRange(timeRange);
            const data = await fetchAnalyticsData(dateRange);
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analyticsData) return null;

    const getTimeRangeLabel = () => {
        const labels = {
            today: 'Today',
            week: 'This Week',
            month: 'This Month',
            year: 'This Year',
            custom: 'Custom Range'
        };
        return labels[timeRange];
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                            <BarChart3 size={32} className="text-primary" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-text-secondary mt-1">Real-time insights and data visualization</p>
                    </div>
                    <ExportButton data={analyticsData} timeRange={getTimeRangeLabel()} />
                </div>

                {/* Time Range Filter */}
                <div className="bg-white rounded-xl border border-border p-4">
                    <TimeRangeFilter selectedRange={timeRange} onRangeChange={setTimeRange} />
                </div>

                {/* Summary Stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Users size={24} />
                            <span className="text-purple-200 text-sm font-medium">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold">{analyticsData.totalUsers}</h3>
                        <p className="text-purple-100 text-sm mt-1">Registered Users</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Activity size={24} />
                            <span className="text-blue-200 text-sm font-medium">All Time</span>
                        </div>
                        <h3 className="text-3xl font-bold">{analyticsData.totalAppointments}</h3>
                        <p className="text-blue-100 text-sm mt-1">Total Appointments</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={24} />
                            <span className="text-pink-200 text-sm font-medium">Pending</span>
                        </div>
                        <h3 className="text-3xl font-bold">{analyticsData.pendingAppointments}</h3>
                        <p className="text-pink-100 text-sm mt-1">Awaiting Review</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Users size={24} />
                            <span className="text-green-200 text-sm font-medium">Active</span>
                        </div>
                        <h3 className="text-3xl font-bold">{analyticsData.activeStaff}</h3>
                        <p className="text-green-100 text-sm mt-1">Staff Members</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* User Registrations */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-4">User Registrations Over Time</h3>
                        {analyticsData.userRegistrations.length > 0 ? (
                            <UserRegistrationChart data={analyticsData.userRegistrations} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-text-secondary">
                                No registration data for this period
                            </div>
                        )}
                    </div>

                    {/* Appointments by Category */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Appointments by Category</h3>
                        {analyticsData.appointmentsByCategory.length > 0 ? (
                            <AppointmentCategoryChart data={analyticsData.appointmentsByCategory} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-text-secondary">
                                No appointment data for this period
                            </div>
                        )}
                    </div>
                </div>

                {/* Peak Hours */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Appointment Distribution by Hour</h3>
                    {analyticsData.appointmentsByHour.some(h => h.count > 0) ? (
                        <AppointmentHourChart data={analyticsData.appointmentsByHour} height={350} />
                    ) : (
                        <div className="h-[350px] flex items-center justify-center text-text-secondary">
                            No appointment data for this period
                        </div>
                    )}
                </div>

                {/* User Insights */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Quick Insights</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-700 font-medium">Average Daily Registrations</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">
                                {analyticsData.userRegistrations.length > 0
                                    ? Math.round(analyticsData.userRegistrations.reduce((sum, item) => sum + item.count, 0) / analyticsData.userRegistrations.length)
                                    : 0}
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">Most Popular Category</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {analyticsData.appointmentsByCategory.length > 0
                                    ? analyticsData.appointmentsByCategory.reduce((max, item) => item.count > max.count ? item : max).category
                                    : 'N/A'}
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-700 font-medium">Staff Utilization</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                                {analyticsData.activeStaff > 0
                                    ? Math.round((analyticsData.totalAppointments / analyticsData.activeStaff) * 10) / 10
                                    : 0}
                                <span className="text-sm text-green-700 ml-1">per staff</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
