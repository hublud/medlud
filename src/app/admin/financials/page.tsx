'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
    Wallet,
    Banknote,
    Search,
    CheckCircle2,
    Clock,
    Activity,
    ArrowLeft,
    Landmark,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Types for Settlement Groups
type PendingSettlement = {
    doctorId: string;
    doctorName: string;
    totalAmount: number;
    commissionCount: number;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    commissionIds: string[];
};

type PayoutHistory = {
    id: string;
    doctorName: string;
    amount: number;
    status: string;
    created_at: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
};

export default function AdminFinancialsPage() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [pendingSettlements, setPendingSettlements] = useState<PendingSettlement[]>([]);
    const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
    const [processingPayouts, setProcessingPayouts] = useState<Record<string, boolean>>({});

    // Manual wallet credit state
    const [creditPanelOpen, setCreditPanelOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
    const [creditMode, setCreditMode] = useState<'reference' | 'manual'>('reference');
    const [creditRef, setCreditRef] = useState('');
    const [creditUserId, setCreditUserId] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [creditLoading, setCreditLoading] = useState(false);
    const [creditResult, setCreditResult] = useState<{ ok: boolean; message: string } | null>(null);

    useEffect(() => {
        // Only fetch when the user session is available so RLS policies allow the select
        if (profile) {
            fetchData();
            fetchAllUsers();
        }
    }, [activeTab, profile]);

    const fetchAllUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            if (error) {
                console.error("Error fetching users:", error);
            }
            if (data) {
                // Ensure array doesn't include entries with completely null full_name AND email to avoid blank dropdowns
                setAllUsers(data.map(u => ({ 
                    id: u.id, 
                    full_name: u.full_name || 'No Name', 
                    email: u.email || 'No Email' 
                })));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleWalletCredit = async () => {
        setCreditLoading(true);
        setCreditResult(null);
        try {
            const body: any = { admin_user_id: profile?.id };
            if (creditMode === 'reference') {
                body.reference = creditRef.trim();
                if (creditUserId) body.user_id = creditUserId; // fallback if metadata missing
            } else {
                body.user_id = creditUserId;
                body.amount = parseFloat(creditAmount);
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/admin/wallet-credit', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setCreditResult({ ok: true, message: data.message + ` New balance: ₦${Number(data.new_balance).toLocaleString()}` });
                setCreditRef('');
                setCreditAmount('');
            } else {
                setCreditResult({ ok: false, message: data.error || 'Something went wrong.' });
            }
        } catch (e: any) {
            setCreditResult({ ok: false, message: e.message });
        } finally {
            setCreditLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                await fetchPendingSettlements();
            } else {
                await fetchPayoutHistory();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingSettlements = async () => {
        // Fetch all pending commission records
        const { data: commissions, error: commError } = await supabase
            .from('commission_records')
            .select(`
                id,
                doctor_amount,
                consultation:consultation_id (
                    doctor_id
                )
            `)
            .eq('payout_status', 'pending');

        if (commError) {
            console.error('Error fetching pending commissions:', commError);
            return;
        }

        if (!commissions || commissions.length === 0) {
            setPendingSettlements([]);
            return;
        }

        // Group by doctor ID using explicit any casting to navigate jsonb paths safely
        const grouped: Record<string, PendingSettlement> = {};
        const doctorIds = new Set<string>();

        commissions.forEach((comm: any) => {
            const doctorId = comm.consultation?.doctor_id;
            if (!doctorId) return;

            doctorIds.add(doctorId);

            if (!grouped[doctorId]) {
                grouped[doctorId] = {
                    doctorId,
                    doctorName: 'Loading...',
                    totalAmount: 0,
                    commissionCount: 0,
                    bankName: null,
                    accountNumber: null,
                    accountName: null,
                    commissionIds: []
                };
            }

            grouped[doctorId].totalAmount += Number(comm.doctor_amount);
            grouped[doctorId].commissionCount += 1;
            grouped[doctorId].commissionIds.push(comm.id);
        });

        // Bulk fetch doctor profile and bank details
        if (doctorIds.size > 0) {
            const { data: doctorsInfo, error: docError } = await supabase
                .from('doctors')
                .select('id, bank_name, account_number, account_name, profiles!doctors_id_fkey(full_name)')
                .in('id', Array.from(doctorIds));

            if (!docError && doctorsInfo) {
                doctorsInfo.forEach((doc: any) => {
                    if (grouped[doc.id]) {
                        grouped[doc.id].doctorName = Array.isArray(doc.profiles) ? doc.profiles[0]?.full_name : (doc.profiles?.full_name || 'Unknown Doctor');
                        grouped[doc.id].bankName = doc.bank_name;
                        grouped[doc.id].accountNumber = doc.account_number;
                        grouped[doc.id].accountName = doc.account_name;
                    }
                });
            }
        }

        setPendingSettlements(Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount));
    };

    const fetchPayoutHistory = async () => {
        const { data: payouts, error } = await supabase
            .from('doctor_payouts')
            .select(`
                id, amount, status, created_at,
                doctor:profiles!doctor_id(full_name),
                doctor_details:doctors!doctor_id(bank_name, account_number, account_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payout history:', error);
            return;
        }

        const mappedHistory = (payouts || []).map((p: any) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            created_at: p.created_at,
            doctorName: Array.isArray(p.doctor) ? p.doctor[0]?.full_name : (p.doctor?.full_name || 'Unknown'),
            bankName: p.doctor_details?.bank_name,
            accountNumber: p.doctor_details?.account_number,
            accountName: p.doctor_details?.account_name
        }));

        setPayoutHistory(mappedHistory);
    };

    const handleMarkAsPaid = async (settlement: PendingSettlement) => {
        if (!confirm(`Are you sure you want to mark ₦${settlement.totalAmount.toLocaleString()} as paid for ${settlement.doctorName}?`)) return;

        setProcessingPayouts(prev => ({ ...prev, [settlement.doctorId]: true }));

        try {
            // 1. Create a doctor_payout record
            const { data: payoutData, error: payoutError } = await supabase
                .from('doctor_payouts')
                .insert({
                    doctor_id: settlement.doctorId,
                    amount: settlement.totalAmount,
                    status: 'completed'
                })
                .select('id')
                .single();

            if (payoutError || !payoutData) throw payoutError;

            // 2. Update all associated commission_records
            const { error: updateError } = await supabase
                .from('commission_records')
                .update({
                    payout_status: 'paid',
                    payout_id: payoutData.id
                })
                .in('id', settlement.commissionIds);

            if (updateError) throw updateError;

            // Remove from local state
            setPendingSettlements(prev => prev.filter(s => s.doctorId !== settlement.doctorId));
            alert('Payout marked successfully.');
        } catch (error: any) {
            console.error('Error settling payout:', error);
            alert('Failed to process payout. Please try again.');
        } finally {
            setProcessingPayouts(prev => ({ ...prev, [settlement.doctorId]: false }));
        }
    };

    const filteredPending = pendingSettlements.filter(s =>
        s.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.accountName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = payoutHistory.filter(h =>
        h.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Banknote size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Administration</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Financial Reports & Payouts</h1>
                        <p className="text-gray-500">Manage doctor settlements and review financial history.</p>
                    </div>

                    <Link href="/admin">
                        <Button variant="outline" className="bg-white border-gray-200">
                            <ArrowLeft size={16} className="mr-2" /> Back to Admin
                        </Button>
                    </Link>
                </div>

                {/* Manual Wallet Credit Panel */}
                <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        onClick={() => setCreditPanelOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <ShieldCheck size={18} className="text-amber-700" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-sm">Manual Wallet Credit</p>
                                <p className="text-xs text-gray-500">Apply a missed top-up by Flutterwave tx_ref or direct amount</p>
                            </div>
                        </div>
                        {creditPanelOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {creditPanelOpen && (
                        <div className="border-t border-amber-100 p-6 space-y-5">
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
                                <button
                                    onClick={() => setCreditMode('reference')}
                                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                                        creditMode === 'reference' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    By Flutterwave Reference
                                </button>
                                <button
                                    onClick={() => setCreditMode('manual')}
                                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                                        creditMode === 'manual' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    Direct Manual Credit
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {creditMode === 'reference' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Flutterwave tx_ref *</label>
                                        <input
                                            type="text"
                                            value={creditRef}
                                            onChange={e => setCreditRef(e.target.value)}
                                            placeholder="e.g. re_abc123def456"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none font-mono"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Auto-detects user &amp; amount from Flutterwave. Add user below only if metadata missing.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                        {creditMode === 'reference' ? 'User Override (optional)' : 'User *'}
                                    </label>
                                    <select
                                        value={creditUserId}
                                        onChange={e => setCreditUserId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none"
                                    >
                                        <option value="">-- Select a user --</option>
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                {creditMode === 'manual' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Amount (₦) *</label>
                                        <input
                                            type="number"
                                            value={creditAmount}
                                            onChange={e => setCreditAmount(e.target.value)}
                                            placeholder="e.g. 5000"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none"
                                            min="1"
                                        />
                                    </div>
                                )}
                            </div>

                            {creditResult && (
                                <div className={`text-sm px-4 py-3 rounded-xl font-medium ${
                                    creditResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                    {creditResult.ok ? '✓ ' : '✗ '}{creditResult.message}
                                </div>
                            )}

                            <button
                                onClick={handleWalletCredit}
                                disabled={creditLoading || (creditMode === 'reference' ? !creditRef.trim() : !creditUserId || !creditAmount)}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {creditLoading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                                {creditLoading ? 'Processing...' : 'Apply Wallet Credit'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button
                            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'pending'
                                    ? 'text-primary border-b-2 border-primary bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('pending')}
                        >
                            <Clock size={16} /> Pending Settlements
                        </button>
                        <button
                            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'history'
                                    ? 'text-primary border-b-2 border-primary bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('history')}
                        >
                            <CheckCircle2 size={16} /> Payout History
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'pending' ? 'pending settlements' : 'payout history'} by doctor name...`}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                                    {activeTab === 'pending' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Details</th>}
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'pending' ? 'Total Pending' : 'Amount Paid'}
                                    </th>
                                    {activeTab === 'history' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Date</th>}
                                    {activeTab === 'pending' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="animate-spin text-primary" size={32} />
                                                <span className="text-sm text-gray-400">Loading financials...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : activeTab === 'pending' && filteredPending.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 font-medium">All settled up! No pending commissions found.</p>
                                        </td>
                                    </tr>
                                ) : activeTab === 'history' && filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 font-medium">No past payouts found.</p>
                                        </td>
                                    </tr>
                                ) : activeTab === 'pending' ? (
                                    // PENDING ROWS
                                    filteredPending.map(settlement => (
                                        <tr key={settlement.doctorId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-gray-900">{settlement.doctorName}</p>
                                                <p className="text-xs text-gray-500 font-medium mt-1">
                                                    {settlement.commissionCount} unpaid sessions
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <Landmark size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                    {settlement.bankName || settlement.accountNumber ? (
                                                        <div className="flex items-center">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">{settlement.bankName}</p>
                                                                <p className="text-sm text-gray-600 font-mono tracking-wider">{settlement.accountNumber}</p>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{settlement.accountName}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            No Bank Details Saved
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-lg font-black text-emerald-600">
                                                    ₦{settlement.totalAmount.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-right space-x-2">
                                                <Button
                                                    onClick={() => handleMarkAsPaid(settlement)}
                                                    disabled={processingPayouts[settlement.doctorId] || !settlement.accountNumber}
                                                    className="bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {processingPayouts[settlement.doctorId] ? 'Processing...' : 'Mark as Paid'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    // HISTORY ROWS
                                    filteredHistory.map(history => (
                                        <tr key={history.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-gray-900">{history.doctorName}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{history.id.slice(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Landmark size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700">{history.bankName || 'N/A'}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono">{history.accountNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-lg font-black text-gray-900">
                                                    ₦{history.amount.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 size={14} />
                                                    {history.status}
                                                </span>
                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                    {new Date(history.created_at).toLocaleString('en-NG', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
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

