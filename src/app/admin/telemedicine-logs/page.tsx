'use client';

import React, { useState, useEffect } from 'react';
import {
    Phone,
    Video,
    User,
    Clock,
    Calendar,
    ClipboardList,
    Search,
    ChevronRight,
    Filter,
    FileText,
    Activity,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/dashboard/Header';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TelemedicineLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        try {
            setLoading(true);
            // Fetch calls with patient and provider profile details
            const { data, error } = await supabase
                .from('telemedicine_calls')
                .select(`
          *,
          patient:patient_id(full_name, med_id),
          provider:provider_id(full_name),
          ai_summary,
          provider_notes
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const filteredLogs = logs.filter(log =>
        log.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.patient?.med_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.provider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Activity size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Administration</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Telemedicine Call Logs</h1>
                        <p className="text-gray-500">Monitor and review all medical consultation sessions.</p>
                    </div>

                    <Link href="/admin">
                        <Button variant="outline" className="bg-white border-gray-200">
                            <ArrowLeft size={16} className="mr-2" /> Back to Admin
                        </Button>
                    </Link>
                </div>

                {/* Selected Log Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
                            <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Session Details</h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                            {new Date(selectedLog.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => setSelectedLog(null)} className="h-10 w-10 p-0 rounded-full hover:bg-gray-100">
                                    <Search className="rotate-45" size={20} />
                                </Button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Patient</p>
                                        <p className="text-sm font-bold text-gray-900 text-center">{selectedLog.patient?.full_name}</p>
                                        <p className="text-[10px] font-medium text-primary text-center">MID: {selectedLog.patient?.med_id}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Professional</p>
                                        <p className="text-sm font-bold text-gray-900 text-center">{selectedLog.provider?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 lg:col-span-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Duration</p>
                                        <p className="text-sm font-bold text-gray-900 text-center">{formatDuration(selectedLog.duration)}</p>
                                    </div>
                                </div>

                                {/* Summaries */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary">
                                            <FileText size={18} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">AI Clinical Summary</h3>
                                        </div>
                                        <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 text-sm leading-relaxed text-gray-700 italic">
                                            {selectedLog.ai_summary || "AI Summary not generated for this session."}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <ClipboardList size={18} />
                                            <h3 className="font-bold text-sm uppercase tracking-wider">Professional Notes</h3>
                                        </div>
                                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                            {selectedLog.provider_notes || "No professional notes provided."}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <Button variant="primary" onClick={() => setSelectedLog(null)} className="px-8 rounded-xl font-bold">
                                    Close Review
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by patient name, Med ID, or professional..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter size={18} />
                        More Filters
                    </Button>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Consultant</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Session</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Call Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="animate-spin text-primary" size={32} />
                                                <span className="text-sm text-gray-400">Loading call history...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <p className="text-gray-400">No call logs found matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{log.patient?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                                                            MID: {log.patient?.med_id || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-700">{log.provider?.full_name || 'Unassigned'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                                        <Clock size={12} className="text-gray-400" />
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {log.call_type === 'VIDEO' ? <Video size={14} className="text-primary" /> : <Phone size={14} className="text-primary" />}
                                                        <span className="text-xs font-bold text-gray-700">{log.call_type}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        Duration: {formatDuration(log.duration)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-all"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
