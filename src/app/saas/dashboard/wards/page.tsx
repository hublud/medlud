'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    User, 
    Heart, 
    Thermometer, 
    Plus, 
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Layers,
    X,
    FileText,
    LogOut
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';

export default function WardBedManagerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing wards...</p>
                </div>
            </div>
        }>
            <WardBedManagerContent />
        </Suspense>
    );
}

function WardBedManagerContent() {
    const { user, profile } = useAuth();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Wards and Beds State
    const [wards, setWards] = useState<any[]>([]);
    const [selectedWard, setSelectedWard] = useState<any | null>(null);
    const [beds, setBeds] = useState<any[]>([]);
    const [selectedBed, setSelectedBed] = useState<any | null>(null);

    // Admission & Round Logs
    const [activeAdmission, setActiveAdmission] = useState<any | null>(null);
    const [clinicalLogs, setClinicalLogs] = useState<any[]>([]);
    const [patientDiagnoses, setPatientDiagnoses] = useState<any[]>([]);
    const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
    const [patientLabs, setPatientLabs] = useState<any[]>([]);
    const [patientScans, setPatientScans] = useState<any[]>([]);
    
    // Add Ward/Bed Forms
    const [showAddWard, setShowAddWard] = useState(false);
    const [newWardName, setNewWardName] = useState('');
    const [newWardCapacity, setNewWardCapacity] = useState('5');
    const [newWardGender, setNewWardGender] = useState<'MALE' | 'FEMALE' | 'UNRESTRICTED'>('UNRESTRICTED');

    // Admit Patient Modal
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [initialDiagnosis, setInitialDiagnosis] = useState('');
    const [admittingDocId, setAdmittingDocId] = useState('');
    const [doctors, setDoctors] = useState<any[]>([]);

    // Log Vitals Form
    const [vitalsTemp, setVitalsTemp] = useState('');
    const [vitalsBp, setVitalsBp] = useState('');
    const [vitalsPulse, setVitalsPulse] = useState('');
    const [vitalsNotes, setVitalsNotes] = useState('');
    const [loggingVitals, setLoggingVitals] = useState(false);

    // Discharge Modal
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [dischargeSummary, setDischargeSummary] = useState('');
    const [discharging, setDischarging] = useState(false);

    const searchParams = useSearchParams();
    const urlPatientId = searchParams.get('patient_id');

    useEffect(() => {
        if (user) {
            fetchStaffAndWards();
        }
    }, [user]);

    useEffect(() => {
        const fetchUrlPatient = async () => {
            if (!urlPatientId || !staffInfo) return;
            try {
                const { data: patient, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, med_id')
                    .eq('role', 'patient')
                    .eq('id', urlPatientId)
                    .maybeSingle();

                if (error) throw error;
                if (patient) {
                    const { data: activeAdmissions } = await (supabase as any)
                        .from('ward_admissions')
                        .select('patient_id')
                        .eq('facility_id', staffInfo.facility_id)
                        .eq('status', 'admitted')
                        .eq('patient_id', patient.id);

                    const alreadyAdmitted = (activeAdmissions || []).length > 0;
                    setSelectedPatient({
                        ...patient,
                        alreadyAdmitted
                    });
                    
                    // Clean up URL query parameters so refreshing/re-selecting beds works normally
                    window.history.replaceState({}, '', '/saas/dashboard/wards');
                }
            } catch (err) {
                console.error('Error fetching URL patient:', err);
            }
        };

        fetchUrlPatient();
    }, [urlPatientId, staffInfo]);

    const fetchStaffAndWards = async () => {
        try {
            setLoading(true);
            // 1. Fetch staff
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

            // 2. Fetch doctors in facility
            const { data: docData } = await (supabase as any)
                .from('facility_staff')
                .select('profile_id, profiles(full_name)')
                .eq('facility_id', staffData.facility_id)
                .eq('role', 'doctor');
            setDoctors(docData || []);
            if (docData && docData.length > 0) {
                setAdmittingDocId(docData[0].profile_id);
            }

            // 3. Fetch wards
            await loadWards(staffData.facility_id);
        } catch (e) {
            console.error('Error fetching ward settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadWards = async (facilityId: string) => {
        const { data } = await (supabase as any)
            .from('wards')
            .select('*')
            .eq('facility_id', facilityId)
            .order('name', { ascending: true });

        setWards(data || []);
        if (data && data.length > 0) {
            setSelectedWard(data[0]);
            await loadBeds(data[0].id);
        }
    };

    const loadBeds = async (wardId: string) => {
        const { data } = await (supabase as any)
            .from('beds')
            .select('*')
            .eq('ward_id', wardId)
            .order('bed_number', { ascending: true });

        setBeds(data || []);
        setSelectedBed(null);
        setActiveAdmission(null);
        setClinicalLogs([]);
    };

    const handleSelectBed = async (bed: any) => {
        setSelectedBed(bed);
        setActiveAdmission(null);
        setClinicalLogs([]);

        if (bed.status === 'occupied') {
            // Fetch active admission for this bed
            const { data: admission, error } = await (supabase as any)
                .from('ward_admissions')
                .select(`
                    *,
                    patient:profiles!ward_admissions_patient_id_fkey(full_name, med_id, date_of_birth, blood_group),
                    doctor:profiles!ward_admissions_admitting_doctor_id_fkey(full_name)
                `)
                .eq('bed_id', bed.id)
                .eq('status', 'admitted')
                .maybeSingle();

            if (error) {
                console.error('Fetch active admission error:', error);
                return;
            }

            if (admission) {
                setActiveAdmission(admission);
                // Fetch clinical progression logs for this admission
                const { data: logs } = await (supabase as any)
                    .from('ward_clinical_logs')
                    .select('*, nurse:profiles(full_name)')
                    .eq('admission_id', admission.id)
                    .order('created_at', { ascending: false });

                setClinicalLogs(logs || []);

                // Fetch patient EMR details for this admitted patient
                const { data: diagnoses } = await (supabase as any)
                    .from('diagnosis_records')
                    .select('*')
                    .eq('patient_id', admission.patient_id)
                    .order('created_at', { ascending: false });
                setPatientDiagnoses(diagnoses || []);

                const { data: prescriptions } = await (supabase as any)
                    .from('prescription_history')
                    .select('*, doctor:profiles!prescription_history_doctor_id_fkey(full_name)')
                    .eq('patient_id', admission.patient_id)
                    .order('created_at', { ascending: false });
                setPatientPrescriptions(prescriptions || []);

                const { data: labs } = await (supabase as any)
                    .from('lab_history')
                    .select('*, doctor:profiles!lab_history_doctor_id_fkey(full_name)')
                    .eq('patient_id', admission.patient_id)
                    .order('created_at', { ascending: false });
                setPatientLabs(labs || []);

                const { data: scans } = await (supabase as any)
                    .from('imaging_history')
                    .select('*, doctor:profiles!imaging_history_doctor_id_fkey(full_name)')
                    .eq('patient_id', admission.patient_id)
                    .order('created_at', { ascending: false });
                setPatientScans(scans || []);
            }
        } else if (bed.status === 'vacant' && selectedPatient) {
            if (!selectedPatient.alreadyAdmitted) {
                setShowAdmitModal(true);
            } else {
                alert(`${selectedPatient.full_name} is already admitted to a bed in this facility. Please discharge them first before re-admitting.`);
            }
        }
    };

    const handleAddWard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWardName.trim() || !staffInfo) return;

        try {
            const { data: wardData, error: wardErr } = await (supabase as any)
                .from('wards')
                .insert({
                    facility_id: staffInfo.facility_id,
                    name: newWardName,
                    capacity: parseInt(newWardCapacity),
                    gender_restriction: newWardGender
                })
                .select()
                .single();

            if (wardErr) throw wardErr;

            // Generate beds automatically based on capacity
            const bedsToInsert = Array.from({ length: parseInt(newWardCapacity) }).map((_, i) => ({
                ward_id: wardData.id,
                bed_number: `Bed ${i + 1}`,
                status: 'vacant'
            }));

            const { error: bedErr } = await (supabase as any)
                .from('beds')
                .insert(bedsToInsert);

            if (bedErr) throw bedErr;

            alert('Ward created successfully along with beds!');
            setNewWardName('');
            setShowAddWard(false);
            loadWards(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Add ward error:', err);
            alert(`Failed to add ward: ${err.message}`);
        }
    };

    const handlePatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientSearch.trim() || !staffInfo) return;

        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, med_id')
                .eq('role', 'patient')
                .or(`med_id.ilike.%${patientSearch}%,full_name.ilike.%${patientSearch}%`)
                .limit(8);

            const patients = data || [];

            // Check which patients already have an active admission in this facility
            if (patients.length > 0) {
                const patientIds = patients.map((p: any) => p.id);
                const { data: activeAdmissions } = await (supabase as any)
                    .from('ward_admissions')
                    .select('patient_id')
                    .eq('facility_id', staffInfo.facility_id)
                    .eq('status', 'admitted')
                    .in('patient_id', patientIds);

                const admittedIds = new Set((activeAdmissions || []).map((a: any) => a.patient_id));

                // Tag each patient with their admission status
                setPatientResults(patients.map((p: any) => ({
                    ...p,
                    alreadyAdmitted: admittedIds.has(p.id)
                })));
            } else {
                setPatientResults([]);
            }
        } catch (e) {
            console.error('Patient lookup error:', e);
        }
    };

    const handleAdmitPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !selectedBed || !staffInfo) return;

        // Guard: block re-admission of already admitted patients
        if (selectedPatient.alreadyAdmitted) {
            alert(`${selectedPatient.full_name} is already admitted to a bed in this facility. Please discharge them first before re-admitting.`);
            return;
        }

        try {
            const { error } = await (supabase as any)
                .from('ward_admissions')
                .insert({
                    facility_id: staffInfo.facility_id,
                    patient_id: selectedPatient.id,
                    bed_id: selectedBed.id,
                    admitting_doctor_id: admittingDocId || null,
                    assigned_nurse_id: user?.id,
                    diagnosis: initialDiagnosis,
                    status: 'admitted'
                });

            if (error) throw error;

            alert('Patient admitted successfully!');
            setShowAdmitModal(false);
            setSelectedPatient(null);
            setPatientSearch('');
            setInitialDiagnosis('');
            loadBeds(selectedWard.id);
        } catch (err: any) {
            console.error('Admission error:', err);
            alert(`Failed to admit patient: ${err.message}`);
        }
    };

    const handleLogVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAdmission) return;
        setLoggingVitals(true);

        try {
            const { error } = await (supabase as any)
                .from('ward_clinical_logs')
                .insert({
                    admission_id: activeAdmission.id,
                    recorded_by: user?.id,
                    temperature: vitalsTemp ? parseFloat(vitalsTemp) : null,
                    blood_pressure: vitalsBp || null,
                    pulse_rate: vitalsPulse ? parseInt(vitalsPulse) : null,
                    clinical_notes: vitalsNotes
                });

            if (error) throw error;

            alert('Vitals and clinical progression notes logged!');
            setVitalsTemp('');
            setVitalsBp('');
            setVitalsPulse('');
            setVitalsNotes('');
            handleSelectBed(selectedBed); // refresh bed details
        } catch (err: any) {
            console.error('Vitals log error:', err);
            alert(`Failed to log vitals: ${err.message}`);
        } finally {
            setLoggingVitals(false);
        }
    };

    const handleDischargePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAdmission || !selectedBed) return;
        setDischarging(true);

        try {
            // 1. Update admission status to discharged
            const { error: admError } = await (supabase as any)
                .from('ward_admissions')
                .update({
                    status: 'discharged',
                    discharged_at: new Date().toISOString(),
                    discharge_summary: dischargeSummary
                })
                .eq('id', activeAdmission.id);

            if (admError) throw admError;

            // 2. Raise invoice for ward stay (automatic 10,000 NGN base charge as placeholder)
            await (supabase as any)
                .from('facility_invoices')
                .insert({
                    facility_id: staffInfo.facility_id,
                    patient_id: activeAdmission.patient_id,
                    created_by: user?.id,
                    amount: 10000.00,
                    items: [
                        { description: `Ward Admission Bed Charges (${selectedWard.name} - ${selectedBed.bed_number})`, price: 10000.00 }
                    ],
                    status: 'pending'
                });

            alert('Patient discharged successfully! Inpatient invoice generated.');
            setShowDischargeModal(false);
            setDischargeSummary('');
            loadBeds(selectedWard.id);
        } catch (err: any) {
            console.error('Discharge error:', err);
            alert(`Failed to discharge patient: ${err.message}`);
        } finally {
            setDischarging(false);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing wards...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profile?.role === 'partner';
    const isAuthorized = staffInfo && (['nurse', 'doctor', 'ward_manager'].includes(userRole) || isPartner);

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
                                ? "You must be registered as active hospital staff in the database to access this ward admission dashboard." 
                                : `Your role (${userRole?.replace('_', ' ')}) does not have permission to access Wards & Beds.`}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/saas/dashboard">
                            <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white border-gray-200">
                                <ArrowLeft size={18} />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <Layers size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Ward & Bed Occupancy Board</h1>
                            <p className="text-xs text-slate-500">Real-time visual map of hospital wards, inpatient bed allocations, and clinical check-in logs.</p>
                        </div>
                    </div>
                    
                    {/* Add Ward Button */}
                    <Button 
                        onClick={() => setShowAddWard(true)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1 self-start sm:self-auto"
                    >
                        <Plus size={14} /> Create Ward
                    </Button>
                </div>

                {/* Ward Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                    {wards.map(w => (
                        <button
                            key={w.id}
                            onClick={() => {
                                setSelectedWard(w);
                                loadBeds(w.id);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                selectedWard?.id === w.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-500 border-gray-200 hover:bg-slate-50'
                            }`}
                        >
                            🏢 {w.name} <span className="ml-1 text-[10px] opacity-60">({w.capacity} Beds)</span>
                        </button>
                    ))}
                    {wards.length === 0 && (
                        <p className="text-xs text-slate-400 font-semibold py-2">No inpatient wards set up. Click "Create Ward" to get started.</p>
                    )}
                </div>

                {/* Main Interactive Grid Layout */}
                {selectedWard && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left visual Bed map */}
                        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ward Map: {selectedWard.name}</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                {beds.map(b => {
                                    const isSelected = selectedBed?.id === b.id;
                                    const bedColorClass = 
                                        b.status === 'occupied' 
                                            ? 'border-rose-300 text-rose-600 bg-rose-50/10 hover:bg-rose-50/20' 
                                            : b.status === 'maintenance'
                                            ? 'border-amber-300 text-amber-600 bg-amber-50/10 hover:bg-amber-55/20'
                                            : 'border-emerald-300 text-emerald-600 bg-emerald-50/10 hover:bg-emerald-50/20';

                                    return (
                                        <button
                                            key={b.id}
                                            onClick={() => handleSelectBed(b)}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${bedColorClass} ${
                                                isSelected ? 'ring-4 ring-slate-900/10 scale-95 border-slate-900' : ''
                                            }`}
                                        >
                                            <Layers size={24} />
                                            <span className="text-[10px] font-bold uppercase">{b.bed_number}</span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border capitalize border-inherit">
                                                {b.status}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right sidebar: Bed management & patient details */}
                        <div className="lg:col-span-1">
                            {!selectedBed ? (
                                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-center py-16 text-slate-400 text-xs font-semibold">
                                    Click any bed on the ward map to view clinical status or manage admissions.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Bed details card */}
                                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 text-sm">{selectedBed.bed_number}</h3>
                                                <p className="text-[10px] text-slate-400 font-semibold">{selectedWard.name}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                selectedBed.status === 'occupied' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            }`}>
                                                {selectedBed.status}
                                            </span>
                                        </div>

                                        {/* Occupied State Details */}
                                        {selectedBed.status === 'occupied' && activeAdmission && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admitted Patient</p>
                                                    <div className="text-xs">
                                                        <div className="font-extrabold text-slate-800">{activeAdmission.patient?.full_name}</div>
                                                        <p className="text-[10px] text-slate-400 font-medium">MED-ID: {activeAdmission.patient?.med_id} • Age: {calculateAge(activeAdmission.patient?.date_of_birth)}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <p>🩸 Blood: <strong>{activeAdmission.patient?.blood_group || '--'}</strong></p>
                                                        <p>👨‍⚕️ Round Doc: <strong>{activeAdmission.doctor?.full_name || '--'}</strong></p>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium pt-1 border-b border-gray-150 pb-2">
                                                        Admitted: {new Date(activeAdmission.admitted_at).toLocaleString()}
                                                    </div>

                                                    {/* Active Diagnoses / Conditions */}
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Diagnoses</p>
                                                        {patientDiagnoses.length === 0 ? (
                                                            <p className="text-[10px] text-slate-400 italic">No diagnoses recorded yet.</p>
                                                        ) : (
                                                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                                {patientDiagnoses.map(d => (
                                                                    <div key={d.id} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]">
                                                                        <div className="font-bold text-slate-700">{d.diagnosis}</div>
                                                                        {d.notes && <p className="text-slate-500 italic mt-0.5">"{d.notes}"</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Active Medications / Injections */}
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prescriptions / Injections</p>
                                                        {patientPrescriptions.length === 0 ? (
                                                            <p className="text-[10px] text-slate-400 italic">No prescriptions recorded yet.</p>
                                                        ) : (
                                                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                                {patientPrescriptions.map(p => (
                                                                    <div key={p.id} className="bg-purple-50/50 p-2 rounded-lg border border-purple-100 text-[10px]">
                                                                        <div className="font-bold text-purple-800">{p.medication} ({p.dosage})</div>
                                                                        <div className="text-slate-500 font-medium">{p.frequency} • {p.duration}</div>
                                                                        {p.notes && <p className="text-slate-600 italic mt-0.5">Note: {p.notes}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Active Lab Orders / Requests */}
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lab Orders</p>
                                                        {patientLabs.length === 0 ? (
                                                            <p className="text-[10px] text-slate-400 italic">No lab tests ordered yet.</p>
                                                        ) : (
                                                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                                {patientLabs.map(l => (
                                                                    <div key={l.id} className="bg-sky-50/50 p-2 rounded-lg border border-sky-100 text-[10px] flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-bold text-sky-800">{l.test_name}</div>
                                                                            <p className="text-slate-400 text-[9px]">Req: {new Date(l.request_date).toLocaleDateString()}</p>
                                                                        </div>
                                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                                                            l.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                                        }`}>
                                                                            {l.status}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Active Scan Orders / Requests */}
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Imaging Scans</p>
                                                        {patientScans.length === 0 ? (
                                                            <p className="text-[10px] text-slate-400 italic">No scan requests ordered yet.</p>
                                                        ) : (
                                                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                                {patientScans.map(s => (
                                                                    <div key={s.id} className="bg-amber-50/50 p-2 rounded-lg border border-amber-100 text-[10px] flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-bold text-amber-800">{s.scan_name} ({s.scan_type.toUpperCase()})</div>
                                                                            {s.notes && <p className="text-slate-500 text-[9px] italic mt-0.5">"{s.notes}"</p>}
                                                                        </div>
                                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                                                            s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                                        }`}>
                                                                            {s.status}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={() => setShowDischargeModal(true)} 
                                                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1"
                                                    >
                                                        <LogOut size={14} /> Discharge Inpatient
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vacant State Actions */}
                                        {selectedBed.status === 'vacant' && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] text-slate-400 leading-normal">This bed is ready to accommodate a patient admission.</p>
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedPatient(null);
                                                        setPatientResults([]);
                                                        setPatientSearch('');
                                                        setShowAdmitModal(true);
                                                    }} 
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1"
                                                >
                                                    <Plus size={14} /> Admit Patient
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Occupied Nursing Progression Vitals Forms */}
                                    {selectedBed.status === 'occupied' && activeAdmission && (
                                        <div className="space-y-4">
                                            {/* Log round logs Form */}
                                            <form onSubmit={handleLogVitals} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                                    <Thermometer size={14} className="text-emerald-600" /> Log Round Notes / Vitals
                                                </h4>
                                                
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Temp (°C)</label>
                                                        <input 
                                                            type="number" 
                                                            step="0.1" 
                                                            placeholder="36.5" 
                                                            value={vitalsTemp}
                                                            onChange={(e) => setVitalsTemp(e.target.value)}
                                                            className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">BP (mmHg)</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="120/80" 
                                                            value={vitalsBp}
                                                            onChange={(e) => setVitalsBp(e.target.value)}
                                                            className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pulse (bpm)</label>
                                                        <input 
                                                            type="number" 
                                                            placeholder="72" 
                                                            value={vitalsPulse}
                                                            onChange={(e) => setVitalsPulse(e.target.value)}
                                                            className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nursing/Clinical Notes</label>
                                                    <textarea 
                                                        placeholder="Enter patient status, drug administration logs..."
                                                        value={vitalsNotes}
                                                        onChange={(e) => setVitalsNotes(e.target.value)}
                                                        rows={2}
                                                        required
                                                        className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none"
                                                    ></textarea>
                                                </div>

                                                <Button 
                                                    type="submit" 
                                                    disabled={loggingVitals}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2"
                                                >
                                                    {loggingVitals ? 'Saving...' : 'Add Progression Entry'}
                                                </Button>
                                            </form>

                                            {/* Nursing progression logs timeline */}
                                            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                                                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                                    <FileText size={14} className="text-emerald-600" /> Ward Round Logs
                                                </h4>
                                                
                                                {clinicalLogs.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 text-center py-4">No progression check-ins logged yet.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                        {clinicalLogs.map(log => (
                                                            <div key={log.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] space-y-1.5 leading-normal">
                                                                <div className="flex justify-between items-start text-[9px] text-slate-400 font-bold border-b border-slate-200/50 pb-1">
                                                                    <span>👤 {log.nurse?.full_name || 'Staff'}</span>
                                                                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                {(log.temperature || log.blood_pressure || log.pulse_rate) && (
                                                                    <div className="flex flex-wrap gap-2 text-[9px] font-extrabold text-slate-650">
                                                                        {log.temperature && <span>🌡️ {log.temperature}°C</span>}
                                                                        {log.blood_pressure && <span>🩺 {log.blood_pressure}</span>}
                                                                        {log.pulse_rate && <span>💓 {log.pulse_rate} bpm</span>}
                                                                    </div>
                                                                )}
                                                                <p className="text-slate-600 italic">"{log.clinical_notes}"</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Ward Modal */}
                {showAddWard && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-base">Setup New Ward</h3>
                                <button onClick={() => setShowAddWard(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleAddWard} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ward Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Intensive Care Unit (ICU)" 
                                        value={newWardName}
                                        onChange={(e) => setNewWardName(e.target.value)}
                                        required
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bed Capacity</label>
                                        <select 
                                            value={newWardCapacity}
                                            onChange={(e) => setNewWardCapacity(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white"
                                        >
                                            <option value="2">2 Beds</option>
                                            <option value="5">5 Beds</option>
                                            <option value="8">8 Beds</option>
                                            <option value="12">12 Beds</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender Restriction</label>
                                        <select 
                                            value={newWardGender}
                                            onChange={(e) => setNewWardGender(e.target.value as any)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white"
                                        >
                                            <option value="UNRESTRICTED">Unrestricted</option>
                                            <option value="MALE">Male Only</option>
                                            <option value="FEMALE">Female Only</option>
                                        </select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2">
                                    Confirm & Create Ward
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Admit Patient Modal */}
                {showAdmitModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-base">Inpatient Admission</h3>
                                <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleAdmitPatient} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Find Registered Patient</label>
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
                                        {patientResults.map((p: any) => (
                                            p.alreadyAdmitted ? (
                                                // Already admitted — shown as disabled with badge
                                                <div
                                                    key={p.id}
                                                    className="w-full text-left p-3 bg-amber-50/60 flex justify-between items-center text-xs cursor-not-allowed opacity-80"
                                                >
                                                    <div>
                                                        <span className="font-bold text-slate-600">{p.full_name}</span>
                                                        <span className="text-[9px] font-semibold text-slate-400 ml-2">({p.med_id})</span>
                                                    </div>
                                                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase whitespace-nowrap">
                                                        Already Admitted
                                                    </span>
                                                </div>
                                            ) : (
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
                                            )
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

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admitting Doctor</label>
                                    <select 
                                        value={admittingDocId}
                                        onChange={(e) => setAdmittingDocId(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white"
                                    >
                                        {doctors.map(d => (
                                            <option key={d.profile_id} value={d.profile_id}>{d.profiles?.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Diagnosis</label>
                                    <textarea 
                                        placeholder="Enter reason for admission & primary diagnostics..." 
                                        value={initialDiagnosis}
                                        onChange={(e) => setInitialDiagnosis(e.target.value)}
                                        rows={2}
                                        required
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none"
                                    ></textarea>
                                </div>

                                <Button type="submit" disabled={!selectedPatient} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs mt-2">
                                    Confirm Admission
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Discharge Modal */}
                {showDischargeModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <h3 className="font-extrabold text-slate-800 text-base">Inpatient Discharge</h3>
                                <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleDischargePatient} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discharge Summary</label>
                                    <textarea 
                                        placeholder="Enter clinical progression overview and outpatient treatment guidance..." 
                                        value={dischargeSummary}
                                        onChange={(e) => setDischargeSummary(e.target.value)}
                                        rows={4}
                                        required
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none"
                                    ></textarea>
                                </div>
                                <div className="bg-amber-50 text-amber-800 p-3.5 rounded-2xl border border-amber-100 text-[10px] leading-normal font-semibold">
                                    ⚠️ Discharging this patient will automatically mark {selectedBed.bed_number} as vacant and generate a pending billing invoice for the ward stay.
                                </div>
                                <Button type="submit" disabled={discharging} className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold text-xs mt-2">
                                    {discharging ? 'Discharging...' : 'Confirm Patient Discharge'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
