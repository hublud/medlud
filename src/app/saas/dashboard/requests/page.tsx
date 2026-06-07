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
    Pill,
    Microscope,
    Clock,
    Plus,
    X,
    Eye,
    Upload,
    FileText,
    Layers,
    Heart,
    Check
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type ActiveTabType = 'SEARCH' | 'PRESCRIPTIONS' | 'LABS' | 'SCANS' | 'TRIAGE';

export default function ClinicalRequestsPage() {
    const { user, profile } = useAuth();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTabType>('SEARCH');

    // Patient Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Lists
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [labs, setLabs] = useState<any[]>([]);
    const [scans, setScans] = useState<any[]>([]);
    const [triageWaiting, setTriageWaiting] = useState<any[]>([]);
    const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);

    // Modals and Forms
    const [selectedLab, setSelectedLab] = useState<any | null>(null);
    const [selectedScan, setSelectedScan] = useState<any | null>(null);
    const [findingsText, setFindingsText] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [submittingAction, setSubmittingAction] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStaffAndData();
        }
    }, [user]);

    // Automatically select tab based on staff role once staffInfo is loaded
    useEffect(() => {
        if (staffInfo) {
            const role = staffInfo.role;
            if (role === 'pharmacist') {
                setActiveTab('PRESCRIPTIONS');
            } else if (role === 'lab_tech') {
                setActiveTab('LABS');
            } else if (role === 'nurse' || role === 'ward_manager') {
                setActiveTab('SCANS');
            } else {
                setActiveTab('SEARCH');
            }
        }
    }, [staffInfo]);

    const fetchStaffAndData = async () => {
        try {
            setLoading(true);
            // 1. Fetch staff mapping
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

            // 2. Fetch all related request items in parallel
            await Promise.all([
                loadPrescriptionOrders(staffData.facility_id),
                loadLabOrders(staffData.facility_id),
                loadScanOrders(staffData.facility_id),
                loadTriageAndAdmissions(staffData.facility_id)
            ]);
        } catch (e) {
            console.error('Error fetching clinical request details:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadPrescriptionOrders = async (facilityId: string) => {
        // Query pending prescription history orders
        const { data, error } = await (supabase as any)
            .from('prescription_history')
            .select(`
                *,
                patient:profiles!prescription_history_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                doctor:profiles!prescription_history_doctor_id_fkey(full_name)
            `)
            .eq('pharmacy_fulfillment_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Prescriptions load error:', error);
        } else {
            setPrescriptions(data || []);
        }
    };

    const loadLabOrders = async (facilityId: string) => {
        // Query pending laboratory requisitions
        const { data, error } = await (supabase as any)
            .from('lab_history')
            .select(`
                *,
                patient:profiles!lab_history_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                doctor:profiles!lab_history_doctor_id_fkey(full_name)
            `)
            .eq('status', 'requested')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Labs load error:', error);
        } else {
            setLabs(data || []);
        }
    };

    const loadScanOrders = async (facilityId: string) => {
        // Query pending imaging scan history
        const { data, error } = await (supabase as any)
            .from('imaging_history')
            .select(`
                *,
                patient:profiles!imaging_history_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                doctor:profiles!imaging_history_doctor_id_fkey(full_name)
            `)
            .eq('status', 'scheduled')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Scans load error:', error);
        } else {
            setScans(data || []);
        }
    };

    const loadTriageAndAdmissions = async (facilityId: string) => {
        // Query triage records waiting consult
        const { data: triageData, error: triageErr } = await (supabase as any)
            .from('triage_records')
            .select(`
                *,
                patient:profiles!triage_records_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group)
            `)
            .eq('facility_id', facilityId)
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });

        // Query active admissions
        const { data: adminData, error: adminErr } = await (supabase as any)
            .from('ward_admissions')
            .select(`
                *,
                patient:profiles!ward_admissions_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                bed:beds(bed_number, ward:wards(name)),
                doctor:profiles!ward_admissions_admitting_doctor_id_fkey(full_name)
            `)
            .eq('facility_id', facilityId)
            .eq('status', 'admitted')
            .order('admitted_at', { ascending: false });

        if (triageErr) console.error('Triage fetch error:', triageErr);
        if (adminErr) console.error('Admissions fetch error:', adminErr);

        setTriageWaiting(triageData || []);
        setActiveAdmissions(adminData || []);
    };

    const handlePatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`full_name.ilike.%${searchQuery}%,med_id.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err: any) {
            console.error('Patient search error:', err);
            alert(`Search error: ${err.message}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFulfillPrescription = async (rxId: string) => {
        setSubmittingAction(true);
        try {
            const { error } = await (supabase as any)
                .from('prescription_history')
                .update({ 
                    pharmacy_fulfillment_status: 'filled'
                })
                .eq('id', rxId);

            if (error) throw error;

            alert('Prescription marked as dispensed successfully!');
            if (staffInfo) {
                await loadPrescriptionOrders(staffInfo.facility_id);
            }
        } catch (e: any) {
            console.error('Prescription dispense failed:', e);
            alert(`Fulfillment failed: ${e.message}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleFileUpload = async (file: File, folder: string) => {
        const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${folder}/${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
            .from('lab-results')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('lab-results')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    const handleFulfillLab = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLab || !findingsText.trim() || !staffInfo) return;

        setSubmittingAction(true);
        try {
            let uploadedUrl = '';
            if (uploadFile) {
                uploadedUrl = await handleFileUpload(uploadFile, `labs/${selectedLab.patient_id}`);
            }

            const resultsJson = {
                findings: findingsText,
                technician_id: user?.id,
                lab_center: staffInfo.facility?.name,
                file_url: uploadedUrl || null
            };

            // 1. Update lab history
            const { error: labErr } = await (supabase as any)
                .from('lab_history')
                .update({
                    status: 'completed',
                    results_date: new Date().toISOString().split('T')[0],
                    results_data: resultsJson,
                    notes: `Report: ${findingsText}`
                })
                .eq('id', selectedLab.id);

            if (labErr) throw labErr;

            // 2. Add to patient EMR timeline
            const { error: diagErr } = await (supabase as any)
                .from('diagnosis_records')
                .insert({
                    patient_id: selectedLab.patient_id,
                    doctor_id: selectedLab.doctor_id,
                    appointment_id: selectedLab.appointment_id,
                    diagnosis: `Lab Complete: ${selectedLab.test_name}`,
                    severity: 'MILD',
                    status: 'RESOLVED',
                    notes: `Lab Result Findings: ${findingsText}`
                });

            if (diagErr) throw diagErr;

            alert('Lab results submitted and added to patient EMR timeline!');
            setSelectedLab(null);
            setFindingsText('');
            setUploadFile(null);
            await loadLabOrders(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Lab fulfillment error:', err);
            alert(`Fulfillment error: ${err.message}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleFulfillScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedScan || !findingsText.trim() || !staffInfo) return;

        setSubmittingAction(true);
        try {
            let uploadedUrl = '';
            if (uploadFile) {
                uploadedUrl = await handleFileUpload(uploadFile, `scans/${selectedScan.patient_id}`);
            }

            // 1. Update imaging history
            const { error: scanErr } = await (supabase as any)
                .from('imaging_history')
                .update({
                    status: 'completed',
                    image_url: uploadedUrl || null,
                    report_text: findingsText,
                    scan_date: new Date().toISOString().split('T')[0],
                    notes: `Imaging scan completed. Report uploaded.`
                })
                .eq('id', selectedScan.id);

            if (scanErr) throw scanErr;

            // 2. Add to patient EMR timeline
            const { error: diagErr } = await (supabase as any)
                .from('diagnosis_records')
                .insert({
                    patient_id: selectedScan.patient_id,
                    doctor_id: selectedScan.doctor_id,
                    appointment_id: selectedScan.appointment_id,
                    diagnosis: `Imaging Completed: ${selectedScan.scan_name} (${selectedScan.scan_type.toUpperCase()})`,
                    severity: 'MILD',
                    status: 'RESOLVED',
                    notes: `Imaging Scan Report: ${findingsText}`
                });

            if (diagErr) throw diagErr;

            alert('Imaging report submitted and added to patient EMR timeline!');
            setSelectedScan(null);
            setFindingsText('');
            setUploadFile(null);
            await loadScanOrders(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Scan fulfillment error:', err);
            alert(`Fulfillment error: ${err.message}`);
        } finally {
            setSubmittingAction(false);
        }
    };

    const calculateAge = (dob: string | undefined): string => {
        if (!dob) return '--';
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return `${age} yrs`;
        } catch (e) {
            return '--';
        }
    };

    const getWaitTimeText = (createdString: string): string => {
        const diffMs = Date.now() - new Date(createdString).getTime();
        const mins = Math.floor(diffMs / (1000 * 60));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing Clinical Center...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profile?.role === 'partner';
    const isAuthorized = staffInfo && (['doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'ward_manager'].includes(userRole) || isPartner);

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
                                ? "You must be registered as active hospital staff to access this center." 
                                : `Your role (${userRole?.replace('_', ' ')}) does not have permission to access the Clinical Requests dashboard.`}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/saas/dashboard">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <Activity size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Clinical Requests & Patient Search</h1>
                            <p className="text-xs text-slate-500">Facility notifications hub. Search EMRs and fulfill prescriptions, lab orders, and imaging requests.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white p-1 rounded-2xl border border-gray-150 shadow-sm mb-8 w-fit flex-wrap gap-1">
                    <button
                        onClick={() => setActiveTab('SEARCH')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'SEARCH' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Search size={14} /> Patient Lookup
                    </button>

                    <button
                        onClick={() => setActiveTab('SCANS')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 relative ${activeTab === 'SCANS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Layers size={14} /> Imaging Scans
                        {scans.length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-0.5">
                                {scans.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('LABS')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 relative ${activeTab === 'LABS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Microscope size={14} /> Lab Requests
                        {labs.length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-0.5">
                                {labs.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('PRESCRIPTIONS')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 relative ${activeTab === 'PRESCRIPTIONS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Pill size={14} /> Prescriptions
                        {prescriptions.length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-0.5">
                                {prescriptions.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('TRIAGE')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'TRIAGE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Activity size={14} /> Admissions & Triage
                        {(triageWaiting.length > 0 || activeAdmissions.length > 0) && (
                            <span className="bg-indigo-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-0.5">
                                {triageWaiting.length + activeAdmissions.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab content: SEARCH */}
                {activeTab === 'SEARCH' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Search className="text-emerald-600" size={18} /> Global Patient Lookup
                            </h2>
                            <form onSubmit={handlePatientSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search patients by name, email, or MED-ID..."
                                        className="w-full text-xs border border-gray-250 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <Button type="submit" disabled={isSearching} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6">
                                    {isSearching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                                </Button>
                            </form>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Search Results ({searchResults.length})</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {searchResults.map(patient => (
                                        <div key={patient.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex justify-between items-center gap-4 hover:shadow-md transition-all">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-800">{patient.full_name}</h3>
                                                <p className="text-[10px] text-slate-400 font-semibold">
                                                    MED-ID: {patient.med_id || '--'} • DOB: {patient.date_of_birth || '--'}
                                                </p>
                                                <p className="text-[10px] text-slate-550">
                                                    📧 {patient.email} {patient.phone ? `• 📞 ${patient.phone}` : ''}
                                                </p>
                                            </div>
                                            <Link href={`/dashboard/staff/emr/${patient.id}`}>
                                                <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white text-xs rounded-xl flex items-center gap-1">
                                                    <FileText size={12} /> View EMR
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : searchQuery && !isSearching ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                                <User className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-700 font-bold text-sm">No patients found</p>
                                <p className="text-slate-400 text-xs mt-1">Try another search query.</p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Tab content: SCANS */}
                {activeTab === 'SCANS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pl-1">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending Imaging Requisitions ({scans.length})</p>
                        </div>

                        {scans.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                                <Layers className="mx-auto text-slate-200 mb-3 animate-pulse" size={48} />
                                <p className="text-slate-700 font-bold text-sm">No pending scans</p>
                                <p className="text-slate-400 text-xs mt-1">All requested radiological and imaging tests are completed.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {scans.map(scan => (
                                    <div key={scan.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">
                                                    {scan.scan_type.toUpperCase()} REQUESTED
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> Ordered: {getWaitTimeText(scan.created_at)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Scan: {scan.scan_name}</h3>
                                                <p className="text-[11px] text-slate-600 mt-0.5">
                                                    Patient: <strong className="text-slate-800">{scan.patient?.full_name}</strong> (MED-ID: {scan.patient?.med_id} • Age: {calculateAge(scan.patient?.date_of_birth)})
                                                </p>
                                                {scan.notes && (
                                                    <p className="text-[11px] text-slate-500 italic mt-1">"Notes: {scan.notes}"</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">Ordering Practitioner: {scan.doctor?.full_name || 'Practitioner'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 self-stretch md:self-auto justify-end">
                                            <Link href={`/dashboard/staff/emr/${scan.patient_id}`}>
                                                <Button variant="outline" size="sm" className="text-slate-700 bg-white border-gray-200 rounded-xl text-xs flex items-center gap-1">
                                                    <FileText size={12} /> EMR History
                                                </Button>
                                            </Link>
                                            <Button 
                                                onClick={() => setSelectedScan(scan)}
                                                size="sm" 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-sm shadow-emerald-600/10"
                                            >
                                                <Upload size={12} /> Submit Report
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content: LABS */}
                {activeTab === 'LABS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pl-1">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending Laboratory Orders ({labs.length})</p>
                        </div>

                        {labs.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                                <Microscope className="mx-auto text-slate-200 mb-3 animate-pulse" size={48} />
                                <p className="text-slate-700 font-bold text-sm">No pending lab tests</p>
                                <p className="text-slate-400 text-xs mt-1">All requested diagnostic laboratory tests are completed.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {labs.map(lab => (
                                    <div key={lab.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
                                                    LAB TEST REQUESTED
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> Ordered: {getWaitTimeText(lab.created_at)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Test: {lab.test_name}</h3>
                                                <p className="text-[11px] text-slate-600 mt-0.5">
                                                    Patient: <strong className="text-slate-800">{lab.patient?.full_name}</strong> (MED-ID: {lab.patient?.med_id} • Age: {calculateAge(lab.patient?.date_of_birth)})
                                                </p>
                                                {lab.notes && (
                                                    <p className="text-[11px] text-slate-500 italic mt-1">"Notes: {lab.notes}"</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">Ordering Practitioner: {lab.doctor?.full_name || 'Practitioner'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 self-stretch md:self-auto justify-end">
                                            <Link href={`/dashboard/staff/emr/${lab.patient_id}`}>
                                                <Button variant="outline" size="sm" className="text-slate-700 bg-white border-gray-200 rounded-xl text-xs flex items-center gap-1">
                                                    <FileText size={12} /> EMR History
                                                </Button>
                                            </Link>
                                            <Button 
                                                onClick={() => setSelectedLab(lab)}
                                                size="sm" 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-sm shadow-emerald-600/10"
                                            >
                                                <Upload size={12} /> Upload Results
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content: PRESCRIPTIONS */}
                {activeTab === 'PRESCRIPTIONS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pl-1">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending Prescriptions ({prescriptions.length})</p>
                        </div>

                        {prescriptions.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                                <Pill className="mx-auto text-slate-200 mb-3 animate-pulse" size={48} />
                                <p className="text-slate-700 font-bold text-sm">No pending prescriptions</p>
                                <p className="text-slate-400 text-xs mt-1">All medication orders have been fulfilled.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map(rx => (
                                    <div key={rx.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-100">
                                                    PRESCRIPTION PENDING
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> Prescribed: {getWaitTimeText(rx.created_at)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Medication: {rx.medication}</h3>
                                                <p className="text-xs font-bold text-slate-700">Dosage: {rx.dosage} • Frequency: {rx.frequency} • Duration: {rx.duration}</p>
                                                <p className="text-[11px] text-slate-600 mt-0.5">
                                                    Patient: <strong className="text-slate-800">{rx.patient?.full_name}</strong> (MED-ID: {rx.patient?.med_id} • Age: {calculateAge(rx.patient?.date_of_birth)} • Blood: {rx.patient?.blood_group || '--'})
                                                </p>
                                                {rx.notes && (
                                                    <p className="text-[11px] text-slate-500 italic mt-1">"Notes: {rx.notes}"</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">Prescribing Doctor: {rx.doctor?.full_name || 'Practitioner'}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0 self-stretch md:self-auto justify-end items-center">
                                            <Link href={`/dashboard/staff/emr/${rx.patient_id}`}>
                                                <Button variant="outline" size="sm" className="text-slate-700 bg-white border-gray-200 rounded-xl text-xs flex items-center gap-1">
                                                    <FileText size={12} /> EMR History
                                                </Button>
                                            </Link>
                                            <Button 
                                                onClick={() => handleFulfillPrescription(rx.id)}
                                                disabled={submittingAction}
                                                size="sm" 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-sm shadow-emerald-600/10"
                                            >
                                                <Check size={14} /> Dispense Med
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content: TRIAGE */}
                {activeTab === 'TRIAGE' && (
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 pl-1">Triage Records Waiting Consult ({triageWaiting.length})</p>
                            {triageWaiting.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-gray-150 shadow-sm text-slate-450 text-xs">
                                    No patients currently waiting in triage queue.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {triageWaiting.map(tr => {
                                        const priorityColorClass = 
                                            tr.triage_color === 'RED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                            tr.triage_color === 'ORANGE' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                            tr.triage_color === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                            tr.triage_color === 'GREEN' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                            'bg-slate-100 text-slate-700 border-slate-200';
                                        return (
                                            <div key={tr.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${priorityColorClass}`}>
                                                            {tr.triage_color} PRIORITY
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                            <Clock size={12} /> {getWaitTimeText(tr.created_at)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-800">{tr.patient?.full_name}</h3>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                        MED-ID: {tr.patient?.med_id} • Age: {calculateAge(tr.patient?.date_of_birth)}
                                                    </p>
                                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-bold text-slate-650 grid grid-cols-3 gap-2">
                                                        <div>🌡️ Temp: <span className="text-slate-800">{tr.temperature ? `${tr.temperature}°C` : '--'}</span></div>
                                                        <div>💓 Pulse: <span className="text-slate-800">{tr.pulse_rate ? `${tr.pulse_rate} bpm` : '--'}</span></div>
                                                        <div>🩺 BP: <span className="text-slate-800">{tr.blood_pressure || '--'}</span></div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 italic">"Chief Complaint: {tr.chief_complaint}"</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/dashboard/staff/emr/${tr.patient_id}`} className="flex-1">
                                                        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs text-slate-700 bg-white border-gray-200">
                                                            View Patient EMR
                                                        </Button>
                                                    </Link>
                                                    <Link href="/saas/dashboard/queue" className="flex-1">
                                                        <Button size="sm" className="w-full rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                                            Consult Queue
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 pl-1">Admitted Inpatients ({activeAdmissions.length})</p>
                            {activeAdmissions.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-gray-150 shadow-sm text-slate-450 text-xs">
                                    No admitted inpatients in wards currently.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeAdmissions.map(adm => (
                                        <div key={adm.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100">
                                                        🛏️ Bed: {adm.bed?.bed_number || '--'} ({adm.bed?.ward?.name || 'General Ward'})
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold">Admitted: {new Date(adm.admitted_at).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800">{adm.patient?.full_name}</h3>
                                                <p className="text-[10px] text-slate-400 font-semibold">
                                                    MED-ID: {adm.patient?.med_id} • Blood: {adm.patient?.blood_group || '--'}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">Diagnosis: <span className="font-bold text-slate-700">{adm.diagnosis || 'Observation'}</span></p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">Physician: {adm.doctor?.full_name || 'Practitioner'}</p>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-slate-100/50 mt-1">
                                                <Link href={`/dashboard/staff/emr/${adm.patient_id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full rounded-xl text-xs text-slate-700 bg-white border-gray-200">
                                                        EMR Logs
                                                    </Button>
                                                </Link>
                                                <Link href="/saas/dashboard/wards" className="flex-1">
                                                    <Button size="sm" className="w-full rounded-xl text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold">
                                                        Ward Manager
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Lab results upload */}
            {selectedLab && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-gray-150 p-6 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Upload Lab Results</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Test: {selectedLab.test_name} • Patient: {selectedLab.patient?.full_name}</p>
                            </div>
                            <button onClick={() => { setSelectedLab(null); setFindingsText(''); setUploadFile(null); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleFulfillLab} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700">Findings & Technical Report *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={findingsText}
                                    onChange={(e) => setFindingsText(e.target.value)}
                                    placeholder="Enter findings, parameters measured, out-of-bounds indicators..."
                                    className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700">Supporting Attachment (Optional)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-500/40 transition-all bg-gray-50/30">
                                    <input
                                        type="file"
                                        id="lab-file"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                    <label htmlFor="lab-file" className="cursor-pointer flex flex-col items-center gap-1">
                                        <Upload className="text-slate-400 mb-1" size={24} />
                                        <span className="font-bold text-slate-700 text-xs">{uploadFile ? uploadFile.name : 'Select PDF, JPEG, or PNG file'}</span>
                                        <span className="text-[10px] text-slate-400">Max size: 5MB</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-150">
                                <Button type="button" variant="outline" onClick={() => { setSelectedLab(null); setFindingsText(''); setUploadFile(null); }} className="flex-1 rounded-xl text-xs py-2.5">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submittingAction} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-2.5">
                                    {submittingAction ? <Loader2 className="animate-spin" size={16} /> : 'Save & Publish Results'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Scan report upload */}
            {selectedScan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-gray-150 p-6 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 font-extrabold">Fulfill Scan Requisition</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Type: {selectedScan.scan_type.toUpperCase()} • Name: {selectedScan.scan_name} • Patient: {selectedScan.patient?.full_name}</p>
                            </div>
                            <button onClick={() => { setSelectedScan(null); setFindingsText(''); setUploadFile(null); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleFulfillScan} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700">Radiology Findings & Report *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={findingsText}
                                    onChange={(e) => setFindingsText(e.target.value)}
                                    placeholder="Enter physical observations, radiological findings, clinical impressions..."
                                    className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700">Scan Image Upload (Optional)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-500/40 transition-all bg-gray-50/30">
                                    <input
                                        type="file"
                                        id="scan-file"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                    <label htmlFor="scan-file" className="cursor-pointer flex flex-col items-center gap-1">
                                        <Upload className="text-slate-400 mb-1" size={24} />
                                        <span className="font-bold text-slate-700 text-xs">{uploadFile ? uploadFile.name : 'Select radiology scan file (JPEG, PNG)'}</span>
                                        <span className="text-[10px] text-slate-400">Max size: 8MB</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-150">
                                <Button type="button" variant="outline" onClick={() => { setSelectedScan(null); setFindingsText(''); setUploadFile(null); }} className="flex-1 rounded-xl text-xs py-2.5">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submittingAction} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-2.5">
                                    {submittingAction ? <Loader2 className="animate-spin" size={16} /> : 'Publish Report to EMR'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
