'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Lock, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signIn } = useAuth();
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
            const { error: signInError } = await signIn(email, password);

            if (signInError) {
                console.error('Sign in error:', signInError);
                // Handle abort error gracefully (common in dev/hot-reload)
                if (signInError.name === 'AbortError' || signInError.message.includes('aborted')) {
                    // Ignore aborts, likely navigation or cleanup
                    return;
                }
                setError(signInError.message);
                setLoading(false);
                isSubmitting.current = false;
                return;
            }

            console.log('Sign in successful, redirecting...');
            startTransition(() => {
                router.push('/dashboard');
                // Keep loading true during redirect
            });
        } catch (err: any) {
            console.error('Login exception:', err);
            if (err.name !== 'AbortError') {
                setError('An unexpected error occurred. Please try again.');
                setLoading(false);
            }
            isSubmitting.current = false;
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (err: any) {
            setError('Failed to sign in with Google.');
            setLoading(false);
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
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
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
                    <Link href="#" className="text-sm text-primary hover:underline font-medium">
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

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-text-secondary">Or continue with</span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                fullWidth
                size="lg"
                onClick={handleGoogleSignIn}
                isLoading={loading}
                className="flex items-center justify-center gap-2"
            >
                <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
                Google
            </Button>

            <div className="pt-4 text-center">
                <p className="text-sm text-text-secondary">
                    Don't have an account? <Link href="/welcome" className="text-primary hover:underline font-medium">Get Started</Link>
                </p>
            </div>
        </div>
    );
}
