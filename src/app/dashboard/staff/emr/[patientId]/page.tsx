'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Activity, 
    FileText, 
    Calendar, 
    Search, 
    Filter, 
    Upload, 
    User, 
    CheckCircle, 
    ShieldAlert, 
    Heart, 
    Plus, 
    ClipboardList,
    Pill,
    Microscope,
    Eye,
    TrendingUp,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    Layers,
    Sparkles,
    Video
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { EscalateTelemedicineModal } from '@/components/staff/EscalateTelemedicineModal';
import Link from 'next/link';

export default function DoctorEMRViewPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.patientId as string;

    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [isBypassing, setIsBypassing] = useState(false);
    const [doctorUser, setDoctorUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('');

    // Patient EMR Data
    const [patientProfile, setPatientProfile] = useState<any>(null);
    const [patientRecord, setPatientRecord] = useState<any>(null);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [chronicConditions, setChronicConditions] = useState<any[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [doctorNotes, setDoctorNotes] = useState<any[]>([]); // diagnosis_records for sidebar
    const [latestTriage, setLatestTriage] = useState<any>(null);
    const [triageHistory, setTriageHistory] = useState<any[]>([]);
    const [telemedAppointments, setTelemedAppointments] = useState<any[]>([]);

    // Comparison view for lab history
    const [labHistory, setLabHistory] = useState<any[]>([]);

    // Input Forms
    const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
    const [newDiagnosis, setNewDiagnosis] = useState('');
    const [newSeverity, setNewSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
    const [newStatus, setNewStatus] = useState<'ACTIVE' | 'RESOLVED' | 'CHRONIC'>('ACTIVE');
    const [newDiagNotes, setNewDiagNotes] = useState('');
    const [submittingDiag, setSubmittingDiag] = useState(false);

    // Lab Test Request Modal States
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);
    const [labTestName, setLabTestName] = useState('');
    const [labNotes, setLabNotes] = useState('');
    const [submittingLab, setSubmittingLab] = useState(false);

    // Prescription / Injection Modal States
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [rxMedication, setRxMedication] = useState('');
    const [rxDosage, setRxDosage] = useState('');
    const [rxFrequency, setRxFrequency] = useState('');
    const [rxDuration, setRxDuration] = useState('');
    const [rxNotes, setRxNotes] = useState('');
    const [submittingRx, setSubmittingRx] = useState(false);

    // Scan Request Modal States
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [scanType, setScanType] = useState<'xray' | 'ultrasound' | 'mri' | 'ct' | 'other'>('xray');
    const [scanName, setScanName] = useState('');
    const [scanNotes, setScanNotes] = useState('');
    const [submittingScan, setSubmittingScan] = useState(false);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        if (patientId) {
            checkAccess();
        }
    }, [patientId]);

    const checkAccess = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setDoctorUser(user);

            console.log('EMR checkAccess starting for patientId:', patientId);
            console.log('Logged in doctor user ID:', user.id);

            // Fetch patient profile
            const { data: pProfile, error: pProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', patientId)
                .single();

            if (pProfileError) {
                console.error('Profiles fetch error:', pProfileError);
            }
            console.log('Patient profile retrieved:', pProfile ? pProfile.full_name : 'NULL');

            if (!pProfile) {
                alert('Patient record not found.');
                router.push('/dashboard/staff');
                return;
            }
            setPatientProfile(pProfile);

            // Fetch my staff/user profile to check my role
            const { data: myProfile, error: myProfileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (myProfileError) {
                console.error('My profile fetch error:', myProfileError);
            }
            const role = myProfile?.role || '';
            setUserRole(role);

            // Call doctor_has_patient_access RPC to check if this staff member has access
            const { data: hasAccessRpc, error: rpcError } = await (supabase as any)
                .rpc('doctor_has_patient_access', {
                    doc_id: user.id,
                    pat_id: patientId
                });

            if (rpcError) {
                console.error('Error checking access via RPC:', rpcError);
            }

            console.log('Resulting hasAccess from RPC:', hasAccessRpc);

            let hasAccess = !!hasAccessRpc;

            if (!hasAccess && ['nurse', 'lab_tech', 'pharmacist', 'ward_manager', 'receptionist'].includes(role)) {
                const { data: staffData } = await (supabase as any)
                    .from('facility_staff')
                    .select('facility_id')
                    .eq('profile_id', user.id)
                    .eq('status', 'active')
                    .maybeSingle();
                
                if (staffData) {
                    console.log('Access granted because user is active facility staff:', role);
                    hasAccess = true;
                }
            }

            if (hasAccess) {
                setAuthorized(true);
                await fetchEMRData();
            } else {
                setAuthorized(false);
            }
        } catch (err) {
            console.error('Error verifying doctor access:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEmergencyOverride = async () => {
        if (!doctorUser || !patientId) return;
        setIsBypassing(true);
        try {
            // Grant temporary consent (expires in 2 hours)
            const expires = new Date();
            expires.setHours(expires.getHours() + 2);

            const { error: consentErr } = await (supabase as any)
                .from('patient_doctor_consents')
                .upsert({
                    patient_id: patientId,
                    doctor_id: doctorUser.id,
                    status: 'granted',
                    notes: 'EMERGENCY CLINICAL OVERRIDE BY PHYSICIAN',
                    expires_at: expires.toISOString()
                });

            if (consentErr) throw consentErr;

            // Audit log override is handled automatically via postgres trigger on consents insert
            alert('Access override granted. Access is permitted for the next 2 hours.');
            setAuthorized(true);
            await fetchEMRData();
        } catch (e: any) {
            console.error('Override failed:', e);
            alert(`Override failed: ${e.message}`);
        } finally {
            setIsBypassing(false);
        }
    };

    const fetchEMRData = async () => {
        try {
            // 1. Fetch Lifelong Patient records
            const { data: recordData } = await (supabase as any)
                .from('patient_records')
                .select('*')
                .eq('patient_id', patientId)
                .maybeSingle();
            setPatientRecord(recordData);

            // 2. Fetch Allergies, Chronic Conditions, Lab History, and Doctor Notes
            const { data: allergyData } = await (supabase as any).from('allergy_records').select('*').eq('patient_id', patientId);
            const { data: chronicData } = await (supabase as any).from('chronic_conditions').select('*').eq('patient_id', patientId);
            const { data: lHistory } = await (supabase as any).from('lab_history').select('*').eq('patient_id', patientId).order('request_date', { ascending: false });
            // Fetch doctor diagnosis notes for the sidebar panel
            const { data: diagData } = await (supabase as any)
                .from('diagnosis_records')
                .select('*, doctor:profiles!diagnosis_records_doctor_id_fkey(full_name)')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(10);
            
            // Fetch triage records (nurse logs)
            const { data: triageRecordsData } = await (supabase as any)
                .from('triage_records')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });
            
            const triageList = triageRecordsData || [];
            setTriageHistory(triageList);
            setLatestTriage(triageList.length > 0 ? triageList[0] : null);
            
            setAllergies(allergyData || []);
            setChronicConditions(chronicData || []);
            setLabHistory(lHistory || []);
            setDoctorNotes(diagData || []);

            // Fetch scheduled telemedicine appointments
            const { data: telemedData } = await (supabase as any)
                .from('appointments')
                .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name)')
                .eq('user_id', patientId)
                .eq('status', 'SCHEDULED')
                .order('date', { ascending: true });
            setTelemedAppointments(telemedData || []);

            // 3. Assemble Timeline events (consults, diagnoses, rx, referrals, uploads, labs, triage)
            let events: any[] = [];

            // A. Consultations
            const { data: aptData } = await (supabase as any)
                .from('appointments')
                .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name)')
                .eq('user_id', patientId)
                .eq('status', 'COMPLETED');
            (aptData || []).forEach((apt: any) => {
                events.push({
                    id: apt.id,
                    type: 'consultation',
                    title: apt.title || 'Consultation Summary',
                    date: apt.date || apt.created_at,
                    notes: apt.doctor_response || apt.notes,
                    meta: {
                        doctor: apt.doctor?.full_name || 'Medical Practitioner',
                        symptoms: apt.symptoms
                    }
                });
            });

            // B. Prescriptions
            const { data: rxData } = await (supabase as any)
                .from('prescription_history')
                .select('*, doctor:profiles!prescription_history_doctor_id_fkey(full_name)')
                .eq('patient_id', patientId);
            (rxData || []).forEach((rx: any) => {
                events.push({
                    id: rx.id,
                    type: 'prescription',
                    title: `Medication: ${rx.medication}`,
                    date: rx.created_at,
                    notes: `Dosage: ${rx.dosage} | Frequency: ${rx.frequency} | Duration: ${rx.duration}. Notes: ${rx.notes || 'None'}`,
                    meta: {
                        doctor: rx.doctor?.full_name || 'Prescribing Doctor',
                        status: rx.pharmacy_fulfillment_status
                    }
                });
            });

            // C. Referrals
            const { data: refData } = await (supabase as any)
                .from('referral_requests')
                .select('*, doctor:profiles!referral_requests_doctor_id_fkey(full_name), facility:facilities(name)')
                .eq('patient_id', patientId);
            (refData || []).forEach((ref: any) => {
                events.push({
                    id: ref.id,
                    type: 'referral',
                    title: `Partner Referral: ${ref.request_type.toUpperCase()}`,
                    date: ref.created_at,
                    notes: `Destination: ${ref.facility?.name || ref.external_facility_name}. Notes: ${ref.clinical_notes || 'None'}`,
                    meta: {
                        doctor: ref.doctor?.full_name || 'Doctor',
                        status: ref.status
                    }
                });
            });

            // D. Uploaded results
            const { data: uploadData } = await (supabase as any)
                .from('medical_uploads')
                .select('*')
                .eq('patient_id', patientId);
            (uploadData || []).forEach((up: any) => {
                events.push({
                    id: up.id,
                    type: 'upload',
                    title: `Uploaded Record: ${up.file_name}`,
                    date: up.created_at,
                    notes: up.notes || `Category: ${up.category.replace('_', ' ')}`,
                    meta: {
                        url: up.file_url,
                        category: up.category
                    }
                });
            });

            // E. Imaging Scans
            const { data: scanData } = await (supabase as any)
                .from('imaging_history')
                .select('*, doctor:profiles!imaging_history_doctor_id_fkey(full_name)')
                .eq('patient_id', patientId);
            (scanData || []).forEach((scan: any) => {
                events.push({
                    id: scan.id,
                    type: 'imaging',
                    title: `Imaging Scan Requested: ${scan.scan_name} (${scan.scan_type.toUpperCase()})`,
                    date: scan.created_at,
                    notes: scan.notes || 'No scan notes specified.',
                    meta: {
                        doctor: scan.doctor?.full_name || 'Ordering Doctor',
                        status: scan.status
                    }
                });
            });

            // F. Nurse Triage Records
            triageList.forEach((t: any) => {
                events.push({
                    id: t.id,
                    type: 'triage',
                    title: `Nurse Triage Vitals & Intake`,
                    date: t.created_at,
                    notes: `Chief Complaint: "${t.chief_complaint || 'None logged'}"\n🌡️ Temp: ${t.temperature ? `${t.temperature}°C` : '--'} | 🩺 BP: ${t.blood_pressure || '--'} | 💓 Pulse: ${t.pulse_rate ? `${t.pulse_rate} bpm` : '--'} | 🌬️ Resp: ${t.respiration_rate ? `${t.respiration_rate} bpm` : '--'} | ⚖️ Weight: ${t.weight ? `${t.weight} kg` : '--'} | 🩸 SpO2: ${t.spo2 ? `${t.spo2}%` : '--'}`,
                    meta: {
                        color: t.triage_color,
                        status: t.status
                    }
                });
            });

            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTimelineEvents(events);

        } catch (e) {
            console.error('EMR retrieval error:', e);
        }
    };

    const handleAddDiagnosis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDiagnosis.trim()) return;

        setSubmittingDiag(true);
        try {
            const { error } = await (supabase as any)
                .from('diagnosis_records')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorUser?.id,
                    diagnosis: newDiagnosis,
                    severity: newSeverity,
                    status: newStatus,
                    notes: newDiagNotes
                });

            if (error) throw error;

            alert('Diagnosis recorded successfully!');
            setIsDiagnosisModalOpen(false);
            setNewDiagnosis('');
            setNewDiagNotes('');
            fetchEMRData();
        } catch (err: any) {
            console.error('Add diagnosis error:', err);
            alert(`Failed to add diagnosis: ${err.message}`);
        } finally {
            setSubmittingDiag(false);
        }
    };

    const handleRequestLab = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!labTestName.trim()) return;

        setSubmittingLab(true);
        try {
            const { error } = await (supabase as any)
                .from('lab_history')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorUser?.id,
                    test_name: labTestName,
                    notes: labNotes,
                    status: 'requested'
                });

            if (error) throw error;

            alert('Lab test requested successfully!');
            setIsLabModalOpen(false);
            setLabTestName('');
            setLabNotes('');
            fetchEMRData();
        } catch (err: any) {
            console.error('Request lab test error:', err);
            alert(`Failed to request lab test: ${err.message}`);
        } finally {
            setSubmittingLab(false);
        }
    };

    const handleRecordPrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rxMedication.trim() || !rxDosage.trim() || !rxFrequency.trim() || !rxDuration.trim()) return;

        setSubmittingRx(true);
        try {
            const { error } = await (supabase as any)
                .from('prescription_history')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorUser?.id,
                    medication: rxMedication,
                    dosage: rxDosage,
                    frequency: rxFrequency,
                    duration: rxDuration,
                    notes: rxNotes,
                    pharmacy_fulfillment_status: 'pending'
                });

            if (error) throw error;

            alert('Prescription recorded successfully!');
            setIsPrescriptionModalOpen(false);
            setRxMedication('');
            setRxDosage('');
            setRxFrequency('');
            setRxDuration('');
            setRxNotes('');
            fetchEMRData();
        } catch (err: any) {
            console.error('Record prescription error:', err);
            alert(`Failed to record prescription: ${err.message}`);
        } finally {
            setSubmittingRx(false);
        }
    };

    const handleRequestScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanName.trim()) return;

        setSubmittingScan(true);
        try {
            const { error } = await (supabase as any)
                .from('imaging_history')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorUser?.id,
                    scan_type: scanType,
                    scan_name: scanName,
                    notes: scanNotes,
                    status: 'scheduled'
                });

            if (error) throw error;

            alert('Imaging scan requested successfully!');
            setIsScanModalOpen(false);
            setScanName('');
            setScanNotes('');
            fetchEMRData();
        } catch (err: any) {
            console.error('Request imaging scan error:', err);
            alert(`Failed to request imaging scan: ${err.message}`);
        } finally {
            setSubmittingScan(false);
        }
    };

    // Filter computation
    const filteredEvents = timelineEvents.filter(evt => {
        const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              evt.notes?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'ALL' || evt.type === filterType.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Verifying clinical credentials...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            You are not currently assigned to this patient's consultations, nor has the patient granted clinical consent.
                        </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                        <Button
                            onClick={handleEmergencyOverride}
                            disabled={isBypassing}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={16} />
                            {isBypassing ? 'Granting Access...' : 'Emergency Bypass (Overrides RLS)'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/staff')}
                            className="w-full rounded-xl py-3 text-slate-400 font-bold"
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/staff')}
                            className="w-10 h-10 bg-white hover:bg-slate-100 border border-gray-200 text-slate-600 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">AUTHORIZED CLINICAL AUDIT ACCESS</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900">{patientProfile?.full_name} EMR</h1>
                            <p className="text-xs text-slate-500">Lifelong healthcare record timeline • MED-ID: {patientProfile?.med_id}</p>
                        </div>
                    </div>

                    {['doctor', 'partner'].includes(userRole) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setIsDiagnosisModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                            >
                                <Plus size={14} /> Add Diagnosis
                            </button>
                            <button
                                onClick={() => setIsLabModalOpen(true)}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-sky-600/10"
                            >
                                <Microscope size={14} /> Request Lab Test
                            </button>
                            <button
                                onClick={() => setIsPrescriptionModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-purple-600/10"
                            >
                                <Pill size={14} /> Add Prescription / Injection
                            </button>
                            <button
                                onClick={() => setIsScanModalOpen(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-600/10"
                            >
                                <Layers size={14} /> Request Scan
                            </button>
                            <button
                                onClick={() => setIsEscalateModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                            >
                                <Sparkles size={14} className="animate-pulse text-indigo-200" /> Escalate to Telemedicine
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Timeline and Comparison Tab */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Comparison view for lab history */}
                        {labHistory.length > 0 && (
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                                    📊 Lab Parameter Historical Comparison
                                </h3>
                                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                                    {labHistory.map(lab => (
                                        <div key={lab.id} className="p-4 flex justify-between items-center bg-slate-50 text-xs">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-700">{lab.test_name}</p>
                                                <p className="text-[10px] text-slate-400">Date: {new Date(lab.request_date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">{lab.notes || 'Reviewed'}</p>
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{lab.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search and timeline filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search timeline (diagnosis, meds, tests)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-xs border border-gray-100 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter size={16} className="text-slate-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full sm:w-40 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                                >
                                    <option value="ALL">All Events</option>
                                    <option value="CONSULTATION">Consultations</option>
                                    <option value="PRESCRIPTION">Prescriptions</option>
                                    <option value="REFERRAL">Referrals</option>
                                    <option value="LAB">Laboratory</option>
                                    <option value="UPLOAD">Documents</option>
                                    <option value="TRIAGE">Nurse Triage Logs</option>
                                </select>
                            </div>
                        </div>

                        {/* Timeline list */}
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <ClipboardList className="mx-auto text-slate-200 mb-3 animate-pulse" size={48} />
                                <p className="text-slate-700 font-bold text-sm">No clinical history records found</p>
                            </div>
                        ) : (
                            <div className="relative border-l border-emerald-200/80 ml-6 pl-8 space-y-6 py-2">
                                {filteredEvents.map(evt => (
                                    <div key={evt.id} className="relative group">
                                        <div className={`absolute -left-[45px] top-0.5 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md text-white transition-all ${
                                            evt.type === 'consultation' ? 'bg-indigo-600' :
                                            evt.type === 'prescription' ? 'bg-emerald-600' :
                                            evt.type === 'referral' ? 'bg-amber-600' :
                                            evt.type === 'lab' ? 'bg-purple-600' : 
                                            evt.type === 'triage' ? 'bg-rose-500' : 'bg-slate-600'
                                        }`}>
                                            {evt.type === 'consultation' && <Heart size={14} />}
                                            {evt.type === 'prescription' && <Pill size={14} />}
                                            {evt.type === 'referral' && <FileText size={14} />}
                                            {evt.type === 'lab' && <Microscope size={14} />}
                                            {evt.type === 'triage' && <Activity size={14} />}
                                            {evt.type === 'upload' && <Upload size={14} />}
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                        {evt.type}
                                                    </span>
                                                    <h3 className="font-bold text-slate-800 text-sm">{evt.title}</h3>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(evt.date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{evt.notes}</p>

                                            {evt.meta && (
                                                <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold">
                                                    {evt.meta.doctor && (
                                                        <span>Physician: <span className="text-slate-600">{evt.meta.doctor}</span></span>
                                                    )}
                                                    {evt.meta.symptoms && (
                                                        <span>Symptoms: <span className="text-slate-600">{evt.meta.symptoms}</span></span>
                                                    )}
                                                    {evt.meta.status && (
                                                        <span>Status: <span className="uppercase text-slate-600">{evt.meta.status}</span></span>
                                                    )}
                                                    {evt.meta.url && (
                                                        <a 
                                                            href={evt.meta.url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all"
                                                        >
                                                            <Eye size={12} /> View Document File
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Patient health stats sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Telemedicine Schedule Sidebar Panel */}
                        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -z-10"></div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                <Video size={13} className="text-indigo-600 animate-pulse" /> Telemedicine Bookings
                            </h3>
                            {telemedAppointments.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No scheduled virtual sessions for this patient.</p>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {telemedAppointments.map((apt: any) => {
                                        const aptDate = new Date(apt.date);
                                        const isToday = aptDate.toDateString() === new Date().toDateString();
                                        return (
                                            <div key={apt.id} className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs leading-snug">{apt.title}</p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                            {aptDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                        isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {isToday ? 'Today' : 'Upcoming'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                                                    <span>Doctor: <span className="font-bold text-slate-700">{apt.doctor?.full_name || 'Staff'}</span></span>
                                                    <span className="capitalize">{apt.type} • {apt.duration}</span>
                                                </div>
                                                <Link href={`/dashboard/telemedicine/session/${apt.id}`}>
                                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 h-8 text-[11px] font-bold rounded-xl mt-1 flex items-center justify-center gap-1 shadow-sm">
                                                        <Video size={12} /> Join Session
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Nurse Triage Vitals Sidebar */}
                        {latestTriage && (
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-300">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                    <Activity size={13} className="text-rose-500 animate-pulse" /> Nurse Triage Vitals
                                </h3>
                                <div className="text-xs space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">🌡️ Temp</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.temperature ? `${latestTriage.temperature}°C` : '--'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">🩺 BP</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.blood_pressure || '--'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">💓 Pulse</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.pulse_rate ? `${latestTriage.pulse_rate} bpm` : '--'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">🌬️ Resp</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.respiration_rate ? `${latestTriage.respiration_rate} bpm` : '--'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">⚖️ Weight</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.weight ? `${latestTriage.weight} kg` : '--'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">🩸 SpO2</span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{latestTriage.spo2 ? `${latestTriage.spo2}%` : '--'}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Chief Complaint</span>
                                        <p className="text-xs text-slate-700 italic">"{latestTriage.chief_complaint || 'None logged'}"</p>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-2 font-bold">
                                        <span>Priority: <span className={`px-2 py-0.5 rounded text-[9px] ${
                                            latestTriage.triage_color === 'RED' ? 'bg-rose-100 text-rose-700' :
                                            latestTriage.triage_color === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
                                            latestTriage.triage_color === 'YELLOW' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>{latestTriage.triage_color || 'GREEN'}</span></span>
                                        <span>Date: {new Date(latestTriage.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lifelong summary details */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                📋 Lifelong Health Profile
                            </h3>
                            <div className="text-xs space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Blood Group</span>
                                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{patientProfile?.blood_group || '--'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Genotype</span>
                                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{patientRecord?.genotype || '--'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Maternal</span>
                                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{patientProfile?.is_pregnant ? 'Pregnant 🤰' : 'No'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Age</span>
                                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                                            {patientProfile?.date_of_birth ? new Date().getFullYear() - new Date(patientProfile.date_of_birth).getFullYear() : '--'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Allergies</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allergies.length === 0 ? (
                                            <span className="text-slate-400 text-xs">No allergies logged</span>
                                        ) : (
                                            allergies.map(all => (
                                                <span key={all.id} className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                                                    {all.allergen} ({all.severity})
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chronic Illnesses</span>
                                    <div className="space-y-1.5">
                                        {chronicConditions.length === 0 ? (
                                            <span className="text-slate-400 text-xs block">None reported</span>
                                        ) : (
                                            chronicConditions.map(cc => (
                                                <div key={cc.id} className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]">
                                                    <span className="font-bold text-slate-700">{cc.condition_name}</span>
                                                    <span className="text-[8px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{cc.status}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Active Medications</span>
                                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-700 min-h-[60px] whitespace-pre-wrap">
                                        {patientRecord?.current_medications || 'None configured.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Emergency details sidebar */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                🚨 Emergency Contact
                            </h3>
                            <div className="text-xs space-y-2.5 text-slate-600">
                                <div>
                                    <span className="block text-[8px] font-extrabold uppercase text-slate-400">Primary Contact</span>
                                    <p className="font-bold text-slate-800">{patientProfile?.emergency_contact_name || '--'}</p>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-extrabold uppercase text-slate-400">Phone Number</span>
                                    <p className="font-bold text-slate-800">{patientProfile?.emergency_contact_phone || '--'}</p>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-extrabold uppercase text-slate-400">Relationship</span>
                                    <p className="font-bold text-slate-800 capitalize">{patientProfile?.emergency_contact_relationship || '--'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Doctor's Notes sidebar */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                <ClipboardList size={13} className="text-indigo-500" /> Doctor's Notes
                            </h3>
                            {doctorNotes.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No clinical notes recorded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {doctorNotes.map((note: any) => (
                                        <div key={note.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-bold text-slate-800 text-xs leading-tight">{note.diagnosis}</p>
                                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                    note.severity === 'SEVERE' ? 'bg-rose-100 text-rose-700' :
                                                    note.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>{note.severity}</span>
                                            </div>
                                            {note.notes && (
                                                <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-line">{note.notes}</p>
                                            )}
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                                <span className="text-[9px] text-slate-400 font-semibold">
                                                    Dr. {note.doctor?.full_name || 'Unknown'}
                                                </span>
                                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                    note.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                    note.status === 'CHRONIC' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>{note.status}</span>
                                            </div>
                                            <p className="text-[9px] text-slate-300">{new Date(note.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                {/* Add Diagnosis modal */}
                {isDiagnosisModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Plus className="text-emerald-600" size={20} /> Record New Patient Diagnosis
                            </h2>
                            <form onSubmit={handleAddDiagnosis} className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Diagnosis / Condition Name</label>
                                    <input
                                        type="text"
                                        value={newDiagnosis}
                                        onChange={(e) => setNewDiagnosis(e.target.value)}
                                        placeholder="e.g. Essential Hypertension"
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Severity</label>
                                        <select
                                            value={newSeverity}
                                            onChange={(e) => setNewSeverity(e.target.value as any)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="MILD">Mild</option>
                                            <option value="MODERATE">Moderate</option>
                                            <option value="SEVERE">Severe</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Clinical Status</label>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value as any)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="RESOLVED">Resolved</option>
                                            <option value="CHRONIC">Chronic</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Clinical Diagnosis Notes</label>
                                    <textarea
                                        value={newDiagNotes}
                                        onChange={(e) => setNewDiagNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Specify presentation details, family history factors..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDiagnosisModalOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-md shadow-emerald-600/10"
                                        disabled={submittingDiag}
                                    >
                                        {submittingDiag ? 'Saving Log...' : 'Confirm Diagnosis'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* 2. Lab Request Modal */}
                {isLabModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Microscope className="text-sky-600" size={20} /> Request Lab Test
                            </h2>
                            <form onSubmit={handleRequestLab} className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Test Name *</label>
                                    <input
                                        type="text"
                                        value={labTestName}
                                        onChange={(e) => setLabTestName(e.target.value)}
                                        placeholder="e.g. Malaria Parasite (MP), Full Blood Count (FBC)"
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-sky-505"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Clinical Indications / Notes</label>
                                    <textarea
                                        value={labNotes}
                                        onChange={(e) => setLabNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Specify specific parameters, symptoms, or indications..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-sky-505"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsLabModalOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl py-3 font-bold shadow-md shadow-sky-600/10"
                                        disabled={submittingLab}
                                    >
                                        {submittingLab ? 'Submitting...' : 'Request Test'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. Prescription / Injection Modal */}
                {isPrescriptionModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Pill className="text-purple-600" size={20} /> Prescribe Medication / Injection
                            </h2>
                            <form onSubmit={handleRecordPrescription} className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Medication Name *</label>
                                    <input
                                        type="text"
                                        value={rxMedication}
                                        onChange={(e) => setRxMedication(e.target.value)}
                                        placeholder="e.g. Tab Paracetamol, Inj Artemether"
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <label className="font-bold text-slate-700 block mb-1">Dosage *</label>
                                        <input
                                            type="text"
                                            value={rxDosage}
                                            onChange={(e) => setRxDosage(e.target.value)}
                                            placeholder="e.g. 500mg, 80mg"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="font-bold text-slate-700 block mb-1">Frequency *</label>
                                        <input
                                            type="text"
                                            value={rxFrequency}
                                            onChange={(e) => setRxFrequency(e.target.value)}
                                            placeholder="e.g. Daily, 2x daily"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="font-bold text-slate-700 block mb-1">Duration *</label>
                                        <input
                                            type="text"
                                            value={rxDuration}
                                            onChange={(e) => setRxDuration(e.target.value)}
                                            placeholder="e.g. 3 days, 5 days"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Instructions / Injection Notes</label>
                                    <textarea
                                        value={rxNotes}
                                        onChange={(e) => setRxNotes(e.target.value)}
                                        rows={2}
                                        placeholder="e.g. Take after meals, administering nurse log vitals first..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsPrescriptionModalOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold shadow-md shadow-purple-600/10"
                                        disabled={submittingRx}
                                    >
                                        {submittingRx ? 'Prescribing...' : 'Confirm Prescription'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* 4. Request Scan Modal */}
                {isScanModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Layers className="text-amber-600" size={20} /> Request Imaging Scan
                            </h2>
                            <form onSubmit={handleRequestScan} className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Scan Type *</label>
                                        <select
                                            value={scanType}
                                            onChange={(e) => setScanType(e.target.value as any)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="xray">X-Ray</option>
                                            <option value="mri">MRI Scan</option>
                                            <option value="ct">CT Scan</option>
                                            <option value="ultrasound">Ultrasound</option>
                                            <option value="other">Other Scan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Scan Name / Location *</label>
                                        <input
                                            type="text"
                                            value={scanName}
                                            onChange={(e) => setScanName(e.target.value)}
                                            placeholder="e.g. Chest, Brain, Abdomen"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Clinical Indications / Scan Notes</label>
                                    <textarea
                                        value={scanNotes}
                                        onChange={(e) => setScanNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Specify specific reasons, clinical symptoms, or instructions..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsScanModalOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 font-bold shadow-md shadow-amber-600/10"
                                        disabled={submittingScan}
                                    >
                                        {submittingScan ? 'Submitting...' : 'Request Scan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            <EscalateTelemedicineModal
                isOpen={isEscalateModalOpen}
                onClose={() => setIsEscalateModalOpen(false)}
                patientId={patientId}
                patientName={patientProfile?.full_name || 'Patient'}
                patientEmail={patientProfile?.email}
                doctorId={doctorUser?.id}
                doctorName={doctorUser?.email || 'Doctor'} // Or standard doctor name
                onSuccess={() => {
                    fetchEMRData();
                }}
            />
            </div>
        </div>
    );
}
