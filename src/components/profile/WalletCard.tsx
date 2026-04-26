'use client';

import React from 'react';
import { Wallet, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export const WalletCard = () => {
    const { profile } = useAuth();
    const balance = profile?.wallet_balance || 0;

    return (
        <Card className="overflow-hidden border-emerald-100 bg-white">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Wallet size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">MedLud Wallet</h3>
                    </div>
                    <Link
                        href="/dashboard/wallet"
                        className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                        View History <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-xl text-white shadow-md mb-6">
                    <p className="text-xs opacity-80 font-medium mb-1">Total Balance</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold">₦</span>
                        <span className="text-3xl font-black">{balance.toLocaleString()}</span>
                    </div>
                </div>

                <Link href="/dashboard/wallet">
                    <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all border border-emerald-200/50">
                        <PlusCircle size={18} />
                        Fund Wallet
                    </button>
                </Link>

                <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-wider font-bold">
                    Use your balance for instant consultations
                </p>
            </div>
        </Card>
    );
};
