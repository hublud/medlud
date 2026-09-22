'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ChevronLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/auth/callback`,
            });

            if (error) throw error;

            setStatus('success');
        } catch (err: any) {
            console.error('Password reset error:', err);
            setErrorMessage(err.message || 'Failed to send reset email. Please try again.');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <Link
                href="/login"
                className="absolute -top-4 -left-4 p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
            >
                <ChevronLeft size={16} />
                Back to Login
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
                <h1 className="text-2xl font-bold text-text-primary">Forgot Password?</h1>
                <p className="text-text-secondary mt-2">
                    Enter your email and we'll send you a reset link
                </p>
            </div>

            {status === 'success' ? (
                <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center">
                        <div className="bg-emerald-50 p-4 rounded-full">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-text-primary">Check Your Inbox</h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            We've sent a password reset link to{' '}
                            <span className="font-semibold text-text-primary">{email}</span>.
                            The link expires in 1 hour.
                        </p>
                    </div>
                    <p className="text-xs text-text-secondary">
                        Didn't receive it?{' '}
                        <button
                            type="button"
                            onClick={() => { setStatus('idle'); setEmail(''); }}
                            className="text-primary hover:underline font-medium"
                        >
                            Try again
                        </button>
                    </p>
                </div>
            ) : (
                <>
                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your registered email"
                            required
                            leftIcon={Mail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={loading}
                            rightIcon={<ArrowRight size={18} />}
                        >
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="pt-2 text-center">
                        <p className="text-sm text-text-secondary">
                            Remember your password?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
