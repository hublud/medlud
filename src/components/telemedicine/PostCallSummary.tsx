import React, { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface PostCallSummaryProps {
    callId: string;
    onReturnHome: () => void;
}

export const PostCallSummary: React.FC<PostCallSummaryProps> = ({ callId, onReturnHome }) => {
    const [loading, setLoading] = useState(true);
    const [callData, setCallData] = useState<any>(null);

    useEffect(() => {
        if (!callId) {
            setLoading(false);
            return;
        }

        async function fetchCallDetails() {
            try {
                // Fetch basic call data first to avoid join issues if RLS is strict
                const { data, error } = await supabase
                    .from('telemedicine_calls')
                    .select(`
                        provider_id,
                        provider_notes,
                        ai_summary
                    `)
                    .eq('id', callId)
                    .single();

                if (error) {
                    console.error('Telemedicine Fetch Error:', JSON.stringify(error, null, 2));
                    throw error;
                }

                if (data && data.provider_id) {
                    // Fetch provider name separately to be safer with joins
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', data.provider_id)
                        .single();

                    setCallData({ ...data, provider: profile });
                } else {
                    setCallData(data);
                }

            } catch (error: any) {
                console.error('Full Error Details:', error);
                const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown database error');
                console.error('Fetch Failed:', errorMsg);
            } finally {
                setLoading(false);
            }
        }

        fetchCallDetails();
    }, [callId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-text-secondary">Retrieving session summary...</p>
            </div>
        );
    }

    const doctorName = callData?.provider?.full_name || 'your medical professional';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-green-500 mb-2">
                <CheckCircle size={64} className="mx-auto" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary">Call Completed</h2>
                <p className="text-text-secondary">
                    Your session with {doctorName} has ended.
                </p>
            </div>

            <div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-border shadow-sm text-left space-y-6">
                <div>
                    <h3 className="font-bold text-text-primary border-b border-border pb-3 mb-4 uppercase text-xs tracking-widest">
                        Professional Notes
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {callData?.provider_notes || "Your doctor hasn't submitted notes for this session yet."}
                    </p>
                </div>

                {callData?.ai_summary && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">AI Clinical Summary</h4>
                        <p className="text-sm text-gray-700 italic">
                            {callData.ai_summary}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button
                    variant="outline"
                    className="flex-1 justify-center rounded-xl h-12"
                    onClick={onReturnHome}
                >
                    <Home size={18} className="mr-2" />
                    Return to Dashboard
                </Button>

                <Link href="/dashboard/appointments/book" className="flex-1">
                    <Button className="w-full justify-center rounded-xl h-12 shadow-lg shadow-primary/20">
                        <Calendar size={18} className="mr-2" />
                        Book Follow-up
                    </Button>
                </Link>
            </div>
        </div>
    );
};
