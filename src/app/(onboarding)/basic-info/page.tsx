'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { User, Mail, Phone, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NIGERIAN_STATES } from '@/lib/constants';

export default function BasicInfoPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        country: 'NG',
        state: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            const { data, error } = await signUp(formData.email, formData.password, {
                full_name: fullName,
                phone: formData.phone,
                country: formData.country,
                state: formData.state
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            // Success redirect
            router.push('/verify-email');
        } catch (err: any) {
            setError('Failed to create account. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-primary">Tell us about yourself</h1>
                <p className="text-text-secondary mt-1">We need this to setup your account</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        name="firstName"
                        placeholder="e.g. Ade"
                        required
                        leftIcon={User}
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <Input
                        label="Last Name"
                        name="lastName"
                        placeholder="e.g. Okafor"
                        required
                        leftIcon={User}
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                </div>

                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    leftIcon={Mail}
                    value={formData.email}
                    onChange={handleChange}
                />

                <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    required
                    leftIcon={Phone}
                    value={formData.phone}
                    onChange={handleChange}
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    leftIcon={Lock}
                    value={formData.password}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Country"
                        name="country"
                        options={[
                            { value: 'NG', label: 'Nigeria' },
                            { value: 'GH', label: 'Ghana' },
                            { value: 'KE', label: 'Kenya' },
                            { value: 'ZA', label: 'South Africa' },
                            { value: 'OTHER', label: 'Other' }
                        ]}
                        value={formData.country}
                        onChange={handleChange}
                        required
                    />

                    {formData.country === 'NG' ? (
                        <Select
                            label="State"
                            name="state"
                            options={[{ value: '', label: 'Select State' }, ...NIGERIAN_STATES]}
                            value={formData.state || ''}
                            onChange={handleChange}
                            required
                        />
                    ) : (
                        <Input
                            label="State / Region"
                            name="state"
                            placeholder="State or Region"
                            value={formData.state || ''}
                            onChange={handleChange}
                        />
                    )}
                </div>

                <p className="text-xs text-text-secondary">
                    By continuing, you agree to our <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>

                <Button type="submit" fullWidth size="lg" className="mt-4" isLoading={loading}>
                    Continue
                </Button>
            </form>
        </div>
    );
}
