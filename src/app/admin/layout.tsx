'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    Brain,
    Menu,
    X,
    ShieldCheck,
    BarChart3,
    TrendingUp,
    Phone,
    Activity,
    Lightbulb,
    Heart
} from 'lucide-react';


import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const sidebarItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Staff Management', href: '/admin/staff', icon: ShieldCheck },
    { name: 'Staff Performance', href: '/admin/staff-performance', icon: TrendingUp },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
    { name: 'Telemedicine Logs', href: '/admin/telemedicine-logs', icon: Phone },
    { name: 'Mental Health Resources', href: '/admin/mental-health-resources', icon: Heart },
    { name: 'Health Tips', href: '/admin/health-tips', icon: Lightbulb },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Simple RBAC check
    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (profile && profile.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500 animate-pulse font-medium">Verifying Admin Access...</p>
            </div>
        );
    }

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                        <div className="bg-primary p-2 rounded-lg">
                            <Brain className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">MedLud Admin</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:text-red-400" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <Brain className="text-primary" size={24} />
                        <span className="font-bold">MedLud</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
