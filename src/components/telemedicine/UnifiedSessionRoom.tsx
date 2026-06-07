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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [diagnosticDetails, setDiagnosticDetails] = useState<any>(null);
    const [fetchError, setFetchError] = useState<any>(null);
    
    const agora = useAgora(agoraDetails?.appId || null);

    const isStaff = userRole && ['doctor', 'nurse', 'admin', 'partner', 'mental-health', 'nurse-assistant'].includes(userRole);
    const returnUrl = isStaff ? '/saas/dashboard/telemedicine' : '/dashboard/telemedicine';

    useEffect(() => {
        const fetchConsultationAndRole = async () => {
            try {
                // Fetch user role
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, full_name, email')
                        .eq('id', user.id)
                        .single();
                    if (profile) {
                        setUserRole(profile.role);
                        setCurrentUser({ ...user, profile });
                    } else {
                        setCurrentUser(user);
                    }
                }

                // Fetch consultation
                const { data, error } = await supabase
                    .from('consultations')
                    .select('*')
                    .eq('id', consultationId)
                    .single();

                if (error) {
                    console.error('❌ [UnifiedSessionRoom] Error fetching consultation:', error);
                    setFetchError(error);

                    // Trigger server-side diagnostic lookup
                    try {
                        const res = await fetch(`/api/consultations/check?id=${consultationId}`);
                        const diag = await res.json();
                        setDiagnosticDetails(diag);
                    } catch (diagErr) {
                        console.error('Error fetching diagnostics:', diagErr);
                    }
                }

                if (data) {
                    setConsultation(data);
                    if (data.consultation_type === 'chat') {
                        setViewState('CHAT');
                    } else {
                        // For VIDEO or VOICE, initiate Agora token generation
                        initiateAgora(data);
                    }
                }
            } catch (err: any) {
                console.error('Error fetching session data:', err);
                setFetchError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchConsultationAndRole();
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

    const handleConnected = async () => {
        setViewState('LIVE');
        // Update both consultation and appointment status to active/ACTIVE
        await Promise.all([
            supabase.from('consultations').update({ status: 'active' }).eq('id', consultationId),
            supabase.from('appointments').update({ status: 'ACTIVE' }).eq('id', consultationId)
        ]);
    };

    const handleEndCall = async (transcript: string) => {
        await agora.leave();
        setViewState('SUMMARY');
        
        // Update both consultation and appointment status to completed/COMPLETED
        await Promise.all([
            supabase.from('consultations').update({ status: 'completed' }).eq('id', consultationId),
            supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', consultationId)
        ]);
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
        const handleLogout = async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
        };

        const isPermissionDenied = fetchError && 
            (fetchError.code === 'PGRST116' || fetchError.status === 406 || fetchError.status === 403) && 
            diagnosticDetails?.exists;

        return (
            <div className="max-w-xl mx-auto my-12 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-3">
                        {isPermissionDenied ? 'Access Denied to Session' : 'Consultation Not Found'}
                    </h2>
                    
                    <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                        {isPermissionDenied 
                            ? "This telemedicine session exists, but your currently logged-in account does not have permission to access it."
                            : "We couldn't retrieve the requested virtual consultation. The link may be broken or the session might not exist in this facility database."}
                    </p>

                    {/* Diagnostic Panels */}
                    <div className="space-y-4 mb-8 text-sm">
                        {/* Logged in User Card */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                                Currently Logged In
                            </span>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {currentUser?.profile?.full_name || 'Guest User'}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {currentUser?.email || 'No email associated'}
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 uppercase">
                                    {currentUser?.profile?.role || 'Guest'}
                                </span>
                            </div>
                        </div>

                        {/* Assigned Participants Card (if exists) */}
                        {diagnosticDetails?.exists && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-3">
                                    Assigned Session Participants
                                </span>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Patient (Required)</p>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                            {diagnosticDetails.patientName}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                            {diagnosticDetails.patientEmail}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Doctor (Required)</p>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                            {diagnosticDetails.doctorName}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                            {diagnosticDetails.doctorEmail}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                    <span>Type: <span className="font-medium text-zinc-800 dark:text-zinc-200 uppercase">{diagnosticDetails.consultationType}</span></span>
                                    <span>Status: <span className="font-medium text-zinc-800 dark:text-zinc-200 uppercase">{diagnosticDetails.status}</span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {isPermissionDenied && (
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition duration-150 shadow-sm"
                            >
                                Sign Out & Log In with Correct Account
                            </button>
                        )}
                        <Link href={returnUrl} className="w-full">
                            <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 transition duration-150">
                                Return to Telemedicine Dashboard
                            </button>
                        </Link>
                    </div>
                </div>
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
                onReturnHome={() => window.location.href = returnUrl} 
            />
        );
    }

    if (viewState === 'CONNECTING' && agoraDetails) {
        return (
            <ConnectingScreen
                onCancel={() => window.location.href = returnUrl}
                onConnected={handleConnected}
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
