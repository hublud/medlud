'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, Clock, User, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AISummaryCard } from '@/components/staff/AISummaryCard';
import { PrescriptionBuilder } from '@/components/staff/PrescriptionBuilder';
import { DoctorChat } from '@/components/staff/DoctorChat';
import { TransferCaseModal } from '@/components/staff/TransferCaseModal';
import { Appointment, Prescription, ChatMessage } from '@/types/appointment';
import { supabase } from '@/lib/supabase';
import {
    notifyPatientOfAppointmentEvent,
    notifyPatientOfNewMessage,
    notifyPatientOfPrescription
} from '@/utils/notifications';

export default function CaseReviewPage() {
    const params = useParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [doctorNotes, setDoctorNotes] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const dummyUserRef = useRef<string | null>(null); // To store current user ID

    useEffect(() => {
        if (params.id) {
            fetchCaseDetails(params.id as string);

            // Subscribe to new messages
            const channel = supabase
                .channel(`appointment_chat:${params.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `appointment_id=eq.${params.id}` },
                    (payload) => {
                        const newMsg = payload.new as ChatMessage;
                        setChatMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            // Clean up any optimistic version of this same message
                            const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.content === newMsg.content));
                            return [...filtered, newMsg];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [params.id]);

    const fetchCaseDetails = async (id: string) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            dummyUserRef.current = user?.id || null;

            // Fetch Appointment - simplified query to avoid join issues
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();

            if (aptError) {
                console.error('Error fetching case details (apt):', JSON.stringify(aptError, null, 2));
                throw aptError;
            }

            // Fetch Patient Profile separately
            let appointmentWithPatient = { ...aptData };
            if (aptData.user_id) {
                const { data: patientData, error: patientError } = await supabase
                    .from('profiles')
                    .select('full_name, date_of_birth, blood_group, gender')
                    .eq('id', aptData.user_id)
                    .single();

                if (patientData) {
                    appointmentWithPatient.patient = patientData;
                }
                if (patientError) {
                    console.error('Patient profile fetch error:', JSON.stringify(patientError, null, 2));
                }
            }

            setAppointment(appointmentWithPatient as any);

            // Fetch Messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('appointment_id', id)
                .order('created_at', { ascending: true });

            if (msgError) console.error('Messages fetch error:', JSON.stringify(msgError, null, 2));
            setChatMessages(msgData || []);

        } catch (error: any) {
            console.error('Unexpected error in fetchCaseDetails:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!dummyUserRef.current || !appointment) return;

        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            appointment_id: appointment.id,
            sender_id: dummyUserRef.current,
            role: 'DOCTOR',
            content: content,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, optimisticMsg]);

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    appointment_id: appointment.id,
                    sender_id: dummyUserRef.current,
                    role: 'DOCTOR',
                    content: content
                });

            if (error) {
                setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                throw error;
            }

            // Notify Patient of new message
            const { data: doctor } = await supabase.from('profiles').select('full_name').eq('id', dummyUserRef.current).single();
            await notifyPatientOfNewMessage(appointment.id, doctor?.full_name || 'Doctor', content);

        } catch (error: any) {
            console.error('Error sending message:', JSON.stringify(error, null, 2));
            alert('Failed to send message');
        }
    };

    const handleTransferCase = async (staffId: string) => {
        if (!appointment) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    doctor_id: staffId,
                    status: 'PENDING' // Ensure it's back to pending if it was in review
                })
                .eq('id', appointment.id);

            if (error) throw error;

            // Notify Patient of referral/transfer
            const { data: staff } = await supabase.from('profiles').select('full_name').eq('id', staffId).single();
            await notifyPatientOfAppointmentEvent(appointment.id, 'REASSIGNED', { doctorName: staff?.full_name });

            router.push('/dashboard/staff');
        } catch (err: any) {
            console.error('Transfer error:', JSON.stringify(err, null, 2));
            throw err;
        }
    };

    const [saving, setSaving] = useState(false);

    const handleCompleteCase = async () => {
        if (!appointment) return;

        try {
            setSaving(true);
            // 1. Update Appointment Status
            const { error: aptError } = await supabase
                .from('appointments')
                .update({
                    status: 'COMPLETED',
                    doctor_response: doctorNotes,
                    doctor_id: dummyUserRef.current
                })
                .eq('id', appointment.id);

            if (aptError) throw aptError;

            // 2. Save Prescriptions - DELETE existing ones first to avoid duplicates on retry
            await supabase.from('prescriptions').delete().eq('appointment_id', appointment.id);

            if (prescriptions.length > 0) {
                const prescriptionsToSave = prescriptions.map(p => ({
                    appointment_id: appointment.id,
                    medication: p.medication,
                    dosage: p.dosage,
                    frequency: p.frequency,
                    duration: p.duration,
                    notes: p.notes
                }));

                const { error: rxError } = await supabase
                    .from('prescriptions')
                    .insert(prescriptionsToSave);

                if (rxError) throw rxError;

                // Notify Patient about new prescription
                await notifyPatientOfPrescription(appointment.id, prescriptions.length);
            }

            // Notify Patient of case completion
            await notifyPatientOfAppointmentEvent(appointment.id, 'COMPLETED', { note: doctorNotes });

            alert('Consultation completed successfully! The patient has been notified.');
            router.push('/dashboard/staff');

        } catch (error: any) {
            console.error('Error completing case:', JSON.stringify(error, null, 2));
            alert(`Failed to update case: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const getPatientName = () => {
        if (appointment?.patient) {
            return `${appointment.patient.first_name} ${appointment.patient.last_name}`;
        }
        return 'Unknown';
    };

    const calculateAge = (dob: string | undefined): string => {
        if (!dob) return '--';
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age.toString();
        } catch (e) {
            return '--';
        }
    };

    const handleClaimCase = async () => {
        if (!dummyUserRef.current || !appointment) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ doctor_id: dummyUserRef.current })
                .eq('id', appointment.id)
                .is('doctor_id', null);

            if (error) {
                alert('This case has already been claimed by another doctor.');
            } else {
                // Notify Patient
                const { data: doctor } = await supabase.from('profiles').select('full_name').eq('id', dummyUserRef.current).single();
                await notifyPatientOfAppointmentEvent(appointment.id, 'REASSIGNED', {
                    doctorName: doctor?.full_name
                });

                fetchCaseDetails(appointment.id);
            }
        } catch (err: any) {
            console.error('Claim error:', JSON.stringify(err, null, 2));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }

    if (!appointment) return <div className="p-8 text-center text-red-500">Appointment not found</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/staff">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {appointment.title}
                                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase">
                                    {appointment.priority} PRIORITY
                                </span>
                            </h1>
                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                <User size={14} /> {getPatientName()} • Case ID: #{appointment.id.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary transition-all">
                                <ArrowLeft size={16} className="mr-1.5" /> Patient View
                            </Button>
                        </Link>
                        {appointment.status === 'PENDING' && !appointment.doctor_id ? (
                            <Button onClick={handleClaimCase} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle size={16} className="mr-2" /> Claim Case
                            </Button>
                        ) : (
                            <>
                                {appointment.doctor_id === dummyUserRef.current && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="bg-white"
                                            onClick={() => setIsTransferModalOpen(true)}
                                        >
                                            <Clock size={16} className="mr-2" /> Transfer
                                        </Button>
                                        <Button variant="outline" className="bg-white">
                                            <Save size={16} className="mr-2" /> Save Draft
                                        </Button>
                                        <Button
                                            onClick={handleCompleteCase}
                                            disabled={saving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                                        >
                                            {saving ? (
                                                <><Loader2 className="mr-2 animate-spin" size={16} /> Saving...</>
                                            ) : (
                                                <><CheckCircle size={16} className="mr-2" /> Complete Case</>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Patient Info & Chat */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Patient Summary Card */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-emerald-600" /> Case Details
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                {appointment.description || appointment.symptoms}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {appointment.symptoms?.split(',').map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                        {s.trim()}
                                    </span>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                                <div>
                                    <span className="block text-gray-400 text-xs uppercase tracking-wider">Patient Age</span>
                                    <span className="font-semibold text-gray-900">{calculateAge(appointment.patient?.date_of_birth)}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-xs uppercase tracking-wider">Blood Group</span>
                                    <span className="font-semibold text-gray-900">{appointment.patient?.blood_group || '--'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Consultation Chat */}
                        <DoctorChat messages={chatMessages} onSendMessage={handleSendMessage} />
                    </div>

                    {/* Right Column: AI Analysis & Tools */}
                    <div className="space-y-6">
                        {/* AI Summary */}
                        <AISummaryCard
                            consultationText={`${appointment.description} ${chatMessages.map(m => m.content).join(' ')}`}
                        />

                        {/* Clinical Actions */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4">Clinical Response</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Clinical Notes / Diagnosis</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        rows={4}
                                        placeholder="Enter your diagnosis and internal notes..."
                                        value={doctorNotes}
                                        onChange={(e) => setDoctorNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <PrescriptionBuilder
                                    value={prescriptions}
                                    onChange={setPrescriptions}
                                    appointmentId={appointment.id}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TransferCaseModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onTransfer={handleTransferCase}
                currentDoctorId={dummyUserRef.current || undefined}
            />
        </div>
    );
}
