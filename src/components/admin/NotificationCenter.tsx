'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminNotification, getUnreadNotifications, getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/utils/notifications';

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [showAll]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = showAll ? await getAllNotifications() : await getUnreadNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            await loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            await loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getSeverityIcon = (severity: AdminNotification['severity']) => {
        switch (severity) {
            case 'error':
                return <AlertCircle className="text-red-500" size={20} />;
            case 'warning':
                return <AlertTriangle className="text-yellow-500" size={20} />;
            case 'success':
                return <CheckCircle className="text-green-500" size={20} />;
            default:
                return <Info className="text-blue-500" size={20} />;
        }
    };

    const getSeverityColor = (severity: AdminNotification['severity']) => {
        switch (severity) {
            case 'error':
                return 'border-l-red-500 bg-red-50';
            case 'warning':
                return 'border-l-yellow-500 bg-yellow-50';
            case 'success':
                return 'border-l-green-500 bg-green-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bell size={24} className="text-primary" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Notifications</h3>
                        <p className="text-sm text-text-secondary">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowAll(!showAll)}
                        variant="outline"
                        size="sm"
                    >
                        {showAll ? 'Unread Only' : 'Show All'}
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            onClick={handleMarkAllAsRead}
                            variant="outline"
                            size="sm"
                        >
                            <CheckCheck size={16} className="mr-1" />
                            Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="text-center py-8 text-text-secondary">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                        <Bell size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No notifications</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`border-l-4 rounded-lg p-4 ${getSeverityColor(notification.severity)} ${notification.is_read ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {getSeverityIcon(notification.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="font-semibold text-text-primary">
                                            {notification.title}
                                        </h4>
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="p-1 hover:bg-white rounded transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary mb-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                        {notification.action_url && (
                                            <a
                                                href={notification.action_url}
                                                className="text-xs text-primary hover:underline font-medium"
                                            >
                                                View Details →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
