'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BellRing, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const TelemedicineReminder: React.FC = () => {
    const { user, profile } = useAuth();
    const [upcomingApt, setUpcomingApt] = useState<any | null>(null);
    const [dismissedAptIds, setDismissedAptIds] = useState<string[]>([]);
    const lastNotifiedAptId = useRef<string | null>(null);

    // Only true once profile has loaded AND the user is a doctor/partner
    // profile === null means not yet loaded; profile === undefined or no role means not a doctor
    const profileLoaded = profile !== null;
    const isDoctor = profileLoaded && (
        profile?.role === 'partner' || profile?.facility_staff?.role === 'doctor'
    );

    const playChime = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            
            // C5 Note
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
            gain1.gain.setValueAtTime(0.12, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.6);

            // E5 Note (150ms delay)
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
                gain2.gain.setValueAtTime(0.12, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start();
                osc2.stop(ctx.currentTime + 0.6);
            }, 150);

            // G5 Note (300ms delay)
            setTimeout(() => {
                const osc3 = ctx.createOscillator();
                const gain3 = ctx.createGain();
                osc3.type = 'sine';
                osc3.frequency.setValueAtTime(783.99, ctx.currentTime);
                gain3.gain.setValueAtTime(0.18, ctx.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
                osc3.connect(gain3);
                gain3.connect(ctx.destination);
                osc3.start();
                osc3.stop(ctx.currentTime + 1.0);
            }, 300);
            
        } catch (e) {
            console.warn('[Reminder Chime] Audio Context blocked or not supported:', e);
        }
    };

    useEffect(() => {
        // Wait until profile has loaded before doing anything
        if (!user || !profileLoaded) return;

        if (!isDoctor) {
            setUpcomingApt(null);
            return;
        }

        const checkSchedule = async () => {
            try {
                const now = new Date();
                const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000);
                const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

                // Fetch appointments scheduled for this doctor within the 15-minute reminder window
                const { data: apts, error: aptsError } = await supabase
                    .from('appointments')
                    .select(`
                        id,
                        date,
                        type,
                        duration,
                        title,
                        user_id
                    `)
                    .eq('doctor_id', user.id)
                    .eq('status', 'SCHEDULED')
                    .gte('date', fiveMinsAgo.toISOString())
                    .lte('date', tenMinsFromNow.toISOString());

                if (aptsError) throw aptsError;

                if (apts && apts.length > 0) {
                    const patientIds = apts.map((a: any) => a.user_id).filter(Boolean);
                    const { data: patients, error: patientError } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', patientIds);

                    if (patientError) throw patientError;

                    const mappedApts = apts.map(apt => ({
                        ...apt,
                        patient: patients?.find(p => p.id === apt.user_id) || null
                    }));

                    // Filter out dismissed ones
                    const activeApts = mappedApts.filter(apt => !dismissedAptIds.includes(apt.id));
                    
                    if (activeApts.length > 0) {
                        const targetApt = activeApts[0];
                        setUpcomingApt(targetApt);

                        // Trigger audio reminder only ONCE per appointment ID to prevent annoyances
                        if (lastNotifiedAptId.current !== targetApt.id) {
                            playChime();
                            lastNotifiedAptId.current = targetApt.id;
                        }
                    } else {
                        setUpcomingApt(null);
                    }
                } else {
                    setUpcomingApt(null);
                }
            } catch (err: any) {
                // Supabase PostgrestError has non-enumerable properties — extract them explicitly
                const errMessage = err?.message || err?.error_description || JSON.stringify(err);
                console.warn(
                    `[Reminder] Error checking doctor schedules: ${errMessage}`,
                    { code: err?.code, details: err?.details, hint: err?.hint }
                );
            }
        };

        // Run immediately
        checkSchedule();

        // Check every 30 seconds
        const interval = setInterval(checkSchedule, 30000);
        return () => clearInterval(interval);

    }, [user, profileLoaded, isDoctor, dismissedAptIds]);

    if (!upcomingApt) return null;

    const handleDismiss = () => {
        setDismissedAptIds(prev => [...prev, upcomingApt.id]);
        setUpcomingApt(null);
    };

    const aptDate = new Date(upcomingApt.date);
    const minsDiff = Math.round((aptDate.getTime() - new Date().getTime()) / 60000);
    const timeText = minsDiff <= 0 
        ? 'Starting now!' 
        : `Starting in ${minsDiff} minutes`;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white rounded-3xl border border-indigo-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-350 flex flex-col">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-4 relative flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/10 animate-bounce">
                    <BellRing size={20} />
                </div>
                <div>
                    <h4 className="font-extrabold text-sm leading-tight">Telemedicine Session Reminder</h4>
                    <p className="text-[10px] text-indigo-300 font-bold tracking-wider uppercase mt-0.5">{timeText}</p>
                </div>
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    title="Dismiss reminder"
                >
                    <X size={15} />
                </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5 font-medium text-slate-650">
                    <p className="flex justify-between">
                        <span className="text-slate-400">Appointment:</span>
                        <span className="font-bold text-slate-800">{upcomingApt.title}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-slate-400">Patient Name:</span>
                        <span className="font-bold text-slate-800">{upcomingApt.patient?.full_name || 'Patient'}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-slate-400">Scheduled Time:</span>
                        <span className="font-bold text-slate-800">
                            {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({upcomingApt.duration})
                        </span>
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button 
                        onClick={handleDismiss} 
                        variant="outline" 
                        className="flex-1 text-[11px] h-9 font-bold rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                        Dismiss
                    </Button>
                    <Link href={`/dashboard/telemedicine/session/${upcomingApt.id}`} className="flex-[2]" onClick={handleDismiss}>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-9 font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-150 rounded-xl">
                            <Video size={13} />
                            Join Session
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
