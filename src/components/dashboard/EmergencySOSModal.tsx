import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EmergencySOSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
    const { user, session } = useAuth();
    const [countdown, setCountdown] = useState(7);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCountdown(7);
            setSent(false);
            setSending(false);
            setError(null);

            timerRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        sendEmergencyAlert();
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

    const sendEmergencyAlert = async () => {
        setSending(true);
        try {
            if (!session?.access_token) {
                throw new Error('Authentication session missing. Please log in again.');
            }

            // Get location if possible
            let locationData = { latitude: null as number | null, longitude: null as number | null };

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                locationData.latitude = position.coords.latitude;
                locationData.longitude = position.coords.longitude;
            } catch (locError) {
                console.warn('Could not get location:', locError);
            }

            const response = await fetch('/api/emergency/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: user?.id,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || 'Failed to send alert';
                const detailMessage = data.details ? ` (${JSON.stringify(data.details)})` : '';
                const hintMessage = data.hint ? ` [Hint: ${data.hint}]` : '';
                throw new Error(errorMessage + detailMessage + hintMessage);
            }

            setSent(true);
        } catch (err: any) {
            console.error('SOS Error:', err);
            setError(err.message || 'Failed to send emergency alert.');
        } finally {
            setSending(false);
        }
    };

    const handleCancel = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        onClose();
    };

    const handleSendNow = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        sendEmergencyAlert();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100 transition-transform">

                {sending ? (
                    <div className="py-8 space-y-4">
                        <Loader2 className="w-16 h-16 text-red-600 animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-gray-900">Sending Alert...</h2>
                        <p className="text-gray-500">Notifying your emergency contact.</p>
                    </div>
                ) : sent ? (
                    <div className="py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Alert Sent</h2>
                        <p className="text-gray-600">Your emergency contact has been notified with your location.</p>
                        <button
                            onClick={onClose}
                            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-10 h-10 text-red-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency SOS</h2>

                        <div className="my-6">
                            <div className="text-6xl font-black text-red-600 tabular-nums">
                                {countdown}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Seconds to cancel</p>
                        </div>

                        <p className="text-gray-600 mb-8">
                            Sending emergency alert with your current location to your designated contact.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleCancel}
                                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={20} />
                                Cancel Alert
                            </button>

                            <button
                                onClick={handleSendNow}
                                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                            >
                                Send Immediately
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
