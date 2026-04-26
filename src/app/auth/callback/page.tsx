'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your account...');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            
            if (!code) {
                // Check if we are already logged in (maybe the link was clicked twice)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setStatus('success');
                    setMessage('You are already authenticated. Redirecting...');
                    setTimeout(() => router.push('/health-profile'), 1000);
                    return;
                }
                
                setStatus('error');
                setMessage('No verification code found in the URL. Your link may have expired or was already used.');
                return;
            }

            try {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                
                if (error) throw error;

                if (data.session) {
                    setStatus('success');
                    setMessage('Verification successful! One moment while we prepare your dashboard...');
                    
                    // Small delay for visual confirmation of the "Success" state
                    setTimeout(() => {
                        router.push('/health-profile');
                    }, 1500);
                } else {
                    throw new Error('Could not establish a secure session.');
                }
            } catch (err: any) {
                console.error('Auth error:', err);
                setStatus('error');
                setMessage(err.message || 'An error occurred during verification.');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500 border border-border">
            <div className="flex justify-center">
                {status === 'loading' && (
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full" />
                        </div>
                    </div>
                )}
                {status === 'success' && (
                    <div className="bg-emerald-50 p-4 rounded-full">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                )}
                {status === 'error' && (
                    <div className="bg-red-50 p-4 rounded-full">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                    {status === 'loading' && 'Authenticating'}
                    {status === 'success' && 'Success!'}
                    {status === 'error' && 'Verification Link Error'}
                </h1>
                <p className="text-text-secondary leading-relaxed px-4">
                    {message}
                </p>
            </div>

            {status === 'error' && (
                <div className="pt-4 space-y-3">
                    <button 
                        onClick={() => router.push('/login')}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Back to Login
                    </button>
                    <p className="text-xs text-text-secondary">
                        If you continue to have issues, please contact support.
                    </p>
                </div>
            )}

            {status === 'success' && (
                <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden mt-8">
                    <div className="bg-emerald-500 h-full animate-[loading_1.5s_ease-in-out]" />
                </div>
            )}
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <Suspense fallback={
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                </div>
            }>
                <CallbackHandler />
            </Suspense>
        </div>
    );
}

// Add a simple loading animation
// Note: In Next.js, you might want to add this to your global CSS or a module
// but for this standalone page, we'll keep the tailwind animate class if defined
// otherwise the bar just won't animate.
