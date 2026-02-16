'use client';

import React from 'react';
import { Mail, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function VerifyEmailPage() {
    return (
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-25"></div>
                <Mail className="text-primary" size={48} />
            </div>

            <div className="space-y-3">
                <h1 className="text-2xl font-bold text-text-primary">Confirm your email</h1>
                <p className="text-text-secondary leading-relaxed">
                    Account created! Please check your email to confirm your account before continuing.
                </p>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col gap-4">
                <p className="text-xs text-blue-700 font-medium">
                    We've sent a verification link to your email address. Clicking the link will verify your identity and automatically log you in.
                </p>
                <Button
                    variant="outline"
                    fullWidth
                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => window.open('https://mail.google.com', '_blank')}
                >
                    <ExternalLink size={18} />
                    Open Mail
                </Button>
            </div>

            <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-secondary mb-4">Already verified?</p>
                <Link href="/login">
                    <Button fullWidth className="gap-2 group">
                        Continue to Login
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <p className="text-xs text-text-secondary">
                Didn't receive the email? Check your spam folder or <button className="text-primary font-bold hover:underline">Resend Email</button>
            </p>
        </div>
    );
}
