'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Phone, Users, Plus, Share2, User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export const EmergencyContactsCard = () => {
    const { profile, updateProfile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        relationship: '',
        phone: ''
    });

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updates = {
            emergency_contact_name: newContact.name,
            emergency_contact_relationship: newContact.relationship,
            emergency_contact_phone: newContact.phone
        };

        const { error } = await updateProfile(updates);

        if (!error) {
            setIsModalOpen(false);
            setNewContact({ name: '', relationship: '', phone: '' });
        }
        setLoading(false);
    };

    const handleToggleLocation = async (checked: boolean) => {
        await updateProfile({ share_location_emergency: checked });
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Emergency Contacts</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {profile?.emergency_contact_name ? (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg animate-in fade-in duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-text-primary">{profile.emergency_contact_name}</h3>
                                <p className="text-sm text-text-secondary">{profile.emergency_contact_relationship}</p>
                            </div>
                            <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded font-medium">Primary</span>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-text-primary font-medium">
                            <Phone size={16} className="text-red-500" />
                            {profile.emergency_contact_phone}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-xl text-center">
                        <p className="text-text-secondary text-sm italic">No emergency contact added yet.</p>
                    </div>
                )}

                <div className="border-t border-border pt-4">
                    <Toggle
                        label="Share Live Location"
                        description="Allow contacts to see location during emergencies"
                        checked={!!profile?.share_location_emergency}
                        onChange={handleToggleLocation}
                    />
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Emergency Contact"
            >
                <form onSubmit={handleAddContact} className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        required
                        leftIcon={User}
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <Input
                        label="Relationship"
                        placeholder="e.g. Brother"
                        required
                        leftIcon={Users}
                        value={newContact.relationship}
                        onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="+234..."
                        required
                        leftIcon={Phone}
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            Add Contact
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};
