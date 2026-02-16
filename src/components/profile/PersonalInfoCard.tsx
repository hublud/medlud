'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { User, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import { NIGERIAN_STATES } from '@/lib/constants';

import { useAuth } from '@/context/AuthContext';

export const PersonalInfoCard = () => {
    const { profile, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: (profile?.full_name || '').split(' ')[0] || '',
        lastName: (profile?.full_name || '').split(' ').slice(1).join(' ') || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        country: profile?.country || 'NG',
        state: profile?.state || ''
    });

    // Update state if profile changes (e.g., after successful save)
    React.useEffect(() => {
        if (profile) {
            setFormData({
                firstName: (profile.full_name || '').split(' ')[0] || '',
                lastName: (profile.full_name || '').split(' ').slice(1).join(' ') || '',
                email: profile.email || '',
                phone: profile.phone || '',
                country: profile.country || 'NG',
                state: profile.state || ''
            });
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        const updates = {
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone,
            country: formData.country,
            state: formData.state
        };

        const { error } = await updateProfile(updates);

        if (!error) {
            setIsEditing(false);
        }
        setLoading(false);
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Personal Information</h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                        aria-label="Edit personal info"
                    >
                        <Edit2 size={18} />
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                            aria-label="Cancel edit"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={handleSave}
                            className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                            aria-label="Save changes"
                        >
                            <Save size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        leftIcon={User}
                    />
                    <Input
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        leftIcon={User}
                    />
                </div>

                <Input
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    leftIcon={Mail}
                />

                <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    leftIcon={Phone}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        disabled={!isEditing}
                        leftIcon={MapPin}
                    />
                    {formData.country === 'Nigeria' || formData.country === 'NG' ? (
                        <Select
                            label="State / Region"
                            name="state"
                            options={[{ value: '', label: 'Select State' }, ...NIGERIAN_STATES]}
                            value={formData.state}
                            onChange={handleChange}
                            disabled={!isEditing}
                            leftIcon={MapPin}
                        />
                    ) : (
                        <Input
                            label="State / Region"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled={!isEditing}
                            leftIcon={MapPin}
                        />
                    )}
                </div>
            </div>
        </Card>
    );
};
