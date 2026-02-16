'use client';

import React from 'react';
import { Sparkles, Stethoscope, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { aiService } from '@/services/aiService';

interface AISummaryCardProps {
    consultationText: string;
    loading?: boolean;
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ consultationText, loading }) => {
    const [analysis, setAnalysis] = React.useState<{
        chiefComplaint: string;
        detectedSymptoms: string[];
        riskLevel: RiskLevel;
        suggestedActions: string[];
    }>({
        chiefComplaint: 'Analyzing...',
        detectedSymptoms: [],
        riskLevel: 'LOW',
        suggestedActions: []
    });
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    React.useEffect(() => {
        let isMounted = true;

        const performAnalysis = async () => {
            if (!consultationText) return;

            setIsAnalyzing(true);
            try {
                const result = await aiService.analyzeConsultation(consultationText);
                if (isMounted) {
                    setAnalysis(result);
                }
            } catch (error) {
                console.error("Analysis failed", error);
                if (isMounted) {
                    setAnalysis({
                        chiefComplaint: 'Analysis Failed',
                        detectedSymptoms: [],
                        riskLevel: 'LOW',
                        suggestedActions: ['Consultation text could not be analyzed']
                    });
                }
            } finally {
                if (isMounted) setIsAnalyzing(false);
            }
        };

        performAnalysis();

        return () => { isMounted = false; };
    }, [consultationText]);

    const isLoading = loading || isAnalyzing;


    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="text-indigo-400 animate-spin" size={20} />
                    <div className="h-4 w-32 bg-indigo-200 rounded" />
                </div>
                <div className="space-y-3">
                    <div className="h-3 w-full bg-indigo-100 rounded" />
                    <div className="h-3 w-2/3 bg-indigo-100 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-white to-neutral-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
            {/* Live Indicator */}
            <div className="absolute top-0 right-0 p-2">
                <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/30">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Live Analysis</span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                        <Sparkles className="text-indigo-600" size={16} />
                    </div>
                    AI Insights
                </h3>
                <div className={`
                    text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm
                    ${analysis.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                        analysis.riskLevel === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'}
                `}>
                    {analysis.riskLevel} PRIORITY
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block ml-1 underline decoration-indigo-100 decoration-2 underline-offset-4">Chief Complaint</label>
                    <p className="font-bold text-gray-800 flex items-center gap-2.5 text-sm">
                        <Stethoscope size={18} className="text-indigo-300" />
                        {analysis.chiefComplaint}
                    </p>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5 block ml-1">Clinical Markers</label>
                    <div className="flex flex-wrap gap-2">
                        {analysis.detectedSymptoms.length > 0 ? (
                            analysis.detectedSymptoms.map((sym, idx) => (
                                <span key={idx} className="bg-white border border-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm">
                                    {sym}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 text-xs italic ml-1">Awaiting more clinical data...</span>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-indigo-50 shadow-inner">
                    <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <Activity size={14} className="text-indigo-600" />
                        AI Agent Advice
                    </label>
                    <ul className="space-y-2.5">
                        {analysis.suggestedActions.map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-700 font-medium flex items-start gap-3">
                                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                {action}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-5 pt-3 border-t border-indigo-50 flex items-center justify-center gap-1.5">
                <Sparkles size={10} className="text-indigo-300" />
                <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                    Agent-level monitoring active
                </p>
            </div>
        </div>
    );
};
