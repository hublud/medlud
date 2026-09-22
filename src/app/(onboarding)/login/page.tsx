'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Lock, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getRedirectPath } from '@/utils/redirects';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isPending, startTransition] = React.useTransition();
    const isSubmitting = React.useRef(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting.current) return;

        isSubmitting.current = true;
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting sign in...');
            const { profile: userProfile, error: signInError } = await signIn(email, password);

            if (signInError) {
                console.warn('Sign in error:', signInError.message);
                // Handle abort error gracefully (common in dev/hot-reload)
                if (signInError.name === 'AbortError' || signInError.message?.includes('aborted')) {
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                }
                setError(signInError.message);
                setLoading(false);
                isSubmitting.current = false;
                return;
            }

            console.log('Sign in successful, determining redirection path...');
            const redirectTo = searchParams?.get('redirectTo');
            let targetPath = redirectTo || '/dashboard';

            if (!redirectTo) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: dbProfile } = await (supabase as any)
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (dbProfile) {
                        try {
                            const { data: staffData } = await (supabase as any)
                                .from('facility_staff')
                                .select('id, role, status, facility_id')
                                .eq('profile_id', user.id)
                                .eq('status', 'active')
                                .maybeSingle();

                            const fullProfile = { ...dbProfile, facility_staff: staffData };
                            targetPath = getRedirectPath(fullProfile);
                        } catch (e) {
                            console.warn('Error fetching facility staff status on login:', e);
                            targetPath = getRedirectPath(dbProfile);
                        }
                    }
                }
            }

            console.log(`Redirecting to: ${targetPath}`);

            startTransition(() => {
                router.push(targetPath);
                // Keep loading true during redirect
            });
        } catch (err: any) {
            console.warn('Login exception:', err.message || err);
            if (err.name !== 'AbortError') {
                setError('An unexpected error occurred. Please try again.');
                setLoading(false);
            }
            isSubmitting.current = false;
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <Link
                href="/"
                className="absolute -top-4 -left-4 p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
            >
                <ChevronLeft size={16} />
                Back Home
            </Link>

            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <Image
                        src="/medlud-logo.png"
                        alt="MedLud Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
                <p className="text-text-secondary mt-2">Sign in to your MedLud account</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <Input
                    label="Email Address or MED-ID"
                    type="text"
                    placeholder="Enter email or 7-digit Medical ID"
                    required
                    leftIcon={User}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    leftIcon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-secondary hover:text-primary transition-colors p-1"
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    }
                />

                <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                        Forgot Password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={loading}
                    rightIcon={<ArrowRight size={18} />}
                >
                    Sign In
                </Button>
            </form>


            <div className="pt-4 text-center">
                <p className="text-sm text-text-secondary">
                    Don't have an account? <Link href="/welcome" className="text-primary hover:underline font-medium">Get Started</Link>
                </p>
            </div>


        </div>
    );
}
