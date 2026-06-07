'use client';

import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    FileText, 
    Calendar, 
    Search, 
    Filter, 
    User, 
    CheckCircle, 
    ShieldAlert, 
    Heart, 
    ClipboardList,
    TrendingUp,
    Send,
    Clock,
    ArrowLeft,
    PhoneCall,
    Eye,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function DoctorFollowUpsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [responses, setResponses] = useState<Record<string, any>>({});
    
    // Filter and search states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Scheduled' | 'Awaiting Patient Response' | 'Completed' | 'Escalated' | 'Missed'>('ALL');

    // Action variables
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch follow up schedules with patient profiles
            const { data: fupData, error: fupErr } = await (supabase as any)
                .from('follow_up_schedules')
                .select('*, patient:profiles(id, full_name, med_id, phone, email)')
                .order('scheduled_at', { ascending: false });

            if (fupErr) throw fupErr;
            setFollowUps(fupData || []);

            // Fetch corresponding responses
            if (fupData && fupData.length > 0) {
                const fupIds = fupData.map((f: any) => f.id);
                const { data: respData } = await (supabase as any)
                    .from('follow_up_responses')
                    .select('*')
                    .in('follow_up_id', fupIds);
                
                const respMap: Record<string, any> = {};
                (respData || []).forEach((r: any) => {
                    respMap[r.follow_up_id] = r;
                });
                setResponses(respMap);
            }
        } catch (err) {
            console.error('Error loading follow-ups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (fup: any) => {
        setSendingReminderId(fup.id);
        try {
            // Log user notification
            const { error: notifErr } = await (supabase as any)
                .from('user_notifications')
                .insert({
                    user_id: fup.patient_id,
                    title: `🚨 Care Follow-Up Reminder: ${fup.follow_up_type.toUpperCase()}`,
                    message: `Please complete your outstanding checklist log. Details: ${fup.details?.questions?.[0] || 'Check status'}`,
                    action_url: '/dashboard/emr'
                });

            if (notifErr) throw notifErr;

            // Update status to Awaiting Patient Response
            const { error: updateErr } = await (supabase as any)
                .from('follow_up_schedules')
                .update({ 
                    status: 'Awaiting Patient Response',
                    updated_at: new Date().toISOString()
                })
                .eq('id', fup.id);

            if (updateErr) throw updateErr;

            alert(`Reminder sent successfully to ${fup.patient?.full_name || 'Patient'}!`);
            fetchFollowUps();
        } catch (e: any) {
            console.error('Failed to send reminder:', e);
            alert(`Failed to send reminder: ${e.message}`);
        } finally {
            setSendingReminderId(null);
        }
    };

    // Computations
    const totalCount = followUps.length;
    const completedCount = followUps.filter(f => f.status === 'Completed').length;
    const escalatedCount = followUps.filter(f => f.status === 'Escalated').length;
    const missedCount = followUps.filter(f => f.status === 'Missed' || (f.status === 'Scheduled' && new Date(f.scheduled_at).getTime() < Date.now())).length;
    const pendingCount = followUps.filter(f => f.status === 'Scheduled' || f.status === 'Awaiting Patient Response').length;

    const filteredFollowUps = followUps.filter(f => {
        // Search filter
        const patName = f.patient?.full_name?.toLowerCase() || '';
        const patId = f.patient?.med_id?.toLowerCase() || '';
        const fupType = f.follow_up_type?.toLowerCase() || '';
        const matchesSearch = patName.includes(searchQuery.toLowerCase()) || 
                              patId.includes(searchQuery.toLowerCase()) || 
                              fupType.includes(searchQuery.toLowerCase());
        
        // Status filter
        if (statusFilter === 'ALL') return matchesSearch;
        if (statusFilter === 'Missed') {
            const isMissed = f.status === 'Missed' || (f.status === 'Scheduled' && new Date(f.scheduled_at).getTime() < Date.now());
            return matchesSearch && isMissed;
        }
        return matchesSearch && f.status === statusFilter;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing follow-up dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/staff">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <Activity size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">MedLud Care Continuity Control</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Follow-Up Care Dashboard</h1>
                            <p className="text-xs text-slate-500">Intelligent post-consultation health monitoring and patient response escalation.</p>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Schedules</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-1">{totalCount}</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
                            <ClipboardList size={16} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wider">Active Escalated</p>
                            <p className="text-xl font-extrabold text-rose-600 mt-1">{escalatedCount}</p>
                        </div>
                        <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 border border-rose-100 animate-pulse">
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">Missed logs</p>
                            <p className="text-xl font-extrabold text-orange-600 mt-1">{missedCount}</p>
                        </div>
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">Pending Checks</p>
                            <p className="text-xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
                        </div>
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Completed Care</p>
                            <p className="text-xl font-extrabold text-emerald-600 mt-1">{completedCount}</p>
                        </div>
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <CheckCircle size={16} />
                        </div>
                    </div>
                </div>

                {/* Filters and search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name, MED-ID, or follow-up type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs border border-gray-100 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full sm:w-44 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Awaiting Patient Response">Awaiting Response</option>
                            <option value="Completed">Completed</option>
                            <option value="Escalated">Escalated</option>
                            <option value="Missed">Missed</option>
                        </select>
                    </div>
                </div>

                {/* Follow-up lists */}
                {filteredFollowUps.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <ClipboardList className="mx-auto text-slate-200 mb-3" size={48} />
                        <p className="text-slate-700 font-bold text-sm">No follow-up schedules found</p>
                        <p className="text-slate-400 text-xs mt-1">Try updating your status filters or search query.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFollowUps.map(fup => {
                            const response = responses[fup.id];
                            const isMissed = fup.status === 'Scheduled' && new Date(fup.scheduled_at).getTime() < Date.now();
                            return (
                                <div key={fup.id} className={`bg-white p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                                    fup.status === 'Escalated' ? 'border-rose-200 bg-rose-50/10' :
                                    isMissed ? 'border-orange-200 bg-orange-50/10' : 'border-gray-100'
                                }`}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1">
                                            {/* Top badges */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                                                    {fup.follow_up_type.replace('_', ' ')}
                                                </span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                                    fup.status === 'Escalated' ? 'bg-rose-100 text-rose-800' :
                                                    isMissed ? 'bg-orange-100 text-orange-800' :
                                                    fup.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {isMissed ? 'Missed' : fup.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> Target: {new Date(fup.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </span>
                                            </div>

                                            {/* Patient info */}
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">{fup.patient?.full_name || 'Patient'}</h3>
                                                <p className="text-[10px] text-slate-400 font-medium">MED-ID: {fup.patient?.med_id || '--'} • Phone: {fup.patient?.phone || '--'}</p>
                                            </div>

                                            {/* Checklist questions */}
                                            <div className="space-y-1.5 pl-3 border-l-2 border-slate-200 text-xs">
                                                <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Scheduled Questions</p>
                                                {(fup.details?.questions || []).map((q: string, i: number) => (
                                                    <p key={i} className="text-slate-600">❓ {q}</p>
                                                ))}
                                            </div>

                                            {/* Patient response if completed or escalated */}
                                            {response && (
                                                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3 text-xs">
                                                    <h4 className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider">Patient Response Log</h4>
                                                    
                                                    {/* Med Adherence Check */}
                                                    {response.response_data?.adherence !== undefined && (
                                                        <p className="font-bold">
                                                            Medication Taken: <span className={response.response_data.adherence ? 'text-emerald-600' : 'text-rose-600'}>
                                                                {response.response_data.adherence ? 'Confirmed Yes' : 'No'}
                                                            </span>
                                                        </p>
                                                    )}

                                                    {/* Specific Answers */}
                                                    {response.response_data?.answers && (
                                                        <div className="space-y-2">
                                                            {response.response_data.answers.map((ans: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100">
                                                                    <p className="font-bold text-slate-500 text-[10px]">Q: {ans.question}</p>
                                                                    <p className="font-semibold text-slate-700 mt-0.5">A: {ans.answer}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Notes and Severity */}
                                                    <div className="flex flex-col sm:flex-row gap-4 pt-1 text-[11px]">
                                                        <p className="flex-[2] text-slate-600 italic">"{response.notes || 'No additional comment log.'}"</p>
                                                        <div className="flex-1 text-right sm:text-right font-bold text-slate-700">
                                                            Symptom Severity: <span className={
                                                                response.symptom_severity === 'Severe' ? 'text-rose-600' :
                                                                response.symptom_severity === 'Moderate' ? 'text-orange-600' : 'text-slate-600'
                                                            }>{response.symptom_severity}</span>
                                                        </div>
                                                    </div>

                                                    {/* Attached document link */}
                                                    {response.file_url && (
                                                        <a 
                                                            href={response.file_url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-all pt-1"
                                                        >
                                                            <Eye size={12} /> View Attached File
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex md:flex-col gap-2 w-full md:w-44 self-stretch justify-end md:justify-start">
                                            <Link href={`/dashboard/staff/emr/${fup.patient_id}`} className="w-full">
                                                <button className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 py-2.5 rounded-xl transition-all border border-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer">
                                                    <FileText size={14} /> Open EMR Profile
                                                </button>
                                            </Link>
                                            
                                            {fup.status !== 'Completed' && (
                                                <button
                                                    onClick={() => handleSendReminder(fup)}
                                                    disabled={sendingReminderId === fup.id}
                                                    className="w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                                >
                                                    <Send size={14} /> 
                                                    {sendingReminderId === fup.id ? 'Sending...' : 'Send Reminder'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
