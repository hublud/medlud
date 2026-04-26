'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from 'lucide-react';
import { BLOOD_GROUPS } from '@/lib/constants';
import { TagInput } from '@/components/ui/TagInput';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function HealthProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [pregnancyStatus, setPregnancyStatus] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [conditions, setConditions] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const userId = user?.id;
        if (!userId) {
            setError('You are not logged in. Please refresh the page and try again.');
            setLoading(false);
            return;
        }

        const updates = {
            gender: gender || null,
            date_of_birth: dateOfBirth || null,
            is_pregnant: gender === 'female' ? pregnancyStatus === 'yes' : false,
            blood_group: bloodGroup || null,
            known_conditions: conditions.join(', ') || null,
            allergies: allergies.join(', ') || null,
            onboarding_step: 'emergency-contact',
            updated_at: new Date().toISOString(),
        };

        console.log('[HealthProfile] Saving profile for user:', userId);

        const { error: dbError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (dbError) {
            console.error('[HealthProfile] DB error:', dbError);
            setError(dbError.message || 'Failed to save. Please try again.');
            setLoading(false);
            return;
        }

        console.log('[HealthProfile] Saved successfully, navigating...');
        router.push('/emergency-contact');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mt-2">
                <h1 className="text-2xl font-bold text-text-primary">Your Health Profile</h1>
                <p className="text-text-secondary mt-1">Help us tailor your experience.</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleContinue} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Gender"
                        options={[
                            { value: '', label: 'Select Gender' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                        ]}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    />
                    <Input
                        label="Date of Birth"
                        type="date"
                        leftIcon={Calendar}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                </div>

                {gender === 'female' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <Select
                            label="Are you currently pregnant?"
                            options={[
                                { value: 'no', label: 'No' },
                                { value: 'yes', label: 'Yes' },
                                { value: 'unsure', label: 'Unsure' },
                            ]}
                            value={pregnancyStatus}
                            onChange={(e) => setPregnancyStatus(e.target.value)}
                        />
                    </div>
                )}

                <Select
                    label="Blood Group (Optional)"
                    options={[{ value: '', label: 'Select Blood Group' }, ...BLOOD_GROUPS]}
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                />

                <TagInput
                    label="Known Conditions (Optional)"
                    placeholder="E.g. Diabetes, Hypertension"
                    tags={conditions}
                    onChange={setConditions}
                    helperText="Select or type and press enter to add"
                />

                <TagInput
                    label="Allergies (Optional)"
                    placeholder="E.g. Peanuts, Penicillin"
                    tags={allergies}
                    onChange={setAllergies}
                    helperText="Select or type and press enter to add"
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
