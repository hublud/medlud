'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    Calendar,
    Activity,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Loader2,
    Clock,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';

interface DashboardStats {
    totalUsers: number;
    maternalUsers: number;
    pendingAppointments: number;
    staffOnline: string;
}

interface RecentUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_maternal: boolean;
    created_at: string;
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        maternalUsers: 0,
        pendingAppointments: 0,
        staffOnline: '0/0',
    });
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Total Users
            const { count: totalCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Maternal Users
            const { count: maternalCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_maternal', true);

            // 3. Fetch Pending Appointments
            const { count: pendingCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');

            // 4. Fetch Staff for Online Calculation (Mock logic for \"online\" based on role)
            const staffRoles = ['nurse', 'nurse-assistant', 'doctor', 'mental-health'];
            const { data: staffData } = await supabase
                .from('profiles')
                .select('id, role')
                .in('role', staffRoles);

            const staffOnlineCount = staffData?.length ? Math.floor(staffData.length * 0.7) : 0; // Simulated online ratio

            // 5. Fetch Recent Registrations
            const { data: recentData } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, is_maternal, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                totalUsers: totalCount || 0,
                maternalUsers: maternalCount || 0,
                pendingAppointments: pendingCount || 0,
                staffOnline: `${staffOnlineCount}/${staffData?.length || 0}`,
            });

            setRecentUsers(recentData || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statCards = [
        {
            name: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            change: '+12.5%', // Placeholder for trend analysis
            trend: 'up',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            name: 'Maternal Registrations',
            value: stats.maternalUsers.toLocaleString(),
            change: '+18.2%',
            trend: 'up',
            icon: Activity,
            color: 'text-pink-600',
            bg: 'bg-pink-50',
        },
        {
            name: 'Pending Appointments',
            value: stats.pendingAppointments.toLocaleString(),
            change: '-4.3%',
            trend: 'down',
            icon: Calendar,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            name: 'Active Staff',
            value: stats.staffOnline,
            change: 'Live',
            trend: 'up',
            icon: Clock,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Navigation */}
            <div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4 group"
                >
                    <div className="p-2 rounded-full bg-white border border-gray-100 group-hover:bg-primary/5 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-medium">Back to User Dashboard</span>
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                {loading && <Loader2 className="animate-spin text-primary" size={24} />}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.change}
                                    {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
                                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <QuickActionsPanel currentUserId={user?.id || ''} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Users */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
                        <Link href="/admin/users" className="text-primary text-sm font-medium hover:underline">View all</Link>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-gray-400">
                                <Loader2 className="animate-spin mx-auto mb-2" />
                                <p>Updating registrations...</p>
                            </div>
                        ) : recentUsers.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">
                                No recent registrations found.
                            </div>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                                            {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {user.full_name || user.email.split('@')[0]}
                                            </p>
                                            <p className="text-xs text-gray-500">{getTimeAgo(user.created_at)}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${user.is_maternal ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.is_maternal ? 'Maternal' : user.role === 'patient' ? 'General' : user.role.toUpperCase()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">System Status</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Patient/Staff Ratio</span>
                                <span className="text-gray-900 font-medium">Healthy</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[12%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Active Consultations</span>
                                <span className="text-gray-900 font-medium">{stats.staffOnline.split('/')[0]} Doctors Online</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[80%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Response Rate</span>
                                <span className="text-gray-900 font-medium">94%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full w-[94%]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-900 rounded-xl">
                        <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider font-bold">Admin Notice</p>
                        <p className="text-white text-sm">Real-time database sync is active. Statistics update automatically on page load.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
