'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    User, 
    ShieldCheck, 
    Loader2, 
    AlertCircle, 
    ArrowLeft, 
    Sliders,
    Pill, 
    Microscope, 
    Users, 
    Layers, 
    Plus, 
    X, 
    CheckCircle,
    Mail,
    Phone,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function FacilitySettingsPage() {
    const { user, profile } = useAuth();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingFeatures, setUpdatingFeatures] = useState(false);
    
    // Facility Features State
    const [hasLab, setHasLab] = useState(true);
    const [hasPharmacy, setHasPharmacy] = useState(true);
    
    // Staff List State
    const [staffList, setStaffList] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [bedsCount, setBedsCount] = useState(0);

    // Add Staff Modal State
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [addStaffName, setAddStaffName] = useState('');
    const [addStaffEmail, setAddStaffEmail] = useState('');
    const [addStaffRole, setAddStaffRole] = useState<'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'lab_tech' | 'ward_manager'>('doctor');
    const [addStaffPhone, setAddStaffPhone] = useState('');
    const [addStaffDeptId, setAddStaffDeptId] = useState('');
    const [submittingStaff, setSubmittingStaff] = useState(false);

    // Add Department State
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDesc, setNewDeptDesc] = useState('');
    const [showAddDeptModal, setShowAddDeptModal] = useState(false);
    const [submittingDept, setSubmittingDept] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch current caller staff mapping and facility details
            const { data: staffData } = await (supabase as any)
                .from('facility_staff')
                .select('*, facility:facilities(*)')
                .eq('profile_id', user?.id)
                .eq('status', 'active')
                .maybeSingle();

            if (!staffData) {
                setLoading(false);
                return;
            }
            
            setStaffInfo(staffData);
            setHasLab(staffData.facility?.has_lab ?? true);
            setHasPharmacy(staffData.facility?.has_pharmacy ?? true);

            const facilityId = staffData.facility_id;

            // 2. Fetch all staff members for facility
            const { data: staffMembers } = await (supabase as any)
                .from('facility_staff')
                .select('*, profile:profiles(full_name, email), department:departments(name)')
                .eq('facility_id', facilityId);
            setStaffList(staffMembers || []);

            // 3. Fetch departments
            const { data: deptData } = await (supabase as any)
                .from('departments')
                .select('*')
                .eq('facility_id', facilityId);
            setDepartments(deptData || []);
            if (deptData && deptData.length > 0) {
                setAddStaffDeptId(deptData[0].id);
            }

            // 4. Fetch wards and beds count
            const { data: wardData } = await (supabase as any)
                .from('wards')
                .select('*')
                .eq('facility_id', facilityId);
            setWards(wardData || []);

            if (wardData && wardData.length > 0) {
                const wardIds = wardData.map((w: any) => w.id);
                const { count } = await (supabase as any)
                    .from('beds')
                    .select('*', { count: 'exact', head: true })
                    .in('ward_id', wardIds);
                setBedsCount(count || 0);
            }

        } catch (e) {
            console.error('Error fetching facility settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeatures = async () => {
        if (!staffInfo) return;
        setUpdatingFeatures(true);

        try {
            const { error } = await (supabase as any)
                .from('facilities')
                .update({
                    has_lab: hasLab,
                    has_pharmacy: hasPharmacy,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staffInfo.facility_id);

            if (error) throw error;
            
            alert('Facility configuration updated successfully!');
            // Refresh staff info
            await fetchInitialData();
        } catch (err: any) {
            console.error('Update features error:', err);
            alert(`Failed to save configuration: ${err.message}`);
        } finally {
            setUpdatingFeatures(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffInfo || !addStaffName.trim() || !addStaffEmail.trim()) return;
        setSubmittingStaff(true);

        try {
            // Get auth token from supabase to authenticate api request
            const session = (await supabase.auth.getSession()).data.session;
            const token = session?.access_token;

            const response = await fetch('/api/facility/add-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    facilityId: staffInfo.facility_id,
                    email: addStaffEmail,
                    fullName: addStaffName,
                    role: addStaffRole,
                    phone: addStaffPhone || null,
                    departmentId: addStaffDeptId || null
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add staff member');
            }

            if (data.credentials) {
                alert(`Staff member added successfully!\n\nCredentials:\nEmail: ${data.credentials.email}\nDefault Password: ${data.credentials.password}\n\nPlease tell them to change it on their first login.`);
            } else {
                alert(data.message || 'Staff member added successfully!');
            }

            setShowAddStaffModal(false);
            setAddStaffName('');
            setAddStaffEmail('');
            setAddStaffPhone('');
            
            // Refresh directory list
            await fetchInitialData();
        } catch (err: any) {
            console.error('Add staff submission error:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setSubmittingStaff(false);
        }
    };

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffInfo || !newDeptName.trim()) return;
        setSubmittingDept(true);

        try {
            const { data, error } = await (supabase as any)
                .from('departments')
                .insert({
                    facility_id: staffInfo.facility_id,
                    name: newDeptName.trim(),
                    description: newDeptDesc.trim() || null
                })
                .select()
                .single();

            if (error) throw error;

            alert('Department created successfully!');
            setNewDeptName('');
            setNewDeptDesc('');
            setShowAddDeptModal(false);
            
            // Refresh settings data
            await fetchInitialData();
        } catch (err: any) {
            console.error('Error adding department:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setSubmittingDept(false);
        }
    };

    const handleDeleteDepartment = async (deptId: string) => {
        if (!confirm('Are you sure you want to delete this department? Any staff assigned to it will be unassigned.')) return;

        try {
            const { error } = await (supabase as any)
                .from('departments')
                .delete()
                .eq('id', deptId);

            if (error) throw error;

            alert('Department deleted successfully!');
            await fetchInitialData();
        } catch (err: any) {
            console.error('Error deleting department:', err);
            alert(`Error: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Opening settings...</p>
                </div>
            </div>
        );
    }

    if (!staffInfo || profile?.role !== 'partner') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-150 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            Only the facility administrator/partner can configure settings and manage staff lists.
                        </p>
                    </div>
                    <Link href="/saas/dashboard">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                            Back to Staff Portal
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/saas/dashboard">
                        <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200">
                            <ArrowLeft size={18} />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                            <Sliders size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Facility Settings & Modules</h1>
                        <p className="text-xs text-slate-500">Configure enabled departments, activate in-house pharmacy/labs, and manage local clinical staff.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Feature toggles & general info */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Facility Profile Card */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-slate-800 text-sm border-b border-gray-100 pb-3">Facility Context</h3>
                            <div className="text-xs space-y-2 leading-relaxed text-slate-600">
                                <p>🏢 <strong>Name:</strong> {staffInfo.facility?.name}</p>
                                <p>🔑 <strong>License:</strong> {staffInfo.facility?.license_number || 'N/A'}</p>
                                <p>📞 <strong>Contact:</strong> {staffInfo.facility?.contact_phone || 'N/A'}</p>
                                <p>⚡ <strong>SaaS Subscription:</strong> 
                                    <span className="ml-1.5 px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                        {staffInfo.facility?.saas_subscription_status}
                                    </span>
                                </p>
                                {staffInfo.facility?.saas_subscription_expires_at && (
                                    <p className="text-[10px] text-slate-400">
                                        Expires: {new Date(staffInfo.facility.saas_subscription_expires_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Feature Toggles Panel */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-sm">Feature Activation</h3>
                                <p className="text-[10px] text-slate-400">Enable or disable specific hospital modules.</p>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Lab Toggle */}
                                <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex gap-2.5 items-start">
                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                                            <Microscope size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">In-house Laboratory</p>
                                            <p className="text-[10px] text-slate-400">Enable diagnostics queuing and lab results upload.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={hasLab} 
                                            onChange={(e) => setHasLab(e.target.checked)} 
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                {/* Pharmacy Toggle */}
                                <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex gap-2.5 items-start">
                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                                            <Pill size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">In-house Pharmacy</p>
                                            <p className="text-[10px] text-slate-400">Enable prescription dispensing queue operations.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={hasPharmacy} 
                                            onChange={(e) => setHasPharmacy(e.target.checked)} 
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSaveFeatures}
                                disabled={updatingFeatures}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 flex justify-center"
                            >
                                {updatingFeatures ? 'Saving Configuration...' : 'Save Configuration'}
                            </Button>
                        </div>

                        {/* Wards & Beds Quick Stat Panel */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                <Layers size={16} className="text-emerald-600" /> Ward & Beds Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase">Wards</p>
                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{wards.length}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase">Total Beds</p>
                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{bedsCount}</p>
                                </div>
                            </div>
                            <Link href="/saas/dashboard/wards" className="block">
                                <Button variant="outline" className="w-full text-xs font-bold py-2 border-gray-250 hover:bg-slate-50 text-slate-650">
                                    Manage Beds & Wards
                                </Button>
                            </Link>
                        </div>

                        {/* Departments Panel */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Users size={16} className="text-emerald-600" /> Hospital Departments
                                </h3>
                                <Button 
                                    size="sm" 
                                    onClick={() => setShowAddDeptModal(true)} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] py-1 px-2.5 font-bold flex items-center gap-0.5"
                                >
                                    <Plus size={12} /> Create
                                </Button>
                            </div>
                            
                            {departments.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-medium py-2 text-center">No departments created yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {departments.map(d => (
                                        <div key={d.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] flex justify-between items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-800 truncate">{d.name}</p>
                                                {d.description && <p className="text-slate-400 mt-0.5 truncate">{d.description}</p>}
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteDepartment(d.id)}
                                                className="text-rose-500 hover:text-rose-700 font-bold shrink-0 text-[10px] p-1"
                                                title="Delete Department"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Staff directory (Add Doctor UI) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Staff Directory Panel */}
                        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                                <div>
                                    <h3 className="font-extrabold text-slate-850 text-sm">Staff Directory</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Verify active medical practitioners mapped to this facility.</p>
                                </div>
                                <Button 
                                    onClick={() => setShowAddStaffModal(true)} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1 self-start sm:self-auto"
                                >
                                    <Plus size={14} /> Add Staff Member
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="p-4 pl-6">Professional</th>
                                            <th className="p-4">Facility Role</th>
                                            <th className="p-4">Department</th>
                                            <th className="p-4 pr-6 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                                        {staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                                                    No registered staff found.
                                                </td>
                                            </tr>
                                        ) : (
                                            staffList.map((st) => (
                                                <tr key={st.id} className="hover:bg-slate-50/40 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-bold text-slate-800">{st.profile?.full_name || 'Anonymous Practitioner'}</div>
                                                        <div className="text-[9px] text-slate-400 mt-0.5">{st.profile?.email || 'No email registered'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="capitalize font-semibold text-slate-650 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                                            {st.role.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-500">
                                                        {st.department?.name || '--'}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right font-semibold">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                                            st.status === 'active' 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {st.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="font-extrabold text-slate-800 text-base">Add Facility Staff</h3>
                            <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Dr. Amina Bello" 
                                        value={addStaffName}
                                        onChange={(e) => setAddStaffName(e.target.value)}
                                        required
                                        className="w-full text-xs border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="email" 
                                        placeholder="e.g. aminabello@medlud.com" 
                                        value={addStaffEmail}
                                        onChange={(e) => setAddStaffEmail(e.target.value)}
                                        required
                                        className="w-full text-xs border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number (Optional)</label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. +2348031112233" 
                                        value={addStaffPhone}
                                        onChange={(e) => setAddStaffPhone(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Role</label>
                                    <select 
                                        value={addStaffRole}
                                        onChange={(e) => setAddStaffRole(e.target.value as any)}
                                        className="w-full text-xs border border-gray-200 rounded-xl py-2.5 px-3 bg-white"
                                    >
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="lab_tech">Lab Tech</option>
                                        <option value="ward_manager">Ward Manager</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                                    <select 
                                        value={addStaffDeptId}
                                        onChange={(e) => setAddStaffDeptId(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl py-2.5 px-3 bg-white"
                                    >
                                        <option value="">No Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-50 text-slate-500 p-3 rounded-2xl border border-slate-100 text-[9px] leading-normal font-semibold">
                                💡 Creating a new staff account will automatically verify them, register their professional credentials in the system, and map them to {staffInfo.facility?.name}.
                            </div>

                            <Button 
                                type="submit" 
                                disabled={submittingStaff}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2 flex justify-center"
                            >
                                {submittingStaff ? 'Processing Add Staff...' : 'Confirm & Add Staff'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Department Modal */}
            {showAddDeptModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="font-extrabold text-slate-800 text-base">Create Department</h3>
                            <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddDepartment} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Pediatrics or General Medicine" 
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    required
                                    className="w-full text-xs border border-gray-200 rounded-xl py-2.5 px-3 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                                <textarea 
                                    placeholder="e.g. Child health care and clinic operations..."
                                    value={newDeptDesc}
                                    onChange={(e) => setNewDeptDesc(e.target.value)}
                                    rows={3}
                                    className="w-full text-xs border border-gray-200 rounded-xl py-2.5 px-3 outline-none"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={submittingDept}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2 flex justify-center"
                            >
                                {submittingDept ? 'Creating...' : 'Create Department'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
