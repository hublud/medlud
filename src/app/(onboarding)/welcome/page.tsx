import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';

export default function WelcomePage() {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500 relative">
            <Link
                href="/"
                className="absolute -top-4 -left-4 p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
            >
                <ChevronLeft size={16} />
                Back
            </Link>

            <div className="relative w-20 h-20 mb-2">
                <Image
                    src="/medlud-logo.png"
                    alt="MedLud Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <h1 className="text-4xl font-extrabold text-primary tracking-tight">MedLud</h1>

            <h2 className="text-xl font-semibold text-text-primary">
                Empowering Healthcare Through Intelligence
            </h2>

            <p className="text-text-secondary max-w-sm">
                Your trusted health companion. Connecting you to care, guidance, and support whenever you need it.
            </p>

            <div className="w-full space-y-4 pt-6">
                <Link href="/account-type" className="w-full block">
                    <Button fullWidth size="lg">Get Started</Button>
                </Link>

                <Link href="/login" className="w-full block">
                    <Button variant="outline" fullWidth size="lg">Sign In</Button>
                </Link>
            </div>
        </div>
    );
}
