'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TelemedicineHome } from '@/components/telemedicine/TelemedicineHome';
import { ConnectingScreen } from '@/components/telemedicine/ConnectingScreen';
import { LiveCallScreen } from '@/components/telemedicine/LiveCallScreen';
import { PostCallSummary } from '@/components/telemedicine/PostCallSummary';
import { Header } from '@/components/dashboard/Header';
import { useAgora } from '@/hooks/useAgora';
import { PaymentModal } from '@/components/telemedicine/PaymentModal';
import { TelemedicineHistory } from '@/components/telemedicine/TelemedicineHistory';
import { NewCaseForm } from '@/components/telemedicine/NewCaseForm';
import { useRouter } from 'next/navigation';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';


type CallState = 'HISTORY' | 'NEW_CASE' | 'SELECTION' | 'CONNECTING' | 'LIVE' | 'SUMMARY';
type CallType = 'VIDEO' | 'VOICE';

export default function TelemedicinePage() {
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
    const { settings: platformSettings } = usePlatformSettings();

    const prices = {
        video: platformSettings?.video_price || 8000,
        chat: platformSettings?.chat_price || 7000
    };


    const agora = useAgora(appId || '3671af6a0e094b8d9a440ce8f3482683'); // Use provided App ID if env not loaded yet

    React.useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setPatientEmail(user.email || '');
                const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
                if (profile) setPatientBalance(profile.wallet_balance || 0);
            }
        };
        fetchUserData();
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
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 2. Get Agora token first
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

            // 3. Insert call record into database WITH the token
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
                // Update basic call status and raw transcript first
                await supabase.from('telemedicine_calls')
                    .update({ status: 'completed', transcript: transcript || null })
                    .eq('id', activeCallId);

                if (transcript && transcript.trim().length > 0) {
                    // Fetch AI Summary
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

    const handleReturnHome = () => {
        setViewState('HISTORY');
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Only show standard header/nav when not in live call to reduce distractions */}
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
                            onStartNewCase={() => setViewState('NEW_CASE')} 
                            onViewCase={(id) => router.push(`/dashboard/telemedicine/${id}`)}
                        />
                    )}

                    {viewState === 'NEW_CASE' && (
                        <NewCaseForm 
                            onCancel={() => setViewState('HISTORY')} 
                            onSubmit={(data) => {
                                setActiveCaseId(data.newCaseId);
                                setViewState('SELECTION');
                            }} 
                        />
                    )}

                    {viewState === 'SELECTION' && (
                        <div className="max-w-2xl mx-auto">
                            <button onClick={() => setViewState('NEW_CASE')} className="text-sm text-text-secondary hover:text-primary mb-4 flex items-center">
                                ← Back
                            </button>
                            <TelemedicineHome onStartCall={handleInitiatePayment} />
                        </div>
                    )}

                    {showPaymentModal && (
                        <PaymentModal
                            isOpen={showPaymentModal}
                            onClose={() => setShowPaymentModal(false)}
                            patientBalance={patientBalance}
                            patientEmail={patientEmail}
                            doctor={{
                                id: null, // General pool consultation
                                full_name: 'Available Expert',
                                selectedType: callType === 'VIDEO' ? 'video' : 'chat',
                                price: callType === 'VIDEO' ? prices.video : prices.chat,
                                specialty_type: 'General Telemedicine'
                            }}
                            onSuccess={(consultationId) => {
                                setShowPaymentModal(false);
                                router.push(`/dashboard/telemedicine/session/${consultationId}`);
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
                                handleReturnHome();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
