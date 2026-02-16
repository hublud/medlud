'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    RefreshCcw,
    UserCircle,
    Plus,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface StaffProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_staff_verified: boolean;
    phone?: string;
    created_at: string;
}

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'nurse',
        phone: ''
    });

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const staffRoles = ['nurse', 'nurse-assistant', 'doctor', 'mental-health'];
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', staffRoles)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err: any) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const toggleVerification = async (staffMember: StaffProfile) => {
        setProcessingId(staffMember.id);
        const newStatus = !staffMember.is_staff_verified;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_staff_verified: newStatus })
                .eq('id', staffMember.id);

            if (error) throw error;

            // Update local state
            setStaff(prev => prev.map(s =>
                s.id === staffMember.id ? { ...s, is_staff_verified: newStatus } : s
            ));
        } catch (err: any) {
            console.error('Error toggling verification:', err);
            alert('Failed to update status. Please ensure you have run the database migration SQL.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const defaultPassword = 'MedLudStaff123!'; // Default password for new staff
            const { data, error } = await supabase.rpc('create_staff_user', {
                staff_email: formData.email,
                staff_password: defaultPassword,
                staff_full_name: formData.full_name,
                staff_role: formData.role,
                staff_phone: formData.phone || null
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error || 'Failed to create staff');

            console.log('Staff created successfully:', data);

            // Reset form and close modal
            setFormData({ full_name: '', email: '', role: 'nurse', phone: '' });
            setIsModalOpen(false);

            // Refresh list
            fetchStaff();
            alert(`Staff created successfully!\n\nDefault Password: ${defaultPassword}\nPlease tell them to change it after first login.`);
        } catch (err: any) {
            console.error('Error creating staff:', err);
            alert(err.message || 'Failed to create staff user.');
        } finally {
            setIsCreating(false);
        }
    };

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || s.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            doctor: 'bg-emerald-100 text-emerald-700',
            nurse: 'bg-blue-100 text-blue-700',
            'nurse-assistant': 'bg-purple-100 text-purple-700',
            'mental-health': 'bg-amber-100 text-amber-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
                {role.replace('-', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 text-sm">Verify and manage medical professional access</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                        className="gap-2"
                    >
                        <Plus size={16} />
                        Add Staff
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading} className="gap-2">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all text-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="doctor">Doctors</option>
                        <option value="nurse">Nurses</option>
                        <option value="nurse-assistant">Nursing Assistants</option>
                        <option value="mental-health">Mental Health Pros</option>
                    </select>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Professional</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Verification Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                        <p>Loading staff records...</p>
                                    </td>
                                </tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <p>No staff members found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {s.full_name?.charAt(0) || <UserCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 leading-tight">{s.full_name}</p>
                                                    <p className="text-xs text-gray-500">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(s.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.is_staff_verified ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                                                    <ShieldCheck size={18} />
                                                    Verified
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm">
                                                    <ShieldAlert size={18} />
                                                    Pending Approval
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant={s.is_staff_verified ? "outline" : "primary"}
                                                size="sm"
                                                onClick={() => toggleVerification(s)}
                                                isLoading={processingId === s.id}
                                                className="w-32"
                                            >
                                                {s.is_staff_verified ? (
                                                    <span className="flex items-center gap-1.5 text-red-500">
                                                        <XCircle size={16} /> Deactivate
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 size={16} /> Activate
                                                    </span>
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hint for Admin */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-sm">
                    <strong>Admin Tip:</strong> Activating a staff member will grant them instant access to the professional portal on their dashboard. Please ensure credentials have been verified.
                </p>
            </div>

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 px-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add New Staff</h2>
                                <p className="text-sm text-gray-500">Create a new professional account</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                            <Input
                                label="Full Name"
                                placeholder="e.g. Dr. John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Select
                                label="Professional Role"
                                options={[
                                    { value: 'doctor', label: 'Doctor' },
                                    { value: 'nurse', label: 'Nurse' },
                                    { value: 'nurse-assistant', label: 'Nursing Assistant' },
                                    { value: 'mental-health', label: 'Mental Health Professional' }
                                ]}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                required
                            />
                            <Input
                                label="Phone Number (Optional)"
                                placeholder="+234..."
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={isCreating}
                                >
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
