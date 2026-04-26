'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Banknote, Clock, CheckCircle2, Calendar, Landmark } from 'lucide-react';

export const DoctorPayments = () => {
    const { user } = useAuth();
    const [payouts, setPayouts] = useState<any[]>([]);
    const [pendingEarnings, setPendingEarnings] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPayoutHistory();
            fetchPendingEarnings();
        }
    }, [user]);

    const fetchPendingEarnings = async () => {
        try {
            // Fetch all commission_records for this doctor where status is pending
            // We need to join with consultations to verify the doctor_id
            const { data, error } = await supabase
                .from('commission_records')
                .select(`
                    doctor_amount,
                    consultation:consultation_id (doctor_id)
                `)
                .eq('payout_status', 'pending');

            if (data) {
                const total = data
                    .filter((r: any) => r.consultation?.doctor_id === user?.id)
                    .reduce((sum: number, r: any) => sum + (r.doctor_amount || 0), 0);
                setPendingEarnings(total);
            }
        } catch (error) {
            console.error('Error fetching pending earnings:', error);
        }
    };

    const fetchPayoutHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctor_payouts')
                .select('*')
                .eq('doctor_id', user?.id || '')
                .order('created_at', { ascending: false });

            if (data) setPayouts(data);
        } catch (error) {
            console.error('Error fetching payout history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center">
                <Clock className="animate-spin mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm">Loading payment history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600">
                        <Banknote size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                        <p className="text-sm text-gray-500 font-medium">View your processed weekly payouts</p>
                    </div>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Pending Earnings</p>
                        <h3 className="text-2xl font-black text-emerald-900">₦{pendingEarnings.toLocaleString()}</h3>
                        <p className="text-xs text-emerald-600/70 mt-1">To be settled in next cycle</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Paid to Date</p>
                        <h3 className="text-2xl font-black text-gray-900">
                            ₦{payouts.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{payouts.length} successful payouts</p>
                    </div>
                </div>

                {payouts.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Banknote size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-bold">No payouts recorded yet</p>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
                            Payments are processed weekly by the administration team.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white rounded-2xl border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payout Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm font-bold text-gray-900">
                                                    {new Date(p.created_at).toLocaleDateString('en-GB')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 pl-5">
                                                {new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-base font-black text-gray-900">
                                                ₦{Number(p.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                                <CheckCircle2 size={12} />
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-mono text-gray-400 group-hover:text-gray-600 transition-colors">
                                                #{p.id.slice(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Payout Information Notice */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                <div className="p-2 bg-blue-100 rounded-xl h-fit text-blue-600">
                    <Landmark size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-blue-900 mb-1">Payout Information</h3>
                    <p className="text-sm text-blue-700/80 leading-relaxed">
                        Weekly settlements are processed every Monday. Funds are sent to your verified bank account on file. 
                        If you notice any discrepancies, please contact us via call or WhatsApp on <strong>09025713908</strong> or email us at <strong>medlud@hublud.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};
