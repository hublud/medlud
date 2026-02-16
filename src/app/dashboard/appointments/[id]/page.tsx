'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MessageSquare, Send, Loader2, Clock, Activity, FileText, AlertCircle, ShieldCheck, Stethoscope, Save, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PrescriptionCard } from '@/components/appointments/PrescriptionCard';
import Link from 'next/link';
import { ChatMessage, Appointment, Prescription } from '@/types/appointment';
import { ChatBubble } from '@/components/shared/ChatBubble';
import { AISummaryCard } from '@/components/staff/AISummaryCard';
import { supabase } from '@/lib/supabase';

export default function AppointmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (params.id) {
            fetchAppointmentDetails(params.id as string);

            // Subscribe to new messages
            const channel = supabase
                .channel(`patient_appointment_chat:${params.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `appointment_id=eq.${params.id}` },
                    (payload) => {
                        const newMsg = payload.new as ChatMessage;
                        setMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            // Clean up any optimistic version of this same message
                            const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.content === newMsg.content));
                            return [...filtered, newMsg];
                        });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${params.id}` },
                    (payload) => {
                        // Refresh appointment if status changes (e.g. to RESPONDED)
                        fetchAppointmentDetails(params.id as string);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchAppointmentDetails = async (id: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            userRef.current = user?.id || null;

            // Fetch Appointment - Use maybeSingle to avoid PGRST116 if 0 or >1 rows (though id should be unique)
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (aptError) {
                console.error('Fetch error details (apt):', JSON.stringify(aptError, null, 2));
                throw aptError;
            }

            if (!aptData) {
                console.warn('Appointment not found');
                setAppointment(null);
                setLoading(false);
                return;
            }

            // If we have an appointment and a doctor_id, fetch the doctor profile separately
            let appointmentWithDoctor = { ...aptData };
            if (aptData.doctor_id) {
                const { data: docData, error: docError } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', aptData.doctor_id)
                    .maybeSingle();

                if (docData) {
                    appointmentWithDoctor.doctor = docData;
                }
                if (docError) {
                    console.error('Doctor fetch error:', JSON.stringify(docError, null, 2));
                }
            }

            setAppointment(appointmentWithDoctor as any);

            // Fetch Messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('appointment_id', id)
                .order('created_at', { ascending: true });

            if (msgError) console.error('Messages error:', JSON.stringify(msgError, null, 2));
            setMessages(msgData || []);

            // Fetch Prescriptions
            const { data: rxData, error: rxError } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('appointment_id', id);

            if (rxError) console.error('Prescriptions error:', JSON.stringify(rxError, null, 2));
            setPrescriptions(rxData || []);

        } catch (error: any) {
            console.error('Error fetching appointment (catch):', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleSendReply = async (imageUrl?: string) => {
        if ((!replyText.trim() && !imageUrl) || !appointment || !userRef.current) return;

        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            appointment_id: appointment.id,
            sender_id: userRef.current,
            role: 'USER',
            content: replyText,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        const textToSend = replyText;
        setReplyText('');

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    appointment_id: appointment.id,
                    sender_id: userRef.current,
                    role: 'USER',
                    content: textToSend,
                    image_url: imageUrl
                });

            if (error) {
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                throw error;
            }

        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send message.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !appointment || !userRef.current) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, etc)');
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${userRef.current}/${fileName}`;

            console.log('Uploading to:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('lab-results')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                throw uploadError;
            }

            // Get Public URL
            const { data: urlData } = supabase.storage
                .from('lab-results')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
                throw new Error('Could not generate public URL');
            }

            console.log('Generated Public URL:', urlData.publicUrl);

            // Send as message
            await handleSendReply(urlData.publicUrl);

        } catch (error: any) {
            console.error('Full upload error context:', error);
            if (error.message?.includes('bucket not found')) {
                alert('❌ Error: The "lab-results" storage bucket was not found. Please create it in your Supabase Dashboard (Storage tab).');
            } else if (error.status === 403 || error.message?.includes('Permission denied')) {
                alert('❌ Permission Denied: Please ensure you have run the latest SQL migration for storage policies.');
            } else {
                alert(`❌ Upload failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'RESPONDED': return 'bg-blue-100 text-blue-700';
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDoctorName = () => {
        if (appointment?.doctor) {
            const doc = appointment.doctor;
            if (doc.full_name) {
                const name = doc.full_name;
                // Add prefix based on role if not already present
                if (doc.role === 'doctor' && !name.toLowerCase().startsWith('dr')) {
                    const parts = name.split(' ');
                    // Use last name for formal address if available, or just the name
                    // User asked for "like Dr James" which implies first name, but usually it's Dr Lastname.
                    // However, users example "Dr James" suggests First Name.
                    // Let's stick to "Dr. [First Name]" as requested.
                    return `Dr. ${parts[0]}`;
                }
                if (doc.role === 'nurse' || doc.role === 'nurse-assistant') {
                    const parts = name.split(' ');
                    return `Nurse ${parts[0]}`;
                }
                return name;
            }
            return 'Medical Staff';
        }
        return 'Medical Staff';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!appointment) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Case Not Found</h2>
            <p className="text-gray-500 mb-6 max-w-xs">We couldn't retrieve the details for this consultation. It may have been deleted or moved.</p>
            <Link href="/dashboard/appointments">
                <Button variant="outline">Back to My Appointments</Button>
            </Link>
        </div>
    );

    const isWaiting = !appointment.doctor_id;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/appointments"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors group"
                    >
                        <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                        Back to Cases
                    </Link>
                    <div className="flex items-center gap-2">
                        {appointment.status === 'PENDING' && appointment.doctor_id ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-200">
                                CONNECTED
                            </span>
                        ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Waiting State Banner */}
                {isWaiting && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock size={20} className="text-blue-200 animate-pulse" />
                                    <h2 className="text-xl font-bold">Waiting for Medical Staff</h2>
                                </div>
                                <p className="text-blue-100/80 text-sm max-w-md">
                                    Your case has been successfully submitted. A doctor or nurse will review your symptoms and join the consultation shortly.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                                <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                                    <Activity size={20} className="animate-bounce" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status</p>
                                    <p className="text-sm font-bold">In Triage Queue</p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Case Details & History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Patient Request Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                            <div className="bg-gray-50/50 p-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 text-sm">Consultation Details</h2>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Submitted on {new Date(appointment.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${appointment.severity === 'severe' ? 'bg-red-100 text-red-700' :
                                    appointment.severity === 'moderate' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {appointment.severity || 'mild'}
                                </span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{appointment.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {appointment.description || appointment.symptoms}
                                    </p>
                                </div>

                                {appointment.medication_details && (
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                                        <AlertCircle size={14} className="text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Current Medication</p>
                                            <p className="text-xs text-amber-700">{appointment.medication_details}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Conversation & Doctor Response */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    <h2 className="font-bold text-gray-900 text-sm">Case Conversation</h2>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{messages.length} Messages</span>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px] relative">
                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                                <MessageSquare size={32} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 text-sm font-medium">No messages yet.</p>
                                            <p className="text-gray-400 text-xs mt-1">Chat will begin once a doctor joins the case.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <ChatBubble key={msg.id} message={msg} viewingAs="PATIENT" />
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="file"
                                            id="lab-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isWaiting || uploading}
                                        />
                                        <label
                                            htmlFor="lab-upload"
                                            className={`p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 cursor-pointer transition-all ${uploading ? 'animate-pulse' : ''}`}
                                            title="Upload Lab Result"
                                        >
                                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                        </label>

                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={isWaiting ? "Waiting for staff to join..." : "Type your message..."}
                                            disabled={isWaiting}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                        />
                                        <Button
                                            onClick={() => handleSendReply()}
                                            disabled={(!replyText.trim() && !uploading) || isWaiting}
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200 transition-transform hover:scale-105 active:scale-95"
                                        >
                                            <Send size={18} />
                                        </Button>
                                    </div>
                                    {uploading && <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Uploading lab result...</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Case Summary & Doctor Info */}
                    <div className="space-y-6">
                        {/* Doctor Overview */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
                            <div className="relative mx-auto w-20 h-20">
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center border-4 border-white shadow-xl ${isWaiting ? 'bg-gray-100 text-gray-300' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {isWaiting ? <User size={40} /> : <Stethoscope size={40} />}
                                </div>
                                {!isWaiting && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900">{isWaiting ? 'Pending Assignment' : getDoctorName()}</h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    {isWaiting ? 'Awaiting medical review' : (appointment.doctor?.role ? appointment.doctor.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Assigned Practitioner')}
                                </p>
                            </div>

                            {!isWaiting && (
                                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 gap-2">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                                        <ShieldCheck size={14} /> VERIFIED PROVIDER
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prescriptions - MOVED HERE */}
                        {prescriptions.length > 0 && (
                            <div className="animate-in slide-in-from-right-4 duration-500">
                                <PrescriptionCard
                                    id={prescriptions[0]?.id}
                                    doctorName={getDoctorName()}
                                    date={prescriptions[0]?.created_at || appointment.date}
                                    items={prescriptions.map(p => ({
                                        medicine: p.medication,
                                        dosage: p.dosage,
                                        frequency: p.frequency,
                                        duration: p.duration
                                    }))}
                                />
                            </div>
                        )}

                        {/* AI Summary - Also visible to patient as requested */}
                        <div className="animate-in slide-in-from-right-4 duration-500 delay-150">
                            <AISummaryCard
                                consultationText={`${appointment.description} ${messages.map(m => m.content).join(' ')}`}
                            />
                        </div>

                        {/* Consultation Note */}
                        {!isWaiting && appointment.doctor_response && (
                            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 space-y-3">
                                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={14} /> Doctor's Summary
                                </h4>
                                <p className="text-sm text-blue-800 leading-relaxed italic">
                                    "{appointment.doctor_response}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
