'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { User, Phone, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EmergencyContactPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [contactName, setContactName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [shareLocation, setShareLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const userId = user?.id;
        if (!userId) {
            setError('You are not logged in. Please refresh the page.');
            setLoading(false);
            return;
        }

        const updates = {
            emergency_contact_name: contactName,
            emergency_contact_relationship: relationship,
            emergency_contact_phone: phoneNumber,
            share_location_emergency: shareLocation,
            onboarding_step: 'permissions',
            updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (dbError) {
            console.error('[EmergencyContact] DB error:', dbError);
            setError(dbError.message || 'Failed to save. Please try again.');
            setLoading(false);
            return;
        }

        router.push('/permissions');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <button 
                onClick={() => router.push('/health-profile')}
                className="flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors group mb-2"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-primary">Emergency Contact</h1>
                <p className="text-text-secondary mt-1">We'll alert them only in urgent situations.</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                    This contact will be notified if you press the emergency button.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Contact Name"
                    placeholder="e.g. Spouse, Parent, Friend"
                    required
                    leftIcon={User}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                />

                <Input
                    label="Relationship"
                    placeholder="e.g. Husband"
                    required
                    leftIcon={User}
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                />

                <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    required
                    leftIcon={Phone}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <Toggle
                    label="Share Location"
                    description="Allow sharing your live location with this contact during emergencies."
                    checked={shareLocation}
                    onChange={setShareLocation}
                />

                <div className="pt-4">
                    <Button type="submit" fullWidth size="lg" isLoading={loading}>
                        Continue
                    </Button>
                </div>
            </form>
        </div>
    );
}
