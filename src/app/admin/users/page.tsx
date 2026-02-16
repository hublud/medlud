'use client';

import React, { useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    UserPlus,
    Mail,
    Phone,
    Calendar as CalendarIcon,
    Shield,
    Trash2,
    Edit2,
    RefreshCcw,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { supabase } from '@/lib/supabase';
import { adminCreateUser, adminUpdateUser } from '@/app/actions/admin-users';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { X } from 'lucide-react';

export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'patient',
        phone: '',
        password: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);



    // ... (existing imports)

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const result = await adminCreateUser({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: formData.role,
                phone: formData.phone
            });

            if (!result.success) throw new Error(result.error);

            alert('User created successfully!');
            setIsAddModalOpen(false);
            setFormData({ full_name: '', email: '', role: 'patient', phone: '', password: '' });
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to create user');
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const result = await adminUpdateUser({
                userId: selectedUser.id,
                role: formData.role,
                password: formData.password || undefined
            });

            if (!result.success) throw new Error(result.error);

            alert('User updated successfully!');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to update user');
        } finally {
            setProcessing(false);
        }
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            role: user.role || 'patient',
            phone: user.phone || '',
            password: '' // Don't show existing password
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This will only remove their profile record.')) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchUsers();
            alert('Profile removed from dashboard.');
        } catch (err: any) {
            alert(err.message || 'Failed to delete profile');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.phone?.includes(searchTerm));
        return matchesSearch;
    });

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage all registered users and clinical staff.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            setFormData({ full_name: '', email: '', role: 'patient', phone: '', password: '' });
                            setIsAddModalOpen(true);
                        }}
                        className="gap-2"
                    >
                        <UserPlus size={20} />
                        Add User
                    </Button>
                    <Button variant="outline" onClick={fetchUsers} disabled={loading} className="gap-2">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm bg-gray-50/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm md:text-base">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-nowrap">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-nowrap">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-nowrap">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-nowrap">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                        <p>Fetching user directory...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                                                    {getInitials(user.full_name || user.email)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 line-clamp-1">{user.full_name || 'Anonymous'}</p>
                                                    <p className="text-xs text-text-secondary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Profile</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 line-clamp-1">
                                                    <Mail size={14} className="shrink-0" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone size={14} className="shrink-0" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                ['doctor', 'nurse', 'mental-health', 'nurse-assistant'].includes(user.role) ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                <Shield size={12} />
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon size={14} className="shrink-0" />
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all text-gray-400 hover:text-primary"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hint for Admin */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-orange-700">
                <Shield size={20} className="shrink-0" />
                <p className="text-sm">
                    <strong>Administrative Control:</strong> You have high-level access to reset any user password or reassignment roles. Please exercise caution when modifying clinical staff roles.
                </p>
            </div>

            {/* Modals Container */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{isAddModalOpen ? 'Add New User' : 'Edit User Access'}</h2>
                                <p className="text-sm text-gray-500">
                                    {isAddModalOpen ? 'Manually register a new MedLud user' : `Updating ${selectedUser?.full_name || 'User'}`}
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={isAddModalOpen ? handleCreateUser : handleUpdateUser} className="p-6 space-y-4">
                            {isAddModalOpen && (
                                <>
                                    <Input
                                        label="Full Name"
                                        placeholder="e.g. Seyi Makinde"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </>
                            )}

                            <Select
                                label="System Role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                options={[
                                    { value: 'patient', label: 'Patient / General User' },
                                    { value: 'doctor', label: 'Doctor' },
                                    { value: 'nurse', label: 'Nurse' },
                                    { value: 'nurse-assistant', label: 'Nursing Assistant' },
                                    { value: 'mental-health', label: 'Mental Health Professional' },
                                    { value: 'admin', label: 'Administrator' }
                                ]}
                                required
                            />

                            <Input
                                label={isEditModalOpen ? "New Password (Leave blank to keep current)" : "Password"}
                                type="text"
                                placeholder={isEditModalOpen ? "Enter new password..." : "MedLud123!"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={isAddModalOpen}
                            />

                            {isAddModalOpen && (
                                <Input
                                    label="Phone Number (Optional)"
                                    placeholder="+234..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={processing}
                                >
                                    {isAddModalOpen ? 'Create Account' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
