import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    X, 
    FileText, 
    Download, 
    Loader2, 
    CheckCircle,
    User,
    Clipboard
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReviewResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: {
        id: string;
        file_url: string;
        file_name: string | null;
        result_type: string;
        created_at: string;
        patient_id: string;
        referral_request_id: string | null;
        patient?: {
            full_name: string;
        };
        referral_request?: {
            request_type: string;
            clinical_notes: string;
        };
    };
    doctorId: string;
    appointmentId?: string;
    callId?: string;
    onSuccess: () => void;
}

export const ReviewResultModal: React.FC<ReviewResultModalProps> = ({
    isOpen,
    onClose,
    result,
    doctorId,
    appointmentId,
    callId,
    onSuccess
}) => {
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewNotes.trim()) return alert('Please enter review notes.');

        setSubmitting(true);
        try {
            const timestamp = new Date().toISOString();

            // 1. Update uploaded results status
            const { error: updateError } = await (supabase as any)
                .from('uploaded_medical_results')
                .update({
                    status: 'reviewed',
                    doctor_review_notes: reviewNotes,
                    reviewed_at: timestamp,
                    doctor_id: doctorId
                })
                .eq('id', result.id);

            if (updateError) throw updateError;

            // 2. Log referral update (complete referral request if linked)
            if (result.referral_request_id) {
                await (supabase as any)
                    .from('referral_requests')
                    .update({ status: 'completed' })
                    .eq('id', result.referral_request_id);
            }

            // 3. Log to referral_logs
            await (supabase as any)
                .from('referral_logs')
                .insert([{
                    referral_request_id: result.referral_request_id,
                    doctor_id: doctorId,
                    patient_id: result.patient_id,
                    event_type: 'reviewed_by_doctor',
                    details: {
                        uploaded_result_id: result.id,
                        result_type: result.result_type,
                        doctor_review_notes: reviewNotes,
                        timestamp: timestamp
                    }
                }]);

            // 4. Post review message in Chat
            const notificationMsg = `📋 Results Reviewed: Dr. reviewed your uploaded ${result.result_type.replace('_', ' ').toUpperCase()}.\n` +
                `✍️ Doctor Notes: ${reviewNotes}`;

            if (appointmentId) {
                await (supabase as any)
                    .from('messages')
                    .insert([{
                        appointment_id: appointmentId,
                        sender_id: doctorId,
                        role: 'DOCTOR',
                        content: notificationMsg
                    }]);
            }

            if (callId) {
                await (supabase as any)
                    .from('session_messages')
                    .insert([{
                        consultation_id: callId,
                        sender_id: doctorId,
                        content: notificationMsg
                    }]);
            }

            alert('Review submitted successfully!');
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Error submitting review:', err);
            alert(`Failed to save review: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const isImage = result.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i) !== null || 
                    result.file_url.includes('lab-results'); // Default public url check

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-250">
                
                {/* Left side: Result Preview */}
                <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-center items-center relative min-h-[300px] md:min-h-0">
                    <h3 className="absolute top-4 left-4 text-xs font-bold text-white/60 uppercase tracking-widest">Medical Document Preview</h3>
                    
                    {isImage ? (
                        <div className="w-full h-full max-h-[50vh] md:max-h-full flex items-center justify-center rounded-2xl overflow-hidden p-2">
                            <img 
                                src={result.file_url} 
                                alt="Medical Result Document" 
                                className="max-w-full max-h-full object-contain rounded-xl border border-white/10"
                            />
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-sm">
                            <FileText className="text-primary mx-auto mb-4" size={48} />
                            <p className="text-white font-bold text-sm truncate">{result.file_name || 'Medical Document'}</p>
                            <p className="text-xs text-white/50 mt-1">PDF or Binary document type</p>
                            <a 
                                href={result.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold mt-4 hover:bg-primary-hover shadow-lg"
                            >
                                <Download size={14} /> Open in New Tab
                            </a>
                        </div>
                    )}
                </div>

                {/* Right side: Clinical Review Panel */}
                <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-slate-200 flex flex-col max-h-[50vh] md:max-h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
                        <div>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold uppercase px-2 py-0.5 rounded">
                                {result.result_type.replace('_', ' ')}
                            </span>
                            <h2 className="text-base font-extrabold text-slate-900 mt-1">Clinical Review Form</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-slate-150 rounded-full transition-colors">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Scrollable Form */}
                    <form onSubmit={handleSubmitReview} className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            {/* Patient info */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1.5 text-xs">
                                <p className="text-slate-400 font-bold uppercase tracking-wider">Patient Name</p>
                                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                    <User size={14} className="text-primary" /> {result.patient?.full_name || 'Patient'}
                                </p>
                                {result.referral_request && (
                                    <div className="pt-2.5 border-t border-slate-200 mt-2 space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider">Initial Requisition</p>
                                        <p className="font-semibold text-slate-800 capitalize">{result.referral_request.request_type} Referral</p>
                                        <p className="text-slate-500 italic mt-1 leading-normal">"{result.referral_request.clinical_notes || 'No notes provided'}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Review entry */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Clinical Notes & Interpretation *</label>
                                <textarea
                                    required
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    placeholder="Enter your clinical interpretation, changes in treatment instructions, or diagnosis feedback..."
                                    rows={5}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                            >
                                {submitting ? (
                                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                ) : (
                                    <><CheckCircle size={14} /> Submit Review</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};
