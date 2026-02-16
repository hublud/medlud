'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
    const { profile, user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    // Get first name with robust fallback
    const getFirstName = () => {
        if (profile?.full_name) return profile.full_name.split(' ')[0];
        const metaName = user?.user_metadata?.full_name;
        if (metaName) return metaName.split(' ')[0];
        return user?.email?.split('@')[0] || 'User';
    };

    const rawName = getFirstName();
    const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pt-4 relative">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                    Hello, {firstName} <span className="animate-wave inline-block">👋</span>
                </h1>
                <p className="text-text-secondary mt-1 sm:mt-2 text-base sm:text-lg">
                    How can we support your health today?
                </p>
            </div>
            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <div
                    className="relative bg-white p-2 rounded-full border border-border hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell size={20} className="text-text-secondary group-hover:text-primary transition-colors sm:w-6 sm:h-6" />
                    <span className="absolute top-1.5 right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </div>

                {/* Notification Dropdown */}
                <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                />

                <Link href="/dashboard/profile">
                    <div className="bg-gray-100 p-2 rounded-full border border-border hover:bg-gray-200 transition-colors cursor-pointer">
                        <User size={20} className="text-text-secondary sm:w-6 sm:h-6" />
                    </div>
                </Link>
            </div>
        </header>
    );

};
