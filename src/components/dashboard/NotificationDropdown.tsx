'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Calendar, Video, CheckCircle, Info, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, markUserNotificationAsRead, UserNotification } from '@/utils/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = React.useState<UserNotification[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (isOpen && user) {
            fetchNotifications();
        }
    }, [isOpen, user]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await markUserNotificationAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    if (!isOpen) return null;

    const getIcon = (type: UserNotification['type']) => {
        switch (type) {
            case 'APPOINTMENT': return <Calendar size={16} className="text-blue-600" />;
            case 'TELEMEDICINE': return <Video size={16} className="text-purple-600" />;
            case 'PRESCRIPTION': return <Stethoscope size={16} className="text-green-600" />;
            case 'SYSTEM': return <Info size={16} className="text-gray-600" />;
            default: return <Bell size={16} className="text-gray-600" />;
        }
    };

    const getBgColor = (type: UserNotification['type']) => {
        switch (type) {
            case 'APPOINTMENT': return 'bg-blue-100';
            case 'TELEMEDICINE': return 'bg-purple-100';
            case 'PRESCRIPTION': return 'bg-green-100';
            case 'SYSTEM': return 'bg-gray-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <>
            {/* Backdrop to close on click outside */}
            <div className="fixed inset-0 z-40" onClick={onClose}></div>

            {/* Dropdown */}
            <div className="absolute top-16 right-0 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-border z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-text-primary">Notifications</h3>
                    <span
                        className="text-xs text-primary font-medium cursor-pointer hover:underline"
                        onClick={() => fetchNotifications()}
                    >
                        Refresh
                    </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-text-secondary">
                            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-primary" />
                            <p className="text-sm">Loading notifications...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={notification.action_url || '#'}
                                    onClick={(e) => {
                                        if (!notification.is_read) handleMarkAsRead(notification.id, e);
                                        onClose();
                                    }}
                                    className={`block p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${getBgColor(notification.type)}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-secondary line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary border border-border px-1.5 py-0.5 rounded">
                                                    {notification.type}
                                                </span>
                                                <span className="text-[10px] text-text-secondary">
                                                    • {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-text-secondary">
                            <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
