'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar as CalendarIcon, List, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppointmentCalendar } from '@/components/admin/AppointmentCalendar';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { AppointmentDetailModal } from '@/components/admin/AppointmentDetailModal';

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

export default function AdminAppointmentsPage() {
    const router = useRouter();
    const { profile, user, loading: authLoading } = useAuth();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [profile, authLoading, router]);

    useEffect(() => {
        loadAppointments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, statusFilter, categoryFilter]);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    user:profiles!user_id(full_name, email),
                    staff:profiles!staff_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(apt => apt.category === categoryFilter);
        }

        setFilteredAppointments(filtered);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary font-medium">Loading appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Appointments Management</h1>
                        <p className="text-text-secondary mt-1">Manage and track all appointments</p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${view === 'calendar'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-text-secondary border border-border hover:border-primary'
                                }`}
                        >
                            <CalendarIcon size={18} />
                            Calendar
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${view === 'list'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-text-secondary border border-border hover:border-primary'
                                }`}
                        >
                            <List size={18} />
                            List
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <span className="font-medium text-text-primary">Filters:</span>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Categories</option>
                        <option value="general">General</option>
                        <option value="mental-health">Mental Health</option>
                        <option value="maternal">Maternal</option>
                    </select>

                    <div className="ml-auto text-sm text-text-secondary">
                        Showing {filteredAppointments.length} of {appointments.length} appointments
                    </div>
                </div>

                {/* Content */}
                {view === 'calendar' ? (
                    <AppointmentCalendar
                        onEventClick={(apt) => setSelectedAppointment(apt as any)}
                    />
                ) : (
                    <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(filteredAppointments.map(a => a.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                                checked={selectedIds.length === filteredAppointments.length && filteredAppointments.length > 0}
                                                className="w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Patient</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Title</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Category</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Staff</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredAppointments.map(apt => (
                                        <tr
                                            key={apt.id}
                                            onClick={() => setSelectedAppointment(apt)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(apt.id)}
                                                    onChange={() => toggleSelection(apt.id)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-text-primary">{apt.user?.full_name || 'Unknown'}</p>
                                                    <p className="text-sm text-text-secondary">{apt.user?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-primary">{apt.title}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(apt.category)}`}>
                                                    {apt.category.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {apt.staff?.full_name || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary text-sm">
                                                {new Date(apt.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredAppointments.length === 0 && (
                            <div className="py-12 text-center text-text-secondary">
                                No appointments found matching your filters
                            </div>
                        )}
                    </div>
                )}

                {/* Bulk Actions Bar */}
                <BulkActionsBar
                    selectedIds={selectedIds}
                    onClearSelection={() => setSelectedIds([])}
                    onActionComplete={loadAppointments}
                    currentUserId={user?.id || ''}
                />

                {/* Detail Modal */}
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onUpdate={loadAppointments}
                    currentUserId={user?.id || ''}
                />
            </div>
        </div>
    );
}
