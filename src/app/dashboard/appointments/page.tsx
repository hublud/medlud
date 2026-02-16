'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Calendar, Filter, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AppointmentCard, AppointmentCase } from '@/components/appointments/AppointmentCard';

// Mock Data
const MOCK_CASES: AppointmentCase[] = [
    {
        id: 'case-101',
        title: 'Persistent Migraine',
        date: '2026-02-05',
        status: 'RESPONDED',
        symptoms: 'Sever headache on the left side, sensitivity to light.',
        doctorName: 'Dr. Amina Yusuf'
    },
    {
        id: 'case-102',
        title: 'Allergic Reaction',
        date: '2026-01-20',
        status: 'COMPLETED',
        symptoms: 'Skin rash after eating seafood. Took antihistamine.',
        doctorName: 'Dr. Chioma Okeke'
    },
    {
        id: 'case-103',
        title: 'Back Pain',
        date: '2026-02-06',
        status: 'PENDING',
        symptoms: 'Lower back pain after lifting heavy boxes.',
        doctorName: undefined // Not assigned yet
    }
];

import { supabase } from '@/lib/supabase';

export default function AppointmentsPage() {
    const [filter, setFilter] = React.useState<'ALL' | 'PENDING' | 'RESPONDED' | 'COMPLETED'>('ALL');
    const [appointments, setAppointments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user found');
                return;
            }

            console.log('Fetching appointments for user:', user.id);

            const { data, error: supabaseError } = await supabase
                .from('appointments')
                .select('*, doctor:profiles!doctor_id(full_name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (supabaseError) {
                console.error('Supabase error fetching appointments:', supabaseError);
                throw supabaseError;
            }

            console.log(`Fetched ${data?.length || 0} appointments`);
            setAppointments(data || []);
        } catch (err: any) {
            console.error('Error fetching appointments:', err);
            setError(err.message || 'Failed to retrieve appointments. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredCases = filter === 'ALL'
        ? appointments
        : appointments.filter(c => c.status === filter);

    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Appointments & Consultations</h1>
                        <p className="text-text-secondary">Track your cases and doctor responses.</p>
                    </div>
                    <Link href="/dashboard/appointments/book">
                        <Button>
                            <Plus size={18} className="mr-2" /> Start New Consultation
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${filter === 'ALL'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white border border-border text-text-secondary hover:bg-gray-50'
                            }`}
                    >
                        All Cases
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${filter === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-white border border-border text-text-secondary hover:bg-gray-50'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('RESPONDED')}
                        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${filter === 'RESPONDED'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-white border border-border text-text-secondary hover:bg-gray-50'
                            }`}
                    >
                        Responded
                    </button>
                    <button
                        onClick={() => setFilter('COMPLETED')}
                        className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${filter === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-white border border-border text-text-secondary hover:bg-gray-50'
                            }`}
                    >
                        Completed
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border">
                        <Loader2 className="animate-spin text-primary mb-4" size={48} />
                        <p className="text-text-secondary">Retrieving your medical consultations...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCases.map(caseParams => (
                            <AppointmentCard key={caseParams.id} data={caseParams} />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="text-center py-12 px-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-red-700 font-medium mb-2">Error Loading Appointments</p>
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchAppointments}>Try Again</Button>
                    </div>
                )}

                {!loading && !error && filteredCases.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-border">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-text-primary">No appointments found</h3>
                        <p className="text-text-secondary mb-6">{filter === 'ALL' ? 'Start a consultation to get medical advice.' : `No cases marked as ${filter.toLowerCase()}.`}</p>
                        {filter === 'ALL' && (
                            <Link href="/dashboard/appointments/book">
                                <Button variant="outline">Start Now</Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
