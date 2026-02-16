'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { MapPin, Bell, Mic, Camera } from 'lucide-react';

const hardwarePermissions = [
    { icon: MapPin, title: 'Location', description: 'To find nearby care & for emergencies.' },
    { icon: Bell, title: 'Notifications', description: 'For appointment reminders & alerts.' },
    { icon: Mic, title: 'Microphone', description: 'For voice calls with doctors.' },
    { icon: Camera, title: 'Camera', description: 'For video consultations.' },
];

import { useAuth } from '@/context/AuthContext';

export default function PermissionsPage() {
    const router = useRouter();
    const { updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consents, setConsents] = useState({
        terms: false,
        privacy: false,
        emergency: false,
        ai: false,
    });

    const isAllChecked = Object.values(consents).every(Boolean);

    const handleToggle = (key: keyof typeof consents) => {
        setConsents(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGrant = async () => {
        setLoading(true);
        setError(null);

        const updates = {
            onboarding_completed: true,
            onboarding_step: 'completed',
            terms_accepted: consents.terms,
            privacy_policy_accepted: consents.privacy,
            emergency_consent_accepted: consents.emergency,
            ai_consent_accepted: consents.ai
        };

        try {
            const { error: updateError } = await updateProfile(updates);

            if (!updateError) {
                router.push('/completion');
            } else {
                setError(updateError.message || 'Failed to save permissions.');
            }
        } catch (err: any) {
            console.error('Update error:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-primary">Enable Permissions</h1>
                <p className="text-text-secondary mt-1">To get the best experience on MedLud</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {hardwarePermissions.map((perm, idx) => (
                        <div key={idx} className="flex items-start space-x-4 p-3 border border-border rounded-lg bg-gray-50/50">
                            <div className="bg-white p-2 rounded-full shadow-sm text-primary">
                                <perm.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-text-primary">{perm.title}</h4>
                                <p className="text-xs text-text-secondary">{perm.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-border space-y-1">
                    <h3 className="text-sm font-bold text-text-primary mb-3">Terms & Consents</h3>
                    <Checkbox
                        label="I agree to the Terms & Conditions"
                        checked={consents.terms}
                        onChange={() => handleToggle('terms')}
                    />
                    <Checkbox
                        label="I agree to the Privacy Policy"
                        checked={consents.privacy}
                        onChange={() => handleToggle('privacy')}
                    />
                    <Checkbox
                        label="I understand Medlud does not replace emergency care"
                        checked={consents.emergency}
                        onChange={() => handleToggle('emergency')}
                    />
                    <Checkbox
                        label="I consent to AI-assisted health guidance"
                        checked={consents.ai}
                        onChange={() => handleToggle('ai')}
                    />
                </div>
            </div>

            <div className="pt-2">
                <Button
                    onClick={handleGrant}
                    fullWidth
                    size="lg"
                    disabled={!isAllChecked}
                    isLoading={loading}
                >
                    Allow & Continue
                </Button>
                <button
                    onClick={handleGrant} // Reuse handleGrant logic to save completion status
                    className="w-full text-center text-sm text-text-secondary mt-4 hover:underline"
                    disabled={loading}
                >
                    Not now
                </button>
            </div>
        </div>
    );
}
