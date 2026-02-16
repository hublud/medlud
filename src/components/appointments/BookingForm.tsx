'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { BLOOD_GROUPS } from '@/lib/constants'; // Accessing shared constants

interface BookingFormProps {
    onCancel: () => void;
    defaultCategory?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onCancel, defaultCategory }) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        symptoms: '',
        duration: '',
        hasTakenMedication: 'no',
        medicationDetails: '',
        severity: 'mild',
        category: defaultCategory || 'general'
    });

    React.useEffect(() => {
        if (defaultCategory) {
            setFormData(prev => ({ ...prev, category: defaultCategory }));
        }
    }, [defaultCategory]);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to book an appointment');

            // 1. Fetch Patient Health Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('gender, date_of_birth, blood_group, known_conditions, allergies')
                .eq('id', user.id)
                .single();

            // 2. Create the Appointment
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .insert({
                    user_id: user.id,
                    title: formData.title,
                    symptoms: formData.symptoms,
                    duration: formData.duration,
                    severity: formData.severity,
                    medication_details: formData.hasTakenMedication === 'yes' ? formData.medicationDetails : null,
                    status: 'PENDING',
                    category: formData.category
                })
                .select('id')
                .single();

            if (aptError) throw aptError;

            // 3. Generate and Insert Medical History Message
            if (aptData) {
                const age = profile?.date_of_birth
                    ? Math.floor((new Date().getTime() - new Date(profile.date_of_birth).getTime()) / 3.154e+10)
                    : 'N/A';

                const historyContent = `📋 **Patient Health History Summary**
- **Category:** ${formData.category.replace('-', ' ').toUpperCase()}
- **Age/Gender:** ${age} / ${profile?.gender || 'Not specified'}
- **Blood Group:** ${profile?.blood_group || 'Not specified'}
- **Known Conditions:** ${profile?.known_conditions || 'None recorded'}
- **Allergies:** ${profile?.allergies || 'None recorded'}

---
**Initial Complaint:** ${formData.title}
**Symptoms:** ${formData.symptoms}`;

                await supabase.from('messages').insert({
                    appointment_id: aptData.id,
                    sender_id: user.id,
                    role: 'USER',
                    content: historyContent
                });
            }

            console.log("Submitted Case Successfully with History");
            router.push('/dashboard/appointments');
            router.refresh();
        } catch (err: any) {
            console.error('Error submitting appointment:', err);
            alert(err.message || 'Failed to submit appointment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-border">
            <div className="space-y-1 border-b border-border pb-4 mb-4">
                <h2 className="text-xl font-bold text-text-primary">New Consultation Request</h2>
                <p className="text-sm text-text-secondary">
                    Please provide detailed information so our doctors can assist you effectively.
                </p>
            </div>

            {/* Category Selection */}
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
                    disabled={!!defaultCategory} // Disable if pre-selected via URL
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
                <label className="block text-sm font-medium text-text-primary">
                    Describe your Symptoms
                </label>
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
                        { value: 'no', label: 'No, I haven\'t taken anything' },
                        { value: 'yes', label: 'Yes, I have taken medication' }
                    ]}
                    value={formData.hasTakenMedication}
                    onChange={handleChange}
                />

                {formData.hasTakenMedication === 'yes' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            medication Details
                        </label>
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

            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                <AlertCircle size={16} className="text-blue-500 shrink-0" />
                <p>
                    By submitting this request, you allow the assigned doctor to view your <strong>Health Profile</strong>.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
            </div>
        </form>
    );
};
