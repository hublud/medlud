'use client';

import React, { useState } from 'react';
import { Wallet, Loader2, CreditCard } from 'lucide-react';


interface WalletTopUpProps {
    userEmail: string;
    userId: string;
    currentBalance: number;
    onSuccess?: (newBalance: number) => void;
}

export const WalletTopUp: React.FC<WalletTopUpProps> = ({ userEmail, userId, currentBalance, onSuccess }) => {
    const [amount, setAmount] = useState<string>('5000');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const presets = [2000, 5000, 10000, 20000, 50000];

    const loadFlutterwaveScript = (): Promise<void> => {
        if ((window as any).FlutterwaveCheckout) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Flutterwave checkout script'));
            document.head.appendChild(script);
        });
    };

    const handleFundWallet = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount < 100) {
            setError('Minimum top-up amount is ₦100');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await loadFlutterwaveScript();

            const pubKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
            if (!pubKey) {
                throw new Error("Payment gateway is not properly configured (missing public key). Please restart your development server.");
            }

            // Generate unique tx_ref client-side — no server init needed for inline popup
            const txRef = `medlud_wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            setLoading(false);

            window.FlutterwaveCheckout({
                public_key: pubKey,
                tx_ref: txRef,
                amount: numAmount,
                currency: 'NGN',
                payment_options: 'card,banktransfer,ussd',
                customer: {
                    email: userEmail,
                    name: userEmail,
                },
                meta: {
                    user_id: userId,
                    purpose: 'wallet_funding',
                },
                customizations: {
                    title: 'Medlud Wallet Top-Up',
                    description: `Fund your Medlud wallet with ₦${numAmount.toLocaleString()}`,
                    logo: 'https://medlud.com/logo.png',
                },
                callback: async (response: any) => {
                    setLoading(true);
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reference: response.tx_ref }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            setSuccessMsg(`₦${numAmount.toLocaleString()} added to your wallet!`);
                            if (onSuccess) onSuccess(verifyData.new_balance ?? currentBalance + numAmount);
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            setError(verifyData.error || `Verification failed. Contact support with ref: ${response.tx_ref}`);
                        }
                    } catch {
                        setError(`Payment received but verification failed. Contact support with ref: ${response.tx_ref}`);
                    } finally {
                        setLoading(false);
                    }
                },
                onclose: () => {
                    setLoading(false);
                    setError('Transaction cancelled.');
                },
            });

        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-xl">
                    <Wallet size={22} className="text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Fund Your Wallet</h3>
                    <p className="text-sm text-slate-500">Current balance: ₦{currentBalance.toLocaleString()}</p>
                </div>
            </div>

            {/* Quick amount presets */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {presets.map(preset => (
                    <button
                        key={preset}
                        onClick={() => setAmount(String(preset))}
                        className={`py-2 rounded-lg text-sm font-bold border transition-all ${amount === String(preset)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-500'
                            }`}
                    >
                        ₦{preset.toLocaleString()}
                    </button>
                ))}
            </div>

            {/* Custom amount input */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₦</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-lg font-bold"
                    min="100"
                />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            {successMsg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 font-medium">✓ {successMsg}</p>}

            <button
                onClick={handleFundWallet}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/25"
            >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {loading ? 'Processing...' : `Fund ₦${parseFloat(amount || '0').toLocaleString()}`}
            </button>
            <p className="text-center text-xs text-slate-400">Powered by Flutterwave 🔒</p>
        </div>
    );
};
