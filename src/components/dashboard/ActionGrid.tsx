'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Baby, BrainCircuit, Calendar, Video, MapPin, ArrowRight, ShieldCheck, Lock as LockIcon, LayoutDashboard, Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

interface Action {
    title: string;
    description: string;
    icon: any;
    color: string;
    href: string;
    isStaffOnly?: boolean;
    isAdminOnly?: boolean;
    isFeatured?: boolean;
}

export const ActionGrid: React.FC = () => {
    const { profile } = useAuth();
    const [isPregnant, setIsPregnant] = useState(false);

    useEffect(() => {
        // Check if user has pregnancy profile
        const profileData = localStorage.getItem('pregnancyProfile');
        if (profileData) {
            const profile = JSON.parse(profileData);
            setIsPregnant(profile.isPregnant === true);
        }
    }, []);

    const baseActions: Action[] = [
        {
            title: "Talk To A Doctor / Nurse",
            description: "Get help from a medical personal",
            icon: Calendar,
            color: "bg-emerald-100 text-emerald-600",
            href: '/dashboard/appointments',
            isFeatured: true
        },
        {
            title: "Telemedicine",
            description: "Chat, call or video consult",
            icon: Video,
            color: "bg-indigo-100 text-indigo-600",
            href: '/dashboard/telemedicine',
            isFeatured: true
        },
        {
            title: "AI Health Assistant",
            description: "Check symptoms & guidance",
            icon: Bot,
            color: "bg-blue-100 text-blue-600",
            href: '/dashboard/ai-assistant'
        },
        {
            title: "Mental Health",
            description: "Talk about how you feel",
            icon: BrainCircuit,
            color: "bg-purple-100 text-purple-600",
            href: '/dashboard/mental-health'
        },
        {
            title: "Nearby Hospitals",
            description: "Verified care near you",
            icon: MapPin,
            color: "bg-orange-100 text-orange-600",
            href: '/dashboard/hospitals'
        },
    ];

    const maternalAction: Action = {
        title: "Maternal Health",
        description: "Pregnancy & newborn care",
        icon: Baby,
        color: "bg-pink-100 text-pink-600",
        href: isPregnant ? '/dashboard/maternal' : '/dashboard/maternal/setup'
    };

    const staffAction: Action = {
        title: "Staff Portal",
        description: "Manage patients & clinic",
        icon: ShieldCheck,
        color: "bg-emerald-100 text-emerald-600",
        href: '/dashboard/staff',
        isStaffOnly: true
    };

    const adminAction: Action = {
        title: "Admin Dashboard",
        description: "System & user management",
        icon: LayoutDashboard,
        color: "bg-slate-800 text-white",
        href: '/admin',
        isAdminOnly: true
    };

    // Always show Maternal Health card (position 3, after Doctor and Telemedicine)
    // Add Staff Portal if user has a staff role
    const staffRoles = ['nurse', 'nurse-assistant', 'doctor', 'mental-health'];
    const userRole = profile?.role || 'patient';
    const isStaff = staffRoles.includes(userRole);
    const isStaffVerified = profile?.is_staff_verified === true;
    const isAdmin = userRole === 'admin';

    const actions = [...baseActions.slice(0, 2), maternalAction, ...baseActions.slice(2)];

    if (isStaff) {
        actions.push(staffAction);
    }

    if (isAdmin) {
        actions.push(adminAction);
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => {
                const isLocked = action.isStaffOnly && !isStaffVerified;

                return (
                    <div key={index} className="relative">
                        <Link
                            href={isLocked ? '#' : action.href}
                            className={`block group h-full ${isLocked ? 'cursor-not-allowed' : ''}`}
                            onClick={(e) => isLocked && e.preventDefault()}
                        >
                            <div className={`bg-white p-5 rounded-xl border shadow-sm transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden ${isLocked ? 'opacity-70 grayscale-[0.5] border-border' : action.isFeatured
                                ? 'border-emerald-500/30 ring-1 ring-emerald-500/10 group-hover:shadow-xl group-hover:shadow-emerald-500/10 group-hover:border-emerald-500/50'
                                : 'border-border group-hover:shadow-md group-hover:border-primary/30'
                                }`}>
                                {action.isFeatured && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 uppercase tracking-tighter">
                                            <Crown size={10} fill="currentColor" />
                                            Featured
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className={`${action.color} p-3 rounded-full w-fit mb-4 ${!isLocked && 'group-hover:scale-110'} transition-transform duration-300 relative ${action.isFeatured && 'ring-4 ring-emerald-50'}`}>
                                        <action.icon size={28} />
                                        {isLocked && (
                                            <div className="absolute -top-1 -right-1 bg-gray-500 text-white p-1 rounded-full shadow-lg">
                                                <LockIcon size={12} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-bold text-lg ${action.isFeatured ? 'text-gray-900' : 'text-text-primary'}`}>{action.title}</h3>
                                        {isLocked && (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                Verification Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary font-medium leading-tight">{action.description}</p>
                                </div>

                                <div className={`mt-4 flex items-center text-primary text-sm font-medium transition-opacity duration-200 ${isLocked ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'
                                    }`}>
                                    <span>{isLocked ? 'Locked' : 'Open'}</span>
                                    {!isLocked && <ArrowRight size={16} className="ml-1" />}
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
};
