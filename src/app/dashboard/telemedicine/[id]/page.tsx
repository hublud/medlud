'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/dashboard/Header';
import { ArrowLeft, FileText, Calendar, Clock, Download, Video, Phone, Loader2, Hospital, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import moment from 'moment';
import Link from 'next/link';
import { PaymentModal } from '@/components/telemedicine/PaymentModal';
import { ConnectingScreen } from '@/components/telemedicine/ConnectingScreen';
import { LiveCallScreen } from '@/components/telemedicine/LiveCallScreen';
import { PostCallSummary } from '@/components/telemedicine/PostCallSummary';
import { useAgora } from '@/hooks/useAgora';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';


type PageView = 'DETAILS' | 'CONNECTING' | 'LIVE' | 'SUMMARY';
type CallType = 'VIDEO' | 'VOICE';

export default function CaseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<any>(null);
    const [pageView, setPageView] = useState<PageView>('DETAILS');

    // Payment & call state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingCallType, setPendingCallType] = useState<CallType>('VIDEO');
    const [patientBalance, setPatientBalance] = useState(0);
    const [patientEmail, setPatientEmail] = useState('');
    const { settings: platformSettings } = usePlatformSettings();

    const isSpecialistCase = !!caseData?.specialty_type;
    const prices = {
        video: isSpecialistCase 
            ? (platformSettings?.specialist_video_price || 15000) 
            : (platformSettings?.video_price || 8000),
        chat: isSpecialistCase 
            ? (platformSettings?.specialist_chat_price || 12000) 
            : (platformSettings?.chat_price || 7000)
    };


    // Agora state
    const [appId] = useState('3671af6a0e094b8d9a440ce8f3482683');
    const [channelName, setChannelName] = useState('');
    const [token, setToken] = useState('');
    const [uid, setUid] = useState<number>(0);
    const [callType, setCallType] = useState<CallType>('VIDEO');
    const [activeCallId, setActiveCallId] = useState<string | null>(null);

    const agora = useAgora(appId);

    useEffect(() => {
        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/login'); return; }

                setPatientEmail(user.email || '');

                // Fetch profile balance
                const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
                if (profile) setPatientBalance(profile.wallet_balance || 0);

                // Fetch case details

                const { data, error } = await supabase
                    .from('telemedicine_cases')
                    .select(`
                        *,
                        doctor:profiles!telemedicine_cases_doctor_id_fkey(full_name),
                        calls:telemedicine_calls(
                            id, call_type, status, duration, created_at,
                            provider_notes, ai_summary, lab_test_required, 
                            required_lab_tests, lab_request_url, diagnosis_notes, treatment_instructions
                        )
                    `)
                    .eq('id', caseId)
                    .single();

                if (error) throw error;
                setCaseData(data as any);
            } catch (err) {

                console.error('Error fetching case:', err);
            } finally {
                setLoading(false);
            }
        }
        if (caseId) init();
    }, [caseId, router]);

    const handleInitiatePayment = (type: CallType) => {
        setPendingCallType(type);
        setShowPaymentModal(true);
    };

    const startAgoraConnection = async (type: CallType) => {
        setCallType(type);
        const name = `medlud-call-${Date.now()}`;
        const randomUid = Math.floor(Math.random() * 1000000);
        setChannelName(name);
        setUid(randomUid);
        setPageView('CONNECTING');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const res = await fetch('/api/agora-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName: name, uid: randomUid })
            });
            const data = await res.json();
            if (!data.token) throw new Error('Failed to get token');
            setToken(data.token);

            const { data: callData, error: dbError } = await supabase
                .from('telemedicine_calls')
                .insert([{
                    patient_id: user.id,
                    channel_name: name,
                    call_type: type,
                    status: 'pending',
                    token: data.token,
                    case_id: caseId
                }])
                .select()
                .single();

            if (dbError) throw dbError;
            if (callData) setActiveCallId(callData.id);
        } catch (err) {
            console.error('Failed to start call:', err);
            alert('Could not start call. Please try again.');
            setPageView('DETAILS');
        }
    };

    const handleCancelConnection = async () => {
        if (activeCallId) {
            await supabase.from('telemedicine_calls').update({ status: 'cancelled' }).eq('id', activeCallId);
        }
        await agora.leave();
        setPageView('DETAILS');
    };

    const handleEndCall = async (transcript: string) => {
        await agora.leave();
        setPageView('SUMMARY');
        if (activeCallId) {
            try {
                await supabase.from('telemedicine_calls')
                    .update({ status: 'completed', transcript: transcript || null })
                    .eq('id', activeCallId);

                if (transcript?.trim().length > 0) {
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
            } catch (err) {
                console.error('Post-call error:', err);
            }
        }
    };

    const handleReturnToDetails = () => {
        setActiveCallId(null);
        setPageView('DETAILS');
        // Refresh case data to show new completed call
        setLoading(true);
        supabase.from('telemedicine_cases').select(`*, doctor:profiles!telemedicine_cases_doctor_id_fkey(full_name), calls:telemedicine_calls(id, call_type, status, duration, created_at, provider_notes, ai_summary, lab_test_required, required_lab_tests, lab_request_url, diagnosis_notes, treatment_instructions)`).eq('id', caseId).single().then(({ data }) => {
            if (data) setCaseData(data);
            setLoading(false);
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-20 flex flex-col">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full flex-grow">
                    <Header />
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-primary" size={48} />
                    </div>
                </div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="min-h-screen bg-background pb-20 flex flex-col">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full flex-grow">
                    <Header />
                    <div className="text-center py-20 bg-white rounded-2xl border border-border">
                        <h2 className="text-2xl font-bold mb-2">Case Not Found</h2>
                        <p className="text-text-secondary mb-6">The consultation case you are looking for does not exist or you don't have access to it.</p>
                        <Button onClick={() => router.push('/dashboard/telemedicine')}>Back to Telemedicine</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Full-screen call views
    if (pageView === 'CONNECTING') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <ConnectingScreen
                    onCancel={handleCancelConnection}
                    onConnected={() => setPageView('LIVE')}
                    channelName={channelName}
                    token={token}
                    uid={uid}
                    type={callType}
                    agora={agora}
                />
            </div>
        );
    }

    if (pageView === 'LIVE') {
        return (
            <LiveCallScreen
                type={callType}
                onEndCall={handleEndCall}
                agora={agora}
            />
        );
    }

    if (pageView === 'SUMMARY') {
        return (
            <div className="min-h-screen bg-background pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <Header />
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mt-4">
                        <PostCallSummary
                            callId={activeCallId || ''}
                            onReturnHome={handleReturnToDetails}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const { doctor, calls } = caseData;
    const completedCalls = calls?.filter((c: any) => c.status === 'completed') || [];
    const isActive = caseData.status === 'active';
    const isSpecialist = !!caseData.specialty_type;
    const backHref = isSpecialist ? '/dashboard/specialists' : '/dashboard/telemedicine';
    const backLabel = isSpecialist ? 'Back to Specialists' : 'Back to Telemedicine';

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="mb-2">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 shadow-sm transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium">{backLabel}</span>
                    </Link>
                </div>

                <Header />

                <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b border-gray-100">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-text-primary">{caseData.title}</h1>
                                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                    caseData.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {caseData.status}
                                </span>
                            </div>
                            <div className="text-text-secondary text-sm flex items-center gap-4">
                                <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Created {moment(caseData.created_at).format('MMM D, YYYY')}</span>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 min-w-[200px]">
                            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Assigned Doctor</p>
                            {doctor ? (
                                <div>
                                    <p className="font-bold text-gray-900">{doctor.full_name}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Pending Assignment...</p>
                            )}
                        </div>
                    </div>

                    {/* ── START NEW CONSULTATION SESSION ── */}
                    {isActive && (
                        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900">Start a Consultation Session</h3>
                                    <p className="text-sm text-indigo-700 mt-1">Connect with a doctor for this case via video or voice call.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleInitiatePayment('VIDEO')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                    >
                                        <Video size={16} className="mr-2" />
                                        Video Call
                                        <span className="ml-2 text-xs font-normal opacity-80">₦{prices.video.toLocaleString()}</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleInitiatePayment('VOICE')}
                                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <Phone size={16} className="mr-2" />
                                        Voice Call
                                        <span className="ml-2 text-xs font-normal opacity-60">₦{prices.chat.toLocaleString()}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            {/* Description Section */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center">
                                    <FileText size={16} className="mr-2 text-primary" /> Case Description
                                </h3>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{caseData.description}</p>
                                </div>
                            </section>

                            {/* Consultations Feed */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                                    <Clock size={16} className="mr-2 text-primary" /> Consultation Sessions
                                </h3>
                                
                                {completedCalls.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">No completed sessions yet. Start a consultation using the buttons above.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {completedCalls.map((call: any, idx: number) => {
                                            let parsedAiSummary: any = null;
                                            if (call.ai_summary) {
                                                try {
                                                    parsedAiSummary = typeof call.ai_summary === 'string' ? JSON.parse(call.ai_summary) : call.ai_summary;
                                                } catch (e) {
                                                    parsedAiSummary = null;
                                                }
                                            }

                                            return (
                                                <div key={call.id} className="relative pl-6 pb-6 border-l-2 border-gray-200 last:border-0 last:pb-0">
                                                    <div className="absolute w-4 h-4 rounded-full bg-primary -left-[9px] top-1 border-4 border-white shadow-sm" />
                                                    
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session {completedCalls.length - idx}</span>
                                                                <h4 className="font-bold text-lg text-gray-900">{moment(call.created_at).format('MMMM Do YYYY, h:mm a')}</h4>
                                                            </div>
                                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{call.call_type} • {call.duration}s</span>
                                                        </div>

                                                        {call.diagnosis_notes && (
                                                            <div className="mb-4">
                                                                <h5 className="text-xs font-bold text-gray-700 uppercase mb-1">Official Diagnosis</h5>
                                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{call.diagnosis_notes}</p>
                                                            </div>
                                                        )}

                                                        {call.treatment_instructions && (
                                                            <div className="mb-4">
                                                                <h5 className="text-xs font-bold text-gray-700 uppercase mb-1">Treatment & Prescriptions</h5>
                                                                <div className="text-sm text-gray-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                                                                    <p className="whitespace-pre-wrap">{call.treatment_instructions}</p>
                                                                    <div className="mt-3 text-right">
                                                                        <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open(`/dashboard/telemedicine/print/prescription/${call.id}`, '_blank')}>
                                                                            <Download size={14} className="mr-2" /> Print Prescription
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {parsedAiSummary && typeof parsedAiSummary === 'object' && !call.diagnosis_notes && (
                                                            <div className="mb-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                                                                <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">AI Summary</h5>
                                                                <div className="space-y-2 text-sm text-gray-700">
                                                                    {parsedAiSummary.case_summary && <p><span className="font-semibold">Summary:</span> {parsedAiSummary.case_summary}</p>}
                                                                    {parsedAiSummary.possible_diagnosis && <p><span className="font-semibold">Possible Diagnosis:</span> {parsedAiSummary.possible_diagnosis}</p>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {call.lab_test_required && (
                                                            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Hospital size={16} className="text-orange-600" />
                                                                        <h5 className="text-sm font-bold text-orange-900">Lab Test Requested</h5>
                                                                    </div>
                                                                    <p className="text-sm text-orange-800 whitespace-pre-wrap">{call.required_lab_tests}</p>
                                                                </div>
                                                                <div>
                                                                    <Button variant="outline" size="sm" className="bg-white hover:bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-300 w-full" onClick={() => window.open(`/dashboard/telemedicine/print/lab-request/${call.id}`, '_blank')}>
                                                                        <Download size={14} className="mr-2" />
                                                                        Print Request
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Uploaded Attachment */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Attached Documents</h3>
                                {caseData.attachment_url ? (
                                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center truncate mr-2">
                                            <FileText size={18} className="text-blue-500 mr-2 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 truncate">Attachment</span>
                                        </div>
                                        <a href={caseData.attachment_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-md transition-colors">
                                            <Download size={16} />
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No files attached to this case.</p>
                                )}
                            </div>

                            {/* Case info */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Case Info</h3>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Sessions</span>
                                        <span className="font-bold">{completedCalls.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created</span>
                                        <span className="font-bold">{moment(caseData.created_at).format('MMM D, YYYY')}</span>
                                    </div>
                                    {caseData.specialty_type && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Specialty</span>
                                            <span className="font-bold capitalize">{caseData.specialty_type}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    patientBalance={patientBalance}
                    patientEmail={patientEmail}
                    doctor={{
                        id: caseData.doctor?.id || null,
                        full_name: caseData.doctor?.full_name || 'Available Doctor',
                        selectedType: pendingCallType === 'VIDEO' ? 'video' : 'chat',
                        price: pendingCallType === 'VIDEO' ? prices.video : prices.chat,
                        specialty_type: caseData.specialty_type || 'General Telemedicine'
                    }}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        startAgoraConnection(pendingCallType);
                    }}
                />
            )}
        </div>
    );
}
