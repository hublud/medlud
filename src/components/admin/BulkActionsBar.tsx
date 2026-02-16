'use client';

import React, { useState } from 'react';
import { Check, X, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { bulkUpdateAppointmentStatus } from '@/utils/appointmentManagement';

interface BulkActionsBarProps {
    selectedIds: string[];
    onClearSelection: () => void;
    onActionComplete: () => void;
    currentUserId: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedIds,
    onClearSelection,
    onActionComplete,
    currentUserId
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleBulkAction = async (status: string) => {
        setIsProcessing(true);
        try {
            await bulkUpdateAppointmentStatus(selectedIds, status, currentUserId);
            onActionComplete();
            onClearSelection();
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Failed to update appointments. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-lg">
                        <Check size={20} />
                    </div>
                    <span className="font-semibold">{selectedIds.length} selected</span>
                </div>

                <div className="h-8 w-px bg-slate-700"></div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('APPROVED')}
                        disabled={isProcessing}
                        className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                    >
                        <Check size={16} className="mr-1" />
                        Approve
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('COMPLETED')}
                        disabled={isProcessing}
                        className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    >
                        <Check size={16} className="mr-1" />
                        Complete
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('CANCELLED')}
                        disabled={isProcessing}
                        className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                    >
                        <X size={16} className="mr-1" />
                        Cancel
                    </Button>
                </div>

                <div className="h-8 w-px bg-slate-700"></div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={onClearSelection}
                    disabled={isProcessing}
                    className="text-slate-300 border-slate-600 hover:bg-slate-800"
                >
                    Clear
                </Button>
            </div>
        </div>
    );
};
