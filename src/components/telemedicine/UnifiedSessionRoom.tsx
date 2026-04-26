'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgora } from '@/hooks/useAgora';
import { LiveCallScreen } from './LiveCallScreen';
import { ConnectingScreen } from './ConnectingScreen';
import { ChatSessionRoom } from './ChatSessionRoom';
import { PostCallSummary } from './PostCallSummary';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UnifiedSessionRoomProps {
    consultationId: string;
}

export const UnifiedSessionRoom: React.FC<UnifiedSessionRoomProps> = ({ consultationId }) => {
    const [consultation, setConsultation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<'CONNECTING' | 'LIVE' | 'SUMMARY' | 'CHAT'>('CONNECTING');
    const [agoraDetails, setAgoraDetails] = useState<{ token: string; appId: string; channelName: string; uid: number } | null>(null);
    
    const agora = useAgora(agoraDetails?.appId || null);

    useEffect(() => {
        const fetchConsultation = async () => {
            const { data, error } = await supabase
                .from('consultations')
                .select('*')
                .eq('id', consultationId)
                .single();

            if (data) {
                setConsultation(data);
                if (data.consultation_type === 'chat') {
                    setViewState('CHAT');
                } else {
                    // For VIDEO or VOICE, initiate Agora token generation
                    initiateAgora(data);
                }
            }
            setLoading(false);
        };

        fetchConsultation();
    }, [consultationId]);

    const initiateAgora = async (cons: any) => {
        try {
            const channelName = cons.channel_name || `medlud-session-${cons.id}`;
            const randomUid = Math.floor(Math.random() * 1000000);

            const response = await fetch('/api/agora-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName, uid: randomUid })
            });
            const data = await response.json();

            if (data.token) {
                setAgoraDetails({
                    token: data.token,
                    appId: data.appId,
                    channelName: channelName,
                    uid: randomUid
                });
            }
        } catch (error) {
            console.error('Failed to initiate Agora:', error);
        }
    };

    const handleEndCall = async (transcript: string) => {
        await agora.leave();
        setViewState('SUMMARY');
        
        // Update consultation status
        await supabase.from('consultations').update({ status: 'completed' }).eq('id', consultationId);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-text-secondary">Loading your consultation session...</p>
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">Consultation not found.</p>
                <Link href="/dashboard/telemedicine">
                    <button className="text-primary font-medium hover:underline flex items-center justify-center mx-auto">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Telemedicine
                    </button>
                </Link>
            </div>
        );
    }

    if (viewState === 'CHAT') {
        return <ChatSessionRoom consultationId={consultationId} />;
    }

    if (viewState === 'SUMMARY') {
        return (
            <PostCallSummary 
                callId={consultationId} // Usually mapped to call_id, but here we use consultationId context
                onReturnHome={() => window.location.href = '/dashboard/telemedicine'} 
            />
        );
    }

    if (viewState === 'CONNECTING' && agoraDetails) {
        return (
            <ConnectingScreen
                onCancel={() => window.location.href = '/dashboard/telemedicine'}
                onConnected={() => setViewState('LIVE')}
                channelName={agoraDetails.channelName}
                token={agoraDetails.token}
                uid={agoraDetails.uid}
                type={consultation.consultation_type === 'video' || consultation.consultation_type === 'VIDEO' ? 'VIDEO' : 'VOICE'}
                agora={agora}
            />
        );
    }

    if (viewState === 'LIVE') {
        return (
            <LiveCallScreen
                type={consultation.consultation_type === 'video' || consultation.consultation_type === 'VIDEO' ? 'VIDEO' : 'VOICE'}
                onEndCall={handleEndCall}
                agora={agora}
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-text-secondary">Preparing your {consultation.consultation_type} session...</p>
        </div>
    );
};
