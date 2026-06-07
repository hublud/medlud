'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Hospital, 
    ShieldCheck, 
    ShieldAlert, 
    Calendar, 
    Search, 
    Filter, 
    Clock, 
    Activity, 
    CreditCard,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SaaSAdminPage() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');
    const [renewingFacility, setRenewingFacility] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('facilities')
                .select('*, type:facility_types(name)')
                .order('name', { ascending: true });

            if (error) throw error;
            setFacilities(data || []);
        } catch (e) {
            console.error('Error fetching facilities for SaaS admin:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSaaS = async (facilityId: string, currentEnabled: boolean) => {
        try {
            const nextStatus = currentEnabled ? 'expired' : 'active';
            const { error } = await (supabase as any)
                .from('facilities')
                .update({ 
                    saas_enabled: !currentEnabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', facilityId);

            if (error) throw error;
            fetchFacilities();
        } catch (err: any) {
            console.error('Toggle SaaS error:', err);
            alert(`Failed to update SaaS state: ${err.message}`);
        }
    };

    const handleRenewSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewingFacility) return;
        setIsSubmitting(true);

        try {
            const nextExpiry = new Date();
            nextExpiry.setDate(nextExpiry.getDate() + 30); // 30-day subscription

            const { error } = await (supabase as any)
                .from('facilities')
                .update({
                    saas_enabled: true,
                    saas_subscription_status: 'active',
                    saas_subscription_expires_at: nextExpiry.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', renewingFacility.id);

            if (error) throw error;

            alert(`Subscription renewed for 30 days for ${renewingFacility.name}!`);
            setRenewingFacility(null);
            fetchFacilities();
        } catch (err: any) {
            console.error('Renew error:', err);
            alert(`Failed to renew subscription: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateDaysLeft = (expiryString: string | null): { days: number; text: string; color: string } => {
        if (!expiryString) return { days: 0, text: 'No active plan', color: 'text-slate-400' };
        
        const expiryDate = new Date(expiryString);
        const today = new Date();
        const differenceMs = expiryDate.getTime() - today.getTime();
        const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

        if (differenceDays < 0) {
            return { days: differenceDays, text: `Expired ${Math.abs(differenceDays)} days ago`, color: 'text-rose-600' };
        } else if (differenceDays === 0) {
            return { days: 0, text: 'Expires today', color: 'text-orange-500 font-bold' };
        } else if (differenceDays <= 5) {
            return { days: differenceDays, text: `${differenceDays} days left (Critical)`, color: 'text-amber-600 font-semibold' };
        }
        return { days: differenceDays, text: `${differenceDays} days remaining`, color: 'text-emerald-600' };
    };

    // Filter computation
    const filteredFacilities = facilities.filter(fac => {
        const matchesSearch = fac.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              fac.type?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'ACTIVE') {
            matchesStatus = fac.saas_enabled && fac.saas_subscription_status === 'active';
        } else if (statusFilter === 'EXPIRED') {
            matchesStatus = fac.saas_enabled && fac.saas_subscription_status === 'expired';
        } else if (statusFilter === 'INACTIVE') {
            matchesStatus = !fac.saas_enabled;
        }

        return matchesSearch && matchesStatus;
    });

    const activeCount = facilities.filter(f => f.saas_enabled && f.saas_subscription_status === 'active').length;
    const expiredCount = facilities.filter(f => f.saas_enabled && f.saas_subscription_status === 'expired').length;
    const inactiveCount = facilities.filter(f => !f.saas_enabled).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Loading SaaS Subscriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Global MedLud Administrative Panel</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Hospital SaaS Subscriptions</h1>
                <p className="text-xs text-slate-500">Enable/disable SaaS features for partnered facilities and manage their 30-day subscription renewals.</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Registered</p>
                        <p className="text-2xl font-extrabold text-slate-800 mt-1">{facilities.length}</p>
                    </div>
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-100">
                        <Hospital size={18} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Active SaaS</p>
                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</p>
                    </div>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <ShieldCheck size={18} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wider">Expired Plan</p>
                        <p className="text-2xl font-extrabold text-rose-600 mt-1">{expiredCount}</p>
                    </div>
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100 animate-pulse">
                        <ShieldAlert size={18} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Inactive/No SaaS</p>
                        <p className="text-2xl font-extrabold text-slate-650 mt-1">{inactiveCount}</p>
                    </div>
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 border border-slate-200">
                        <Activity size={18} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by facility name, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs border border-slate-100 rounded-xl py-3 pl-10 pr-4 bg-gray-550/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full sm:w-44 text-xs border border-slate-100 rounded-xl p-3 bg-gray-550/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                        <option value="ALL">All SaaS Status</option>
                        <option value="ACTIVE">Active Subscriptions</option>
                        <option value="EXPIRED">Expired Subscriptions</option>
                        <option value="INACTIVE">SaaS Disabled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="p-4 pl-6">Facility Details</th>
                                <th className="p-4">License / Phone</th>
                                <th className="p-4">SaaS Access</th>
                                <th className="p-4">Subscription Status</th>
                                <th className="p-4">Billing Timeline</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {filteredFacilities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                        No facilities matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredFacilities.map((fac) => {
                                    const expiry = calculateDaysLeft(fac.saas_subscription_expires_at);
                                    return (
                                        <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-slate-800">{fac.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{fac.type?.name || 'Partner Facility'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-650">{fac.license_number || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{fac.contact_phone || 'No phone'}</div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleSaaS(fac.id, fac.saas_enabled)}
                                                    className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer transition-all ${
                                                        fac.saas_enabled 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                            : 'bg-slate-550 text-slate-500 border-slate-100 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {fac.saas_enabled ? 'SaaS Enabled' : 'SaaS Disabled'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                                    fac.saas_enabled && fac.saas_subscription_status === 'active'
                                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                                        : fac.saas_enabled && fac.saas_subscription_status === 'expired'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {fac.saas_enabled ? fac.saas_subscription_status.toUpperCase() : 'NO PLAN'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold">
                                                <div className={expiry.color}>{expiry.text}</div>
                                                {fac.saas_subscription_expires_at && (
                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        Next Expiry: {new Date(fac.saas_subscription_expires_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button
                                                    onClick={() => setRenewingFacility(fac)}
                                                    className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-100 transition-all cursor-pointer inline-flex items-center gap-1"
                                                >
                                                    <CreditCard size={12} /> Renew 30d
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Renew Modal */}
            {renewingFacility && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                                <CreditCard size={22} />
                            </div>
                            <h3 className="font-extrabold text-slate-800 text-base">Renew SaaS Subscription</h3>
                            <p className="text-xs text-slate-500 leading-normal">
                                You are renewing the SaaS subscription access for <strong className="text-slate-700">{renewingFacility.name}</strong> for <strong>30 days</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleRenewSubscription} className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-[11px] text-slate-650 space-y-1.5 leading-normal">
                                <p>🗓️ <strong>Duration:</strong> 30 Days Cycle</p>
                                <p>⚡ <strong>Access Level:</strong> Complete Triage, Ward Beds, Queue & Pharmacy modules enabled.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRenewingFacility(null)}
                                    className="flex-1 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl border border-slate-200/80 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin" size={14} /> Processing...</>
                                    ) : (
                                        <><CheckCircle size={14} /> Confirm Renewal</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
