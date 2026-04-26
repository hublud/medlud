'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Clock, AlertCircle, Video, Loader2, Info, X as CloseIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { calculateAge } from '@/utils/dateUtils';

export const ChatSessionRoom: React.FC<{ consultationId: string }> = ({ consultationId }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEscalating, setIsEscalating] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [messageCount, setMessageCount] = useState<number>(0);
    const [settings, setSettings] = useState<any>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function initSession() {
            // Load platform settings for logic limits
            const { data: platformSettings } = await supabase.from('platform_settings').select('*').single();
            setSettings(platformSettings);

            // Load Consultation
            const { data: consultation } = await supabase
                .from('consultations')
                .select(`
          *,
          doctor:doctor_id(profiles(full_name)),
          patient:user_id(email, full_name, date_of_birth, known_conditions, allergies)
        `)
                .eq('id', consultationId)
                .single();

            setSession(consultation);

            // Initialize State Machine (Set to In-Progress if it was Active)
            if (consultation?.status === 'active') {
                const startedAt = new Date().toISOString();
                await supabase.from('consultations').update({
                    status: 'in-progress',
                    started_at: startedAt
                }).eq('id', consultationId);
                setSession({ ...consultation, status: 'in-progress', started_at: startedAt });
            }

            // Load Messages
            const { data: initialMessages } = await supabase
                .from('session_messages')
                .select('*')
                .eq('consultation_id', consultationId)
                .order('created_at', { ascending: true });

            if (initialMessages) {
                setMessages(initialMessages);
                setMessageCount(initialMessages.filter(m => m.sender_id === consultation?.user_id).length);
            }

            setLoading(false);
        }

        initSession();

        // Setup Realtime subscription on messages
        const channel = supabase
            .channel(`consultation_${consultationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'session_messages',
                filter: `consultation_id=eq.${consultationId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_id === session?.user_id) {
                    setMessageCount(prev => prev + 1);
                }
            })
            .subscribe();

        // 2. Subscription for consultation status changes (for escalation)
        const sessionChannel = supabase
            .channel(`session_update_${consultationId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'consultations',
                filter: `id=eq.${consultationId}`
            }, (payload) => {
                setSession(payload.new);
                // If escalated to video, we might need a full page reload or specialized UI
                if (payload.new.consultation_type === 'video' || payload.new.consultation_type === 'VIDEO') {
                    router.refresh(); // Server component wrapper will switch to video view
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(sessionChannel);
        };
    }, [consultationId, session?.user_id, router]);

    useEffect(() => {
        // Timer Logic
        if (session?.started_at && settings && session.status === 'in-progress') {
            const durationMs = settings.chat_session_duration_minutes * 60 * 1000;
            const endTime = new Date(session.started_at).getTime() + durationMs;

            const interval = setInterval(() => {
                const now = new Date().getTime();
                const diff = Math.max(0, endTime - now);
                setTimeRemaining(diff);

                if (diff === 0) {
                    handleSessionExpire();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [session, settings]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSessionExpire = async () => {
        if (session.status === 'expired' || session.status === 'completed') return;

        await supabase.from('consultations').update({
            status: 'expired',
            ended_at: new Date().toISOString()
        }).eq('id', consultationId);

        setSession({ ...session, status: 'expired' });
    };

    const sendMessage = async () => {
        if (!inputText.trim() || session?.status !== 'in-progress') return;

        // Check message limit logic for patient
        if (user?.id === session?.user_id && messageCount >= (settings?.chat_message_limit || 50)) {
            handleSessionExpire();
            return;
        }

        const { error } = await supabase.from('session_messages').insert({
            consultation_id: consultationId,
            sender_id: user?.id,
            content: inputText.trim()
        });

        if (!error) {
            const currentInput = inputText.trim();
            setInputText('');

            // Notification Logic: If sender is NOT the patient (meaning sender is doctor), notify the patient
            if (user?.id !== session?.user_id && session?.patient?.email) {
                try {
                    fetch('/api/notifications/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            patientEmail: session.patient.email,
                            doctorName: session.doctor?.profiles?.full_name || 'Your Doctor',
                            consultationId: consultationId,
                            messageSnippet: currentInput.length > 100 ? currentInput.substring(0, 97) + '...' : currentInput
                        }),
                    });
                } catch (err) {
                    console.error('Failed to trigger email notification:', err);
                }
            }
        }
    };

    const handleEscalateToVideo = async () => {
        if (isPatient || isEscalating) return;

        setIsEscalating(true);
        try {
            const { error } = await supabase
                .from('consultations')
                .update({ consultation_type: 'video' })
                .eq('id', consultationId);

            if (error) throw error;
            router.refresh();
        } catch (err) {
            console.error('Failed to escalate:', err);
            alert('Failed to escalate to video call.');
        } finally {
            setIsEscalating(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex-1">Loading Session...</div>;

    const isExpired = session?.status === 'expired' || session?.status === 'completed';
    const formatTime = (ms: number) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const isPatient = user?.id === session?.user_id;
    const userRoleText = isPatient ? 'Patient' : 'Doctor';
    const otherPartyName = isPatient ? `Dr. ${session?.doctor?.profiles?.full_name}` : session?.patient?.full_name;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/appointments" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-slate-800">{otherPartyName || 'Specialist Consultation'}</h2>
                        <p className="text-xs text-slate-500 capitalize">{session?.consultation_type} Session • {session?.status}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium">
                    {session?.status === 'in-progress' && (
                        <>
                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                                <Clock size={16} />
                                <span>{formatTime(timeRemaining)}</span>
                            </div>
                            {isPatient && (
                                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                                    <span>{messageCount} / {settings?.chat_message_limit} Messages</span>
                                </div>
                            )}
                        </>
                    )}

                    {!isPatient && !isExpired && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsInfoOpen(true)}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full transition-colors relative"
                                title="Patient Medical Info"
                            >
                                <Info size={20} />
                                {(session?.patient?.known_conditions || session?.patient?.allergies) && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            <button
                                onClick={handleEscalateToVideo}
                                disabled={isEscalating}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full transition-all text-xs font-bold shadow-sm shadow-emerald-200"
                            >
                                {isEscalating ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Video size={14} />
                                )}
                                Escalate
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient Info Drawer (Doctor Only) */}
            {isInfoOpen && !isPatient && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsInfoOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-800">Patient Medical Info</h2>
                            <button onClick={() => setIsInfoOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <CloseIcon size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Vital Stats */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Full Name</p>
                                        <p className="font-bold text-slate-800">{session?.patient?.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Age</p>
                                        <p className="font-extrabold text-emerald-600 text-lg">
                                            {calculateAge(session?.patient?.date_of_birth) || 'N/A'} yrs
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Background */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                        Known Conditions
                                    </h3>
                                    {session?.patient?.known_conditions ? (
                                        <div className="flex flex-wrap gap-2">
                                            {session.patient.known_conditions.split(',').map((item: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                                                    {item.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">No conditions reported</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                                        <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
                                        Allergies
                                    </h3>
                                    {session?.patient?.allergies ? (
                                        <div className="flex flex-wrap gap-2">
                                            {session.patient.allergies.split(',').map((item: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                                                    {item.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">No allergies reported</p>
                                    )}
                                </div>
                            </div>

                            {/* Case Context */}
                            <div className="pt-6 border-t border-slate-100 uppercase tracking-widest text-[10px] text-slate-400 font-bold">
                                Consultation Details
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-1">{session?.title || 'General Consultation'}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{session?.description || 'No case description provided.'}</p>
                            </div>
                        </div>

                        <div className="mt-12 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[11px] text-emerald-800 leading-normal text-center font-medium">
                                Use this info to provide better clinical advice. Privacy is paramount.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Expiration Banner */}
            {isExpired && (
                <div className="bg-amber-50 border-t border-amber-200 p-4 text-center">
                    <AlertCircle className="mx-auto text-amber-600 mb-2" size={24} />
                    <h3 className="font-bold text-amber-800">Session Ended</h3>
                    <p className="text-sm text-amber-700 mt-1">This consultation session has reached its limit and is now closed.</p>
                </div>
            )}

            {/* Input */}
            {!isExpired && (
                <div className="bg-white border-t p-4">
                    <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type your message..."
                            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 transition-colors"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputText.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
