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

type CallState = 'HOME' | 'CONNECTING' | 'LIVE' | 'SUMMARY';
type CallType = 'VIDEO' | 'VOICE';

export default function TelemedicinePage() {
    const [viewState, setViewState] = useState<CallState>('HOME');
    const [callType, setCallType] = useState<CallType>('VIDEO');
    const [channelName, setChannelName] = useState('');
    const [token, setToken] = useState('');
    const [uid, setUid] = useState<number>(0);
    const [appId, setAppId] = useState('');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);

    const agora = useAgora(appId || '3671af6a0e094b8d9a440ce8f3482683'); // Use provided App ID if env not loaded yet

    const handleStartCall = async (type: CallType) => {
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
                    token: data.token
                }])
                .select()
                .single();

            if (dbError) throw dbError;
            if (callData) setActiveCallId(callData.id);

        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Could not start call. Please try again.');
            setViewState('HOME');
        }
    };

    const handleCancelConnection = async () => {
        await agora.leave();
        setViewState('HOME');
    };

    const handleConnected = () => {
        setViewState('LIVE');
    };

    const handleEndCall = async () => {
        await agora.leave();
        setViewState('SUMMARY');
    };

    const handleReturnHome = () => {
        setViewState('HOME');
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
                    {viewState === 'HOME' && (
                        <TelemedicineHome onStartCall={handleStartCall} />
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
