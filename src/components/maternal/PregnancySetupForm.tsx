'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Baby, Calendar, AlertCircle, Heart } from 'lucide-react';
import { calculateDueDate, calculateGestationalAge } from '@/data/pregnancyWeeks';
import { ConditionType } from '@/types/user';

export const PregnancySetupForm: React.FC = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Form state
    const [isPregnant, setIsPregnant] = useState(true);
    const [lmpDate, setLmpDate] = useState('');
    const [gestationalWeeks, setGestationalWeeks] = useState('');
    const [useWeeks, setUseWeeks] = useState(false);
    const [isFirstPregnancy, setIsFirstPregnancy] = useState<boolean | null>(null);
    const [hasPreviousComplications, setHasPreviousComplications] = useState<boolean | null>(null);
    const [conditions, setConditions] = useState<ConditionType[]>([]);

    const handleConditionToggle = (condition: ConditionType) => {
        if (condition === 'none') {
            setConditions(['none']);
        } else {
            const filtered = conditions.filter(c => c !== 'none');
            if (conditions.includes(condition)) {
                setConditions(filtered.filter(c => c !== condition));
            } else {
                setConditions([...filtered, condition]);
            }
        }
    };

    const handleSubmit = async () => {
        let gestationalAge: number;
        let estimatedDueDate: Date;

        if (useWeeks && gestationalWeeks) {
            gestationalAge = parseInt(gestationalWeeks);
            // Approximate LMP from gestational age
            const approximateLMP = new Date();
            approximateLMP.setDate(approximateLMP.getDate() - (gestationalAge * 7));
            estimatedDueDate = calculateDueDate(approximateLMP);
        } else if (lmpDate) {
            const lmp = new Date(lmpDate);
            gestationalAge = calculateGestationalAge(lmp);
            estimatedDueDate = calculateDueDate(lmp);
        } else {
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to complete setup');

            // 1. Save deep pregnancy data (if you have a dedicated table, otherwise use profiles)
            // For now, we update the profile to mark them as maternal
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    is_maternal: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Save details to localStorage for instant UI usage
            const pregnancyProfile = {
                isPregnant,
                gestationalAge,
                lastMenstrualPeriod: useWeeks ? new Date() : new Date(lmpDate),
                estimatedDueDate,
                isFirstPregnancy: isFirstPregnancy ?? false,
                hasPreviousComplications: hasPreviousComplications ?? false,
                existingConditions: conditions.length > 0 ? conditions : ['none'],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            localStorage.setItem('pregnancyProfile', JSON.stringify(pregnancyProfile));

            console.log("Maternal profile completed and saved to DB");
            router.push('/dashboard/maternal');
        } catch (err: any) {
            console.error('Error saving maternal profile:', err);
            alert('Failed to save profile. Please try again.');
        }
    };

    const canProceed = () => {
        if (step === 1) return isPregnant !== null;
        if (step === 2) return useWeeks ? gestationalWeeks !== '' : lmpDate !== '';
        if (step === 3) return isFirstPregnancy !== null;
        if (step === 4) return hasPreviousComplications !== null;
        if (step === 5) return conditions.length > 0;
        return false;
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">Step {step} of 5</span>
                    <span className="text-sm font-medium text-primary">{(step / 5 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(step / 5) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Step 1: Confirm Pregnancy */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                            <Baby size={32} className="text-pink-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Are you currently pregnant?</h2>
                        <p className="text-text-secondary">This helps us personalize your care</p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsPregnant(true)}
                            className={`w-full p-4 rounded-xl border-2 transition-all ${isPregnant === true
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <p className="font-semibold text-text-primary">Yes, I'm pregnant</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Gestational Age */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar size={32} className="text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">When did your last period start?</h2>
                        <p className="text-text-secondary">This helps us calculate your due date</p>
                    </div>

                    {!useWeeks ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Last Menstrual Period (LMP)
                                </label>
                                <input
                                    type="date"
                                    value={lmpDate}
                                    onChange={(e) => setLmpDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <button
                                onClick={() => setUseWeeks(true)}
                                className="text-sm text-primary hover:underline"
                            >
                                I don't know my LMP, enter weeks instead
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Gestational Age (weeks)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="42"
                                    value={gestationalWeeks}
                                    onChange={(e) => setGestationalWeeks(e.target.value)}
                                    placeholder="e.g., 12"
                                    className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <button
                                onClick={() => setUseWeeks(false)}
                                className="text-sm text-primary hover:underline"
                            >
                                Enter LMP date instead
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: First Pregnancy */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Is this your first pregnancy?</h2>
                        <p className="text-text-secondary">This helps us tailor our guidance</p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsFirstPregnancy(true)}
                            className={`w-full p-4 rounded-xl border-2 transition-all ${isFirstPregnancy === true
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <p className="font-semibold text-text-primary">Yes, first pregnancy</p>
                        </button>
                        <button
                            onClick={() => setIsFirstPregnancy(false)}
                            className={`w-full p-4 rounded-xl border-2 transition-all ${isFirstPregnancy === false
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <p className="font-semibold text-text-primary">No, I've been pregnant before</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Previous Complications */}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Any previous pregnancy complications?</h2>
                        <p className="text-text-secondary">This information helps us provide better care</p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => setHasPreviousComplications(false)}
                            className={`w-full p-4 rounded-xl border-2 transition-all ${hasPreviousComplications === false
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <p className="font-semibold text-text-primary">No complications</p>
                        </button>
                        <button
                            onClick={() => setHasPreviousComplications(true)}
                            className={`w-full p-4 rounded-xl border-2 transition-all ${hasPreviousComplications === true
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <p className="font-semibold text-text-primary">Yes, I had complications</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Existing Conditions */}
            {step === 5 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Heart size={32} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Do you have any existing conditions?</h2>
                        <p className="text-text-secondary">Select all that apply</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            { value: 'hypertension' as ConditionType, label: 'Hypertension / High Blood Pressure' },
                            { value: 'diabetes' as ConditionType, label: 'Diabetes' },
                            { value: 'sickle_cell' as ConditionType, label: 'Sickle Cell Disease' },
                            { value: 'none' as ConditionType, label: 'None of the above' }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleConditionToggle(option.value)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${conditions.includes(option.value)
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <p className="font-semibold text-text-primary">{option.label}</p>
                            </button>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Privacy Note</p>
                            <p className="text-blue-700">This information is kept confidential and helps us provide personalized care.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 mt-8">
                {step > 1 && (
                    <Button
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        className="flex-1"
                    >
                        Back
                    </Button>
                )}
                <Button
                    onClick={() => {
                        if (step < 5) {
                            setStep(step + 1);
                        } else {
                            handleSubmit();
                        }
                    }}
                    disabled={!canProceed()}
                    className="flex-1"
                >
                    {step === 5 ? 'Complete Setup' : 'Continue'}
                </Button>
            </div>
        </div>
    );
};
