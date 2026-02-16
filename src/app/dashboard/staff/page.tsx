'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Video,
    Phone,
    Users,
    ClipboardList,
    MessageSquare,
    Calendar,
    TrendingUp,
    ShieldCheck,
    Clock,
    AlertCircle,
    ChevronRight,
    Loader2,
    ArrowLeft,
    Activity,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types/appointment';
import { IncomingCallModal } from '@/components/telemedicine/IncomingCallModal';
import { LiveCallScreen } from '@/components/telemedicine/LiveCallScreen';
import { PostCallReport } from '@/components/telemedicine/PostCallReport';
import { useAgora } from '@/hooks/useAgora';

export default function StaffPortalPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'URGENT' | 'MENTAL_HEALTH' | 'MATERNAL'>('ALL');
    const [activeTab, setActiveTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Telemedicine Call State
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [pendingCalls, setPendingCalls] = useState<any[]>([]);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [finishedCall, setFinishedCall] = useState<any>(null);
    const callStartTime = useRef<number | null>(null);
    const notificationAudio = useRef<HTMLAudioElement | null>(null);
    const [appId, setAppId] = useState('');
    const agora = useAgora(appId || null);

    const unlockAudio = () => {
        if (notificationAudio.current) {
            notificationAudio.current.play()
                .then(() => {
                    notificationAudio.current?.pause();
                    if (notificationAudio.current) notificationAudio.current.currentTime = 0;
                    setAudioEnabled(true);
                })
                .catch(e => console.warn('Audio unlock failed:', e));
        }
    };

    useEffect(() => {
        // Initialize audio
        notificationAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        notificationAudio.current.loop = false;
    }, []);

    useEffect(() => {
        if (incomingCall) {
            notificationAudio.current?.play().catch(e => console.warn('Audio play blocked:', e));
        }
    }, [incomingCall]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                console.log('Current Dashboard User:', { uid: user.id, role: profile?.role, profile });
            }
        };

        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/agora-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelName: 'config-fetch', uid: 0 })
                });
                const data = await response.json();
                if (data.appId) setAppId(data.appId);
            } catch (e) {
                console.warn('Failed to fetch Agora config:', e);
            }
        };

        // Initial fetch
        const initialFetch = async () => {
            await checkUser();
            await fetchConfig();
            await fetchAppointments();
            await fetchPendingCalls();
            await fetchCallHistory();
        };
        initialFetch();

        // Heartbeat refresh every 30 seconds
        const heartbeat = setInterval(() => {
            console.log('Heartbeat refresh...');
            fetchAppointments();
            fetchPendingCalls();
            fetchCallHistory();
        }, 30000);

        // Subscription for appointments
        const aptChannel = supabase
            .channel('appointments_change')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
                fetchAppointments();
            })
            .subscribe();

        // Subscription for telemedicine calls
        const callChannel = supabase
            .channel('telemedicine_calls_change')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'telemedicine_calls'
            }, (payload) => {
                console.log('Realtime INSERT:', payload);
                if (payload.new.status === 'pending') {
                    console.log('New pending call detected via Realtime');
                    fetchPendingCalls(); // Re-fetch to get joined data
                    setIncomingCall(payload.new);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'telemedicine_calls'
            }, (payload: any) => {
                console.log('Realtime UPDATE:', payload);
                fetchPendingCalls(); // Always refresh queue on any call update
                if (payload.new.status !== 'pending') {
                    setIncomingCall(null);
                }
            })
            .subscribe((status) => {
                console.log('Telemedicine Realtime Status:', status);
            });

        return () => {
            clearInterval(heartbeat);
            supabase.removeChannel(aptChannel);
            supabase.removeChannel(callChannel);
        };
    }, []);

    const fetchPendingCalls = async () => {
        try {
            console.log('Fetching pending calls...');
            const { data, error } = await supabase
                .from('telemedicine_calls')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Telemedicine Fetch Error:', error.message);
                return;
            }

            if (!data || data.length === 0) {
                setPendingCalls([]);
                return;
            }

            // Fetch patient profiles for these calls (same logic as appointments)
            const patientIds = Array.from(new Set(data.map(c => c.patient_id).filter(Boolean)));

            if (patientIds.length > 0) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, med_id')
                    .in('id', patientIds);

                const profileMap = (profileData || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {} as Record<string, any>);

                const callsWithPatients = data.map(call => ({
                    ...call,
                    patient: profileMap[call.patient_id] || null
                }));

                setPendingCalls(callsWithPatients);
                setLastUpdated(new Date());
            } else {
                setPendingCalls(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Unexpected error in fetchPendingCalls:', err);
        }
    };

    const fetchCallHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('telemedicine_calls')
                .select('*')
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching call history:', error);
                return;
            }

            if (data && data.length > 0) {
                // Fetch profiles separately to avoid join issues
                const patientIds = Array.from(new Set(data.map(c => c.patient_id)));
                const providerIds = Array.from(new Set(data.filter(c => c.provider_id).map(c => c.provider_id)));

                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, med_id')
                    .in('id', [...patientIds, ...providerIds]);

                const profileMap = (profiles || []).reduce((acc, p) => {
                    acc[p.id] = p;
                    return acc;
                }, {} as Record<string, any>);

                const callsWithProfiles = data.map(call => ({
                    ...call,
                    patient: profileMap[call.patient_id] || null,
                    provider: call.provider_id ? (profileMap[call.provider_id] || null) : null
                }));

                setCallHistory(callsWithProfiles);
                setLastUpdated(new Date());
            } else {
                setCallHistory([]);
            }
        } catch (err) {
            console.error('Unexpected error in fetchCallHistory:', err);
        }
    };

    const handleAcceptCall = async (call: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Update call status
            const { error: updateError } = await supabase
                .from('telemedicine_calls')
                .update({
                    status: 'active',
                    provider_id: user.id
                })
                .eq('id', call.id)
                .eq('status', 'pending'); // Ensure it hasn't been taken

            if (updateError) throw updateError;

            // 2. Prepare Agora
            if (!call.token) {
                alert('Call authorization token is missing. Please refresh the queue.');
                fetchPendingCalls();
                return;
            }

            setActiveCall(call);
            setIncomingCall(null);
            setPendingCalls(prev => prev.filter(c => c.id !== call.id));
            callStartTime.current = Date.now();

            // 3. Join the channel
            await agora.join(call.channel_name, call.token, Math.floor(Math.random() * 1000000), call.call_type);

        } catch (error: any) {
            console.error('Failed to accept call:', error);
            alert('Could not accept call. It may have been cancelled or taken by another professional.');
            setIncomingCall(null);
        }
    };

    const handleDeclineCall = async (callId: string) => {
        await supabase
            .from('telemedicine_calls')
            .update({ status: 'cancelled' })
            .eq('id', callId);

        setIncomingCall(null);
        setPendingCalls(prev => prev.filter(c => c.id !== callId));
    };

    const handleDismissCall = async (callId: string) => {
        try {
            await supabase
                .from('telemedicine_calls')
                .update({ status: 'cancelled' })
                .eq('id', callId);

            setPendingCalls(prev => prev.filter(c => c.id !== callId));
        } catch (err) {
            console.error('Failed to dismiss call:', err);
        }
    };

    const handleEndCall = async () => {
        const duration = callStartTime.current ? Math.floor((Date.now() - callStartTime.current) / 1000) : 0;

        setFinishedCall({
            ...activeCall,
            duration
        });

        await agora.leave();
        setActiveCall(null);
        callStartTime.current = null;
    };

    const handleSubmitReport = async (notes: string) => {
        if (!finishedCall) return;

        try {
            // 1. Generate AI Summary
            const response = await fetch('/api/telemedicine/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes,
                    callType: finishedCall.call_type
                })
            });
            const { summary } = await response.json();

            // 2. Update DB
            const { error } = await supabase
                .from('telemedicine_calls')
                .update({
                    status: 'completed',
                    duration: finishedCall.duration,
                    provider_notes: notes,
                    ai_summary: summary
                })
                .eq('id', finishedCall.id);

            if (error) throw error;

            setFinishedCall(null);
            fetchAppointments(); // Refresh queue
            fetchCallHistory(); // Refresh history
        } catch (error) {
            console.error('Failed to save report:', error);
            alert('Failed to save report. Please try again.');
        }
    };

    const handleDiscardReport = async () => {
        if (!finishedCall) return;

        try {
            // Update status to completed even if no notes were added
            // so it leaves the "active" state and shows in history
            await supabase
                .from('telemedicine_calls')
                .update({
                    status: 'completed',
                    duration: finishedCall.duration
                })
                .eq('id', finishedCall.id);

            setFinishedCall(null);
            fetchCallHistory();
        } catch (err) {
            console.error('Failed to discard/update call:', err);
            setFinishedCall(null);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // Fetch appointments - simplified query to avoid join issues
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select('*')
                .order('created_at', { ascending: false });

            if (aptError) {
                console.error('Error fetching appointments (apt):', JSON.stringify(aptError, null, 2));
                return;
            }

            if (!aptData || aptData.length === 0) {
                setAppointments([]);
                return;
            }

            // Fetch patient profiles for these appointments
            const patientIds = Array.from(new Set(aptData.map(a => a.user_id).filter(Boolean)));

            if (patientIds.length > 0) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', patientIds);

                if (profileError) {
                    console.error('Error fetching profiles:', JSON.stringify(profileError, null, 2));
                }

                // Map profiles back to appointments
                const profileMap = (profileData || []).reduce((acc: any, profile: any) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {} as Record<string, any>);

                const appointmentsWithPatients = aptData.map(apt => ({
                    ...apt,
                    patient: profileMap[apt.user_id] || null
                }));

                setAppointments(appointmentsWithPatients as any);
                setLastUpdated(new Date());
            } else {
                setAppointments(aptData as any);
                setLastUpdated(new Date());
            }

        } catch (error: any) {
            console.error('Unexpected error in fetchAppointments:', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return apt.status === 'PENDING';
        if (filter === 'URGENT') return apt.priority === 'URGENT' || apt.priority === 'HIGH';
        if (filter === 'MENTAL_HEALTH') return apt.category === 'mental-health';
        if (filter === 'MATERNAL') return apt.category === 'maternal';
        return true;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getCategoryBadge = (category?: string): React.ReactNode => {
        if (!category || typeof category !== 'string' || category === 'general') return null;
        if (category === 'mental-health') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-100 text-purple-700 border-purple-200">Mental Health</span>;
        if (category === 'maternal') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-pink-100 text-pink-700 border-pink-200">Maternal</span>;
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200">{category}</span>;
    }

    const getPatientName = (apt: Appointment): string => {
        if (!apt.patient) return 'Unknown Patient';

        const p = apt.patient as any;
        const name = p.full_name;
        if (typeof name === 'string' && name.trim()) return name;

        const first = typeof p.first_name === 'string' ? p.first_name : '';
        const last = typeof p.last_name === 'string' ? p.last_name : '';
        const combined = `${first} ${last}`.trim();

        return combined || 'Unknown Patient';
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">MedLud Professional</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Doctor&apos;s Dashboard</h1>
                        <p className="text-gray-500">Manage patient cases, consultations, and prescriptions.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className={`transition-all ${audioEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}
                            onClick={unlockAudio}
                        >
                            <Activity size={16} className="mr-2" />
                            {audioEnabled ? 'Audio Active' : 'Enable Audio'}
                        </Button>

                        <Link href="/dashboard">
                            <Button variant="outline" className="bg-white border-gray-200 text-gray-600 hover:text-primary transition-all">
                                <ArrowLeft size={16} className="mr-2" /> Switch to Patient View
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pending Review</p>
                            <p className="text-2xl font-bold text-gray-900">{appointments.filter(a => a.status === 'PENDING').length}</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                            <ClipboardList size={20} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Urgent Cases</p>
                            <p className="text-2xl font-bold text-gray-900">{appointments.filter(a => a.priority === 'URGENT' || a.priority === 'HIGH').length}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Today&apos;s Visits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {appointments.filter(a => {
                                    try {
                                        return new Date(a.date).toDateString() === new Date().toDateString();
                                    } catch (e) {
                                        return false;
                                    }
                                }).length}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {appointments.length > 0
                                    ? Math.round((appointments.filter(a => a.status === 'COMPLETED' || a.status === 'RESPONDED').length / appointments.length) * 100)
                                    : 0}%
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Appointment List */}
                    <div className="flex-1">
                        <div className="flex flex-col mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar size={20} className="text-primary" />
                                    {activeTab === 'QUEUE' ? 'Patient Queue' : 'Telemedicine History'}
                                </h2>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                    <button
                                        onClick={() => setActiveTab('QUEUE')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'QUEUE' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-primary'}`}
                                    >
                                        Queue
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('HISTORY')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-primary'}`}
                                    >
                                        History
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'QUEUE' && (
                                <div className="flex gap-2 flex-wrap mb-2">
                                    <button
                                        onClick={() => setFilter('ALL')}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('PENDING')}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => setFilter('URGENT')}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Urgent
                                    </button>
                                    <button
                                        onClick={() => setFilter('MENTAL_HEALTH')}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === 'MENTAL_HEALTH' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Mental Health
                                    </button>
                                    <button
                                        onClick={() => setFilter('MATERNAL')}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === 'MATERNAL' ? 'bg-pink-100 text-pink-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Maternal
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
                            {loading && activeTab === 'QUEUE' ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : activeTab === 'HISTORY' ? (
                                <div className="divide-y divide-gray-100">
                                    {callHistory.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 font-medium">
                                            No call history yet.
                                        </div>
                                    ) : (
                                        callHistory.map((call) => (
                                            <div key={call.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                        {call.patient?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{call.patient?.full_name || 'Patient'}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{new Date(call.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{call.call_type}</p>
                                                    <p className="text-[10px] text-gray-400">by {call.provider?.full_name || 'System'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : filteredAppointments.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <p>No appointments found in this category.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredAppointments.map((apt) => (
                                        <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 uppercase text-xs">
                                                    {(getPatientName(apt) as string).split(' ').filter(Boolean).map((n: string) => n[0]).join('') || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900">{getPatientName(apt)}</h3>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(apt.priority || 'MEDIUM')}`}>
                                                            {apt.priority || 'MEDIUM'}
                                                        </span>
                                                        {getCategoryBadge(apt.category)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-medium mb-0.5">{apt.title}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-md">{apt.description || apt.symptoms}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs font-medium text-gray-500 flex items-center justify-end gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(apt.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                                        <Clock size={12} />
                                                        {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/dashboard/staff/appointments/${apt.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            View <ChevronRight size={16} className="ml-1" />
                                                        </Button>
                                                    </Link>

                                                    {apt.status === 'PENDING' && !apt.doctor_id ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                const { data: { user } } = await supabase.auth.getUser();
                                                                if (!user) return;

                                                                const { error } = await supabase
                                                                    .from('appointments')
                                                                    .update({ doctor_id: user.id })
                                                                    .eq('id', apt.id)
                                                                    .is('doctor_id', null); // Atomic check to prevent double booking

                                                                if (error) {
                                                                    alert('Failed to accept case. It may have already been claimed.');
                                                                } else {
                                                                    router.push(`/dashboard/staff/appointments/${apt.id}`);
                                                                }
                                                            }}
                                                        >
                                                            Accept Case
                                                        </Button>
                                                    ) : (
                                                        <Link href={`/dashboard/staff/appointments/${apt.id}`}>
                                                            <Button size="sm" variant={apt.status === 'RESPONDED' ? 'outline' : 'primary'}>
                                                                {apt.status === 'RESPONDED' ? 'Summary' : 'Review'}
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar widgets */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Activity size={18} className="text-emerald-600" />
                                    Live Consultation Queue
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-gray-400 font-medium">
                                        Last sync: {lastUpdated instanceof Date ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                                    </div>
                                    <button
                                        onClick={fetchPendingCalls}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-primary"
                                        title="Refresh Queue"
                                    >
                                        <Clock size={16} className={loading && activeTab === 'QUEUE' ? 'animate-spin text-primary' : ''} />
                                    </button>
                                    {pendingCalls.length > 0 && (
                                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            {pendingCalls.length} Live
                                        </span>
                                    )}
                                </div>
                            </div>

                            {pendingCalls.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Video size={24} className="mx-auto text-gray-300 mb-2 opacity-50" />
                                    <p className="text-xs text-gray-400 font-medium">No incoming calls</p>
                                    <p className="text-[10px] text-gray-300">Queue is active and listening...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingCalls.map(call => (
                                        <div key={call.id} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm animate-in slide-in-from-right-4 duration-300">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-bold text-gray-900">{call.patient?.full_name || 'Patient'}</p>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{call.call_type} • PENDING</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    onClick={() => handleDismissCall(call.id)}
                                                    title="Dismiss Call"
                                                >
                                                    <XCircle size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-4 rounded-lg shadow-sm"
                                                    onClick={() => handleAcceptCall(call)}
                                                >
                                                    Join
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary" />
                                Recent Consultations
                            </h3>
                            <div className="space-y-4">
                                {appointments.slice(0, 3).map((apt, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-gray-300" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Update on {apt.title}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(apt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {appointments.length === 0 && <p className="text-xs text-gray-400">No recent activity.</p>}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-sm">
                                    <ClipboardList size={16} className="mr-2" /> Create New Report
                                </Button>
                                <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-sm">
                                    <Users size={16} className="mr-2" /> Search Patient Database
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Telemedicine Overlays */}
            {incomingCall && (
                <div onClick={() => notificationAudio.current?.play()}>
                    <IncomingCallModal
                        call={incomingCall}
                        onAccept={handleAcceptCall}
                        onDecline={handleDeclineCall}
                    />
                </div>
            )}

            {finishedCall && (
                <PostCallReport
                    call={finishedCall}
                    onSubmit={handleSubmitReport}
                    onDiscard={handleDiscardReport}
                />
            )}

            {activeCall && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col p-4 sm:p-8">
                    <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Video className="text-primary" />
                                Live Consultation
                            </h2>
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={handleEndCall}>
                                Minimize
                            </Button>
                        </div>
                        <LiveCallScreen
                            type={activeCall.call_type}
                            onEndCall={handleEndCall}
                            agora={agora}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
