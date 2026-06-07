'use client';

import React, { useState } from 'react';
import { X, Send, Calendar, Clock, Video, Phone, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { createUserNotification } from '@/utils/notifications';
import { ensurePatientAuth } from '@/app/actions/patient';

interface EscalateTelemedicineModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    doctorId: string;
    doctorName: string;
    onSuccess?: (appointmentId: string) => void;
}

export const EscalateTelemedicineModal: React.FC<EscalateTelemedicineModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    patientEmail,
    doctorId,
    doctorName,
    onSuccess
}) => {
    const [callType, setCallType] = useState<'chat' | 'voice' | 'video'>('chat');
    
    // Scheduled call details
    const [scheduledDate, setScheduledDate] = useState(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localNow = new Date(now.getTime() - tzOffset);
        return localNow.toISOString().split('T')[0];
    });
    const [scheduledTime, setScheduledTime] = useState(() => {
        const now = new Date();
        return now.toTimeString().split(' ')[0].substring(0, 5);
    });
    const [duration, setDuration] = useState('30 mins');
    const [notes, setNotes] = useState('');
    const [priceTier, setPriceTier] = useState<'complimentary' | 'standard'>('complimentary');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [verifyingAccount, setVerifyingAccount] = useState(false);
    const [accountInfo, setAccountInfo] = useState<{ med_id: string; email: string; password?: string } | null>(null);
    const [accountError, setAccountError] = useState('');

    if (!isOpen) return null;

    const handleVerifyAccount = async () => {
        setVerifyingAccount(true);
        setAccountError('');
        try {
            const res = await ensurePatientAuth(patientId);
            if (res.success) {
                setAccountInfo({
                    med_id: res.med_id || '',
                    email: res.email || '',
                    password: res.password || 'MedLudPatient123!'
                });
            } else {
                setAccountError(res.error || 'Failed to verify or create patient account.');
            }
        } catch (err: any) {
            setAccountError(err.message || 'An error occurred during account verification.');
        } finally {
            setVerifyingAccount(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        try {
            // Validate date and time
            if (!scheduledDate || !scheduledTime) {
                setErrorMsg('Please specify both date and time for the scheduled session.');
                setIsSubmitting(false);
                return;
            }
            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

            // Collision Protection: Double Booking Prevention
            const proposedStart = new Date(`${scheduledDate}T${scheduledTime}`);
            let durationMins = 30; // default/fallback
            if (callType !== 'chat') {
                if (duration === '15 mins') durationMins = 15;
                else if (duration === '30 mins') durationMins = 30;
                else if (duration === '45 mins') durationMins = 45;
                else if (duration === '1 hour') durationMins = 60;
            }
            const proposedEnd = new Date(proposedStart.getTime() + durationMins * 60000);

            // Fetch doctor's scheduled appointments for that day
            const startOfDay = new Date(proposedStart);
            startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(proposedStart);
            endOfDay.setHours(23,59,59,999);

            const { data: existingApts, error: queryAptError } = await supabase
                .from('appointments')
                .select('id, date, duration, type, title')
                .eq('doctor_id', doctorId)
                .eq('status', 'SCHEDULED')
                .gte('date', startOfDay.toISOString())
                .lte('date', endOfDay.toISOString());

            if (queryAptError) {
                console.error('Error verifying doctor availability:', queryAptError);
            } else if (existingApts && existingApts.length > 0) {
                for (const apt of existingApts) {
                    const existingStart = new Date(apt.date || '');
                    let extMins = 30;
                    if (apt.type !== 'chat') {
                        if (apt.duration === '15 mins') extMins = 15;
                        else if (apt.duration === '30 mins') extMins = 30;
                        else if (apt.duration === '45 mins') extMins = 45;
                        else if (apt.duration === '1 hour') extMins = 60;
                    }
                    const existingEnd = new Date(existingStart.getTime() + extMins * 60000);

                    // Check for overlap
                    if (existingStart < proposedEnd && existingEnd > proposedStart) {
                        setErrorMsg(`Double-Booking Alert: Dr. ${doctorName} is already booked for "${apt.title}" from ${existingStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${existingEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // Auto-ensure patient account is created/active during escalation
            const authResult = await ensurePatientAuth(patientId);
            if (!authResult.success) {
                console.warn('Patient account auto-verification failed during submit:', authResult.error);
            }

            const title = callType === 'chat' 
                ? 'Telemedicine Chat Consultation' 
                : `Scheduled Telemedicine ${callType === 'video' ? 'Video' : 'Voice'} Consultation`;

            const symptomsBrief = notes.trim() || 'Clinical case follow-up discussion.';

            // 1. Insert into appointments table
            const { data: insertedApt, error: insertAptError } = await supabase
                .from('appointments')
                .insert({
                    user_id: patientId,
                    doctor_id: doctorId,
                    title: title,
                    symptoms: symptomsBrief,
                    type: callType,
                    status: 'SCHEDULED',
                    date: scheduledDateTime,
                    duration: callType === 'chat' ? 'Unlimited' : duration,
                    priority: 'NORMAL',
                    category: 'general'
                })
                .select('id')
                .single();

            if (insertAptError) throw insertAptError;
            if (!insertedApt) throw new Error('Failed to retrieve new appointment reference.');

            const appointmentId = insertedApt.id;

            // 2. Insert twin consultations record (for Agora Live Session compatibility)
            const { error: consultError } = await supabase
                .from('consultations')
                .insert({
                    id: appointmentId, // Match the exact same UUID!
                    user_id: patientId,
                    doctor_id: doctorId,
                    consultation_type: callType,
                    status: 'pending',
                    price: priceTier === 'complimentary' ? 0 : (callType === 'video' ? 8000 : 7000),
                    started_at: scheduledDateTime,
                    specialty_type: 'General Telemedicine',
                    doctor_amount: priceTier === 'complimentary' ? 0 : (callType === 'video' ? 5600 : 4900),
                    commission_amount: priceTier === 'complimentary' ? 0 : (callType === 'video' ? 2400 : 2100)
                });

            if (consultError) {
                console.error('Twin consultation insert error:', consultError);
            }

            // 3. Initialize chat messages for instantaneous communication
            const initMessage = callType === 'chat'
                ? `👋 Hello ${patientName}! I have escalated our case to this direct Telemedicine Chat room. Please let me know your thoughts or updates here.`
                : `📅 Scheduled: Dr. ${doctorName} has scheduled a ${callType === 'video' ? 'Video' : 'Voice'} Call for ${new Date(scheduledDateTime!).toLocaleDateString()} at ${scheduledTime} (${duration}). Notes: "${symptomsBrief}"`;

            // Insert into both messages (Appointments details screen) and session_messages (Unified Agora Session Room)
            await Promise.all([
                supabase.from('messages').insert({
                    appointment_id: appointmentId,
                    sender_id: doctorId,
                    role: 'DOCTOR',
                    content: initMessage
                }),
                supabase.from('session_messages').insert({
                    consultation_id: appointmentId,
                    sender_id: doctorId,
                    content: initMessage
                })
            ]);

            // 4. Dispatch System User Notification
            const alertText = callType === 'chat'
                ? `Dr. ${doctorName} has escalated your case to an active Telemedicine Chat room.`
                : `Dr. ${doctorName} has scheduled a telemedicine ${callType} call for you.`;

            await createUserNotification(
                patientId,
                callType === 'chat' ? 'Telemedicine Chat Open' : 'Telemedicine Call Scheduled',
                alertText,
                'TELEMEDICINE',
                `/dashboard/appointments/${appointmentId}`
            );

            // 5. Trigger email notification via server action endpoint if email is present
            const emailToUse = patientEmail || (authResult.success ? authResult.email : undefined);
            if (emailToUse && !emailToUse.endsWith('@medlud.local')) {
                try {
                    await fetch('/api/notifications/scheduled-call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            appointmentId,
                            patientEmail: emailToUse,
                            patientName,
                            doctorName,
                            callType,
                            scheduledDate: scheduledDateTime,
                            duration: callType === 'chat' ? 'Unlimited' : duration
                        })
                    });
                } catch (emailErr) {
                    console.error('Email dispatch skipped or failed:', emailErr);
                }
            }

            alert(callType === 'chat' 
                ? 'Case successfully escalated to Telemedicine Chat! Patient has been alerted.' 
                : 'Telemedicine Call successfully scheduled! The patient will receive a confirmation email.'
            );
            
            if (onSuccess) onSuccess(appointmentId);
            onClose();

        } catch (err: any) {
            console.error('Escalation failed:', err);
            setErrorMsg(err.message || 'Escalation failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 text-white p-5 relative">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={18} />
                        SaaS Telemedicine Escalation
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-1">Escalate <strong>{patientName}</strong> to telemedicine & reduce future clinic visits.</p>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                    
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 font-semibold leading-normal">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* Channel Selector */}
                    <div className="space-y-1.5">
                        <label className="font-bold text-slate-400 uppercase tracking-wider block">Escalation Channel Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Chat */}
                            <button
                                type="button"
                                onClick={() => setCallType('chat')}
                                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                                    callType === 'chat' 
                                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-extrabold shadow-sm' 
                                        : 'border-slate-200 bg-slate-50/30 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <MessageSquare size={16} />
                                <span>Instant Chat</span>
                            </button>

                            {/* Voice Call */}
                            <button
                                type="button"
                                onClick={() => setCallType('voice')}
                                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                                    callType === 'voice' 
                                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-extrabold shadow-sm' 
                                        : 'border-slate-200 bg-slate-50/30 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <Phone size={16} />
                                <span>Voice Call</span>
                            </button>

                            {/* Video Call */}
                            <button
                                type="button"
                                onClick={() => setCallType('video')}
                                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                                    callType === 'video' 
                                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-extrabold shadow-sm' 
                                        : 'border-slate-200 bg-slate-50/30 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <Video size={16} />
                                <span>Video Call</span>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Scheduled Inputs - render unconditionally */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                            <Calendar size={13} className="text-slate-500" />
                            Call Scheduling Particulars
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-wider block">Date</label>
                                <input 
                                    type="date"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    required
                                    className="w-full border border-slate-250 rounded-xl p-2.5 bg-white outline-none focus:border-emerald-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-wider block">Time</label>
                                <input 
                                    type="time"
                                    value={scheduledTime}
                                    onChange={e => setScheduledTime(e.target.value)}
                                    required
                                    className="w-full border border-slate-250 rounded-xl p-2.5 bg-white outline-none focus:border-emerald-600"
                                />
                            </div>
                        </div>

                        {callType !== 'chat' && (
                            <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-wider block">Duration</label>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="w-full border border-slate-250 rounded-xl p-2.5 bg-white outline-none focus:border-emerald-600 font-semibold"
                                >
                                    <option value="15 mins">15 minutes session</option>
                                    <option value="30 mins">30 minutes session</option>
                                    <option value="45 mins">45 minutes session</option>
                                    <option value="1 hour">1 hour session</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Price tier */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-400 uppercase tracking-wider block">Billing Rate</label>
                        <select
                            value={priceTier}
                            onChange={e => setPriceTier(e.target.value as any)}
                            className="w-full border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-emerald-600 font-semibold"
                        >
                            <option value="complimentary">Complimentary Follow-up (₦0.00)</option>
                            <option value="standard">Standard Consultation Rate ({callType === 'video' ? '₦8,000.00' : '₦7,000.00'})</option>
                        </select>
                    </div>

                    {/* Escalation Notes */}
                    <div className="space-y-1">
                        <label className="font-bold text-slate-400 uppercase tracking-wider block">Provider Instructions / Case Scope</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Enter detailed instruction notes, chief complaints, or symptoms to discuss during the call..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-600 resize-none font-medium"
                        />
                    </div>

                    {/* Patient Portal Credentials Section */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 flex items-center gap-1">
                                <Sparkles size={13} className="text-emerald-600" />
                                Patient Portal Credentials
                            </h4>
                            {accountInfo && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                                    Active
                                </span>
                            )}
                        </div>

                        {accountInfo ? (
                            <div className="space-y-2 text-slate-700 font-semibold">
                                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-emerald-100 text-[10px]">
                                    <div>
                                        <span className="block text-[9px] text-slate-400 font-bold uppercase">MED-ID Username</span>
                                        <span className="font-mono text-xs text-slate-900 font-extrabold">{accountInfo.med_id}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Password</span>
                                        <span className="font-mono text-xs text-slate-900 font-extrabold">{accountInfo.password || 'MedLudPatient123!'}</span>
                                    </div>
                                    <div className="col-span-2 pt-1.5 border-t border-slate-100">
                                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Registered Email</span>
                                        <span className="text-slate-800 text-[10px] break-all">{accountInfo.email}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Patient can use their MED-ID and password to log in and join the virtual consult room.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-550 leading-relaxed font-medium">
                                    Verify or create the patient's portal credentials to allow them to access their dashboard.
                                </p>
                                {accountError && (
                                    <p className="text-[10px] text-rose-600 font-bold">❌ {accountError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleVerifyAccount}
                                    disabled={verifyingAccount}
                                    className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                >
                                    {verifyingAccount ? (
                                        <><Loader2 size={13} className="animate-spin text-emerald-600" /> Verifying Portal Access...</>
                                    ) : (
                                        <>Verify / Create Patient Portal Account</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button 
                            type="button" 
                            onClick={onClose} 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11 text-xs font-bold"
                        >
                            Close
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-xs font-bold flex items-center justify-center gap-1 shadow-lg shadow-emerald-100"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={14} className="animate-spin mr-1" /> Escalating...</>
                            ) : (
                                <><Send size={14} /> Fulfill & Escalate</>
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};
