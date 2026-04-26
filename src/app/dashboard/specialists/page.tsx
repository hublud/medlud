'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, HeartPulse, Brain, Baby, Activity, Eye, Bone, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TelemedicineHistory } from '@/components/telemedicine/TelemedicineHistory';
import { NewCaseForm } from '@/components/telemedicine/NewCaseForm';
import { TelemedicineHome } from '@/components/telemedicine/TelemedicineHome';
import { ConnectingScreen } from '@/components/telemedicine/ConnectingScreen';
import { LiveCallScreen } from '@/components/telemedicine/LiveCallScreen';
import { PostCallSummary } from '@/components/telemedicine/PostCallSummary';
import { Header } from '@/components/dashboard/Header';
import { useAgora } from '@/hooks/useAgora';
import { PaymentModal } from '@/components/telemedicine/PaymentModal';
import { useRouter } from 'next/navigation';

type CallState = 'HISTORY' | 'DIRECTORY' | 'NEW_CASE' | 'SELECTION' | 'CONNECTING' | 'LIVE' | 'SUMMARY';
type CallType = 'VIDEO' | 'VOICE';

const specialties = [
    { id: 'cardiology', name: 'Cardiology', icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'neurology', name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'pediatrics', name: 'Pediatrics', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'general', name: 'General Medicine', icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'orthopedics', name: 'Orthopedics', icon: Bone, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'ophthalmology', name: 'Ophthalmology', icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'psychiatry', name: 'Psychiatry', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function SpecialistsDirectoryPage() {
    const router = useRouter();
    const [viewState, setViewState] = useState<CallState>('HISTORY');
    const [callType, setCallType] = useState<CallType>('VIDEO');
    const [channelName, setChannelName] = useState('');
    const [token, setToken] = useState('');
    const [uid, setUid] = useState<number>(0);
    const [appId, setAppId] = useState('');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [patientBalance, setPatientBalance] = useState(0);
    const [patientEmail, setPatientEmail] = useState('');
    const [settings, setSettings] = useState<any>(null);
    
    const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null);

    const agora = useAgora(appId || '3671af6a0e094b8d9a440ce8f3482683'); // Use provided App ID if env not loaded yet

    useEffect(() => {
        const fetchUserDataAndSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setPatientEmail(user.email || '');
                const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
                if (profile) setPatientBalance(profile.wallet_balance || 0);
            }
            const { data: platformSettings } = await supabase.from('platform_settings').select('*').limit(1).single();
            if (platformSettings) {
                setSettings(platformSettings);
            }
        };
        fetchUserDataAndSettings();
    }, []);

    const handleInitiatePayment = (type: CallType) => {
        setCallType(type);
        setShowPaymentModal(true);
    };

    const startAgoraConnection = async (type: CallType, consultationId: string) => {
        setCallType(type);
        const name = `medlud-call-${Date.now()}`;
        const randomUid = Math.floor(Math.random() * 1000000);
        setChannelName(name);
        setUid(randomUid);
        setViewState('CONNECTING');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const response = await fetch('/api/agora-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName: name, uid: randomUid })
            });
            const data = await response.json();

            if (!data.token) {
                throw new Error('Failed to generate Agora token');
            }

            setToken(data.token);
            setAppId(data.appId);

            const { data: callData, error: dbError } = await supabase
                .from('telemedicine_calls')
                .insert([{
                    patient_id: user.id,
                    channel_name: name,
                    call_type: type,
                    status: 'pending',
                    token: data.token,
                    case_id: activeCaseId
                }])
                .select()
                .single();

            if (dbError) throw dbError;
            if (callData) setActiveCallId(callData.id);

        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Could not start call. Please try again.');
            setViewState('SELECTION');
        }
    };

    const handleCancelConnection = async () => {
        if (activeCallId) {
            await supabase
                .from('telemedicine_calls')
                .update({ status: 'cancelled' })
                .eq('id', activeCallId);
        }
        await agora.leave();
        setViewState('HISTORY');
    };

    const handleConnected = () => {
        setViewState('LIVE');
    };

    const handleEndCall = async (transcript: string) => {
        await agora.leave();
        setViewState('SUMMARY');

        if (activeCallId) {
            try {
                await supabase.from('telemedicine_calls')
                    .update({ status: 'completed', transcript: transcript || null })
                    .eq('id', activeCallId);

                if (transcript && transcript.trim().length > 0) {
                    const res = await fetch('/api/ai/telemedicine-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcript: transcript.trim() }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.data) {
                            await supabase.from('telemedicine_calls')
                                .update({ ai_summary: JSON.stringify(data.data) })
                                .eq('id', activeCallId);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to process call summary', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                {viewState !== 'LIVE' && (
                    <>
                        <div className="mb-2">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                            >
                                <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 shadow-sm transition-all">
                                    <ArrowLeft size={20} />
                                </div>
                                <span className="font-medium">Back to Dashboard</span>
                            </Link>
                        </div>
                        <Header />
                    </>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-border p-6 min-h-[70vh]">
                    {viewState === 'HISTORY' && (
                        <TelemedicineHistory 
                            isSpecialistMode={true}
                            onStartNewCase={() => setViewState('DIRECTORY')} 
                            onViewCase={(id) => router.push(`/dashboard/telemedicine/${id}`)}
                        />
                    )}

                    {viewState === 'DIRECTORY' && (
                        <div className="animate-in fade-in duration-500">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Select a Specialty</h2>
                                    <p className="text-gray-500 text-sm mt-1">Choose the department for your consultation</p>
                                </div>
                                <button onClick={() => setViewState('HISTORY')} className="text-sm text-text-secondary hover:text-primary flex items-center">
                                    ← Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {specialties.map((specialty) => (
                                    <div
                                        key={specialty.id}
                                        onClick={() => {
                                            setSelectedSpecialty(specialty);
                                            setViewState('NEW_CASE');
                                        }}
                                        className="bg-gray-50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group cursor-pointer h-full flex flex-col items-center text-center"
                                    >
                                        <div className={`${specialty.bg} ${specialty.color} p-4 rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                                            <specialty.icon size={32} />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900">{specialty.name}</h3>
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">Connect with a specialist in {specialty.name.toLowerCase()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewState === 'NEW_CASE' && selectedSpecialty && (
                        <div className="animate-in fade-in">
                            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg">
                                <Stethoscope size={18} />
                                <span className="font-bold">Creating case for {selectedSpecialty.name} Specialist</span>
                            </div>
                            <NewCaseForm 
                                specialtyType={selectedSpecialty.id}
                                onCancel={() => setViewState('DIRECTORY')} 
                                onSubmit={(data) => {
                                    setActiveCaseId(data.newCaseId);
                                    setViewState('SELECTION');
                                }} 
                            />
                        </div>
                    )}

                    {viewState === 'SELECTION' && (
                        <div className="max-w-2xl mx-auto">
                            <TelemedicineHome 
                                title={`${selectedSpecialty?.name || "Specialist"} Consultation`}
                                onStartCall={handleInitiatePayment} 
                                prices={{ 
                                    video: settings?.specialist_video_price || 15000, 
                                    chat: settings?.specialist_chat_price || 12000 
                                }}
                                onBack={() => setViewState('NEW_CASE')}
                            />
                        </div>
                    )}

                    {showPaymentModal && (
                        <PaymentModal
                            isOpen={showPaymentModal}
                            onClose={() => setShowPaymentModal(false)}
                            patientBalance={patientBalance}
                            patientEmail={patientEmail}
                            doctor={{
                                id: null, // General pool for this specialty
                                full_name: `${selectedSpecialty?.name || 'Specialist'} Expert`,
                                selectedType: callType === 'VIDEO' ? 'video' : 'chat',
                                price: callType === 'VIDEO' 
                                    ? (settings?.specialist_video_price || 15000) 
                                    : (settings?.specialist_chat_price || 12000),
                                specialty_type: selectedSpecialty?.id || 'general'
                            }}
                            onSuccess={(consultationId) => {
                                setShowPaymentModal(false);
                                startAgoraConnection(callType, consultationId);
                            }}
                        />
                    )}

                    {viewState === 'CONNECTING' && (
                        <ConnectingScreen
                            onCancel={handleCancelConnection}
                            onConnected={handleConnected}
                            channelName={channelName}
                            token={token}
                            uid={uid}
                            type={callType}
                            agora={agora}
                        />
                    )}

                    {viewState === 'LIVE' && (
                        <LiveCallScreen
                            type={callType}
                            onEndCall={handleEndCall}
                            agora={agora}
                        />
                    )}

                    {viewState === 'SUMMARY' && (
                        <PostCallSummary
                            callId={activeCallId || ''}
                            onReturnHome={() => {
                                setActiveCallId(null);
                                setViewState('HISTORY');
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
