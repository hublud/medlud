'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogOut, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export const AccountActionsCard = () => {
    const router = useRouter();
    const { signOut } = useAuth();

    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        // Safety timeout: If logout takes more than 2s, force redirect anyway
        const forceRedirect = setTimeout(() => {
            console.warn('Logout taking too long, forcing redirect...');
            router.push('/login');
            router.refresh();
        }, 2000);

        try {
            console.log('Logging out...');
            await signOut();
            clearTimeout(forceRedirect);
            console.log('Sign out complete, redirecting...');
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
            clearTimeout(forceRedirect);
            router.push('/login');
            router.refresh();
        }
    };

    return (
        <Card className="border-red-100">
            <h2 className="text-lg font-bold text-text-primary mb-6">Account Actions</h2>
            <div className="space-y-4">
                <Button
                    variant="outline"
                    fullWidth
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="justify-start text-text-primary hover:bg-gray-50 disabled:opacity-50"
                >
                    <LogOut size={18} className="mr-3" />
                    {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </Button>

                <Button
                    variant="danger"
                    fullWidth
                    className="justify-start bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-red-500"
                >
                    <Trash2 size={18} className="mr-3" />
                    Deactivate Account
                </Button>
            </div>
        </Card>
    );
};
