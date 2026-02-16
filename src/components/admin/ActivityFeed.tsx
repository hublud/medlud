'use client';

import React, { useState, useEffect } from 'react';
import { Activity, User, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { SystemActivity, getSystemActivity } from '@/utils/notifications';

export const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<SystemActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
        // Poll for new activities every 30 seconds
        const interval = setInterval(loadActivities, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await getSystemActivity(30);
            setActivities(data);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: SystemActivity['activity_type']) => {
        switch (type) {
            case 'login':
                return <User size={18} className="text-blue-600" />;
            case 'appointment':
                return <Calendar size={18} className="text-green-600" />;
            case 'user_action':
                return <Activity size={18} className="text-purple-600" />;
            default:
                return <SettingsIcon size={18} className="text-gray-600" />;
        }
    };

    const getActivityColor = (type: SystemActivity['activity_type']) => {
        switch (type) {
            case 'login':
                return 'bg-blue-50 border-blue-200';
            case 'appointment':
                return 'bg-green-50 border-green-200';
            case 'user_action':
                return 'bg-purple-50 border-purple-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

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
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
                <Activity size={24} className="text-primary" />
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
                    <p className="text-sm text-text-secondary">Real-time system events</p>
                </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="text-center py-8 text-text-secondary">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Loading activity...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                        <Activity size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    activities.map(activity => (
                        <div
                            key={activity.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.activity_type)}`}
                        >
                            <div className="mt-0.5">
                                {getActivityIcon(activity.activity_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary font-medium">
                                    {activity.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {activity.user && (
                                        <span className="text-xs text-text-secondary">
                                            by {activity.user.full_name}
                                        </span>
                                    )}
                                    <span className="text-xs text-text-secondary">
                                        • {getTimeAgo(activity.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
