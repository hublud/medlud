import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Stethoscope, HeartPulse, Brain, Baby, Eye, Bone, Activity } from 'lucide-react';
import { SpecialistList } from '@/components/telemedicine/SpecialistList';

const icons: Record<string, any> = {
    cardiology: HeartPulse,
    neurology: Brain,
    pediatrics: Baby,
    general: Stethoscope,
    orthopedics: Bone,
    ophthalmology: Eye,
    psychiatry: Activity,
};

export default async function SpecialtyViewPage({ params }: { params: Promise<{ specialty: string }> }) {
    const { specialty } = await params;
    const TitleIcon = icons[specialty] || Stethoscope;

    // Convert 'cardiology' to 'Cardiology'
    const specialtyName = specialty ? specialty.charAt(0).toUpperCase() + specialty.slice(1) : '';

    return (
        <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/dashboard/specialists" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-emerald-100 text-emerald-600`}>
                            <TitleIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{specialtyName} Specialists</h1>
                            <p className="text-gray-500 text-sm mt-1">Select a doctor to begin a consultation</p>
                        </div>
                    </div>
                </div>

                <SpecialistList specialty={specialty} />
            </div>
        </div>
    );
}
