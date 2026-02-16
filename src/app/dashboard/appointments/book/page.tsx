'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingForm } from '@/components/appointments/BookingForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookAppointmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingContent />
        </Suspense>
    );
}

function BookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || undefined;

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard/appointments"
                        className="inline-flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Appointments
                    </Link>
                </div>

                <BookingForm onCancel={handleCancel} defaultCategory={category} />
            </div>
        </div>
    );
}
