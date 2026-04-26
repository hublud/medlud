'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { WalletTopUp } from '@/components/wallet/WalletTopUp';

export default function PatientWalletPage() {
    const { profile, user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user]);

    const fetchWalletData = async () => {
        // Get fresh wallet balance
        const { data: profileData } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', user!.id)
            .single();

        if (profileData) setBalance(profileData.wallet_balance || 0);

        // Get wallet_transactions records (top-ups, wallet payments)
        const { data: txData } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get paid consultations for additional history
        const { data: consultData } = await supabase
            .from('consultations')
            .select('id, created_at, price, status, specialty_type, selected_type')
            .eq('user_id', user!.id)
            .in('status', ['active', 'completed'])
            .order('created_at', { ascending: false })
            .limit(20);

        // Build reference set from wallet_transactions to avoid duplicates
        const walletTxRefs = new Set((txData || []).map((t: any) => t.reference_id));

        // Map consultations into the same shape, only if not already in wallet_transactions
        const consultTx = (consultData || []).filter((c: any) => !walletTxRefs.has(`consult_${c.id}`)).map((c: any) => ({
            id: `consult_${c.id}`,
            type: c.specialty_type ? `specialist_${c.selected_type || 'consultation'}` : `telemedicine_${c.selected_type || 'consultation'}`,
            amount: -(c.price || 0),
            status: 'success',
            created_at: c.created_at,
            reference_id: `consult_${c.id}`,
        }));

        // Merge and sort
        const allTx = [...(txData || []), ...consultTx].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransactions(allTx);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={22} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                        <p className="text-sm text-gray-500">Manage your balance and payments</p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <Wallet size={24} />
                        <span className="font-semibold opacity-90">Available Balance</span>
                    </div>
                    <p className="text-5xl font-black tracking-tight">
                        ₦{balance.toLocaleString()}
                    </p>
                    <p className="text-sm opacity-75 mt-2">Ready for consultations</p>
                </div>

                {/* Top-up */}
                {user && profile && (
                    <WalletTopUp
                        userEmail={profile.email || user.email || ''}
                        userId={user.id}
                        currentBalance={balance}
                        onSuccess={(newBalance) => setBalance(newBalance)}
                    />
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Transaction History</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No transactions yet</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${tx.amount > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                            {tx.amount > 0
                                                ? <ArrowUpCircle size={18} className="text-emerald-600" />
                                                : <ArrowDownCircle size={18} className="text-red-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 capitalize">
                                                {tx.type?.replace('_', ' ') || 'Transaction'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-lg ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
