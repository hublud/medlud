'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, FileText, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getAppointmentHistory, getAvailableStaff, reassignAppointment, AppointmentHistory } from '@/utils/appointmentManagement';

interface Appointment {
    id: string;
    title: string;
    symptoms: string;
    status: string;
    category: string;
    created_at: string;
    staff_id: string | null;
    user?: {
        full_name: string;
        email: string;
    };
    staff?: {
        full_name: string;
        email: string;
    };
}

interface AppointmentDetailModalProps {
    appointment: Appointment | null;
    onClose: () => void;
    onUpdate: () => void;
    currentUserId: string;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
    appointment,
    onClose,
    onUpdate,
    currentUserId
}) => {
    const [history, setHistory] = useState<AppointmentHistory[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [isReassigning, setIsReassigning] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (appointment) {
            loadHistory();
            loadStaff();
            setSelectedStaffId(appointment.staff_id || '');
        }
    }, [appointment]);

    const loadHistory = async () => {
        if (!appointment) return;
        const data = await getAppointmentHistory(appointment.id);
        setHistory(data);
    };

    const loadStaff = async () => {
        const data = await getAvailableStaff();
        setStaff(data);
    };

    const handleReassign = async () => {
        if (!appointment || !selectedStaffId) return;

        setIsReassigning(true);
        try {
            await reassignAppointment(
                appointment.id,
                selectedStaffId,
                currentUserId,
                appointment.staff_id || undefined
            );
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error reassigning appointment:', error);
            alert('Failed to reassign appointment');
        } finally {
            setIsReassigning(false);
        }
    };

    if (!appointment) return null;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'mental-health': return 'bg-purple-100 text-purple-700';
            case 'maternal': return 'bg-pink-100 text-pink-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-text-primary">Appointment Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status & Category */}
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(appointment.category)}`}>
                            {appointment.category.replace('-', ' ').toUpperCase()}
                        </span>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <User size={20} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Patient</p>
                                <p className="font-semibold">{appointment.user?.full_name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">{appointment.user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Created</p>
                                <p className="font-semibold">{new Date(appointment.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FileText size={20} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Title</p>
                                <p className="font-semibold">{appointment.title}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-2">Symptoms</p>
                            <p className="text-text-primary bg-gray-50 p-3 rounded-lg">{appointment.symptoms}</p>
                        </div>
                    </div>

                    {/* Staff Assignment */}
                    <div className="border-t border-border pt-6">
                        <h3 className="font-bold text-text-primary mb-3">Staff Assignment</h3>
                        <div className="flex gap-3">
                            <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Unassigned</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.full_name} ({s.role})
                                    </option>
                                ))}
                            </select>
                            <Button
                                onClick={handleReassign}
                                disabled={isReassigning || selectedStaffId === appointment.staff_id}
                            >
                                {isReassigning ? 'Reassigning...' : 'Reassign'}
                            </Button>
                        </div>
                        {appointment.staff && (
                            <p className="text-sm text-gray-500 mt-2">
                                Currently assigned to: <span className="font-medium">{appointment.staff.full_name}</span>
                            </p>
                        )}
                    </div>

                    {/* History */}
                    <div className="border-t border-border pt-6">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 font-bold text-text-primary hover:text-primary transition-colors"
                        >
                            <History size={20} />
                            Change History ({history.length})
                        </button>

                        {showHistory && (
                            <div className="mt-4 space-y-3">
                                {history.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No history available</p>
                                ) : (
                                    history.map(h => (
                                        <div key={h.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                                            <p className="font-medium text-text-primary">
                                                {h.changed_by_profile?.full_name || 'System'}
                                            </p>
                                            <p className="text-gray-600">{h.change_note || 'Status updated'}</p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {new Date(h.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
