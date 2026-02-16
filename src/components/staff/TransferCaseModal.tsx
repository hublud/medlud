'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, User } from 'lucide-react';

interface StaffMember {
    id: string;
    full_name: string;
    role: string;
}

interface TransferCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (staffId: string) => Promise<void>;
    currentDoctorId?: string;
}

export const TransferCaseModal: React.FC<TransferCaseModalProps> = ({
    isOpen,
    onClose,
    onTransfer,
    currentDoctorId
}) => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [transferring, setTransferring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchStaff();
        }
    }, [isOpen]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .in('role', ['doctor', 'nurse', 'mental-health', 'nurse-assistant', 'admin']);

            if (error) throw error;

            // Filter out current doctor
            const filteredStaff = data?.filter(s => s.id !== currentDoctorId) || [];
            setStaff(filteredStaff);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!selectedStaffId) return;
        setTransferring(true);
        try {
            await onTransfer(selectedStaffId);
            onClose();
        } catch (error) {
            console.error('Transfer error:', error);
            alert('Failed to transfer case');
        } finally {
            setTransferring(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transfer Case">
            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Select a staff member to transfer this case to. They will take over the consultation and chat.
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : staff.length === 0 ? (
                    <p className="text-sm text-center py-8 text-gray-400">No available staff members found.</p>
                ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {staff.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedStaffId(member.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedStaffId === member.id
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User size={16} className="text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold">{member.full_name}</p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{member.role}</p>
                                    </div>
                                </div>
                                {selectedStaffId === member.id && (
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={transferring}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleTransfer}
                        disabled={!selectedStaffId || transferring}
                        isLoading={transferring}
                    >
                        Confirm Transfer
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
