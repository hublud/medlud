import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    X, 
    Upload, 
    FileText, 
    Loader2, 
    Check, 
    AlertCircle,
    Building2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UploadResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    appointmentId?: string;
    callId?: string;
    onSuccess: () => void;
}

interface ReferralRequest {
    id: string;
    request_type: string;
    created_at: string;
    is_external: boolean;
    facility?: {
        name: string;
    };
    external_facility_name?: string;
    external_facility_address?: string;
}

export const UploadResultModal: React.FC<UploadResultModalProps> = ({
    isOpen,
    onClose,
    patientId,
    appointmentId,
    callId,
    onSuccess
}) => {
    const [referrals, setReferrals] = useState<ReferralRequest[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(false);

    // Form fields
    const [referralId, setReferralId] = useState<string>('NONE'); // NONE = Independent visit
    const [resultType, setResultType] = useState<'lab_result' | 'scan_result' | 'prescription_receipt' | 'hospital_report'>('lab_result');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // External visit fields
    const [extFacilityName, setExtFacilityName] = useState('');
    const [extFacilityAddress, setExtFacilityAddress] = useState('');
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchActiveReferrals();
        }
    }, [isOpen]);

    const fetchActiveReferrals = async () => {
        setLoadingReferrals(true);
        try {
            const { data } = await (supabase as any)
                .from('referral_requests')
                .select(`
                    *,
                    facility:facilities(name)
                `)
                .eq('patient_id', patientId)
                .eq('status', 'pending');

            setReferrals(data || []);
            if (data && data.length > 0) {
                setReferralId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching referrals:', err);
        } finally {
            setLoadingReferrals(false);
        }
    };

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmitUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert('Please choose a file to upload.');

        // External visit validation
        const isExternalOrNone = referralId === 'NONE' || referrals.find(r => r.id === referralId)?.is_external;
        if (isExternalOrNone && referralId === 'NONE' && (!extFacilityName || !extFacilityAddress)) {
            return alert('Please enter the external clinic name and address.');
        }

        setUploading(true);

        try {
            // 1. Upload file to Supabase Storage ('lab-results' bucket)
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}.${fileExt}`;
            const filePath = `${patientId}/${uniqueFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lab-results')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: urlData } = supabase.storage
                .from('lab-results')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
                throw new Error('Failed to generate public URL for results.');
            }

            const uploadedFileUrl = urlData.publicUrl;

            // 2. If it's a manual external visit (not linked, or linked to external referral), insert to patient_external_visits
            let linkedReferralId = referralId === 'NONE' ? null : referralId;
            if (isExternalOrNone) {
                const { error: visitError } = await (supabase as any)
                    .from('patient_external_visits')
                    .insert([{
                        referral_request_id: linkedReferralId,
                        patient_id: patientId,
                        facility_name: referralId === 'NONE' ? extFacilityName : (referrals.find(r => r.id === referralId)?.external_facility_name || 'External Center'),
                        address: referralId === 'NONE' ? extFacilityAddress : (referrals.find(r => r.id === referralId)?.external_facility_address || 'External Location'),
                        visit_date: visitDate,
                        notes: notes
                    }]);

                if (visitError) throw visitError;
            }

            // 3. Create row in uploaded_medical_results
            // Try to find doctor_id from linked referral
            const selectedRef = referrals.find(r => r.id === referralId);
            const doctorId = (selectedRef as any)?.doctor_id || null;

            const resultInsertData = {
                referral_request_id: linkedReferralId,
                patient_id: patientId,
                doctor_id: doctorId,
                file_url: uploadedFileUrl,
                file_name: fileName,
                result_type: resultType,
                doctor_review_notes: null,
                status: 'pending_review'
            };

            const { data: insertedResult, error: insertError } = await (supabase as any)
                .from('uploaded_medical_results')
                .insert([resultInsertData])
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Update referral status to pending review or complete external visit
            if (linkedReferralId) {
                // Keep status as pending until doctor reviews it, but we can store intermediate info if needed
            }

            // 5. Insert Log to referral_logs
            await (supabase as any)
                .from('referral_logs')
                .insert([{
                    referral_request_id: linkedReferralId,
                    patient_id: patientId,
                    doctor_id: doctorId,
                    event_type: linkedReferralId && !isExternalOrNone ? 'result_uploaded' : 'used_external_center',
                    details: {
                        uploaded_result_id: insertedResult.id,
                        file_name: fileName,
                        result_type: resultType,
                        patient_notes: notes,
                        visit_details: isExternalOrNone ? { name: extFacilityName, address: extFacilityAddress, date: visitDate } : null
                    }
                }]);

            // 6. Post message inside Chat as a clinical record
            const chatMessageText = `📎 Result Uploaded: Patient uploaded ${resultType.replace('_', ' ').toUpperCase()} (${fileName}).\n` + 
                `📝 Patient Notes: ${notes || 'None'}\n` +
                `${isExternalOrNone ? `📍 Center: ${referralId === 'NONE' ? extFacilityName : 'External Center'}` : ''}`;

            // Add public message to Chat
            if (appointmentId) {
                await (supabase as any)
                    .from('messages')
                    .insert([{
                        appointment_id: appointmentId,
                        sender_id: patientId,
                        role: 'USER',
                        content: chatMessageText,
                        image_url: file.type.startsWith('image/') ? uploadedFileUrl : null
                    }]);
            }

            if (callId) {
                await (supabase as any)
                    .from('session_messages')
                    .insert([{
                        consultation_id: callId,
                        sender_id: patientId,
                        content: chatMessageText
                    }]);
            }

            alert('Medical result uploaded successfully! Your doctor has been notified.');
            
            // Reset
            setFile(null);
            setFileName('');
            setNotes('');
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Error uploading result:', err);
            alert(`Failed to upload result: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const selectedRefObject = referrals.find(r => r.id === referralId);
    const showExternalVisitForm = referralId === 'NONE' || selectedRefObject?.is_external;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-250">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 relative">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Upload size={22} className="text-primary" />
                        Upload Medical Care Result
                    </h2>
                    <p className="text-slate-300 text-xs mt-1">Upload lab results, scan reports, clinical receipts, or discharge reports.</p>
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitUpload} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Link to Referral Requisition */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Link to Referral Request</label>
                        {loadingReferrals ? (
                            <div className="p-3 text-xs text-slate-400 flex items-center"><Loader2 size={12} className="animate-spin mr-2" /> Loading referral list...</div>
                        ) : (
                            <select
                                value={referralId}
                                onChange={e => setReferralId(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="NONE">No active referral (Manual / External Visit)</option>
                                {referrals.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.request_type.toUpperCase()} Referral ({r.is_external ? 'External' : r.facility?.name || 'Partner'})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Result Type selection */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Result Document Type</label>
                        <select
                            value={resultType}
                            onChange={e => setResultType(e.target.value as any)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="lab_result">Laboratory Scan/Blood Results</option>
                            <option value="scan_result">Ultrasound/CT/Imaging Scan</option>
                            <option value="prescription_receipt">Pharmacy Prescription Receipt</option>
                            <option value="hospital_report">External Hospital / Specialist Report</option>
                        </select>
                    </div>

                    {/* Fallback External Visit Form */}
                    {showExternalVisitForm && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                                <Building2 size={14} className="text-primary" /> External Facility Visited
                            </h4>
                            
                            {referralId === 'NONE' ? (
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Facility/Clinic Name *</label>
                                        <input
                                            type="text"
                                            required={referralId === 'NONE'}
                                            value={extFacilityName}
                                            onChange={e => setExtFacilityName(e.target.value)}
                                            placeholder="e.g. Kaduna General Clinic"
                                            className="w-full bg-white border p-2 rounded-xl text-xs outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Facility Address *</label>
                                        <input
                                            type="text"
                                            required={referralId === 'NONE'}
                                            value={extFacilityAddress}
                                            onChange={e => setExtFacilityAddress(e.target.value)}
                                            placeholder="e.g. Kakuri road, Kaduna"
                                            className="w-full bg-white border p-2 rounded-xl text-xs outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2.5 bg-white border rounded-xl text-xs text-slate-600">
                                    <p className="font-semibold text-slate-800">Authorized External Facility Referral:</p>
                                    <p className="mt-0.5 font-bold text-primary">{selectedRefObject?.external_facility_name}</p>
                                    <p className="text-[10px] text-slate-400">{selectedRefObject?.external_facility_address}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Visit Date</label>
                                <input
                                    type="date"
                                    value={visitDate}
                                    onChange={e => setVisitDate(e.target.value)}
                                    className="w-full bg-white border p-2 rounded-xl text-xs outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* File Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Choose File (Image or PDF) *</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="result-file-picker"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="result-file-picker"
                                className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-primary p-4 rounded-xl cursor-pointer text-slate-500 hover:text-primary transition-all text-xs font-bold w-full justify-center bg-slate-50/50"
                            >
                                <Upload size={16} />
                                {fileName ? `Change File (${fileName.slice(0, 20)}...)` : 'Browse Image or PDF'}
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Patient Notes / Feedback</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add your comments, pharmacy bill details, or symptoms feedback..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={uploading}
                        className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-primary/20 font-bold"
                    >
                        {uploading ? (
                            <><Loader2 className="animate-spin mr-2" size={16} /> Uploading Results...</>
                        ) : (
                            'Submit Results to Doctor'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};
