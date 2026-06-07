'use client';

import React, { useState, useEffect } from 'react';
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
    Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

type TabType = 'TIMELINE' | 'PROFILE' | 'FOLLOWUPS';

export default function PatientEMRPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('TIMELINE');
    const [loading, setLoading] = useState(true);

    // EMR Data States
    const [patientRecord, setPatientRecord] = useState<any>(null);
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [chronicConditions, setChronicConditions] = useState<any[]>([]);

    // Filter/Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    // Modals & Action States
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);

    // New Document Form
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [uploadCategory, setUploadCategory] = useState<'referral_letter' | 'discharge_summary' | 'lab_report' | 'imaging_report' | 'vaccination_card' | 'other'>('other');
    const [uploadNotes, setUploadNotes] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Profile Edit Form State
    const [genotype, setGenotype] = useState('AA');
    const [currentMeds, setCurrentMeds] = useState('');
    const [pastMeds, setPastMeds] = useState('');
    const [lifestyleDiet, setLifestyleDiet] = useState('');
    const [lifestyleSmoking, setLifestyleSmoking] = useState('no');
    const [lifestyleAlcohol, setLifestyleAlcohol] = useState('no');
    const [lifestyleExercise, setLifestyleExercise] = useState('none');
    const [maternalHistoryGestation, setMaternalHistoryGestation] = useState('');

    // Follow-up Response Form State
    const [adherence, setAdherence] = useState<boolean>(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [severity, setSeverity] = useState<string>('None');
    const [logNotes, setLogNotes] = useState('');
    const [logFile, setLogFile] = useState<File | null>(null);
    const [submittingResponse, setSubmittingResponse] = useState(false);

    useEffect(() => {
        if (user) {
            fetchEMRData();
        }
    }, [user]);

    const fetchEMRData = async () => {
        try {
            setLoading(true);
            const uid = user?.id;
            if (!uid) return;

            // 1. Fetch Lifelong Profile
            const { data: recordData } = await (supabase as any)
                .from('patient_records')
                .select('*')
                .eq('patient_id', uid)
                .maybeSingle();

            if (recordData) {
                setPatientRecord(recordData);
                setGenotype(recordData.genotype || 'AA');
                setCurrentMeds(recordData.current_medications || '');
                setPastMeds(recordData.past_medications || '');
                setLifestyleDiet(recordData.lifestyle_information?.diet || '');
                setLifestyleSmoking(recordData.lifestyle_information?.smoking || 'no');
                setLifestyleAlcohol(recordData.lifestyle_information?.alcohol || 'no');
                setLifestyleExercise(recordData.lifestyle_information?.exercise || 'none');
                setMaternalHistoryGestation(recordData.maternal_history?.gestation || '');
            }

            // 2. Fetch Allergies & Chronic Conditions
            const { data: allergyData } = await (supabase as any).from('allergy_records').select('*').eq('patient_id', uid);
            const { data: chronicData } = await (supabase as any).from('chronic_conditions').select('*').eq('patient_id', uid);
            setAllergies(allergyData || []);
            setChronicConditions(chronicData || []);

            // 3. Fetch Follow-Ups
            const { data: fupData } = await (supabase as any)
                .from('follow_up_schedules')
                .select('*, doctor:profiles(full_name)')
                .eq('patient_id', uid)
                .order('scheduled_at', { ascending: false });
            setFollowUps(fupData || []);

            // 4. Fetch Timeline Events (Consultations, Prescriptions, Referrals, Results, Uploads)
            let events: any[] = [];

            // A. Consultations / Appointments
            const { data: aptData } = await (supabase as any)
                .from('appointments')
                .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name)')
                .eq('user_id', uid)
                .eq('status', 'COMPLETED') as any;
            (aptData || []).forEach((apt: any) => {
                events.push({
                    id: apt.id,
                    type: 'consultation',
                    title: apt.title || 'General Consultation',
                    date: apt.date || apt.created_at,
                    notes: apt.doctor_response || apt.notes,
                    meta: {
                        doctor: apt.doctor?.full_name || 'Medical Officer',
                        symptoms: apt.symptoms,
                        priority: apt.priority
                    }
                });
            });

            // B. Prescriptions
            const { data: rxData } = await (supabase as any)
                .from('prescription_history')
                .select('*, doctor:profiles!prescription_history_doctor_id_fkey(full_name)')
                .eq('patient_id', uid) as any;
            (rxData || []).forEach((rx: any) => {
                events.push({
                    id: rx.id,
                    type: 'prescription',
                    title: `Prescription: ${rx.medication}`,
                    date: rx.created_at,
                    notes: `Dosage: ${rx.dosage} | Frequency: ${rx.frequency} | Duration: ${rx.duration}. Notes: ${rx.notes || 'None'}`,
                    meta: {
                        doctor: rx.doctor?.full_name || 'Medical Specialist',
                        status: rx.pharmacy_fulfillment_status
                    }
                });
            });

            // C. Referrals
            const { data: refData } = await (supabase as any)
                .from('referral_requests')
                .select('*, doctor:profiles!referral_requests_doctor_id_fkey(full_name), facility:facilities(name)')
                .eq('patient_id', uid) as any;
            (refData || []).forEach((ref: any) => {
                events.push({
                    id: ref.id,
                    type: 'referral',
                    title: `Referral Request (${ref.request_type.toUpperCase()})`,
                    date: ref.created_at,
                    notes: `Facility: ${ref.facility?.name || ref.external_facility_name || 'External Specialist'}. Notes: ${ref.clinical_notes || 'None'}`,
                    meta: {
                        doctor: ref.doctor?.full_name || 'Assigned General Practitioner',
                        status: ref.status
                    }
                });
            });

            // D. Uploads
            const { data: uploadData } = await (supabase as any)
                .from('medical_uploads')
                .select('*, uploaded_by_profile:profiles!medical_uploads_uploaded_by_fkey(full_name)')
                .eq('patient_id', uid) as any;
            (uploadData || []).forEach((up: any) => {
                events.push({
                    id: up.id,
                    type: 'upload',
                    title: `Medical Document: ${up.file_name}`,
                    date: up.created_at,
                    notes: up.notes || `Category: ${up.category.replace('_', ' ')}`,
                    meta: {
                        url: up.file_url,
                        category: up.category
                    }
                });
            });

            // E. Lab Results
            const { data: labData } = await (supabase as any)
                .from('lab_history')
                .select('*, doctor:profiles!lab_history_doctor_id_fkey(full_name)')
                .eq('patient_id', uid) as any;
            (labData || []).forEach((lab: any) => {
                events.push({
                    id: lab.id,
                    type: 'lab',
                    title: `Laboratory Diagnostic: ${lab.test_name}`,
                    date: lab.created_at,
                    notes: lab.notes || 'Outcome uploaded and reviewed',
                    meta: {
                        doctor: lab.doctor?.full_name || 'Lab Clinician',
                        status: lab.status,
                        results: lab.results_data
                    }
                });
            });

            // Sort timeline events chronologically (latest first)
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTimelineEvents(events);

        } catch (e) {
            console.error('EMR load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const uid = user?.id;
        if (!uid) return;

        try {
            const updates = {
                patient_id: uid,
                genotype,
                current_medications: currentMeds,
                past_medications: pastMeds,
                lifestyle_information: {
                    diet: lifestyleDiet,
                    smoking: lifestyleSmoking,
                    alcohol: lifestyleAlcohol,
                    exercise: lifestyleExercise
                },
                maternal_history: {
                    gestation: maternalHistoryGestation
                },
                updated_at: new Date().toISOString()
            };

            const { error } = await (supabase as any)
                .from('patient_records')
                .upsert(updates);

            if (error) throw error;

            alert('Health profile updated successfully!');
            setIsProfileEditOpen(false);
            fetchEMRData();
        } catch (e: any) {
            console.error('Save profile error:', e);
            alert(`Error saving profile: ${e.message}`);
        }
    };

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadName.trim()) {
            alert('Please provide a document name and file.');
            return;
        }

        setIsUploading(true);
        try {
            const uid = user?.id;
            if (!uid) return;

            // Upload to Supabase Storage
            const cleanFileName = `${Date.now()}_${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `${uid}/${cleanFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lab-results')
                .upload(filePath, uploadFile);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: urlData } = supabase.storage
                .from('lab-results')
                .getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // Save to medical_uploads table
            const { error: dbError } = await (supabase as any)
                .from('medical_uploads')
                .insert({
                    patient_id: uid,
                    uploaded_by: uid,
                    file_url: publicUrl,
                    file_name: uploadName,
                    file_type: uploadFile.type,
                    category: uploadCategory,
                    notes: uploadNotes
                });

            if (dbError) throw dbError;

            alert('Document uploaded successfully!');
            setIsUploadOpen(false);
            setUploadFile(null);
            setUploadName('');
            setUploadNotes('');
            fetchEMRData();
        } catch (e: any) {
            console.error('Upload document error:', e);
            alert(`Failed to upload document: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenFollowUp = (fup: any) => {
        setSelectedFollowUp(fup);
        setAnswers({});
        setAdherence(true);
        setSeverity('None');
        setLogNotes('');
        setLogFile(null);
        setIsFollowUpModalOpen(true);
    };

    const handleSubmitFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFollowUp) return;

        setSubmittingResponse(true);
        try {
            const uid = user?.id;
            if (!uid) return;

            let fileUrl = '';
            if (logFile) {
                const cleanFileName = `${Date.now()}_${logFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const filePath = `${uid}/followup_${cleanFileName}`;
                
                const { error: uploadErr } = await supabase.storage
                    .from('lab-results')
                    .upload(filePath, logFile);
                if (uploadErr) throw uploadErr;

                const { data: urlData } = supabase.storage
                    .from('lab-results')
                    .getPublicUrl(filePath);
                fileUrl = urlData.publicUrl;
            }

            const responseData = {
                adherence,
                questions: selectedFollowUp.details?.questions || [],
                answers: (selectedFollowUp.details?.questions || []).map((q: string, idx: number) => ({
                    question: q,
                    answer: answers[idx] || 'N/A'
                }))
            };

            // 1. Save Response
            const { error: responseError } = await (supabase as any)
                .from('follow_up_responses')
                .insert({
                    follow_up_id: selectedFollowUp.id,
                    patient_id: uid,
                    response_data: responseData,
                    symptom_severity: severity,
                    file_url: fileUrl || null,
                    notes: logNotes
                });

            if (responseError) throw responseError;

            // 2. Update Follow-up Schedule
            const isEscalated = severity === 'Severe' || severity === 'Moderate';
            const updates = {
                status: isEscalated ? 'Escalated' : 'Completed',
                response_received_at: new Date().toISOString(),
                completed_at: isEscalated ? null : new Date().toISOString(),
                escalated_at: isEscalated ? new Date().toISOString() : null,
                escalation_triggered: isEscalated,
                updated_at: new Date().toISOString()
            };

            const { error: scheduleError } = await (supabase as any)
                .from('follow_up_schedules')
                .update(updates)
                .eq('id', selectedFollowUp.id);

            if (scheduleError) throw scheduleError;

            alert(isEscalated ? 'Response recorded. Your doctor has been notified due to reported symptoms.' : 'Thank you! Follow-up completed successfully.');
            setIsFollowUpModalOpen(false);
            fetchEMRData();
        } catch (err: any) {
            console.error('Submit follow-up response error:', err);
            alert(`Failed to submit check-in: ${err.message}`);
        } finally {
            setSubmittingResponse(false);
        }
    };

    // Filter and search computation
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
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold text-sm">Accessing clinical history record...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 rounded-3xl text-white shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                                EMR LIFELONG ACCOUNT
                            </span>
                            <span className="text-[10px] text-white/60 font-medium">MED-ID: {profile?.med_id || 'Generating...'}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">{profile?.full_name || 'Patient'}</h1>
                        <p className="text-white/80 text-sm max-w-md">Your chronological medical history timeline, care check-ins, and health credentials.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Upload size={16} /> Upload Document
                        </button>
                    </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm mb-8 w-fit">
                    <button
                        onClick={() => setActiveTab('TIMELINE')}
                        className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'TIMELINE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Calendar size={14} /> Medical Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('PROFILE')}
                        className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'PROFILE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <User size={14} /> Lifelong Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('FOLLOWUPS')}
                        className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'FOLLOWUPS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Activity size={14} /> Care Follow-Ups
                        {followUps.filter(f => f.status === 'Scheduled' || f.status === 'Awaiting Patient Response').length > 0 && (
                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                        )}
                    </button>
                </div>

                {/* Content Sections */}
                {activeTab === 'TIMELINE' && (
                    <div className="space-y-6">
                        {/* Filters and search */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search timeline (diagnosis, doctor, test, meds)..."
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
                                    className="w-full sm:w-44 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                                >
                                    <option value="ALL">All Entries</option>
                                    <option value="CONSULTATION">Consultations</option>
                                    <option value="PRESCRIPTION">Prescriptions</option>
                                    <option value="REFERRAL">Referrals</option>
                                    <option value="LAB">Laboratory</option>
                                    <option value="UPLOAD">Documents</option>
                                </select>
                            </div>
                        </div>

                        {/* Chronological Timeline visual list */}
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <ClipboardList className="mx-auto text-slate-200 mb-3 animate-pulse" size={48} />
                                <p className="text-slate-700 font-bold text-sm">No clinical history records found</p>
                                <p className="text-slate-400 text-xs mt-1">Try updating your filters or upload external check-up logs.</p>
                            </div>
                        ) : (
                            <div className="relative border-l border-emerald-200/80 ml-6 pl-8 space-y-8 py-2">
                                {filteredEvents.map((evt, idx) => (
                                    <div key={evt.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                                        {/* Node Icon indicator */}
                                        <div className={`absolute -left-[45px] top-0.5 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md text-white transition-all group-hover:scale-110 ${
                                            evt.type === 'consultation' ? 'bg-indigo-600' :
                                            evt.type === 'prescription' ? 'bg-emerald-600' :
                                            evt.type === 'referral' ? 'bg-amber-600' :
                                            evt.type === 'lab' ? 'bg-purple-600' : 'bg-slate-600'
                                        }`}>
                                            {evt.type === 'consultation' && <Heart size={14} />}
                                            {evt.type === 'prescription' && <Pill size={14} />}
                                            {evt.type === 'referral' && <FileText size={14} />}
                                            {evt.type === 'lab' && <Microscope size={14} />}
                                            {evt.type === 'upload' && <Upload size={14} />}
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                        {evt.type}
                                                    </span>
                                                    <h3 className="font-bold text-slate-800 text-sm">{evt.title}</h3>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(evt.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{evt.notes}</p>

                                            {/* Details Metadata */}
                                            {evt.meta && (
                                                <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold">
                                                    {evt.meta.doctor && (
                                                        <span>Physician: <span className="text-slate-600">{evt.meta.doctor}</span></span>
                                                    )}
                                                    {evt.meta.symptoms && (
                                                        <span>Symptoms: <span className="text-slate-600">{evt.meta.symptoms}</span></span>
                                                    )}
                                                    {evt.meta.status && (
                                                        <span>Status: <span className={`uppercase ${evt.meta.status === 'completed' || evt.meta.status === 'filled' ? 'text-emerald-600' : 'text-slate-500'}`}>{evt.meta.status}</span></span>
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
                )}

                {activeTab === 'PROFILE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile metrics detail */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Medical Summary Cards */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Heart size={20} className="text-emerald-600 animate-pulse" /> Lifelong Medical Profile
                                    </h2>
                                    <button
                                        onClick={() => setIsProfileEditOpen(true)}
                                        className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2 rounded-xl transition-all cursor-pointer"
                                    >
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                        <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Blood Group</span>
                                        <span className="text-lg font-extrabold text-slate-800 mt-1 block">{profile?.blood_group || '--'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                        <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Genotype</span>
                                        <span className="text-lg font-extrabold text-slate-800 mt-1 block">{patientRecord?.genotype || '--'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                        <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Pregnancy Status</span>
                                        <span className="text-lg font-extrabold text-slate-800 mt-1 block">{profile?.is_pregnant ? 'Active 🤰' : 'No'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                        <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Gender</span>
                                        <span className="text-lg font-extrabold text-slate-800 mt-1 block capitalize">{profile?.gender || '--'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Medications</span>
                                            <p className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 min-h-[80px] whitespace-pre-wrap">
                                                {patientRecord?.current_medications || 'No current medications configured.'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Past Medications</span>
                                            <p className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 min-h-[80px] whitespace-pre-wrap">
                                                {patientRecord?.past_medications || 'No past medications log recorded.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lifestyle & Wellness Profile</span>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
                                            <div>Dietary Style: <span className="font-bold text-slate-700">{patientRecord?.lifestyle_information?.diet || 'Standard'}</span></div>
                                            <div>Exercise Level: <span className="font-bold text-slate-700 capitalize">{patientRecord?.lifestyle_information?.exercise || 'none'}</span></div>
                                            <div>Smoking: <span className="font-bold text-slate-700 uppercase">{patientRecord?.lifestyle_information?.smoking || 'no'}</span></div>
                                            <div>Alcohol Intake: <span className="font-bold text-slate-700 uppercase">{patientRecord?.lifestyle_information?.alcohol || 'no'}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Allergies and Emergency Contacts Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                    ⚠️ Allergies
                                </h3>
                                {allergies.length === 0 ? (
                                    <p className="text-xs text-slate-400">No allergies listed.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allergies.map(all => (
                                            <span key={all.id} className="text-[10px] font-bold px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full">
                                                {all.allergen} ({all.severity})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                    🏥 Chronic Conditions
                                </h3>
                                {chronicConditions.length === 0 ? (
                                    <p className="text-xs text-slate-400">No active chronic health conditions.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {chronicConditions.map(cond => (
                                            <div key={cond.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="font-bold text-slate-700">{cond.condition_name}</span>
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                    {cond.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                    🚨 Emergency Contacts
                                </h3>
                                <div className="text-xs space-y-2.5 text-slate-600">
                                    <div>
                                        <span className="block text-[9px] font-extrabold uppercase text-slate-400 mb-0.5">Primary Contact</span>
                                        <p className="font-bold text-slate-800">{profile?.emergency_contact_name || '--'}</p>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-extrabold uppercase text-slate-400 mb-0.5">Phone Number</span>
                                        <p className="font-bold text-slate-800">{profile?.emergency_contact_phone || '--'}</p>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-extrabold uppercase text-slate-400 mb-0.5">Relationship</span>
                                        <p className="font-bold text-slate-800 capitalize">{profile?.emergency_contact_relationship || '--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FOLLOWUPS' && (
                    <div className="space-y-6">
                        {/* Care monitoring logs list */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-600" /> Active Automated Care Check-Ins
                            </h2>

                            {followUps.filter(f => f.status !== 'Completed').length === 0 ? (
                                <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <CheckCircle size={40} className="mx-auto text-emerald-500 mb-2 animate-bounce" />
                                    <p className="text-emerald-900 font-bold text-xs">All outstanding care check-ins completed!</p>
                                    <p className="text-emerald-700/80 text-[10px] mt-0.5">Your clinical team is satisfied with your progress tracking.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {followUps.filter(f => f.status !== 'Completed').map(fup => (
                                        <div key={fup.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                        {fup.follow_up_type.replace('_', ' ')}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                                        fup.status === 'Escalated' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {fup.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-xs text-slate-800">
                                                    Provider: {fup.doctor?.full_name || 'System Assistant'}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 leading-normal">
                                                    Scheduled check-up date: {new Date(fup.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </p>
                                            </div>

                                            <Button
                                                size="sm"
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2 shadow-sm"
                                                onClick={() => handleOpenFollowUp(fup)}
                                            >
                                                Submit Check-In Log
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Completed follow ups history */}
                            {followUps.filter(f => f.status === 'Completed').length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Care Logs</h3>
                                    <div className="space-y-2">
                                        {followUps.filter(f => f.status === 'Completed').map(fup => (
                                            <div key={fup.id} className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div>
                                                    <span className="font-bold text-slate-700 capitalize">{fup.follow_up_type.replace('_', ' ')} check-in</span>
                                                    <span className="text-[9px] text-slate-400 ml-2">completed on {new Date(fup.completed_at || fup.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                                    Success
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODALS */}
                {/* Upload document Modal */}
                {isUploadOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Upload className="text-emerald-600" size={20} /> Upload EMR Document
                            </h2>
                            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Document Name</label>
                                    <input
                                        type="text"
                                        value={uploadName}
                                        onChange={(e) => setUploadName(e.target.value)}
                                        placeholder="e.g. Discharge Letter Hospital X"
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                                    <select
                                        value={uploadCategory}
                                        onChange={(e) => setUploadCategory(e.target.value as any)}
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="referral_letter">Referral Letter</option>
                                        <option value="discharge_summary">Discharge Summary</option>
                                        <option value="lab_report">Lab Result Report</option>
                                        <option value="imaging_report">Imaging/Scan Report</option>
                                        <option value="vaccination_card">Vaccination Card</option>
                                        <option value="other">Other Document</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Document Notes</label>
                                    <textarea
                                        value={uploadNotes}
                                        onChange={(e) => setUploadNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Brief clinical details..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Select File</label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="w-full border border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsUploadOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-md shadow-emerald-600/10"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Uploading...' : 'Submit File'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Lifelong profile modal */}
                {isProfileEditOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Heart className="text-emerald-600" size={20} /> Update Lifelong Profile
                            </h2>
                            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Genotype</label>
                                        <select
                                            value={genotype}
                                            onChange={(e) => setGenotype(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="AA">AA</option>
                                            <option value="AS">AS</option>
                                            <option value="SS">SS</option>
                                            <option value="AC">AC</option>
                                            <option value="SC">SC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Gestational Age (weeks if applicable)</label>
                                        <input
                                            type="text"
                                            value={maternalHistoryGestation}
                                            onChange={(e) => setMaternalHistoryGestation(e.target.value)}
                                            placeholder="e.g. 12 weeks"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Diet Style</label>
                                        <input
                                            type="text"
                                            value={lifestyleDiet}
                                            onChange={(e) => setLifestyleDiet(e.target.value)}
                                            placeholder="e.g. Low sodium, vegetarian"
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Exercise Level</label>
                                        <select
                                            value={lifestyleExercise}
                                            onChange={(e) => setLifestyleExercise(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="none">Sedentary (none)</option>
                                            <option value="light">Light activity</option>
                                            <option value="moderate">Moderate exercise</option>
                                            <option value="heavy">Intense training</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Smoking habits</label>
                                        <select
                                            value={lifestyleSmoking}
                                            onChange={(e) => setLifestyleSmoking(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="no">Non-smoker</option>
                                            <option value="yes">Smoker</option>
                                            <option value="occasional">Occasional smoker</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Alcohol Consumption</label>
                                        <select
                                            value={lifestyleAlcohol}
                                            onChange={(e) => setLifestyleAlcohol(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="no">Non-drinker</option>
                                            <option value="yes">Frequent drinker</option>
                                            <option value="occasional">Occasional drinker</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Current Medications</label>
                                    <textarea
                                        value={currentMeds}
                                        onChange={(e) => setCurrentMeds(e.target.value)}
                                        rows={2}
                                        placeholder="Dosage, Frequency..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Past Medications</label>
                                    <textarea
                                        value={pastMeds}
                                        onChange={(e) => setPastMeds(e.target.value)}
                                        rows={2}
                                        placeholder="List previous main therapies..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsProfileEditOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-md shadow-emerald-600/10"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Respond to Follow Up Modal */}
                {isFollowUpModalOpen && selectedFollowUp && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-50 pb-2">
                                <ClipboardList className="text-emerald-600" size={20} /> Submit Follow-Up Log
                            </h2>
                            <p className="text-[11px] text-slate-400">Complete your response for the check-in generated by {selectedFollowUp.doctor?.full_name || 'General Assistant'}.</p>
                            
                            <form onSubmit={handleSubmitFollowUp} className="space-y-4 text-xs">
                                {/* Adherence check */}
                                {selectedFollowUp.follow_up_type === 'medication' && (
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                        <span className="font-bold text-slate-700">Did you take all medication today?</span>
                                        <input
                                            type="checkbox"
                                            checked={adherence}
                                            onChange={(e) => setAdherence(e.target.checked)}
                                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                        />
                                    </div>
                                )}

                                {/* Specific Questions */}
                                {(selectedFollowUp.details?.questions || []).map((q: string, idx: number) => (
                                    <div key={idx}>
                                        <label className="font-bold text-slate-700 block mb-1">{q}</label>
                                        <input
                                            type="text"
                                            value={answers[idx] || ''}
                                            onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                            placeholder="Write your answer..."
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>
                                ))}

                                {/* Severity Logging */}
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Are you currently experiencing any severe symptoms?</label>
                                    <select
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="None">None - Feeling fine</option>
                                        <option value="Mild">Mild - Slight discomfort</option>
                                        <option value="Moderate">Moderate - Noticeable symptoms</option>
                                        <option value="Severe">Severe - Feeling very unwell</option>
                                    </select>
                                </div>

                                {/* General Notes */}
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Additional Notes</label>
                                    <textarea
                                        value={logNotes}
                                        onChange={(e) => setLogNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Add details about your recovery..."
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Optional File Attachment */}
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Attach Receipt / Image (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setLogFile(e.target.files?.[0] || null)}
                                        className="w-full border border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsFollowUpModalOpen(false)}
                                        className="flex-1 rounded-xl text-slate-400 py-3 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-md shadow-emerald-600/10"
                                        disabled={submittingResponse}
                                    >
                                        {submittingResponse ? 'Submitting...' : 'Save Log'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
