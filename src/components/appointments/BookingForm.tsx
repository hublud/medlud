'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, CreditCard, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';



interface BookingFormProps {
    onCancel: () => void;
    defaultCategory?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onCancel, defaultCategory }) => {
    const router = useRouter();
    const { profile, user } = useAuth();
    const { settings: platformSettings } = usePlatformSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
    const [walletBalance, setWalletBalance] = useState(0);
    const [payError, setPayError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        symptoms: '',
        duration: '',
        hasTakenMedication: 'no',
        medicationDetails: '',
        severity: 'mild',
        category: defaultCategory || 'general'
    });

    const platformPrice = platformSettings?.chat_price || 7000;


    // Fetch wallet balance
    useEffect(() => {
        const load = async () => {
            if (user) {
                const { data: p } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
                if (p) setWalletBalance((p as any).wallet_balance || 0);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (defaultCategory) setFormData(prev => ({ ...prev, category: defaultCategory }));
    }, [defaultCategory]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Step 1: Validate form, show payment modal
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.symptoms || !formData.duration) return;
        setShowPayment(true);
    };

    // Step 2a: Create the appointment (called after payment success or before card payment)
    const createAppointment = async (userId: string, initialStatus: string = 'PENDING') => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('gender, date_of_birth, blood_group, known_conditions, allergies')
            .eq('id', userId)
            .single();

        const { data: aptData, error: aptError } = await supabase
            .from('appointments')
            .insert({
                user_id: userId,
                title: formData.title,
                symptoms: formData.symptoms,
                duration: formData.duration,
                severity: formData.severity,
                medication_details: formData.hasTakenMedication === 'yes' ? formData.medicationDetails : null,
                status: initialStatus,
                category: formData.category
            })
            .select('id')
            .single();

        if (aptError) throw aptError;

        if (aptData) {
            const age = profileData?.date_of_birth
                ? Math.floor((Date.now() - new Date(profileData.date_of_birth).getTime()) / 3.154e10)
                : 'N/A';

            const historyContent = `📋 **Patient Health History Summary**
- **Category:** ${formData.category.replace('-', ' ').toUpperCase()}
- **Age/Gender:** ${age} / ${(profileData as any)?.gender || 'Not specified'}
- **Blood Group:** ${(profileData as any)?.blood_group || 'Not specified'}
- **Known Conditions:** ${(profileData as any)?.known_conditions || 'None recorded'}
- **Allergies:** ${(profileData as any)?.allergies || 'None recorded'}

---
**Initial Complaint:** ${formData.title}
**Symptoms:** ${formData.symptoms}`;

            await supabase.from('messages').insert({
                appointment_id: aptData.id,
                sender_id: userId,
                role: 'USER',
                content: historyContent
            });
        }

        return aptData;
    };

    // Step 2b: Pay from wallet
    const handleWalletPayment = async () => {
        if (!user) return;
        if (walletBalance < platformPrice) {
            setPayError('Insufficient wallet balance. Please fund your wallet or pay by card.');
            return;
        }
        setPayError('');
        setIsSubmitting(true);

        try {
            // Deduct from wallet securely
            const newBalance = walletBalance - platformPrice;
            const { error: deductErr } = await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', user.id);

            if (deductErr) throw deductErr;

            // Log wallet transaction
            await supabase.from('wallet_transactions').insert({
                user_id: user.id,
                type: 'consultation_payment',
                amount: -platformPrice,
                status: 'success',
                reference_id: `appt_${Date.now()}`
            });

            await createAppointment(user.id);
            setPaymentStep('success');
            setTimeout(() => {
                router.push('/dashboard/appointments');
                router.refresh();
            }, 1500);
        } catch (err: any) {
            setPayError(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 2c: Pay by card via Flutterwave (direct popup — no server init needed)
    const handleCardPayment = async () => {
        if (!user) return;
        setPayError('');
        setIsSubmitting(true);

        try {
            // STEP 1: Create the appointment in PAYMENT_PENDING state before opening payment
            const tempApt = await createAppointment(user.id, 'PAYMENT_PENDING');
            if (!tempApt) throw new Error("Could not initialize appointment record");

            // STEP 2: Load Flutterwave
            if (!(window as any).FlutterwaveCheckout) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.flutterwave.com/v3.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
                    document.head.appendChild(script);
                });
            }

            const pubKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
            if (!pubKey) {
                throw new Error("Payment gateway is not properly configured (missing public key). Please restart your development server.");
            }

            // Generate a unique tx_ref locally
            const txRef = `medlud_appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            setIsSubmitting(false);

            window.FlutterwaveCheckout({
                public_key: pubKey,
                tx_ref: txRef,
                amount: platformPrice,
                currency: 'NGN',
                payment_options: 'card,banktransfer,ussd',
                customer: {
                    email: profile?.email || user.email || '',
                    name: profile?.full_name || user.email || '',
                },
                meta: {
                    user_id: user.id,
                    appointment_id: tempApt.id, // CRITICAL: Link payment to this appointment
                    purpose: 'appointment_payment'
                },
                customizations: {
                    title: 'Medlud Consultation',
                    description: 'AI Doctor Consultation Fee',
                    logo: 'https://medlud.com/logo.png',
                },
                callback: (response: any) => {
                    (async () => {
                        console.log("Payment Callback Received:", response);
                        setPaymentStep('processing');
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reference: response.tx_ref }),
                        });

                        if (verifyRes.ok) {
                            // Appointment is already created! The server verify route 
                            // will have switched its status to PENDING via the appointment_id in meta.
                            setPaymentStep('success');
                            setTimeout(() => {
                                router.push('/dashboard/appointments');
                                router.refresh();
                            }, 1500);
                        } else {
                            const errorData = await verifyRes.json();
                            setPaymentStep('select');
                            setPayError('Verification failed: ' + (errorData.error || response.tx_ref));
                        }
                    })();
                },
                onclose: () => {
                    setPayError('Payment cancelled.');
                },
            });

        } catch (err: any) {
            setPayError(err.message || 'Could not start payment');
            setIsSubmitting(false);
        }
    };

    const isInsufficient = walletBalance < platformPrice;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-border">
                <div className="space-y-1 border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-bold text-text-primary">New Consultation Request</h2>
                    <p className="text-sm text-text-secondary">
                        Please provide detailed information so our doctors can assist you effectively.
                    </p>
                </div>

                {/* Category */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <Select
                        label="Consultation Category"
                        name="category"
                        options={[
                            { value: 'general', label: 'General Consultation' },
                            { value: 'mental-health', label: 'Mental Health Support' },
                            { value: 'maternal', label: 'Maternal Health' }
                        ]}
                        value={formData.category}
                        onChange={handleChange}
                        disabled={!!defaultCategory}
                    />
                </div>

                <Input
                    label="Case Title / Main Complaint"
                    name="title"
                    placeholder="e.g. Severe Migraine, Skin Rash, etc."
                    value={formData.title}
                    onChange={handleChange}
                    required
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-primary">Describe your Symptoms</label>
                    <textarea
                        name="symptoms"
                        rows={5}
                        className="block w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                        placeholder="Describe what you are feeling, where it hurts, etc."
                        value={formData.symptoms}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="How long have you had this?"
                        name="duration"
                        placeholder="e.g. 2 days, 1 week"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                    />
                    <Select
                        label="Severity"
                        name="severity"
                        options={[
                            { value: 'mild', label: 'Mild - Annoying but bearable' },
                            { value: 'moderate', label: 'Moderate - Affecting daily life' },
                            { value: 'severe', label: 'Severe - Unbearable pain/distress' }
                        ]}
                        value={formData.severity}
                        onChange={handleChange}
                    />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <Select
                        label="Have you taken any medication for this?"
                        name="hasTakenMedication"
                        options={[
                            { value: 'no', label: "No, I haven't taken anything" },
                            { value: 'yes', label: 'Yes, I have taken medication' }
                        ]}
                        value={formData.hasTakenMedication}
                        onChange={handleChange}
                    />
                    {formData.hasTakenMedication === 'yes' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-text-primary mb-1">Medication Details</label>
                            <textarea
                                name="medicationDetails"
                                rows={2}
                                className="block w-full border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="What did you take? e.g. Paracetamol 500mg"
                                value={formData.medicationDetails}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Price notice */}
                {platformPrice > 0 && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">
                        <span>Consultation fee</span>
                        <span className="font-bold text-base">₦{platformPrice.toLocaleString()}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                    <AlertCircle size={16} className="text-blue-500 shrink-0" />
                    <p>By submitting, you allow the assigned doctor to view your <strong>Health Profile</strong>.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Continue to Payment →
                    </Button>
                </div>
            </form>

            {/* Payment Modal */}
            <Modal isOpen={showPayment} onClose={() => { setShowPayment(false); setPaymentStep('select'); }} title="Complete Payment">
                {paymentStep === 'processing' ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 size={48} className="animate-spin text-emerald-600" />
                        <p className="font-semibold text-slate-700">Verifying your payment...</p>
                        <p className="text-sm text-slate-500">Please wait, do not close this window.</p>
                    </div>
                ) : paymentStep === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <CheckCircle size={56} className="text-emerald-500" />
                        <p className="text-xl font-bold text-slate-900">Payment Confirmed!</p>
                        <p className="text-sm text-slate-500">Redirecting to your consultations...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl text-center border border-emerald-100">
                            <p className="text-sm text-slate-500 mb-1">Consultation Fee</p>
                            <p className="text-4xl font-black text-slate-900">₦{platformPrice.toLocaleString()}</p>
                            <p className="text-sm font-medium text-emerald-600 mt-2">
                                📋 {formData.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Consultation
                            </p>
                        </div>

                        {payError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {payError}
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Wallet */}
                            <div className={`border rounded-xl p-4 ${isInsufficient ? 'border-red-200 bg-red-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <Wallet size={18} className={isInsufficient ? 'text-red-400' : 'text-emerald-600'} />
                                        <span className="font-semibold text-slate-700">Wallet Balance</span>
                                    </div>
                                    <span className={`font-bold text-lg ${isInsufficient ? 'text-red-600' : 'text-emerald-700'}`}>
                                        ₦{walletBalance.toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={handleWalletPayment}
                                    disabled={isSubmitting || isInsufficient}
                                    className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
                                        ${isSubmitting || isInsufficient
                                            ? 'opacity-50 cursor-not-allowed bg-slate-400'
                                            : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'}`}
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                                    {isInsufficient ? 'Insufficient Balance' : 'Pay from Wallet'}
                                </button>
                                {isInsufficient && (
                                    <p className="text-xs text-red-500 text-center mt-2">
                                        You need ₦{(platformPrice - walletBalance).toLocaleString()} more. <a href="/dashboard/wallet" className="underline font-bold">Fund wallet</a> or pay by card below.
                                    </p>
                                )}
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                                <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-gray-500 font-medium">OR</span></div>
                            </div>

                            {/* Card */}
                            <button
                                onClick={handleCardPayment}
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl font-bold bg-[#011B33] text-white hover:bg-[#022B50] transition-all flex items-center justify-center gap-2 hover:shadow-xl disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                {isSubmitting ? 'Please wait...' : `Pay ₦${platformPrice.toLocaleString()} by Card`}
                            </button>
                            <p className="text-center text-xs text-slate-400">Secured by Flutterwave 🔒</p>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};
