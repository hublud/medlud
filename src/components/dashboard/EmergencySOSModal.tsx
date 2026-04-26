import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, MessageSquare, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface EmergencySOSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface EmergencyContact {
    name: string;
    phone: string;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(7);
    const [isTriggered, setIsTriggered] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [contact, setContact] = useState<EmergencyContact | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCountdown(7);
            setIsTriggered(false);
            setError(null);
            fetchEmergencyData();

            timerRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setIsTriggered(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen]);

    const fetchEmergencyData = async () => {
        setIsLoadingProfile(true);
        try {
            // 1. Fetch Location
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn('Location blocked:', err),
                { timeout: 5000 }
            );

            // 2. Fetch Profile
            if (!user) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, emergency_contact_name, emergency_contact_phone')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data?.emergency_contact_phone) {
                setContact({
                    name: data.emergency_contact_name || 'Emergency Contact',
                    phone: data.emergency_contact_phone
                });
            } else {
                setError('No emergency contact found in your profile.');
            }
        } catch (err: any) {
            console.error('Error fetching emergency data:', err);
            setError('Failed to load emergency contact details.');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const getSOSMessage = () => {
        const userName = user?.user_metadata?.full_name || 'I';
        let msg = `SOS! This is an emergency alert from ${userName}. I need help immediately.`;
        if (location) {
            msg += `\n\nMy location: https://www.google.com/maps?q=${location.lat},${location.lng}`;
        }
        return encodeURIComponent(msg);
    };

    const triggerSMS = () => {
        if (!contact) return;
        const msg = getSOSMessage();
        window.location.href = `sms:${contact.phone}?&body=${msg}`;
    };

    const triggerWhatsApp = () => {
        if (!contact) return;
        const msg = getSOSMessage();
        const cleanPhone = contact.phone.replace(/\D/g, '');
        const phoneWithSuffix = cleanPhone.startsWith('0') ? `234${cleanPhone.slice(1)}` : cleanPhone;
        window.open(`https://wa.me/${phoneWithSuffix}?text=${msg}`, '_blank');
    };

    const handleCancel = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        onClose();
    };

    const handleSendNow = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTriggered(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
                {!isTriggered && (
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                )}

                {!isTriggered ? (
                    <>
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <AlertTriangle className="w-12 h-12 text-red-600" />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 mb-2">Emergency SOS</h2>
                        <p className="text-gray-500 text-sm mb-8">Choose contact method in...</p>

                        <div className="relative w-32 h-32 mx-auto mb-10">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-100"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={377}
                                    strokeDashoffset={377 - (377 * countdown) / 7}
                                    className="text-red-600 transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-5xl font-black text-red-600 tabular-nums">{countdown}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleCancel}
                                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <X size={20} />
                                Cancel SOS
                            </button>

                            <button
                                onClick={handleSendNow}
                                className="w-full text-red-600 font-bold text-sm hover:underline"
                            >
                                Trigger Now
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Phone className="w-10 h-10 text-primary" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose SOS Method</h2>
                        <p className="text-gray-600 text-sm mb-8">
                            {contact ? `Alert ${contact.name}` : 'Select your preferred channel to notify help'}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <button
                                onClick={triggerSMS}
                                disabled={!contact}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageSquare size={22} />
                                Send via SMS
                            </button>

                            <button
                                onClick={triggerWhatsApp}
                                disabled={!contact}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Send via WhatsApp
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full text-gray-400 font-bold py-2 mt-4 text-xs hover:text-gray-600 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
