'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { MapPin, Bell, Mic, Camera, ArrowLeft } from 'lucide-react';

const hardwarePermissions = [
    { icon: MapPin, title: 'Location', description: 'To find nearby care & for emergencies.' },
    { icon: Bell, title: 'Notifications', description: 'For appointment reminders & alerts.' },
    { icon: Mic, title: 'Microphone', description: 'For voice calls with doctors.' },
    { icon: Camera, title: 'Camera', description: 'For video consultations.' },
];

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function PermissionsPage() {
    const router = useRouter();
    const { user } = useAuth();
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

        const userId = user?.id;
        if (!userId) {
            setError('You are not logged in. Please refresh the page.');
            setLoading(false);
            return;
        }

        const updates = {
            onboarding_completed: true,
            onboarding_step: 'completed',
            terms_accepted: consents.terms,
            privacy_policy_accepted: consents.privacy,
            emergency_consent_accepted: consents.emergency,
            ai_consent_accepted: consents.ai,
            updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (dbError) {
            console.error('[Permissions] DB error:', dbError);
            setError(dbError.message || 'Failed to save. Please try again.');
            setLoading(false);
            return;
        }

        // Send welcome email in the background
        if (user?.email) {
            fetch('/api/notifications/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            }).catch(err => console.error('Failed to send welcome email:', err));
        }

        router.push('/completion');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <button 
                onClick={() => router.push('/emergency-contact')}
                className="flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors group mb-2"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>
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
            </div>
        </div>
    );
}
