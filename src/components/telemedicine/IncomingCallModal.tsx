import React, { useEffect, useState } from 'react';
import { Phone, Video, PhoneOff, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface IncomingCallModalProps {
    call: {
        id: string;
        patient_id: string;
        call_type: 'VIDEO' | 'VOICE';
        channel_name: string;
        token: string;
        profiles?: {
            full_name: string;
            avatar_url: string;
        };
    };
    onAccept: (call: any) => void;
    onDecline: (callId: string) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ call, onAccept, onDecline }) => {
    const [patientName, setPatientName] = useState('Patient');

    useEffect(() => {
        async function fetchPatientName() {
            if (call.profiles?.full_name) {
                setPatientName(call.profiles.full_name);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', call.patient_id)
                .single();

            if (data?.full_name) {
                setPatientName(data.full_name);
            }
        }

        fetchPatientName();
    }, [call]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-primary/10 p-8 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                            <User size={48} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-gray-900">{patientName}</h3>
                        <p className="text-primary font-medium flex items-center justify-center gap-2">
                            <Bell size={16} className="animate-bounce" />
                            Incoming {call.call_type === 'VIDEO' ? 'Video' : 'Voice'} Call
                        </p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onDecline(call.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                            <PhoneOff size={24} className="text-red-500" />
                        </div>
                        <span className="text-sm font-semibold">Decline</span>
                    </button>

                    <button
                        onClick={() => onAccept(call)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary hover:bg-primary-dark text-white transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 shadow-sm">
                            {call.call_type === 'VIDEO' ? <Video size={24} /> : <Phone size={24} />}
                        </div>
                        <span className="text-sm font-semibold">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
