'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Wallet, Clock } from 'lucide-react';

export const DoctorWallet = () => {
    const { user } = useAuth();
    const [doctorData, setDoctorData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadWalletData();
        }
    }, [user]);

    const loadWalletData = async () => {
        try {
            // Load balances
            const { data: dr } = await supabase
                .from('doctors')
                .select('withdrawable_balance, pending_balance')
                .eq('id', user?.id || '')
                .single();
            
            if (dr) setDoctorData(dr);
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading Wallet Balance...</div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/50">
                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    <Wallet size={20} className="text-emerald-600" />
                    Earnings & Wallet
                </h2>
            </div>

            <div className="p-6">
                {/* Balances */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-sm font-semibold text-slate-500 mb-1">Withdrawable Balance</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            ₦{doctorData?.withdrawable_balance?.toLocaleString() || '0'}
                        </p>
                        <p className="text-[10px] text-emerald-600/70 mt-1 font-medium">Automatic settlement every Monday</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                            <Clock size={14} /> Pending Clearance
                        </p>
                        <p className="text-xl font-bold text-slate-700">
                            ₦{doctorData?.pending_balance?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Funds from recent consultations waiting to be cleared.</p>
                    </div>
                </div>
            </div>

            {/* Payout Information Notice */}
            <div className="mx-6 mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3">
                <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600">
                    <Clock size={16} />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-wider">Automated Settlements</h3>
                    <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                        To simplify your experience, all withdrawable earnings are automatically processed every Monday morning and sent to your bank account on file. No manual request is required. For complaints, contact us via call or WhatsApp on <strong>09025713908</strong> or email us at <strong>medlud@hublud.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};
