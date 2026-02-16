'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

export default function CompletionPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500 text-center py-8">
            <div className="bg-primary/10 p-6 rounded-full text-primary mb-4 animate-bounce">
                <CheckCircle2 size={64} />
            </div>

            <h1 className="text-3xl font-extrabold text-primary tracking-tight">You're All Set!</h1>
            <p className="text-text-secondary max-w-xs">
                Your MedLud account is ready. Let's start taking care of your health together.
            </p>

            <div className="pt-8 w-full">
                <Button onClick={() => router.push('/dashboard')} fullWidth size="lg">
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
