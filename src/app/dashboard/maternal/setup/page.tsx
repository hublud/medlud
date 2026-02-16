'use client';

import React from 'react';
import { PregnancySetupForm } from '@/components/maternal/PregnancySetupForm';
import { ArrowLeft, Baby } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function PregnancySetupPage() {
    const [step, setStep] = React.useState<'SELECTION' | 'FORM'>('SELECTION');
    const router = useRouter();

    if (step === 'SELECTION') {
        return (
            <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 text-center">

                    <div className="space-y-4">
                        <div className="mx-auto w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
                            <Baby size={40} className="text-pink-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Maternal Health</h1>
                        <p className="text-gray-600 text-lg">
                            Are you currently pregnant and looking to track your journey?
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Button
                            onClick={() => setStep('FORM')}
                            className="w-full text-lg h-14 bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200"
                        >
                            Yes, I am pregnant
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            className="w-full text-lg h-14 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                            No, return to dashboard
                        </Button>
                    </div>

                    <p className="text-sm text-gray-400 pt-8">
                        MedLud provides personalized care for expecting mothers.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* Navigation */}
                <div>
                    <button
                        onClick={() => setStep('SELECTION')}
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Selection</span>
                    </button>
                </div>

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-text-primary">Pregnancy Profile Setup</h1>
                    <p className="text-text-secondary text-lg">
                        Let's personalize your maternal health journey
                    </p>
                </div>

                {/* Setup Form */}
                <PregnancySetupForm />
            </div>
        </div>
    );
}
