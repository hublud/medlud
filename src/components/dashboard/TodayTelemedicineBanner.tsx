'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Video, Phone, MessageSquare, Calendar, Clock, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

export const TodayTelemedicineBanner: React.FC = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchSessions = async () => {
            try {
                // Fetch scheduled telemedicine appointments
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
                        id,
                        title,
                        date,
                        type,
                        status,
                        duration,
                        doctor_id,
                        profiles!appointments_doctor_id_fkey(full_name, role)
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'SCHEDULED')
                    .in('type', ['chat', 'voice', 'video'])
                    .order('date', { ascending: true });

                if (error) throw error;

                // Sort and filter: keep sessions from today onwards (or slightly past sessions that are still SCHEDULED)
                setSessions(data || []);
            } catch (err) {
                console.error('Error fetching telemedicine sessions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
        
        // Setup realtime subscription
        const channel = supabase
            .channel('today_sessions_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${user.id}` },
                () => {
                    fetchSessions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    if (loading || sessions.length === 0) return null;

    return (
        <div className="space-y-4 mb-6">
            {sessions.map((session) => {
                const doc = session.profiles;
                let doctorName = 'Medical Provider';
                if (doc) {
                    const name = doc.full_name || '';
                    const role = doc.role || '';
                    if (role === 'doctor' && !name.toLowerCase().startsWith('dr')) {
                        doctorName = `Dr. ${name.split(' ')[0]}`;
                    } else if ((role === 'nurse' || role === 'nurse-assistant') && !name.toLowerCase().startsWith('nurse')) {
                        doctorName = `Nurse ${name.split(' ')[0]}`;
                    } else {
                        doctorName = name;
                    }
                }

                // Check if current date is the booked date (or later)
                const aptDate = session.date ? new Date(session.date) : new Date();
                const today = new Date();
                
                // Clear hours to compare calendar days
                const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
                const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                
                const isBookedDateOrPast = todayDay.getTime() >= aptDay.getTime();

                const dateString = session.date 
                    ? new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                    : '';

                const timeString = session.date 
                    ? new Date(session.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) 
                    : '';

                const typeIcons = {
                    chat: <MessageSquare size={16} />,
                    voice: <Phone size={16} />,
                    video: <Video size={16} />
                };

                return (
                    <div 
                        key={session.id}
                        className={`rounded-3xl p-5 sm:p-6 text-white shadow-xl overflow-hidden relative border animate-in slide-in-from-top-4 duration-500 ${
                            isBookedDateOrPast 
                                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 border-emerald-500/20'
                                : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-slate-700/50'
                        }`}
                    >
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            isBookedDateOrPast ? 'bg-emerald-400' : 'bg-slate-400'
                                        }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                            isBookedDateOrPast ? 'bg-emerald-300' : 'bg-slate-400'
                                        }`}></span>
                                    </span>
                                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                                        isBookedDateOrPast ? 'text-emerald-300' : 'text-slate-400'
                                    }`}>
                                        {isBookedDateOrPast ? 'Active / Join Available' : 'Upcoming Consultation'}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                                    Virtual consultation scheduled with {doctorName}
                                </h3>
                                <p className={`text-xs sm:text-sm max-w-xl font-medium leading-relaxed ${
                                    isBookedDateOrPast ? 'text-emerald-100/90' : 'text-slate-300'
                                }`}>
                                    {isBookedDateOrPast 
                                        ? `You have a scheduled ${session.type.toUpperCase()} session today. Click join below to connect securely.`
                                        : `You have a scheduled ${session.type.toUpperCase()} session on ${dateString} at ${timeString}. The join link will activate on that day.`
                                    }
                                </p>
                                
                                <div className="flex flex-wrap gap-2 pt-1.5">
                                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-xs font-semibold">
                                        <Clock size={12} className={isBookedDateOrPast ? 'text-emerald-200' : 'text-slate-400'} />
                                        <span>{dateString} at {timeString}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-xs font-semibold">
                                        <Calendar size={12} className={isBookedDateOrPast ? 'text-emerald-200' : 'text-slate-400'} />
                                        <span>Duration: {session.duration || '30 mins'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="shrink-0">
                                {isBookedDateOrPast ? (
                                    <Link 
                                        href={`/dashboard/telemedicine/session/${session.id}`}
                                        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 group/btn w-full md:w-auto text-xs"
                                    >
                                        {typeIcons[session.type as keyof typeof typeIcons] || <Video size={16} />}
                                        <span>Join Session Room</span>
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                ) : (
                                    <button 
                                        disabled
                                        className="inline-flex items-center justify-center gap-2 bg-white/10 text-white/50 border border-white/10 font-bold px-6 py-3.5 rounded-2xl w-full md:w-auto text-xs cursor-not-allowed"
                                    >
                                        <Lock size={14} />
                                        <span>Locked Until Booked Date</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Background Premium Glow Orbs */}
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
};

