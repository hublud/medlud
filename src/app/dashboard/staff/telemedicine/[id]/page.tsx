'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileText, Download, Stethoscope, Video, User, Clock, AlertCircle, CalendarPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DoctorCaseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        const fetchCaseData = async () => {
            if (!params.id) return;

            try {
                const caseId = Array.isArray(params.id) ? params.id[0] : params.id;

                // Fetch the telemedicine call details
                const { data, error } = await supabase
                    .from('telemedicine_calls')
                    .select('*, patient:profiles!telemedicine_calls_patient_id_fkey(full_name, email, phone, gender, date_of_birth, med_id), provider:profiles!telemedicine_calls_provider_id_fkey(full_name, avatar_url, med_id)')
                    .eq('id', caseId)
                    .single();

                if (error) throw error;
                
                let callData: any = { ...data };

                // Parse AI Summary if stringified
                if (callData.ai_summary && typeof callData.ai_summary === 'string') {
                    try {
                        callData.parsed_ai_summary = JSON.parse(callData.ai_summary);
                    } catch (e) {
                         callData.parsed_ai_summary = null;
                    }
                }

                setCaseData(callData);
            } catch (error) {
                console.error('Error fetching case details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCaseData();
    }, [params.id]);

    const handleScheduleFollowUp = async () => {
        if (!followUpDate) return alert('Please select a date and time.');
        setScheduling(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('appointments')
                .insert({
                    user_id: caseData.patient_id,
                    doctor_id: user.id,
                    date: followUpDate,
                    time: followUpDate.split('T')[1] || '09:00',
                    type: caseData.call_type || 'VIDEO',
                    status: 'CONFIRMED',
                    title: `Follow-up: ${caseData.title || 'Consultation'}`,
                    description: `Doctor requested follow-up for Case #${caseData.id.slice(0, 8)}`,
                    priority: 'MEDIUM',
                    amount: 0, // Free follow-up or configured price
                    payment_status: 'paid'
                });

            if (error) throw error;
            alert('Follow-up scheduled successfully. The patient has been notified.');
            setShowScheduleModal(false);
        } catch (err: any) {
            console.error('Scheduling error:', err);
            alert('Failed to schedule follow-up: ' + err.message);
        } finally {
            setScheduling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="min-h-screen p-8 text-center flex flex-col items-center justify-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h1>
                <p className="text-gray-500 mb-6">The requested consultation case record could not be found.</p>
                <Button onClick={() => router.back()} className="rounded-full px-8">Return to Dashboard</Button>
            </div>
        );
    }

    const { parsed_ai_summary } = caseData;
    const patientName = caseData.patient?.full_name || 'Unknown Patient';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 border-l border-gray-200 pl-3">Case #{caseData.id.slice(0, 8).toUpperCase()}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            caseData.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            caseData.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                        } uppercase tracking-wider`}>
                            {caseData.status}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header Information */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <User size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Patient</p>
                                <h2 className="text-2xl font-bold text-gray-900">{patientName}</h2>
                                {caseData.patient?.med_id && (
                                    <p className="text-sm text-gray-500 font-medium">MED ID: {caseData.patient.med_id}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} className="text-gray-400" />
                                <span>{new Date(caseData.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Video size={16} className="text-gray-400" />
                                <span className="uppercase font-semibold tracking-wider">{caseData.call_type} Consultation</span>
                            </div>
                            {caseData.duration > 0 && (
                                <div className="text-xs text-gray-400 mt-1 pl-6">
                                    Duration: {Math.floor(caseData.duration / 60)}m {caseData.duration % 60}s
                                </div>
                            )}
                            <Button 
                                size="sm" 
                                className="mt-2 text-xs w-full bg-blue-600 hover:bg-blue-700" 
                                onClick={() => setShowScheduleModal(true)}
                            >
                                <CalendarPlus size={14} className="mr-2" /> Schedule Follow-up
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Clinical Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Doctor's Final Report */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                    <Stethoscope size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Physician&apos;s Report</h3>
                            </div>

                            <div className="space-y-6">
                                {caseData.diagnosis_notes && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2">Diagnosis</h4>
                                        <div className="p-4 bg-gray-50 rounded-2xl text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                            {caseData.diagnosis_notes}
                                        </div>
                                    </div>
                                )}

                                {caseData.treatment_instructions && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2">Treatment & Instructions</h4>
                                        <div className="p-4 bg-emerald-50/50 rounded-2xl text-gray-800 text-sm leading-relaxed whitespace-pre-wrap border border-emerald-100/50">
                                            {caseData.treatment_instructions}
                                        </div>
                                    </div>
                                )}

                                {caseData.provider_notes && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2 mt-6">General Clinical Notes</h4>
                                        <div className="p-4 border border-gray-100 rounded-2xl text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                            {caseData.provider_notes}
                                        </div>
                                    </div>
                                )}

                                {!caseData.diagnosis_notes && !caseData.treatment_instructions && !caseData.provider_notes && (
                                     <div className="p-4 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-sm">
                                         No physician report recorded for this case.
                                     </div>
                                )}
                            </div>
                        </div>

                        {/* AI Summary Background */}
                        {parsed_ai_summary && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-primary/10">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">AI Consultation Analysis</h3>
                                    <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase">System Generated</span>
                                </div>

                                <div className="space-y-5">
                                    {parsed_ai_summary.case_summary && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Session Summary</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">{parsed_ai_summary.case_summary}</p>
                                        </div>
                                    )}
                                    {parsed_ai_summary.possible_diagnosis && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Automated Differential</h4>
                                            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">{parsed_ai_summary.possible_diagnosis}</p>
                                        </div>
                                    )}
                                    {parsed_ai_summary.consultation_description && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Complaint Highlights</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-primary/30 pl-3">{parsed_ai_summary.consultation_description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Attachments Content */}
                    <div className="space-y-6">
                        {caseData.lab_test_required && (
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl p-6 shadow-sm border border-orange-200">
                                <h3 className="text-base font-bold text-orange-900 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-orange-600" />
                                    Lab Tests Requested
                                </h3>
                                <div className="p-4 bg-white/60 rounded-2xl border border-orange-100">
                                    <p className="text-sm text-orange-900 font-medium leading-relaxed whitespace-pre-wrap">
                                        {caseData.required_lab_tests || 'Standard panel required'}
                                    </p>
                                </div>
                                <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm text-sm h-10">
                                    <Download size={16} className="mr-2" /> Download Requisition
                                </Button>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-gray-400" />
                                Documents & Attachments
                            </h3>
                            
                            <div className="space-y-3">
                                {caseData.treatment_instructions && (
                                     <Button variant="outline" className="w-full justify-start text-sm text-gray-600 h-11 rounded-xl group transition-all">
                                        <FileText size={16} className="mr-2 text-primary group-hover:text-primary transition-colors" />
                                        <span>Official Prescription</span>
                                        <Download size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                )}
                                
                                {caseData.id && (
                                    <Button variant="outline" className="w-full justify-start text-sm text-gray-600 h-11 rounded-xl group transition-all">
                                        <FileText size={16} className="mr-2 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                                        <span>Visit Summary PDF</span>
                                        <Download size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                )}
                                
                                {!caseData.treatment_instructions && !caseData.lab_test_required && (
                                     <div className="text-center py-4 bg-gray-50 rounded-2xl border border-gray-100">
                                         <p className="text-xs text-gray-500 font-medium">No documents available</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Schedule Follow-up</h3>
                        <p className="text-sm text-gray-500 mb-6">Select a date and time for the follow-up consultation with {patientName}.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleScheduleFollowUp} disabled={scheduling || !followUpDate}>
                                {scheduling ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
