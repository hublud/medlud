'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Lock, Shield, Download, Info, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const getPasswordStrengthError = (password: string): string | null => {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[@$!%*?&#_]/.test(password)) {
        return "Password must contain at least one special character (e.g. @$!%*?&#_).";
    }
    return null;
};

export const SecurityPrivacyCard = () => {
    const { user, profile, updateProfile } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (passwords.new !== passwords.confirm) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        // Enforce strong password validation
        const passwordError = getPasswordStrengthError(passwords.new);
        if (passwordError) {
            setError(passwordError);
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: passwords.new
        });

        if (error) {
            setError(error.message);
        } else {
            setIsPasswordModalOpen(false);
            setPasswords({ new: '', confirm: '' });
            alert('Password updated successfully!');
        }
        setLoading(false);
    };

    // NDPR Right to Portability - Download Clinical PDF Report
    const handleExportClinicalData = async () => {
        if (!user) return;
        setExporting(true);
        try {
            // 1. Fetch appointments
            const { data: appointments } = await (supabase as any)
                .from('appointments')
                .select('*')
                .eq('user_id', user.id);

            // 2. Fetch prescriptions
            const apptIds = appointments?.map((a: any) => a.id) || [];
            let prescriptions: any[] = [];
            if (apptIds.length > 0) {
                const { data: rxData } = await (supabase as any)
                    .from('prescriptions')
                    .select('*')
                    .in('appointment_id', apptIds);
                prescriptions = rxData || [];
            }

            // 3. Fetch uploaded medical results
            const { data: uploadedResults } = await (supabase as any)
                .from('uploaded_medical_results')
                .select('*')
                .eq('patient_id', user.id);

            // 4. Fetch EMR patient_records
            const { data: recordData } = await (supabase as any)
                .from('patient_records')
                .select('*')
                .eq('patient_id', user.id)
                .maybeSingle();

            // 5. Initialize PDF document
            const doc = new jsPDF();
            
            // Header Styling
            doc.setFillColor(16, 185, 129); // emerald-500
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('MEDLUD HEALTHCARE ECOSYSTEM', 14, 23);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Official Clinical Record • NDPR Compliant Portability Export', 14, 30);
            
            // Subtitle Info
            doc.setTextColor(51, 65, 85); // slate-700
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('PATIENT CLINICAL CHART SUMMARY', 14, 52);
            
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.text(`Record Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}`, 140, 52);
            
            // Draw slate divider line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(14, 55, 196, 55);

            // Assemble demographic data
            const lifestyle = recordData?.lifestyle_information || {};
            const lifestyleText = [
                lifestyle.diet ? `Diet: ${lifestyle.diet}` : '',
                lifestyle.smoking ? `Smoking: ${lifestyle.smoking}` : '',
                lifestyle.alcohol ? `Alcohol: ${lifestyle.alcohol}` : '',
                lifestyle.exercise ? `Exercise: ${lifestyle.exercise}` : ''
            ].filter(Boolean).join(', ') || 'Not logged';

            // Demographic Info Table
            autoTable(doc, {
                startY: 58,
                theme: 'plain',
                head: [],
                body: [
                    [
                        { content: 'Patient Name:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.full_name || 'N/A', 
                        { content: 'MED-ID:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.med_id || 'N/A'
                    ],
                    [
                        { content: 'Email:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.email || 'N/A', 
                        { content: 'Phone:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.phone || 'N/A'
                    ],
                    [
                        { content: 'Date of Birth:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.date_of_birth || 'N/A', 
                        { content: 'Gender:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.gender || 'N/A'
                    ],
                    [
                        { content: 'Blood Group:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.blood_group || 'N/A', 
                        { content: 'Genotype:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        recordData?.genotype || profile?.genotype || 'N/A'
                    ],
                    [
                        { content: 'Known Conditions:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.known_conditions || 'None Declared', 
                        { content: 'Allergies:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.allergies || 'None Declared'
                    ],
                    [
                        { content: 'Lifestyle Info:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        lifestyleText,
                        { content: 'Maternal Status:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } }, 
                        profile?.is_pregnant ? 'Pregnant' : 'Not Pregnant'
                    ]
                ],
                styles: { fontSize: 8.5, cellPadding: 2 }
            });

            const profileEnd = (doc as any).lastAutoTable.finalY + 8;
            
            // Section 1: Consultations / Appointments
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('1. Consultations & Appointment History', 14, profileEnd);
            
            const aptRows = (appointments || []).map((a: any) => [
                new Date(a.date || a.created_at).toLocaleDateString(),
                a.title || 'General Consultation',
                a.symptoms || a.description || 'None provided',
                a.status || 'N/A'
            ]);

            autoTable(doc, {
                startY: profileEnd + 3,
                head: [['Date', 'Consultation', 'Symptoms Reported', 'Status']],
                body: aptRows.length > 0 ? aptRows : [['-', 'No consultations recorded', '-', '-']],
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [16, 185, 129] }
            });

            const aptEnd = (doc as any).lastAutoTable.finalY + 8;
            
            // Section 2: Prescriptions
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('2. Prescription History', 14, aptEnd);
            
            const rxRows = (prescriptions || []).map((p: any) => [
                new Date(p.created_at).toLocaleDateString(),
                p.medication || 'N/A',
                p.dosage || 'N/A',
                p.frequency || 'N/A',
                p.duration || 'N/A',
                p.notes || 'None'
            ]);

            autoTable(doc, {
                startY: aptEnd + 3,
                head: [['Date', 'Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                body: rxRows.length > 0 ? rxRows : [['-', 'No prescriptions recorded', '-', '-', '-', '-']],
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [16, 185, 129] }
            });

            const rxEnd = (doc as any).lastAutoTable.finalY + 8;

            // Section 3: Uploaded Medical Reports
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('3. Uploaded Medical Documents & Lab Reports', 14, rxEnd);

            const uploadRows = (uploadedResults || []).map((u: any) => [
                new Date(u.created_at).toLocaleDateString(),
                u.file_name || 'Report document',
                u.category?.replace('_', ' ').toUpperCase() || 'OTHER',
                u.notes || 'None'
            ]);

            autoTable(doc, {
                startY: rxEnd + 3,
                head: [['Upload Date', 'Document Title', 'Category', 'Notes/Diagnostics']],
                body: uploadRows.length > 0 ? uploadRows : [['-', 'No external reports uploaded', '-', '-']],
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [16, 185, 129] }
            });

            // Save the PDF locally on trigger
            doc.save(`medlud_clinical_chart_${profile?.med_id || 'patient'}.pdf`);

        } catch (err: any) {
            console.error('Error exporting data:', err);
            alert('Failed to export clinical data: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleToggleConsent = async (key: 'ai_consent_accepted' | 'emergency_consent_accepted', currentVal: boolean) => {
        try {
            await updateProfile({ [key]: !currentVal });
        } catch (err: any) {
            console.error(`Failed to update ${key}:`, err);
        }
    };

    return (
        <Card>
            <h2 className="text-lg font-bold text-text-primary mb-6">Security, Privacy & Consent</h2>

            <div className="space-y-6">
                {/* 1. Change Password Option */}
                <div>
                    <Button
                        variant="outline"
                        fullWidth
                        className="justify-between group h-11"
                        onClick={() => setIsPasswordModalOpen(true)}
                    >
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-text-secondary group-hover:text-primary" />
                            <span className="font-medium text-sm">Change Account Password</span>
                        </div>
                    </Button>
                </div>

                {/* 2. NDPR Consent Controls */}
                <div className="border-t border-border pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Shield size={16} className="text-primary" /> Dynamic Consent Settings
                    </h3>
                    
                    <div className="space-y-3">
                        <Toggle
                            label="AI Assistant Consent"
                            description="Enable symptoms checkers and AI diagnostics"
                            checked={profile?.ai_consent_accepted === true}
                            onChange={() => handleToggleConsent('ai_consent_accepted', profile?.ai_consent_accepted)}
                        />
                        <Toggle
                            label="Emergency Contact & Vitals Sharing"
                            description="Allow sharing health summary with responders"
                            checked={profile?.emergency_consent_accepted === true}
                            onChange={() => handleToggleConsent('emergency_consent_accepted', profile?.emergency_consent_accepted)}
                        />
                    </div>
                </div>

                {/* 3. NDPR Right to Portability */}
                <div className="border-t border-border pt-4 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Info size={16} className="text-primary" /> NDPR Data Portability
                    </h3>
                    <p className="text-xs text-text-secondary leading-normal">
                        Under the Nigeria Data Protection Regulation (NDPR), you have the right to request a portable copy of all your medical history and credentials.
                    </p>
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={handleExportClinicalData}
                        disabled={exporting}
                        className="h-10 text-xs font-bold"
                    >
                        {exporting ? (
                            <><Loader2 size={14} className="animate-spin mr-1.5" /> Compiling History...</>
                        ) : (
                            <><Download size={14} className="mr-1.5" /> Export My Clinical Data</>
                        )}
                    </Button>
                </div>

                {/* 4. Encryption Info */}
                <div className="border-t border-border pt-4">
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-2xl text-xs space-y-1.5 border border-blue-100 leading-normal">
                        <p>🔒 <strong>Encryption:</strong> Connection is secured with TLS 1.3. Database storage utilizes AES-256 transparent encryption.</p>
                        <p>👥 <strong>Access:</strong> Medical files are strictly isolated using Supabase RLS (Row Level Security) and visible only to you and authorized doctors.</p>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {error && (
                        <div className="p-2 bg-red-50 text-red-650 text-xs rounded border border-red-100 leading-normal">
                            {error}
                        </div>
                    )}
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        leftIcon={Lock}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        leftIcon={Lock}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPasswordModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};
