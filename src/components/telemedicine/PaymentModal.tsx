'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, Loader2, CheckCircle } from 'lucide-react';



export const PaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    doctor: any;
    patientBalance: number;
    patientEmail: string;
    onSuccess?: (consultationId: string) => void;
}> = ({ isOpen, onClose, doctor, patientBalance, patientEmail, onSuccess }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');

    const consultationPrice = doctor.price;
    const isInsufficient = patientBalance < consultationPrice;

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

    const handleWalletPayment = async () => {
        if (isInsufficient) return;
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: consultation, error: consultError } = await supabase
                .from('consultations')
                .insert({
                    user_id: user.id,
                    doctor_id: doctor.id,
                    consultation_type: doctor.selectedType,
                    price: consultationPrice,
                    commission_amount: 0,
                    doctor_amount: 0,
                    status: 'pending',
                    specialist_flag: true,
                    specialty_type: doctor.specialty_type,
                })
                .select()
                .single();

            if (consultError) throw consultError;

            const response = await fetch('/api/consultations/pay-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultationId: consultation.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Wallet payment failed');
            }

            setPaymentStep('success');
            setTimeout(() => {
                if (onSuccess) onSuccess(consultation.id);
                else router.push(`/dashboard/telemedicine/session/${consultation.id}`);
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'An error occurred during payment');
            setLoading(false);
        }
    };

    const loadAndOpenFlutterwave = async () => {
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create consultation first
            const { data: consultation, error: consultError } = await supabase
                .from('consultations')
                .insert({
                    user_id: user.id,
                    doctor_id: doctor.id,
                    consultation_type: doctor.selectedType,
                    price: consultationPrice,
                    commission_amount: 0,
                    doctor_amount: 0,
                    status: 'pending',
                    specialist_flag: true,
                    specialty_type: doctor.specialty_type,
                })
                .select()
                .single();

            if (consultError) throw consultError;

            await loadFlutterwaveScript();

            const pubKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
            if (!pubKey) {
                throw new Error("Payment gateway is not properly configured (missing public key). Please restart your development server.");
            }

            // Generate tx_ref locally — inline popup does not need server-side init
            const txRef = `medlud_consult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            setLoading(false);

            window.FlutterwaveCheckout({
                public_key: pubKey,
                tx_ref: txRef,
                amount: consultationPrice,
                currency: 'NGN',
                payment_options: 'card,banktransfer,ussd',
                customer: {
                    email: patientEmail,
                    name: patientEmail,
                },
                meta: {
                    user_id: user.id,
                    consultation_id: consultation.id,
                    purpose: 'consultation_payment',
                    doctor_name: doctor.full_name,
                },
                customizations: {
                    title: 'Medlud Consultation',
                    description: `Session with Dr. ${doctor.full_name}`,
                    logo: 'https://medlud.com/logo.png',
                },
                callback: async (response: any) => {
                    setPaymentStep('processing');
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reference: response.tx_ref }),
                        });

                        if (verifyRes.ok) {
                            setPaymentStep('success');
                            setTimeout(() => {
                                if (onSuccess) onSuccess(consultation.id);
                                else router.push(`/dashboard/telemedicine/session/${consultation.id}`);
                            }, 1500);
                        } else {
                            setPaymentStep('select');
                            setError(`Payment verification failed. Contact support with reference: ${response.tx_ref}`);
                        }
                    } catch {
                        setPaymentStep('select');
                        setError(`Verification error. Contact support with reference: ${response.tx_ref}`);
                    }
                },
                onclose: () => {
                    setLoading(false);
                    setError('Payment cancelled. Your booking has not been confirmed.');
                    supabase.from('consultations').update({ status: 'cancelled' }).eq('id', consultation.id);
                },
            });

        } catch (err: any) {
            setError(err.message || 'Could not initiate payment');
            setLoading(false);
        }
    };

    if (paymentStep === 'processing') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Verifying Payment">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={48} className="animate-spin text-emerald-600" />
                    <p className="font-semibold text-slate-700">Verifying your payment...</p>
                    <p className="text-sm text-slate-500">Please wait, do not close this window.</p>
                </div>
            </Modal>
        );
    }

    if (paymentStep === 'success') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <CheckCircle size={56} className="text-emerald-500" />
                    <p className="text-xl font-bold text-slate-900">Payment Confirmed!</p>
                    <p className="text-sm text-slate-500 text-center px-4">Your case has been submitted and a doctor will respond shortly. Redirecting to your session...</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Booking">
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl text-center border border-emerald-100">
                    <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-slate-900">₦{consultationPrice.toLocaleString()}</p>
                    <p className="text-sm font-medium text-emerald-600 mt-2">
                        Telemedicine Session with Dr. {doctor.full_name}
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {/* Pay from Wallet */}
                    <div className={`border rounded-xl p-4 transition-all ${isInsufficient ? 'border-red-200 bg-red-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <Wallet size={18} className={isInsufficient ? 'text-red-400' : 'text-emerald-600'} />
                                <span className="font-semibold text-slate-700">Wallet Balance</span>
                            </div>
                            <span className={`font-bold text-lg ${isInsufficient ? 'text-red-600' : 'text-emerald-700'}`}>
                                ₦{patientBalance.toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={handleWalletPayment}
                            disabled={loading || isInsufficient}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2
                                ${loading || isInsufficient ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20'}`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                            {loading ? 'Processing...' : isInsufficient ? 'Insufficient Balance' : 'Pay from Wallet'}
                        </button>
                        {isInsufficient && (
                            <p className="text-xs text-red-500 text-center mt-2">
                                You need ₦{(consultationPrice - patientBalance).toLocaleString()} more. Fund your wallet or pay by card below.
                            </p>
                        )}
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-4 text-sm text-gray-500 font-medium">OR</span>
                        </div>
                    </div>

                    {/* Pay by Card via Flutterwave */}
                    <button
                        onClick={loadAndOpenFlutterwave}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold bg-[#F5A623] text-white hover:bg-[#e0941a] transition-all flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-orange-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                        {loading ? 'Please wait...' : `Pay ₦${consultationPrice.toLocaleString()} by Card`}
                    </button>
                    <p className="text-center text-xs text-slate-400">Secured by Flutterwave 🔒</p>
                </div>
            </div>
        </Modal>
    );
};
