'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Activity, Stethoscope, FileBadge, Calendar, Droplets, User, Plus, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BLOOD_GROUPS } from '@/lib/constants';

interface HealthInfoCardProps {
    role: 'PATIENT' | 'PROVIDER';
}

import { useAuth } from '@/context/AuthContext';

export const HealthInfoCard: React.FC<HealthInfoCardProps> = ({ role }) => {
    const { profile, updateProfile } = useAuth();
    const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || '');
    const [conditions, setConditions] = useState<{ id: number, text: string, color: 'orange' }[]>(
        profile?.known_conditions ? profile.known_conditions.split(',').map((c: string, i: number) => ({ id: i, text: c.trim(), color: 'orange' })) : []
    );
    const [allergies, setAllergies] = useState<{ id: number, text: string, color: 'red' }[]>(
        profile?.allergies ? profile.allergies.split(',').map((a: string, i: number) => ({ id: i, text: a.trim(), color: 'red' })) : []
    );

    // Update state if profile changes
    React.useEffect(() => {
        if (profile) {
            setBloodGroup(profile.blood_group || '');
            setConditions(profile.known_conditions ? profile.known_conditions.split(',').map((c: string, i: number) => ({ id: i, text: c.trim(), color: 'orange' })) : []);
            setAllergies(profile.allergies ? profile.allergies.split(',').map((a: string, i: number) => ({ id: i, text: a.trim(), color: 'red' })) : []);
        }
    }, [profile]);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'CONDITION' | 'ALLERGY' | null;
        title: string;
    }>({
        isOpen: false,
        type: null,
        title: ''
    });

    const [newItemText, setNewItemText] = useState('');

    const openModal = (type: 'CONDITION' | 'ALLERGY') => {
        setModalConfig({
            isOpen: true,
            type,
            title: type === 'CONDITION' ? 'Add Known Condition' : 'Add Allergy'
        });
        setNewItemText('');
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false, type: null }));
    };

    const handleSetBloodGroup = async (value: string) => {
        setBloodGroup(value);
        await updateProfile({ blood_group: value });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        let updatedConditions = profile?.known_conditions ? profile.known_conditions.split(',').map((c: string) => c.trim()) : [];
        let updatedAllergies = profile?.allergies ? profile.allergies.split(',').map((a: string) => a.trim()) : [];

        if (modalConfig.type === 'CONDITION') {
            updatedConditions.push(newItemText.trim());
        } else if (modalConfig.type === 'ALLERGY') {
            updatedAllergies.push(newItemText.trim());
        }

        const updates = {
            known_conditions: updatedConditions.join(', '),
            allergies: updatedAllergies.join(', ')
        };

        const { error } = await updateProfile(updates);

        if (!error) {
            closeModal();
            setNewItemText('');
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">
                    {role === 'PATIENT' ? 'Health Information' : 'Professional Details'}
                </h2>
                <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
                    {role === 'PATIENT' ? 'Syncing to Cloud' : 'Read Only'}
                </span>
            </div>

            <div className="space-y-4">
                {role === 'PATIENT' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem icon={User} label="Gender" value={profile?.gender || 'Not Specified'} />
                            <InfoItem
                                icon={Calendar}
                                label="Date of Birth"
                                value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not Specified'}
                            />

                            {/* Blood Group with Select */}
                            <div className="col-span-1 md:col-span-2">
                                <Select
                                    label="Blood Group"
                                    options={BLOOD_GROUPS}
                                    value={bloodGroup}
                                    onChange={(e) => handleSetBloodGroup(e.target.value)}
                                    leftIcon={Droplets}
                                />
                            </div>
                        </div>

                        {/* Known Conditions */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs uppercase text-text-secondary font-bold">Known Conditions</h3>
                                <button
                                    onClick={() => openModal('CONDITION')}
                                    className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
                                    title="Add Condition"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {conditions.length > 0 ? (
                                    conditions.map(c => (
                                        <Badge key={c.id} text={c.text} color={c.color} />
                                    ))
                                ) : (
                                    <span className="text-sm text-text-secondary italic">None recorded</span>
                                )}
                            </div>
                        </div>

                        {/* Allergies */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs uppercase text-text-secondary font-bold">Allergies</h3>
                                <button
                                    onClick={() => openModal('ALLERGY')}
                                    className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
                                    title="Add Allergy"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allergies.length > 0 ? (
                                    allergies.map(a => (
                                        <Badge key={a.id} text={a.text} color={a.color} />
                                    ))
                                ) : (
                                    <span className="text-sm text-text-secondary italic">None recorded</span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            <InfoItem icon={Stethoscope} label="Profession" value="Medical Doctor" />
                            <InfoItem icon={Activity} label="Specialty" value="Cardiology" />
                            <InfoItem icon={FileBadge} label="License Number" value="MD-2023-8892" />
                            <InfoItem icon={Calendar} label="Experience" value="8 Years" />
                            <InfoItem icon={Activity} label="Affiliation" value="Lagos University Teaching Hospital" />
                        </div>
                    </>
                )}
            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
            >
                <form onSubmit={handleAddItem} className="space-y-4">
                    <Input
                        label="Name"
                        placeholder={modalConfig.type === 'CONDITION' ? "e.g. Hypertension" : "e.g. Pollen"}
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        required
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-1 text-text-secondary">
            <Icon size={14} />
            <span className="text-xs">{label}</span>
        </div>
        <p className="font-semibold text-text-primary">{value}</p>
    </div>
);

const Badge = ({ text, color }: { text: string, color: 'orange' | 'red' | 'gray' | 'blue' }) => {
    const colors = {
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
        <span className={`text-xs px-2.5 py-1 rounded-full border ${colors[color]} font-medium`}>
            {text}
        </span>
    );
};
