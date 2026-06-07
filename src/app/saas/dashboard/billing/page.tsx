'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    User, 
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Plus,
    CreditCard,
    DollarSign,
    X,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function BillingPanelPage() {
    const { user, profile } = useAuth();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Invoices State
    const [invoices, setInvoices] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'paid' | 'cancelled'>('ALL');

    // Create Invoice Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<{ description: string; price: number }[]>([
        { description: 'Consultation Fee', price: 5000.00 }
    ]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    // Pay Invoice Modal State
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [creatingInvoice, setCreatingInvoice] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStaffAndInvoices();
        }
    }, [user]);

    const fetchStaffAndInvoices = async () => {
        try {
            setLoading(true);
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
            await loadInvoices(staffData.facility_id);
        } catch (e) {
            console.error('Error fetching billing setup:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadInvoices = async (facilityId: string) => {
        const { data, error } = await (supabase as any)
            .from('facility_invoices')
            .select(`
                *,
                patient:profiles!facility_invoices_patient_id_fkey(full_name, med_id)
            `)
            .eq('facility_id', facilityId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            return;
        }
        setInvoices(data || []);
    };

    const handlePatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientSearch.trim()) return;

        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, med_id')
                .eq('role', 'patient')
                .or(`med_id.ilike.%${patientSearch}%,full_name.ilike.%${patientSearch}%`)
                .limit(5);

            setPatientResults(data || []);
        } catch (e) {
            console.error('Patient lookup error:', e);
        }
    };

    const handleAddItem = () => {
        if (!newItemDesc.trim() || !newItemPrice.trim()) return;
        setInvoiceItems([...invoiceItems, { description: newItemDesc, price: parseFloat(newItemPrice) }]);
        setNewItemDesc('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !staffInfo || invoiceItems.length === 0) return;
        setCreatingInvoice(true);

        const totalAmount = invoiceItems.reduce((acc, curr) => acc + curr.price, 0);

        try {
            const { error } = await (supabase as any)
                .from('facility_invoices')
                .insert({
                    facility_id: staffInfo.facility_id,
                    patient_id: selectedPatient.id,
                    created_by: user?.id,
                    amount: totalAmount,
                    items: invoiceItems,
                    status: 'pending'
                });

            if (error) throw error;

            alert('Invoice raised successfully!');
            setShowCreateModal(false);
            setSelectedPatient(null);
            setPatientSearch('');
            setInvoiceItems([{ description: 'Consultation Fee', price: 5000.00 }]);
            loadInvoices(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Create invoice error:', err);
            alert(`Failed to raise invoice: ${err.message}`);
        } finally {
            setCreatingInvoice(false);
        }
    };

    const handleCollectPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice || !staffInfo) return;
        setSubmittingPayment(true);

        try {
            const { error } = await (supabase as any)
                .from('facility_invoices')
                .update({
                    status: 'paid',
                    payment_method: paymentMethod,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedInvoice.id);

            if (error) throw error;

            alert('Payment recorded successfully! Invoice status set to PAID.');
            setSelectedInvoice(null);
            loadInvoices(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Collect payment error:', err);
            alert(`Failed to record payment: ${err.message}`);
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handleCancelInvoice = async (invoiceId: string) => {
        if (!confirm('Are you sure you want to cancel this invoice?')) return;

        try {
            const { error } = await (supabase as any)
                .from('facility_invoices')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', invoiceId);

            if (error) throw error;
            if (staffInfo) loadInvoices(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Cancel invoice error:', err);
            alert(`Failed to cancel invoice: ${err.message}`);
        }
    };

    // Filter computation
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              inv.patient?.med_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingSum = invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const paidSum = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing billing records...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profile?.role === 'partner';
    const isAuthorized = staffInfo && (['receptionist', 'billing_specialist', 'doctor'].includes(userRole) || isPartner);

    if (!staffInfo || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-150 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            {!staffInfo 
                                ? "You must be registered as active hospital staff in the database to access this billing dashboard." 
                                : `Your role (${userRole?.replace('_', ' ')}) does not have permission to access Local Invoicing.`}
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
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/saas/dashboard">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <DollarSign size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Hospital Billing Control</h1>
                            <p className="text-xs text-slate-500">Manage patient invoices, collect payments, and track offline clinical cashflows.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setShowCreateModal(true)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1 self-start sm:self-auto"
                    >
                        <Plus size={14} /> Raise Invoice
                    </Button>
                </div>

                {/* Aggregates stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Invoiced</p>
                        <p className="text-xl font-extrabold text-slate-800 mt-1">
                            NGN {invoices.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm border-l-4 border-l-amber-500">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">Outstanding Payments</p>
                        <p className="text-xl font-extrabold text-amber-600 mt-1">
                            NGN {pendingSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm border-l-4 border-l-emerald-500">
                        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Revenue Collected</p>
                        <p className="text-xl font-extrabold text-emerald-600 mt-1">
                            NGN {paidSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-150 shadow-sm mb-6">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name or MED-ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs border border-gray-100 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full sm:w-44 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Patient Name</th>
                                    <th className="p-4">Date Raised</th>
                                    <th className="p-4">Total (NGN)</th>
                                    <th className="p-4">Billing Status</th>
                                    <th className="p-4">Payment Info</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                                            No billing invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-slate-800">{inv.patient?.full_name || 'Patient'}</div>
                                                <div className="text-[9px] text-slate-400 font-semibold mt-0.5">MED-ID: {inv.patient?.med_id || '--'}</div>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">
                                                {parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                    inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    inv.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[10px] text-slate-500 font-medium">
                                                {inv.payment_method ? `Method: ${inv.payment_method.toUpperCase().replace('_', ' ')}` : '--'}
                                            </td>
                                            <td className="p-4 pr-6 text-right space-x-2">
                                                {inv.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            className="text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            <CreditCard size={12} /> Collect Payment
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelInvoice(inv.id)}
                                                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {inv.status === 'paid' && (
                                                    <span className="text-[10px] text-slate-400 font-semibold">Payment Completed</span>
                                                )}
                                                {inv.status === 'cancelled' && (
                                                    <span className="text-[10px] text-slate-400 italic">Invoice Cancelled</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Invoice Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-base">Raise Custom Invoice</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateInvoice} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Patient</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Enter MED-ID or Name" 
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            className="flex-1 text-xs border border-gray-200 rounded-xl p-3 outline-none"
                                        />
                                        <Button type="button" onClick={handlePatientSearch} variant="outline" className="rounded-xl shrink-0 p-3">
                                            Search
                                        </Button>
                                    </div>
                                </div>

                                {patientResults.length > 0 && !selectedPatient && (
                                    <div className="border border-gray-100 divide-y divide-gray-150 rounded-xl overflow-hidden">
                                        {patientResults.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex justify-between items-center text-xs cursor-pointer"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-800">{p.full_name}</span>
                                                    <span className="text-[9px] font-semibold text-slate-400 ml-2">({p.med_id})</span>
                                                </div>
                                                <Plus size={14} className="text-emerald-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedPatient && (
                                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-extrabold text-slate-800">{selectedPatient.full_name}</span>
                                            <p className="text-[9px] text-slate-400 font-semibold">{selectedPatient.med_id}</p>
                                        </div>
                                        <button type="button" onClick={() => setSelectedPatient(null)} className="text-[10px] text-rose-500 font-bold">Remove</button>
                                    </div>
                                )}

                                {/* Bill Items Editor */}
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Line Items</label>
                                    
                                    <div className="space-y-2">
                                        {invoiceItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                                                <span className="font-semibold text-slate-700">{item.description}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">NGN {item.price.toFixed(2)}</span>
                                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add line item inputs */}
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Service / Medication Name" 
                                            value={newItemDesc}
                                            onChange={(e) => setNewItemDesc(e.target.value)}
                                            className="flex-[2] text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Price" 
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(e.target.value)}
                                            className="flex-1 text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                        />
                                        <Button type="button" onClick={handleAddItem} className="rounded-lg px-3">Add</Button>
                                    </div>
                                </div>

                                <div className="text-right font-extrabold text-sm text-slate-800 pt-3 border-t border-gray-100">
                                    Total Amount: NGN {invoiceItems.reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}
                                </div>

                                <Button type="submit" disabled={!selectedPatient || invoiceItems.length === 0 || creatingInvoice} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2">
                                    {creatingInvoice ? 'Generating invoice...' : 'Generate Invoice'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Collect Payment Modal */}
                {selectedInvoice && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-base">Confirm Payment</h3>
                                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCollectPayment} className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs space-y-1.5 leading-normal">
                                    <p>👤 <strong>Patient:</strong> {selectedInvoice.patient?.full_name}</p>
                                    <p>💵 <strong>Amount:</strong> NGN {parseFloat(selectedInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white"
                                    >
                                        <option value="cash">💵 Cash Payment</option>
                                        <option value="card">💳 Card (POS Terminal)</option>
                                        <option value="bank_transfer">🏦 Bank Transfer</option>
                                    </select>
                                </div>

                                <Button type="submit" disabled={submittingPayment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2">
                                    {submittingPayment ? 'Recording...' : 'Confirm Payment'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
