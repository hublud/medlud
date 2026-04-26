import React, { useState } from 'react';
import { ClipboardList, Send, Loader2, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PostCallReportProps {
    call: {
        id: string;
        patient_id: string;
        duration: number;
        patient_name?: string;
        ai_summary_prefilled?: any;
    };
    onSubmit: (report: any) => Promise<void>;
    onDiscard: () => void;
}

export const PostCallReport: React.FC<PostCallReportProps> = ({ call, onSubmit, onDiscard }) => {
    // Determine initial AI summary strings if present
    const initialAi = call.ai_summary_prefilled || {};
    
    // Convert initial AI summary to manageable states
    const [aiCaseSummary, setAiCaseSummary] = useState(initialAi.case_summary || '');
    const [aiPossibleDiagnosis, setAiPossibleDiagnosis] = useState(initialAi.possible_diagnosis || '');
    const [aiConsultDescription, setAiConsultDescription] = useState(initialAi.consultation_description || '');

    const [providerNotes, setProviderNotes] = useState('');
    const [diagnosisNotes, setDiagnosisNotes] = useState('');
    const [treatmentInstructions, setTreatmentInstructions] = useState('');
    const [labTestRequired, setLabTestRequired] = useState(false);
    const [requiredLabTests, setRequiredLabTests] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Package the report details
            const report = {
                ai_summary: JSON.stringify({
                    case_summary: aiCaseSummary,
                    possible_diagnosis: aiPossibleDiagnosis,
                    consultation_description: aiConsultDescription
                }),
                provider_notes: providerNotes,
                diagnosis_notes: diagnosisNotes,
                treatment_instructions: treatmentInstructions,
                lab_test_required: labTestRequired,
                required_lab_tests: requiredLabTests
            };

            await onSubmit(report);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-primary p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ClipboardList size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Post-Call Summary</h2>
                    <p className="text-white/80 text-sm">Session completed. Please document your findings.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <User size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Patient</p>
                                <p className="text-sm font-bold text-gray-900">{call.patient_name || 'Patient'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                                <Clock size={12} /> Duration
                            </p>
                            <p className="text-sm font-bold text-gray-900">{formatDuration(call.duration)}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* AI Summary Section */}
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-between">
                                    AI-Generated Call Summary
                                    <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px]">Editable</span>
                                </h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Case Summary</label>
                                        <textarea
                                            className="w-full p-2 text-sm rounded-lg border border-primary/20 focus:ring-1 focus:ring-primary outline-none"
                                            rows={2}
                                            value={aiCaseSummary}
                                            onChange={e => setAiCaseSummary(e.target.value)}
                                            placeholder="Transcript generated summary..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Possible Diagnosis (AI)</label>
                                        <input
                                            className="w-full p-2 text-sm rounded-lg border border-primary/20 focus:ring-1 focus:ring-primary outline-none"
                                            value={aiPossibleDiagnosis}
                                            onChange={e => setAiPossibleDiagnosis(e.target.value)}
                                            placeholder="Potential diagnosis..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Consultation Description</label>
                                        <input
                                            className="w-full p-2 text-sm rounded-lg border border-primary/20 focus:ring-1 focus:ring-primary outline-none"
                                            value={aiConsultDescription}
                                            onChange={e => setAiConsultDescription(e.target.value)}
                                            placeholder="Description..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Doctor Input Section */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">Official Diagnosis Notes</label>
                                    <textarea
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                        rows={2}
                                        value={diagnosisNotes}
                                        onChange={e => setDiagnosisNotes(e.target.value)}
                                        placeholder="Enter definitive diagnosis or differential diagnosis..."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">Treatment & Prescriptions</label>
                                    <textarea
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                        rows={3}
                                        value={treatmentInstructions}
                                        onChange={e => setTreatmentInstructions(e.target.value)}
                                        placeholder="Medications to prescribe, dosage, general advice..."
                                    />
                                </div>

                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                                            checked={labTestRequired}
                                            onChange={(e) => setLabTestRequired(e.target.checked)}
                                        />
                                        <span className="text-sm font-bold text-orange-900">Request Lab Tests</span>
                                    </label>
                                    
                                    {labTestRequired && (
                                        <textarea
                                            className="w-full mt-2 p-2 rounded-lg border border-orange-200 focus:ring-1 focus:ring-orange-500 outline-none text-sm bg-white"
                                            rows={2}
                                            value={requiredLabTests}
                                            onChange={e => setRequiredLabTests(e.target.value)}
                                            placeholder="Specify Required Tests (e.g., FBC, Malaria parasite, Widal test)..."
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">General Provider Notes (Internal)</label>
                                    <textarea
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                        rows={2}
                                        value={providerNotes}
                                        onChange={e => setProviderNotes(e.target.value)}
                                        placeholder="Private notes strictly for clinic records..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 rounded-2xl text-base font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                                onClick={onDiscard}
                                disabled={isSubmitting}
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2] h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 animate-spin" size={20} /> Saving Report...</>
                                ) : (
                                    <><Send className="mr-2" size={20} /> Submit Final Report</>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
