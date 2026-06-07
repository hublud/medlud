'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Hospital, 
    FileText, 
    Upload, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    LogOut,
    Phone,
    Mail,
    MapPin,
    User,
    ArrowRight,
    Loader2,
    Calendar,
    Building2,
    X as CloseIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ReferralRequest {
    id: string;
    request_type: string;
    clinical_notes: string;
    status: 'pending' | 'completed' | 'expired' | 'cancelled';
    created_at: string;
    appointment_id: string | null;
    call_id: string | null;
    patient_id: string;
    doctor_id: string | null;
    patient?: {
        full_name: string;
        med_id: string;
        phone: string | null;
    };
    doctor?: {
        full_name: string;
    };
}

export default function PartnerDashboard() {
    const { user, profile, signOut } = useAuth();
    const [facility, setFacility] = useState<any>(null);
    const [referrals, setReferrals] = useState<ReferralRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    
    // Tab and modal states
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [selectedReferral, setSelectedReferral] = useState<ReferralRequest | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    
    // Form fields
    const [resultType, setResultType] = useState<'lab_result' | 'scan_result' | 'prescription_receipt' | 'hospital_report'>('lab_result');
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [reportNotes, setReportNotes] = useState('');

    useEffect(() => {
        if (profile) {
            fetchPartnerData();
        }
    }, [profile]);

    const fetchPartnerData = async () => {
        setLoading(true);
        try {
            if (!profile?.facility_id) {
                console.error('No facility ID linked to this profile.');
                setLoading(false);
                return;
            }

            // 1. Fetch Facility Details
            const { data: facData, error: facErr } = await (supabase as any)
                .from('facilities')
                .select(`
                    *,
                    locations:facility_locations(*)
                `)
                .eq('id', profile.facility_id)
                .single();

            if (facErr) throw facErr;
            setFacility(facData);

            // 2. Fetch Referrals directed to this facility
            const { data: refData, error: refErr } = await (supabase as any)
                .from('referral_requests')
                .select(`
                    *,
                    patient:profiles!patient_id(full_name, med_id, phone),
                    doctor:profiles!doctor_id(full_name)
                `)
                .eq('facility_id', profile.facility_id)
                .order('created_at', { ascending: false });

            if (refErr) throw refErr;
            setReferrals(refData || []);

            // Check if they are mapped in facility_staff
            const { data: staffCheck } = await (supabase as any)
                .from('facility_staff')
                .select('id')
                .eq('profile_id', profile.id)
                .eq('status', 'active')
                .maybeSingle();

            setIsStaff(!!staffCheck);

        } catch (err: any) {
            console.error('Error loading partner data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmitResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReferral || !file) return alert('Please provide all required fields and select a file.');

        setSubmitting(true);
        try {
            const patientId = selectedReferral.patient_id;
            const referralId = selectedReferral.id;

            // 1. Upload file to Supabase Storage 'lab-results'
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}_partner.${fileExt}`;
            const filePath = `${patientId}/${uniqueFileName}`;

            const { error: uploadError } = await (supabase as any).storage
                .from('lab-results')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: urlData } = (supabase as any).storage
                .from('lab-results')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) throw new Error('Could not get public URL for result.');

            const uploadedFileUrl = urlData.publicUrl;

            // 2. Create row in uploaded_medical_results
            const { data: insertedResult, error: insertError } = await (supabase as any)
                .from('uploaded_medical_results')
                .insert([{
                    referral_request_id: referralId,
                    patient_id: patientId,
                    doctor_id: selectedReferral.doctor_id,
                    file_url: uploadedFileUrl,
                    file_name: fileName,
                    result_type: resultType,
                    status: 'pending_review' // Awaiting doctor check
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 3. Update referral request status to completed
            const { error: refUpdateError } = await (supabase as any)
                .from('referral_requests')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', referralId);

            if (refUpdateError) throw refUpdateError;

            // 4. Log to referral_logs
            await (supabase as any)
                .from('referral_logs')
                .insert([{
                    referral_request_id: referralId,
                    patient_id: patientId,
                    doctor_id: selectedReferral.doctor_id,
                    event_type: 'result_uploaded',
                    details: {
                        uploaded_result_id: insertedResult.id,
                        file_name: fileName,
                        result_type: resultType,
                        partner_notes: reportNotes,
                        uploaded_by_partner: true
                    }
                }]);

            // 5. Post notification message in Telemedicine Chat or Appointment Chat
            const notificationMsg = `🔬 Partner Report Submitted: ${facility?.name} has uploaded results for the ${selectedReferral.request_type.toUpperCase()} referral.\n` + 
                `📝 Findings summary: ${reportNotes || 'None'}`;

            if (selectedReferral.appointment_id) {
                await (supabase as any)
                    .from('messages')
                    .insert([{
                        appointment_id: selectedReferral.appointment_id,
                        sender_id: user?.id,
                        role: 'DOCTOR', // Post in doctor-like notification style
                        content: notificationMsg,
                        image_url: file.type.startsWith('image/') ? uploadedFileUrl : null
                    }]);
            }

            if (selectedReferral.call_id) {
                await (supabase as any)
                    .from('session_messages')
                    .insert([{
                        consultation_id: selectedReferral.call_id,
                        sender_id: user?.id,
                        content: notificationMsg
                    }]);
            }

            alert('Medical results submitted successfully!');
            
            // Reset state
            setFile(null);
            setFileName('');
            setReportNotes('');
            setIsUploadOpen(false);
            setSelectedReferral(null);
            
            // Refresh dashboard
            fetchPartnerData();

        } catch (err: any) {
            console.error('Error submitting partner results:', err);
            alert(`Submission failed: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter referrals based on active tab
    const filteredReferrals = referrals.filter(ref => {
        if (activeTab === 'pending') {
            return ref.status === 'pending';
        } else {
            return ref.status === 'completed';
        }
    });

    const pendingCount = referrals.filter(r => r.status === 'pending').length;
    const completedCount = referrals.filter(r => r.status === 'completed').length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                    <p className="text-sm font-bold text-slate-600">Loading Partner Portal...</p>
                </div>
            </div>
        );
    }

    if (!profile?.facility_id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center space-y-4">
                    <AlertCircle className="text-red-500 mx-auto" size={48} />
                    <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                    <p className="text-sm text-slate-500">
                        This account is not associated with any Partnered Facility. Please contact support or your system administrator.
                    </p>
                    <Button onClick={() => signOut()} className="w-full bg-slate-900 text-white font-bold h-11 rounded-xl">
                        <LogOut size={16} className="mr-2" /> Log Out
                    </Button>
                </div>
            </div>
        );
    }

    const location = facility?.locations?.[0];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans">
                
                {/* Top Nav Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Hospital size={22} />
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">Partner Portal</span>
                            <h1 className="text-xl font-bold text-slate-900 leading-tight">MedLud Clinical Network</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isStaff && (
                            <Link href="/saas/dashboard">
                                <Button 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 shadow-md shadow-emerald-100/50"
                                >
                                    Hospital SaaS Portal
                                </Button>
                            </Link>
                        )}
                        <Button 
                            variant="ghost" 
                            onClick={() => signOut()}
                            className="text-slate-500 hover:text-red-600 rounded-full text-xs font-bold"
                        >
                            <LogOut size={16} className="mr-1.5" /> Sign Out
                        </Button>
                    </div>
                </div>

                {/* Facility Info Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/30 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Building2 size={200} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/20">
                                    {facility?.partner_status || 'Partnered'}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {facility?.accreditation_status || 'Accredited'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black">{facility?.name}</h2>
                            <p className="text-xs text-indigo-200 flex items-center gap-1.5">
                                <MapPin size={13} /> {location ? `${location.full_address}, ${location.city}, ${location.state}` : 'Address not specified'}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-xs text-indigo-150">
                            <div>
                                <span className="block text-white/40 text-[10px] uppercase font-bold">License ID</span>
                                <span className="font-semibold text-white">{facility?.license_number || '--'}</span>
                            </div>
                            <div>
                                <span className="block text-white/40 text-[10px] uppercase font-bold">Hours</span>
                                <span className="font-semibold text-white">{facility?.operating_hours || '24/7'}</span>
                            </div>
                            <div>
                                <span className="block text-white/40 text-[10px] uppercase font-bold">Contact Phone</span>
                                <span className="font-semibold text-white flex items-center gap-1"><Phone size={11} /> {facility?.contact_phone || '--'}</span>
                            </div>
                            <div>
                                <span className="block text-white/40 text-[10px] uppercase font-bold">Email</span>
                                <span className="font-semibold text-white flex items-center gap-1 truncate"><Mail size={11} /> {facility?.email || '--'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-5 flex items-center gap-4 bg-white border-slate-100 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={22} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase">Total Requests</p>
                            <p className="text-2xl font-black text-slate-800">{referrals.length}</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4 bg-white border-slate-100 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase">Pending Uploads</p>
                            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4 bg-white border-slate-100 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase">Completed Actions</p>
                            <p className="text-2xl font-black text-slate-800">{completedCount}</p>
                        </div>
                    </Card>
                </div>

                {/* Referral requests section */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                            📥 Incoming Clinical Referrals
                        </h3>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Pending ({pendingCount})
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Completed ({completedCount})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {filteredReferrals.length === 0 ? (
                            <div className="text-center py-12 space-y-3">
                                <CheckCircle className="text-slate-300 mx-auto" size={40} />
                                <p className="text-slate-500 font-bold text-sm">No referrals found in this tab.</p>
                                <p className="text-xs text-slate-400">Incoming requisitions will appear here in real-time.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredReferrals.map((ref) => (
                                    <div 
                                        key={ref.id} 
                                        className="bg-slate-50/55 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
                                    >
                                        <div className="space-y-4">
                                            {/* Header Info */}
                                            <div className="flex items-start justify-between border-b border-slate-200/50 pb-3">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                                                        {ref.request_type} referral
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                        Ref ID: #{ref.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                                <div className="text-right text-[10px] text-slate-400 font-medium">
                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* Patient & Doctor details */}
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Patient ID (Med ID)</span>
                                                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                                        <User size={13} className="text-slate-500" /> {ref.patient?.full_name}
                                                    </p>
                                                    <p className="text-[10px] text-indigo-600 font-bold">ID: {ref.patient?.med_id || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Referred By</span>
                                                    <p className="font-bold text-slate-700">
                                                        Dr. {ref.doctor?.full_name || 'System'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Clinical Requisition notes */}
                                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60">
                                                <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Doctor Requisition Note</span>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                                                    "{ref.clinical_notes || 'No description provided.'}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        {ref.status === 'pending' && (
                                            <div className="mt-5 border-t border-slate-100 pt-4">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedReferral(ref);
                                                        // Default result type based on referral type
                                                        if (ref.request_type === 'lab') setResultType('lab_result');
                                                        else if (ref.request_type === 'imaging') setResultType('scan_result');
                                                        else if (ref.request_type === 'pharmacy') setResultType('prescription_receipt');
                                                        else setResultType('hospital_report');
                                                        setIsUploadOpen(true);
                                                    }}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                                >
                                                    <Upload size={14} /> Submit Results / Report
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {ref.status === 'completed' && (
                                            <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-emerald-600 font-bold bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                                                <span className="flex items-center gap-1.5"><CheckCircle size={15} /> Submission Complete</span>
                                                <span className="text-[10px] text-slate-400 font-normal">Awaiting Review</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Upload Modal */}
            {isUploadOpen && selectedReferral && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-250">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-6 relative">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Upload size={22} className="text-indigo-400" />
                                Submit Clinical Findings
                            </h2>
                            <p className="text-slate-300 text-xs mt-1">Submit reports, scan documents, or receipts for Ref #{selectedReferral.id.slice(0, 8)}</p>
                            <button 
                                onClick={() => {
                                    setIsUploadOpen(false);
                                    setSelectedReferral(null);
                                }} 
                                className="absolute top-6 right-6 p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <CloseIcon size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmitResult} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                            
                            {/* Patient Info Card inside Form */}
                            <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Patient Name</span>
                                    <p className="font-extrabold text-slate-800">{selectedReferral.patient?.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Medical ID</span>
                                    <p className="font-extrabold text-indigo-600">{selectedReferral.patient?.med_id || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Document Type selection */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase block">Result Type</label>
                                <select
                                    value={resultType}
                                    onChange={e => setResultType(e.target.value as any)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                                >
                                    <option value="lab_result">Laboratory Scan/Blood Results</option>
                                    <option value="scan_result">Ultrasound/CT/Imaging Scan</option>
                                    <option value="prescription_receipt">Pharmacy Prescription Receipt</option>
                                    <option value="hospital_report">External Hospital / Specialist Report</option>
                                </select>
                            </div>

                            {/* File Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase block">Choose File (Image or PDF) *</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        id="partner-file-picker"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        required
                                    />
                                    <label
                                        htmlFor="partner-file-picker"
                                        className="flex items-center gap-2 border border-dashed border-slate-350 hover:border-indigo-600 p-4 rounded-xl cursor-pointer text-slate-500 hover:text-indigo-600 transition-all text-xs font-bold w-full justify-center bg-slate-50/50"
                                    >
                                        <Upload size={16} />
                                        {fileName ? `Change File (${fileName.slice(0, 25)}...)` : 'Browse Image or PDF Document'}
                                    </label>
                                </div>
                            </div>

                            {/* Report Notes */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase block">Report Findings / Summary Note *</label>
                                <textarea
                                    required
                                    value={reportNotes}
                                    onChange={e => setReportNotes(e.target.value)}
                                    placeholder="Enter details about findings, drugs dispensed, or clinical report context..."
                                    rows={4}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-4 border-t flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsUploadOpen(false);
                                        setSelectedReferral(null);
                                    }}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold h-11 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-150 flex items-center justify-center"
                                >
                                    {submitting ? (
                                        <><Loader2 className="animate-spin mr-2" size={16} /> Submitting report...</>
                                    ) : (
                                        'Submit to Doctor'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
