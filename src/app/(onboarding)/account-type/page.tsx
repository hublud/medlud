import React from 'react';
import Link from 'next/link';
import { User, Stethoscope, HeartPulse, UserCheck, BriefcaseMedical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const accountTypes = [
    { id: 'patient', label: 'Patient', icon: User, description: 'Manage your health', isPopular: true },
    { id: 'nurse', label: 'Nurse', icon: Stethoscope, description: 'Support patients' },
    { id: 'nurse-assistant', label: 'Nursing Assistant', icon: HeartPulse, description: 'Assist in care' },
    { id: 'doctor', label: 'Doctor', icon: UserCheck, description: 'Provide consultation' },
    { id: 'mental-health', label: 'Mental Health Pro', icon: BriefcaseMedical, description: 'Mental wellness support' },
];

export default function AccountTypePage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-primary">Choose your role</h1>
                <p className="text-text-secondary mt-2">To personalize your experience</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accountTypes.map((type) => (
                    <Link href={`/basic-info?role=${type.id}`} key={type.id} className="block group relative">
                        {type.isPopular && (
                            <div className="absolute -top-3 left-4 z-10 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-lg shadow-emerald-200 animate-pulse">
                                Most Common
                            </div>
                        )}
                        <div className={`border rounded-xl p-4 transition-all duration-300 cursor-pointer flex items-center space-x-4 h-full relative overflow-hidden ${type.isPopular
                            ? 'border-emerald-500 bg-emerald-50/30 shadow-md shadow-emerald-100/50 hover:bg-emerald-50'
                            : 'border-border hover:border-primary hover:bg-primary/5'
                            }`}>
                            <div className={`${type.isPopular ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                                } p-3 rounded-full transition-colors`}>
                                <type.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-semibold transition-colors ${type.isPopular ? 'text-emerald-700' : 'text-text-primary group-hover:text-primary'
                                    }`}>
                                    {type.label}
                                </h3>
                                <p className="text-xs text-text-secondary line-clamp-1">{type.description}</p>
                            </div>
                            {type.isPopular && (
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <User size={64} className="text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            <div className="pt-4">
                <p className="text-center text-sm text-text-secondary">
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
