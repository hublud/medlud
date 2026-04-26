'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PaymentModal } from '@/components/telemedicine/PaymentModal';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';




interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    specialty_type: string;
    specialist_price_chat: number | null;
    specialist_price_video: number | null;
}

interface SelectedDoctor extends Doctor {
    selectedType: 'chat' | 'video';
    price: number;
}

export const SpecialistList: React.FC<{ specialty: string }> = ({ specialty }) => {
    const { profile } = useAuth();
    const { settings: platformSettings, loading: settingsLoading } = usePlatformSettings();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<SelectedDoctor | null>(null);

    useEffect(() => {
        async function loadData() {
            // 2. Fetch doctors for this specialty
            const { data, error } = await supabase

                .from('doctors')
                .select(`
          id, 
          specialization, 
          specialty_type,
          specialist_price_chat,
          specialist_price_video,
          profiles:id (full_name)
        `)
                .eq('specialty_type', specialty);

            if (data) {
                // Flatten the data shape for easier mapping
                const formatted = data.map((d: any) => ({
                    ...d,
                    full_name: d.profiles?.full_name || 'Anonymous Doctor'
                }));
                setDoctors(formatted);
            }
            setLoading(false);
        }
        loadData();
    }, [specialty]);

    if (loading) return <div className="text-center py-8">Loading specialists...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {doctors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-gray-500">No specialists found for {specialty}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map(doctor => {
                        const chatPrice = doctor.specialist_price_chat || platformSettings?.specialist_chat_price || 12000;
                        const videoPrice = doctor.specialist_price_video || platformSettings?.specialist_video_price || 15000;


                        return (
                            <div key={doctor.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-emerald-500/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Dr. {doctor.full_name}</h3>
                                        <p className="text-emerald-600 font-medium text-sm">{doctor.specialization || specialty}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => setSelectedDoctor({ ...doctor, selectedType: 'chat', price: chatPrice })}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Voice ₦{chatPrice}
                                    </button>
                                    <button
                                        onClick={() => setSelectedDoctor({ ...doctor, selectedType: 'video', price: videoPrice })}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Video ₦{videoPrice}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedDoctor && (
                <PaymentModal
                    isOpen={true}
                    onClose={() => setSelectedDoctor(null)}
                    doctor={selectedDoctor}
                    patientBalance={profile?.wallet_balance || 0}
                    patientEmail={profile?.email || ''}
                    onSuccess={(id) => {
                        setSelectedDoctor(null);
                        window.location.href = `/dashboard/telemedicine/session/${id}`;
                    }}
                />
            )}
        </div>
    );
};
