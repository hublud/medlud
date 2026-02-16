'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar, User, Info, ArrowLeft } from 'lucide-react';
import { BLOOD_GROUPS } from '@/lib/constants';

import { useAuth } from '@/context/AuthContext';

export default function HealthProfilePage() {
    const router = useRouter();
    const { updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [pregnancyStatus, setPregnancyStatus] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [conditions, setConditions] = useState('');
    const [allergies, setAllergies] = useState('');

    const [error, setError] = useState<string | null>(null);

    const handleSkip = () => {
        router.push('/emergency-contact');
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updates = {
                gender,
                date_of_birth: dateOfBirth || null,
                is_pregnant: gender === 'female' ? (pregnancyStatus === 'yes') : false,
                blood_group: bloodGroup,
                known_conditions: conditions,
                allergies: allergies,
                onboarding_step: 'emergency-contact'
            };

            const { error: updateError } = await updateProfile(updates);

            if (!updateError) {
                router.push('/emergency-contact');
            } else {
                setError(updateError.message || 'Failed to update profile. Please ensure you have run the database fix script.');
            }
        } catch (err: any) {
            console.error('Update error:', err);
            setError('An unexpected error occurred. Please try again or skip this step.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-primary">Your Health Profile</h1>
                <p className="text-text-secondary mt-1">Help us tailor your experience. You can skip this.</p>
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

                <Input
                    label="Known Conditions (Optional)"
                    placeholder="e.g. Diabetes, Hypertension"
                    leftIcon={Info}
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                />

                <Input
                    label="Allergies (Optional)"
                    placeholder="e.g. Peanuts, Penicillin"
                    leftIcon={Info}
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                />

                <div className="pt-4 flex flex-col space-y-3">
                    <Button type="submit" fullWidth size="lg" isLoading={loading}>
                        Continue
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        fullWidth
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        Skip for now
                    </Button>
                </div>
            </form>
        </div>
    );
}
