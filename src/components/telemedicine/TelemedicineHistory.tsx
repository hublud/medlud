'use client';

import React, { useEffect, useState } from 'react';
import { Box, FileText, Video, Phone, ChevronRight, PlusCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import moment from 'moment';

interface TelemedicineHistoryProps {
    onStartNewCase: () => void;
    onViewCase: (caseId: string) => void;
    specialtyType?: string;
    isSpecialistMode?: boolean;
}

export const TelemedicineHistory: React.FC<TelemedicineHistoryProps> = ({ onStartNewCase, onViewCase, specialtyType, isSpecialistMode }) => {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCases() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch cases and related calls
                let query = supabase
                    .from('telemedicine_cases')
                    .select(`
                        id, title, status, created_at, doctor_id, description, specialty_type,
                        doctor:profiles!telemedicine_cases_doctor_id_fkey(full_name),
                        calls:telemedicine_calls(id, call_type, status, duration)
                    `)
                    .eq('patient_id', user.id)
                    .order('created_at', { ascending: false });

                if (specialtyType) {
                    query = query.eq('specialty_type', specialtyType);
                } else if (isSpecialistMode) {
                    query = query.not('specialty_type', 'is', null);
                } else {
                    query = query.is('specialty_type', null);
                }

                const { data, error } = await query;

                if (error) throw error;
                setCases(data || []);
            } catch (error) {
                console.error('Error fetching cases:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto text-left animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-border">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Telemedicine Cases</h2>
                    <p className="text-text-secondary mt-1">Manage your online consultations and history</p>
                </div>
                <Button onClick={onStartNewCase} className="mt-4 sm:mt-0 shadow-lg shadow-primary/20 hidden sm:flex">
                    <PlusCircle size={18} className="mr-2" />
                    Start New Case
                </Button>
            </div>

            {cases.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-white w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-sm mb-4">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Consultation History</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">You haven't had any telemedicine sessions yet. Start a new case to connect with a doctor.</p>
                    <Button onClick={onStartNewCase} className="shadow-lg shadow-primary/20">
                        <PlusCircle size={18} className="mr-2" />
                        Start New Case
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map((c) => (
                        <div key={c.id} onClick={() => onViewCase(c.id)} className="bg-white border border-border p-5 rounded-xl hover:shadow-md cursor-pointer hover:border-primary/40 transition-all flex flex-col justify-between group">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-text-primary truncate pr-2">{c.title}</h3>
                                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                        c.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                                    {c.description}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 mt-auto">
                                    <CalendarIcon size={14} className="mr-1.5" />
                                    <span className="text-gray-500 font-medium">
                                        {new Date(c.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center text-sm font-medium text-gray-700">
                                    {c.doctor ? (
                                        <>Assigned to {c.doctor.full_name}</>
                                    ) : (
                                        <span className="text-gray-400 italic">Waiting for assignment</span>
                                    )}
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-6 sm:hidden">
                <Button onClick={onStartNewCase} className="w-full h-14 rounded-xl shadow-lg shadow-primary/20 text-lg">
                    <PlusCircle size={20} className="mr-2" />
                    Start New Case
                </Button>
            </div>
        </div>
    );
};
