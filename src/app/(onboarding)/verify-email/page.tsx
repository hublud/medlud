'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const { verifyEmailOtp, resendVerificationEmail } = useAuth();
    
    const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const isVerifyingRef = useRef(false);
    
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    // Handle input change
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only numbers

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take last character
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 7) {
            inputRefs[index + 1].current?.focus();
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 8).split('');
        const newOtp = [...otp];
        pastedData.forEach((char, i) => {
            if (/^\d$/.test(char) && i < 8) {
                newOtp[i] = char;
            }
        });
        setOtp(newOtp);
        
        // Focus the last filled input or the first empty one
        const lastIndex = Math.min(pastedData.length, 7);
        inputRefs[lastIndex].current?.focus();
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || otp.some(digit => !digit)) return;
        if (isVerifyingRef.current) return;

        isVerifyingRef.current = true;
        setVerifying(true);
        setVerifyStatus('idle');
        setErrorMessage('');

        try {
            const code = otp.join('');
            const { error } = await verifyEmailOtp(email, code);
            
            if (error) {
                setVerifyStatus('error');
                setErrorMessage(error.message || 'Invalid verification code. Please try again.');
                isVerifyingRef.current = false;
            } else {
                setVerifyStatus('success');
                // Primary redirection handled by OnboardingLayout, but we add a failsafe
                setTimeout(() => {
                    router.push('/health-profile');
                }, 2000);
            }
        } catch (err) {
            setVerifyStatus('error');
            setErrorMessage('An unexpected error occurred during verification');
            isVerifyingRef.current = false;
        } finally {
            setVerifying(false);
        }
    };

    // Auto-verify when all digits are entered
    useEffect(() => {
        if (otp.every(digit => digit !== '') && verifyStatus === 'idle' && !verifying) {
            handleVerify();
        }
    }, [otp]);

    const handleResend = async () => {
        if (!email) return;
        
        setResending(true);
        setResendStatus('idle');
        
        try {
            const { error } = await resendVerificationEmail(email);
            if (error) {
                setResendStatus('error');
                setErrorMessage(error.message || 'Failed to resend code');
            } else {
                setResendStatus('success');
                setOtp(['', '', '', '', '', '', '', '']); // Clear OTP input
                isVerifyingRef.current = false; // Reset verification lock
                inputRefs[0].current?.focus();
                setTimeout(() => setResendStatus('idle'), 5000);
            }
        } catch (err) {
            setResendStatus('error');
            setErrorMessage('An unexpected error occurred');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-25"></div>
                <ShieldCheck className="text-primary" size={48} />
            </div>

            <div className="space-y-3">
                <h1 className="text-2xl font-bold text-text-primary">Verify your email</h1>
                <div className="text-text-secondary leading-relaxed space-y-1">
                    <p>Enter the 8-digit code sent to</p>
                    {email && (
                        <p className="font-semibold text-primary break-all text-lg">
                            {email}
                        </p>
                    )}
                </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center gap-1.5 sm:gap-2 w-full max-w-[360px] mx-auto" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={`flex-1 min-w-[24px] max-w-[44px] h-11 sm:h-14 text-center text-lg sm:text-2xl font-bold border-2 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm ${
                                verifyStatus === 'error' ? 'border-red-300 bg-red-50 text-red-600' : 
                                verifyStatus === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-600' :
                                'border-gray-100 bg-gray-50 text-gray-900'
                            }`}
                        />
                    ))}
                </div>

                {errorMessage && verifyStatus === 'error' && (
                    <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                )}

                {verifyStatus === 'success' && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span className="font-medium">Verification successful! Redirecting...</span>
                    </div>
                )}

                <Button 
                    type="submit" 
                    fullWidth 
                    size="lg" 
                    isLoading={verifying}
                    disabled={otp.some(digit => !digit) || verifyStatus === 'success'}
                    className="shadow-lg shadow-primary/20"
                >
                    Verify Account
                </Button>
            </form>

            <div className="pt-4 space-y-4">
                <p className="text-sm text-text-secondary">
                    Didn't receive the code? Check your spam or{' '}
                    <button 
                        onClick={handleResend}
                        disabled={resending || verifying || verifyStatus === 'success'}
                        className="text-primary font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        {resending ? 'Sending...' : 'Resend Code'}
                    </button>
                </p>

                {resendStatus === 'success' && (
                    <div className="flex items-center justify-center gap-2 text-primary bg-primary/5 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        <span className="font-medium">New code sent successfully!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
