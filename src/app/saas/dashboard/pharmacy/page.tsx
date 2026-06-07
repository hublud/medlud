'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Pill,
    Microscope,
    Clock,
    X,
    FlaskConical,
    ShieldAlert,
    LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function PharmacyLabFulfillmentPage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Pharmacy state
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [rxSearch, setRxSearch] = useState('');
    const [dispensing, setDispensing] = useState<string | null>(null);

    // Lab state
    const [labs, setLabs] = useState<any[]>([]);
    const [labSearch, setLabSearch] = useState('');
    const [selectedLab, setSelectedLab] = useState<any | null>(null);
    const [labResultText, setLabResultText] = useState('');
    const [submittingLab, setSubmittingLab] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    useEffect(() => {
        if (user) fetchStaffData();
    }, [user]);

    const fetchStaffData = async () => {
        try {
            setLoading(true);
            const { data: staffData } = await (supabase as any)
                .from('facility_staff')
                .select('*, facility:facilities(*)')
                .eq('profile_id', user?.id)
                .eq('status', 'active')
                .maybeSingle();

            if (!staffData) { setLoading(false); return; }
            setStaffInfo(staffData);

            if (staffData.role === 'pharmacist' || staffData.role === 'doctor') {
                await loadPharmacyOrders();
            }
            if (staffData.role === 'lab_tech' || staffData.role === 'doctor') {
                await loadLabOrders();
            }
        } catch (e) {
            console.error('Error loading fulfillment data:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadPharmacyOrders = async () => {
        const { data } = await (supabase as any)
            .from('prescription_history')
            .select(`
                *,
                patient:profiles!prescription_history_patient_id_fkey(full_name, med_id, date_of_birth),
                doctor:profiles!prescription_history_doctor_id_fkey(full_name)
            `)
            .order('created_at', { ascending: false });
        setPrescriptions(data || []);
    };

    const loadLabOrders = async () => {
        const { data } = await (supabase as any)
            .from('lab_history')
            .select(`
                *,
                patient:profiles!lab_history_patient_id_fkey(full_name, med_id, date_of_birth),
                doctor:profiles!lab_history_doctor_id_fkey(full_name)
            `)
            .order('created_at', { ascending: false });
        setLabs(data || []);
    };

    const handleDispense = async (rxId: string) => {
        setDispensing(rxId);
        try {
            const { error } = await (supabase as any)
                .from('prescription_history')
                .update({ pharmacy_fulfillment_status: 'filled' })
                .eq('id', rxId);
            if (error) throw error;
            await loadPharmacyOrders();
        } catch (e: any) {
            alert(`Failed to dispense: ${e.message}`);
        } finally {
            setDispensing(null);
        }
    };

    const handleUploadLabResults = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLab || !staffInfo) return;
        setSubmittingLab(true);
        try {
            const resultsJson = {
                findings: labResultText,
                technician_id: user?.id,
                lab_center: staffInfo.facility?.name
            };

            const { error: labErr } = await (supabase as any)
                .from('lab_history')
                .update({
                    status: 'completed',
                    results_date: new Date().toISOString().split('T')[0],
                    results_data: resultsJson,
                    notes: `Report: ${labResultText}`
                })
                .eq('id', selectedLab.id);
            if (labErr) throw labErr;

            // Write result into patient EMR timeline as a diagnosis note
            await (supabase as any)
                .from('diagnosis_records')
                .insert({
                    patient_id: selectedLab.patient_id,
                    doctor_id: selectedLab.doctor_id,
                    appointment_id: selectedLab.appointment_id || null,
                    diagnosis: `Lab Result: ${selectedLab.test_name}`,
                    severity: 'MILD',
                    status: 'RESOLVED',
                    notes: `Findings: ${labResultText}`
                });

            alert('Lab results saved and added to patient EMR!');
            setSelectedLab(null);
            setLabResultText('');
            loadLabOrders();
        } catch (err: any) {
            alert(`Failed to save results: ${err.message}`);
        } finally {
            setSubmittingLab(false);
        }
    };

    // ─── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Loading portal...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isAuthorized = staffInfo && ['pharmacist', 'lab_tech', 'doctor'].includes(userRole);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            {!staffInfo
                                ? 'You must be registered as active hospital staff.'
                                : `Your role (${userRole}) does not have permission to access this portal.`}
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

    // ─── Role-specific config ──────────────────────────────────────────────────
    const isPharmacist = userRole === 'pharmacist';
    const isLabTech = userRole === 'lab_tech';

    const pendingRx = prescriptions.filter(rx => rx.pharmacy_fulfillment_status === 'pending').length;
    const pendingLabs = labs.filter(l => l.status === 'requested').length;

    const filteredPrescriptions = prescriptions.filter(rx =>
        rx.patient?.full_name?.toLowerCase().includes(rxSearch.toLowerCase()) ||
        rx.patient?.med_id?.toLowerCase().includes(rxSearch.toLowerCase()) ||
        rx.medication?.toLowerCase().includes(rxSearch.toLowerCase())
    );

    const filteredLabs = labs.filter(l =>
        l.patient?.full_name?.toLowerCase().includes(labSearch.toLowerCase()) ||
        l.patient?.med_id?.toLowerCase().includes(labSearch.toLowerCase()) ||
        l.test_name?.toLowerCase().includes(labSearch.toLowerCase())
    );

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/saas/dashboard">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200 hover:bg-slate-50">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <div className={`flex items-center gap-2 mb-0.5 ${isLabTech ? 'text-sky-600' : 'text-emerald-600'}`}>
                                {isLabTech ? <FlaskConical size={16} /> : <Pill size={16} />}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">
                                {isLabTech ? '🔬 Laboratory Panel' : '💊 Pharmacy Panel'}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {isLabTech
                                    ? 'View pending lab test requests and submit clinical findings for the patient EMR.'
                                    : 'View and dispense medication orders prescribed by doctors.'}
                            </p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        className="rounded-xl flex items-center gap-2 text-xs font-bold border-gray-200 text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all px-4 py-2 self-start sm:self-center"
                    >
                        <LogOut size={14} />
                        <span>Log Out</span>
                    </Button>
                </div>

                {/* Stats */}
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8`}>
                    {isLabTech ? (
                        <>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-sky-600">{pendingLabs}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending Tests</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-emerald-600">{labs.filter(l => l.status === 'completed').length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completed</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-slate-700">{labs.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Orders</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-amber-600">{pendingRx}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Awaiting Dispense</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-emerald-600">{prescriptions.filter(rx => rx.pharmacy_fulfillment_status === 'filled').length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Dispensed Today</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-extrabold text-slate-700">{prescriptions.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Orders</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Search bar */}
                <div className="relative bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
                    <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={isLabTech ? 'Search by patient name, MED-ID, or test name...' : 'Search by patient name, MED-ID, or drug name...'}
                        value={isLabTech ? labSearch : rxSearch}
                        onChange={(e) => isLabTech ? setLabSearch(e.target.value) : setRxSearch(e.target.value)}
                        className="w-full text-xs border border-gray-100 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>

                {/* ─── LAB TECH VIEW ──────────────────────────────────────────────────── */}
                {isLabTech && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 bg-sky-50 border-b border-sky-100 flex items-center gap-2">
                            <FlaskConical size={14} className="text-sky-600" />
                            <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">Lab Test Requisitions</span>
                            {pendingLabs > 0 && (
                                <span className="ml-auto bg-sky-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    {pendingLabs} Pending
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Patient</th>
                                        <th className="p-4">Test Requested</th>
                                        <th className="p-4">Request Date</th>
                                        <th className="p-4">Clinician</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 pr-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredLabs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center">
                                                <FlaskConical className="mx-auto mb-2 text-slate-200" size={36} />
                                                <p className="text-slate-400 font-semibold">No lab requisitions found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLabs.map(l => (
                                            <tr key={l.id} className={`hover:bg-slate-50/40 transition-colors ${l.status === 'requested' ? 'border-l-4 border-l-sky-400' : ''}`}>
                                                <td className="p-4 pl-5">
                                                    <div className="font-bold text-slate-800">{l.patient?.full_name || 'Patient'}</div>
                                                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">MED-ID: {l.patient?.med_id || '--'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-extrabold text-slate-800">{l.test_name}</div>
                                                    {l.notes && <div className="text-[10px] text-slate-400 mt-0.5 max-w-[220px] truncate">{l.notes}</div>}
                                                </td>
                                                <td className="p-4 text-slate-500">{l.request_date || new Date(l.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 text-slate-600 font-semibold">Dr. {l.doctor?.full_name || 'Medical Officer'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                        l.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-sky-50 text-sky-700 border-sky-100'
                                                    }`}>
                                                        {l.status === 'requested' ? 'Pending' : l.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {l.status === 'requested' ? (
                                                        <button
                                                            onClick={() => setSelectedLab(l)}
                                                            className="text-[10px] font-extrabold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            <Microscope size={12} /> Submit Results
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 justify-end">
                                                            <CheckCircle size={12} className="text-emerald-500" /> Completed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── PHARMACIST VIEW ────────────────────────────────────────────────── */}
                {isPharmacist && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                            <Pill size={14} className="text-emerald-600" />
                            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Prescription Orders</span>
                            {pendingRx > 0 && (
                                <span className="ml-auto bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    {pendingRx} To Dispense
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Patient</th>
                                        <th className="p-4">Medication Details</th>
                                        <th className="p-4">Prescribed By</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 pr-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredPrescriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center">
                                                <Pill className="mx-auto mb-2 text-slate-200" size={36} />
                                                <p className="text-slate-400 font-semibold">No prescription orders found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPrescriptions.map(rx => (
                                            <tr key={rx.id} className={`hover:bg-slate-50/40 transition-colors ${rx.pharmacy_fulfillment_status === 'pending' ? 'border-l-4 border-l-amber-400' : ''}`}>
                                                <td className="p-4 pl-5">
                                                    <div className="font-bold text-slate-800">{rx.patient?.full_name || 'Patient'}</div>
                                                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">MED-ID: {rx.patient?.med_id || '--'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-extrabold text-slate-800">{rx.medication}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {rx.dosage} · {rx.frequency} · {rx.duration}
                                                    </div>
                                                    {rx.notes && <div className="text-[10px] text-slate-300 mt-0.5 italic">{rx.notes}</div>}
                                                </td>
                                                <td className="p-4 text-slate-600 font-semibold">Dr. {rx.doctor?.full_name || 'Medical Officer'}</td>
                                                <td className="p-4 text-slate-500">{new Date(rx.created_at).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                        rx.pharmacy_fulfillment_status === 'filled'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {rx.pharmacy_fulfillment_status === 'filled' ? 'Dispensed' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {rx.pharmacy_fulfillment_status === 'pending' ? (
                                                        <button
                                                            onClick={() => handleDispense(rx.id)}
                                                            disabled={dispensing === rx.id}
                                                            className="text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            {dispensing === rx.id ? (
                                                                <><Loader2 size={12} className="animate-spin" /> Dispensing...</>
                                                            ) : (
                                                                <><Pill size={12} /> Dispense</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 justify-end">
                                                            <CheckCircle size={12} className="text-emerald-500" /> Dispensed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── DOCTOR fallback (sees both) ────────────────────────────────────── */}
                {userRole === 'doctor' && (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                        <p className="font-bold text-sm">As a doctor, use the dedicated Requests Center.</p>
                        <Link href="/saas/dashboard/requests">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4 py-2">
                                Go to Clinical Requests →
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* ─── Submit Lab Results Modal ──────────────────────────────────────────── */}
            {selectedLab && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                                    <FlaskConical size={16} className="text-sky-600" /> Submit Lab Results
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Results will be saved to the patient's EMR timeline</p>
                            </div>
                            <button onClick={() => { setSelectedLab(null); setLabResultText(''); }} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-xs space-y-1.5 leading-relaxed">
                            <p>👤 <strong>Patient:</strong> {selectedLab.patient?.full_name} <span className="text-slate-400">(MED-ID: {selectedLab.patient?.med_id})</span></p>
                            <p>🔬 <strong>Test:</strong> {selectedLab.test_name}</p>
                            {selectedLab.notes && <p>📋 <strong>Doctor's Notes:</strong> {selectedLab.notes}</p>}
                        </div>

                        <form onSubmit={handleUploadLabResults} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Clinical Findings & Results *
                                </label>
                                <textarea
                                    placeholder="e.g. Haemoglobin: 11.5 g/dL (Low), WBC: 8,200/μL (Normal), Malaria Parasite: Negative..."
                                    value={labResultText}
                                    onChange={(e) => setLabResultText(e.target.value)}
                                    rows={5}
                                    required
                                    className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={submittingLab}
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl py-3 font-bold text-xs flex items-center justify-center gap-2"
                            >
                                {submittingLab ? (
                                    <><Loader2 size={14} className="animate-spin" /> Saving findings...</>
                                ) : (
                                    <><CheckCircle size={14} /> Confirm & Save Results</>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
