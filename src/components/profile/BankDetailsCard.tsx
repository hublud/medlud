'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export const BankDetailsCard = () => {
    const { profile } = useAuth();
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only render for staff, doctors, and admins
    const isMedicalStaff = profile?.role === 'staff' || profile?.role === 'doctor' || profile?.role === 'admin';
    if (!isMedicalStaff) {
        return null;
    }

    useEffect(() => {
        if (!profile?.id) return;

        const fetchBankDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('doctors')
                    .select('bank_name, account_number, account_name')
                    .eq('id', profile.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore row not found
                    console.error('Error fetching bank details:', error);
                }

                if (data) {
                    setBankName(data.bank_name || '');
                    setAccountNumber(data.account_number || '');
                    setAccountName(data.account_name || '');
                }
            } finally {
                setFetching(false);
            }
        };

        fetchBankDetails();
    }, [profile?.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Upsert into doctors table (in case it doesn't exist yet, though typically it should)
            const { error: upsertError } = await supabase
                .from('doctors')
                .upsert({
                    id: profile.id,
                    bank_name: bankName,
                    account_number: accountNumber,
                    account_name: accountName,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error saving bank details:', err);
            setError(err.message || 'Failed to save bank details.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <Card className="overflow-hidden border-gray-100 bg-white p-6 flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-orange-100 bg-white">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <Landmark size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">Payout Bank Details</h3>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Guarantee Trust Bank"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="0123456789"
                            pattern="[0-9]*"
                            maxLength={15}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100' : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                        variant="primary"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : success ? (
                            <>
                                <CheckCircle2 size={18} />
                                Saved Successfully
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Details
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-wider font-bold">
                    Used for your weekly commission payouts
                </p>
            </div>
        </Card>
    );
};
