'use client';

import React, { useEffect, useState } from 'react';
import { Stethoscope, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ActivityItem {
    id: string;
    title: string;
    date: string; // ISO string
    status: string;
    doctorName?: string;
}

export const RecentActivity: React.FC = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!user) return;

            try {
                // Fetch recent appointments
                // Attempting to join profiles to get doctor details
                const { data: appointments, error } = await supabase
                    .from('appointments')
                    .select(`
                        id,
                        title,
                        date,
                        status,
                        doctor_id,
                        profiles!appointments_doctor_id_fkey(full_name)
                    `)
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(5);

                if (error) {
                    // Fallback query if the specific FK join fails (often generic profiles join works)
                    console.warn('Join failed, retrying without complex join...', error.message);
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('appointments')
                        .select('id, title, date, status, doctor_id')
                        .eq('user_id', user.id)
                        .order('date', { ascending: false })
                        .limit(5);

                    if (fallbackError) throw fallbackError;

                    setActivities((fallbackData || []).map(apt => ({
                        id: apt.id,
                        title: apt.title || 'Medical Consultation',
                        date: apt.date,
                        status: apt.status
                    })));
                    return;
                }

                const formattedActivities: ActivityItem[] = (appointments || []).map(apt => ({
                    id: apt.id,
                    title: apt.title || 'Medical Consultation',
                    date: apt.date,
                    status: apt.status,
                    doctorName: (apt.profiles as any)?.full_name
                }));

                setActivities(formattedActivities);
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [user]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100', label: 'Completed' };
            case 'RESPONDED':
                return { icon: Stethoscope, color: 'text-blue-600 bg-blue-100', label: 'Responded' };
            case 'PENDING':
                return { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' };
            case 'CANCELLED':
                return { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' };
            default:
                return { icon: Calendar, color: 'text-purple-600 bg-purple-100', label: status };
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mt-8 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text-primary">Recent Activity</h3>
                <Link href="/dashboard/appointments" className="text-sm text-primary font-medium hover:underline">
                    View All
                </Link>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No recent activity found.</p>
                    <Link href="/dashboard/appointments/new" className="text-xs text-primary hover:underline mt-2 block">
                        Schedule a consultation
                    </Link>
                </div>
            ) : (
                <div className="space-y-0 divide-y divide-gray-100">
                    {activities.map((item) => {
                        const config = getStatusConfig(item.status);
                        const Icon = config.icon;
                        const dateObj = new Date(item.date);
                        const isValidDate = !isNaN(dateObj.getTime());
                        const timeAgo = isValidDate ? formatDistanceToNow(dateObj, { addSuffix: true }) : item.date;

                        return (
                            <Link
                                key={item.id}
                                href={`/dashboard/appointments/${item.id}`}
                                className="flex items-center space-x-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg px-2 group"
                            >
                                <div className={`p-2 rounded-full ${config.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-text-primary text-sm truncate group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-text-secondary truncate">
                                        {item.doctorName ? `with ${item.doctorName}` : timeAgo}
                                    </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap block ${config.color.replace('text-', 'bg-opacity-10 text-')}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                        {timeAgo}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
