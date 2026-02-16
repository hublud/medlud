import React, { useState } from 'react';
import { ClipboardList, Send, Loader2, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PostCallReportProps {
    call: {
        id: string;
        patient_id: string;
        duration: number;
        patient_name?: string;
    };
    onSubmit: (notes: string) => Promise<void>;
    onDiscard: () => void;
}

export const PostCallReport: React.FC<PostCallReportProps> = ({ call, onSubmit, onDiscard }) => {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(notes);
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
                        <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-bold text-gray-700">Clinical Notes</label>
                            <textarea
                                id="notes"
                                className="w-full h-40 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm"
                                placeholder="Describe the patient's condition, advice given, and any recommended follow-up..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
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
                                disabled={isSubmitting || !notes.trim()}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 animate-spin" size={20} /> Generating Summary...</>
                                ) : (
                                    <><Send className="mr-2" size={20} /> Submit Report</>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
