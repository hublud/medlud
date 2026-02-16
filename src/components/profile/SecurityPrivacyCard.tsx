'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Lock, Shield, Smartphone, Globe } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export const SecurityPrivacyCard = () => {
    const { user } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (passwords.new !== passwords.confirm) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: passwords.new
        });

        if (error) {
            setError(error.message);
        } else {
            setIsPasswordModalOpen(false);
            setPasswords({ new: '', confirm: '' });
            alert('Password updated successfully!');
        }
        setLoading(false);
    };

    return (
        <Card>
            <h2 className="text-lg font-bold text-text-primary mb-6">Security & Privacy</h2>

            <div className="space-y-6">
                <div>
                    <Button
                        variant="outline"
                        fullWidth
                        className="justify-between group"
                        onClick={() => setIsPasswordModalOpen(true)}
                    >
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-text-secondary group-hover:text-primary" />
                            <span>Change Password</span>
                        </div>
                        <span className="text-xs text-text-secondary">Last changed 30 days ago</span>
                    </Button>
                </div>

                <div className="border-t border-border pt-2">
                    <Toggle
                        label="Two-Factor Authentication"
                        description="Add an extra layer of security"
                        checked={false}
                        onChange={() => { }}
                    />
                </div>

                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <Shield size={16} /> Privacy Information
                    </h3>
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs space-y-2">
                        <p>• Your connection to HubLud is encrypted with SSL.</p>
                        <p>• Your medical data is strictly confidential and never shared without your consent.</p>
                        <p>• You can request a copy of your data or account deletion at any time via support.</p>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {error && (
                        <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                            {error}
                        </div>
                    )}
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        leftIcon={Lock}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        leftIcon={Lock}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPasswordModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};
