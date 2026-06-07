'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    User, 
    Heart, 
    Thermometer, 
    TrendingUp, 
    Plus, 
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    X,
    Pill,
    FileText,
    Clock,
    Calendar,
    LogOut,
    Video
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { registerPatient } from '@/app/actions/patient';
import { EscalateTelemedicineModal } from '@/components/staff/EscalateTelemedicineModal';

export default function NurseTriagePage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [triageHistory, setTriageHistory] = useState<any[]>([]);

    // Triage Dashboard Tab state
    const [activeDashboardTab, setActiveDashboardTab] = useState<'INTAKE' | 'LOOKUP' | 'PRESCRIPTIONS' | 'TELEMEDICINE'>('INTAKE');
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
    const [telemedSchedule, setTelemedSchedule] = useState<any[]>([]);
    const [loadingTelemed, setLoadingTelemed] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
    const [searchingGlobalPatient, setSearchingGlobalPatient] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Patient Lookup State
    const [patientSearch, setPatientSearch] = useState('');
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    // Register Patient State
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regGender, setRegGender] = useState('male');
    const [regDob, setRegDob] = useState('');
    const [regBloodGroup, setRegBloodGroup] = useState('');
    // Emergency contact
    const [regEmergencyName, setRegEmergencyName] = useState('');
    const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
    const [regEmergencyRelationship, setRegEmergencyRelationship] = useState('');
    // Medical history
    const [regAllergies, setRegAllergies] = useState('');
    const [regChronicConditions, setRegChronicConditions] = useState('');
    const [regCurrentMedications, setRegCurrentMedications] = useState('');
    const [registering, setRegistering] = useState(false);

    // Vitals Form State
    const [temp, setTemp] = useState('');
    const [bp, setBp] = useState('');
    const [pulse, setPulse] = useState('');
    const [resp, setResp] = useState('');
    const [weight, setWeight] = useState('');
    const [spo2, setSpo2] = useState('');
    const [complaint, setComplaint] = useState('');
    const [triageColor, setTriageColor] = useState<'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'>('GREEN');
    const [targetDeptId, setTargetDeptId] = useState('');
    const [targetDoctorId, setTargetDoctorId] = useState('');
    const [facilityDoctors, setFacilityDoctors] = useState<any[]>([]);

    // Bed Assignment Modal State
    const [showAssignBedModal, setShowAssignBedModal] = useState(false);
    const [assignBedPatient, setAssignBedPatient] = useState<any | null>(null);
    const [assignBedWards, setAssignBedWards] = useState<any[]>([]);
    const [selectedAssignWardId, setSelectedAssignWardId] = useState('');
    const [assignBeds, setAssignBeds] = useState<any[]>([]);
    const [selectedAssignBedId, setSelectedAssignBedId] = useState('');
    const [assignAdmittingDocId, setAssignAdmittingDocId] = useState('');
    const [assignDiagnosis, setAssignDiagnosis] = useState('');
    const [assigningBed, setAssigningBed] = useState(false);

    // Daily Vitals Update Modal State
    const [showUpdateVitalsModal, setShowUpdateVitalsModal] = useState(false);
    const [vitalsUpdatePatient, setVitalsUpdatePatient] = useState<any | null>(null);
    const [vitalsUpdateRecord, setVitalsUpdateRecord] = useState<any | null>(null);
    const [updateTemp, setUpdateTemp] = useState('');
    const [updateBp, setUpdateBp] = useState('');
    const [updatePulse, setUpdatePulse] = useState('');
    const [updateResp, setUpdateResp] = useState('');
    const [updateWeight, setUpdateWeight] = useState('');
    const [updateSpo2, setUpdateSpo2] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');
    const [updatingVitals, setUpdatingVitals] = useState(false);

    // Telemedicine Escalation State
    const [showSelectDocForTelemedModal, setShowSelectDocForTelemedModal] = useState(false);
    const [telemedPatient, setTelemedPatient] = useState<any | null>(null);
    const [selectedTelemedDoctorId, setSelectedTelemedDoctorId] = useState('');
    const [showTelemedEscalateModal, setShowTelemedEscalateModal] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStaffAndFacilityData();
        }
    }, [user]);

    const fetchStaffAndFacilityData = async () => {
        try {
            setLoading(true);
            // 1. Fetch staff mapping
            const { data: staffData, error: staffErr } = await (supabase as any)
                .from('facility_staff')
                .select('*, facility:facilities(*)')
                .eq('profile_id', user?.id)
                .eq('status', 'active')
                .maybeSingle();

            if (staffErr) throw staffErr;
            
            if (!staffData) {
                setStaffInfo(null);
                setLoading(false);
                return;
            }

            setStaffInfo(staffData);

            // 2. Fetch facility departments
            const { data: deptData, error: deptErr } = await (supabase as any)
                .from('departments')
                .select('*')
                .eq('facility_id', staffData.facility_id);

            if (deptErr) throw deptErr;
            setDepartments(deptData || []);
            if (deptData && deptData.length > 0) {
                setTargetDeptId(deptData[0].id);
            }

            // 2b. Fetch active facility doctors
            const { data: docData, error: docErr } = await (supabase as any)
                .from('facility_staff')
                .select('profile_id, profiles(id, full_name, email)')
                .eq('facility_id', staffData.facility_id)
                .eq('role', 'doctor')
                .eq('status', 'active');
            
            if (docErr) {
                console.error('Error fetching facility doctors:', docErr);
            } else {
                setFacilityDoctors(docData || []);
            }

            // 3. Fetch today's triage history for this facility
            await loadTriageHistory(staffData.facility_id);

            // 4. Fetch doctor prescription logs for this facility
            await fetchPrescriptions(staffData.facility_id);

            // 5. Fetch upcoming telemedicine schedule
            const doctorIds = (docData || []).map((d: any) => d.profile_id);
            if (doctorIds.length > 0) {
                const { data: teleData, error: teleErr } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        doctor:profiles!appointments_doctor_id_fkey(id, full_name)
                    `)
                    .in('doctor_id', doctorIds)
                    .eq('status', 'SCHEDULED')
                    .order('date', { ascending: true });

                if (!teleErr && teleData && teleData.length > 0) {
                    const patientIds = teleData.map((a: any) => a.user_id).filter(Boolean);
                    const { data: patients, error: patientErr } = await supabase
                        .from('profiles')
                        .select('id, full_name, med_id, email, phone')
                        .in('id', patientIds);
                    
                    if (!patientErr) {
                        const mapped = teleData.map(apt => ({
                            ...apt,
                            patient: patients?.find(p => p.id === apt.user_id) || null
                        }));
                        setTelemedSchedule(mapped);
                    } else {
                        setTelemedSchedule(teleData);
                    }
                } else if (!teleErr) {
                    setTelemedSchedule([]);
                }
            } else {
                setTelemedSchedule([]);
            }
        } catch (e) {
            console.error('Error fetching triage setup:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrescriptions = async (facilityId: string) => {
        try {
            setLoadingPrescriptions(true);
            const { data, error } = await (supabase as any)
                .from('prescription_history')
                .select(`
                    *,
                    patient:profiles!prescription_history_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                    doctor:profiles!prescription_history_doctor_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setPrescriptions(data || []);
        } catch (e) {
            console.error('Error fetching prescriptions:', e);
        } finally {
            setLoadingPrescriptions(false);
        }
    };

    const fetchTelemedSchedule = async (facilityId: string) => {
        try {
            setLoadingTelemed(true);
            const { data: docData } = await (supabase as any)
                .from('facility_staff')
                .select('profile_id')
                .eq('facility_id', facilityId)
                .eq('role', 'doctor')
                .eq('status', 'active');

            const doctorIds = (docData || []).map((d: any) => d.profile_id);
            if (doctorIds.length === 0) {
                setTelemedSchedule([]);
                return;
            }

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patient:profiles!appointments_user_id_fkey(id, full_name, med_id, email, phone),
                    doctor:profiles!appointments_doctor_id_fkey(id, full_name)
                `)
                .in('doctor_id', doctorIds)
                .eq('status', 'SCHEDULED')
                .order('date', { ascending: true });

            if (error) throw error;
            setTelemedSchedule(data || []);
        } catch (e) {
            console.error('Error fetching telemed schedule:', e);
        } finally {
            setLoadingTelemed(false);
        }
    };

    const handleGlobalPatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!globalSearchQuery.trim()) return;

        setSearchingGlobalPatient(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, med_id, blood_group, date_of_birth')
                .eq('role', 'patient')
                .or(`med_id.ilike.%${globalSearchQuery}%,email.ilike.%${globalSearchQuery}%,full_name.ilike.%${globalSearchQuery}%`)
                .limit(20);

            if (error) throw error;
            setGlobalSearchResults(data || []);
        } catch (err: any) {
            console.error('Global patient search error:', err);
            alert(`Failed to search: ${err.message}`);
        } finally {
            setSearchingGlobalPatient(false);
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

    const loadTriageHistory = async (facilityId: string) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data, error } = await (supabase as any)
                .from('triage_records')
                .select(`
                    *,
                    patient:profiles!triage_records_patient_id_fkey(id, full_name, med_id)
                `)
                .eq('facility_id', facilityId)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            const records = data || [];

            // Cross-check which patients currently have an active ward admission
            if (records.length > 0) {
                const patientIds = records.map((r: any) => r.patient_id);
                const { data: admissions } = await (supabase as any)
                    .from('ward_admissions')
                    .select('patient_id, bed_id, beds(bed_number, wards(name))')
                    .eq('facility_id', facilityId)
                    .eq('status', 'admitted')
                    .in('patient_id', patientIds);

                const admissionMap: Record<string, any> = {};
                (admissions || []).forEach((a: any) => {
                    admissionMap[a.patient_id] = a;
                });

                setTriageHistory(records.map((r: any) => ({
                    ...r,
                    admission: admissionMap[r.patient_id] || null
                })));
            } else {
                setTriageHistory([]);
            }
        } catch (e) {
            console.error('Error loading triage history:', e);
        }
    };

    const handlePatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientSearch.trim()) return;

        setSearchingPatient(true);
        setSelectedPatient(null);
        try {
            // Find patients by MED-ID, email, or name
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, med_id, blood_group, date_of_birth')
                .eq('role', 'patient')
                .or(`med_id.ilike.%${patientSearch}%,email.ilike.%${patientSearch}%,full_name.ilike.%${patientSearch}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err: any) {
            console.error('Patient search error:', err);
            alert(`Failed to search: ${err.message}`);
        } finally {
            setSearchingPatient(false);
        }
    };

    const handleSaveTriage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !staffInfo) return;
        if (!complaint.trim()) {
            alert('Please enter a chief complaint.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Log Triage Entry
            const { error: triageErr } = await (supabase as any)
                .from('triage_records')
                .insert({
                    facility_id: staffInfo.facility_id,
                    patient_id: selectedPatient.id,
                    recorded_by: user?.id,
                    temperature: temp ? parseFloat(temp) : null,
                    blood_pressure: bp || null,
                    pulse_rate: pulse ? parseInt(pulse) : null,
                    respiration_rate: resp ? parseInt(resp) : null,
                    weight: weight ? parseFloat(weight) : null,
                    spo2: spo2 ? parseInt(spo2) : null,
                    chief_complaint: complaint,
                    triage_color: triageColor,
                    status: 'waiting'
                });

            if (triageErr) throw triageErr;

            // 2. Create Internal Queue Referral
            if (targetDeptId) {
                const { error: refErr } = await (supabase as any)
                    .from('internal_referrals')
                    .insert({
                        facility_id: staffInfo.facility_id,
                        patient_id: selectedPatient.id,
                        referred_by: user?.id,
                        target_department_id: targetDeptId,
                        target_doctor_id: targetDoctorId || null,
                        clinical_notes: `Triage Complaint: ${complaint} | Priority: ${triageColor}`,
                        status: 'pending'
                    });
                if (refErr) throw refErr;
            }

            // 3. Send real-time notification/page to doctors in target department
            await (supabase as any)
                .from('user_notifications')
                .insert({
                    user_id: null, // public/shared alert
                    title: `🚨 Priority Triage: ${triageColor} Queue`,
                    message: `Patient ${selectedPatient.full_name} has been triaged with priority ${triageColor} and routed to your department.`,
                    action_url: `/saas/dashboard/queue`
                });

            alert('Triage details saved. Patient successfully routed to queue!');
            
            // Reset form
            setSelectedPatient(null);
            setSearchResults([]);
            setPatientSearch('');
            setTemp('');
            setBp('');
            setPulse('');
            setResp('');
            setWeight('');
            setSpo2('');
            setComplaint('');
            setTriageColor('GREEN');
            setTargetDoctorId('');

            // Refresh triage history
            if (staffInfo?.facility_id) {
                loadTriageHistory(staffInfo.facility_id);
            }
        } catch (err: any) {
            console.error('Save triage error:', err);
            alert(`Failed to save triage details: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName.trim() || !user?.id) return;

        setRegistering(true);
        try {
            const res = await registerPatient(user.id, {
                full_name: regName,
                email: regEmail || undefined,
                phone: regPhone || undefined,
                gender: regGender || undefined,
                date_of_birth: regDob || undefined,
                blood_group: regBloodGroup || undefined,
                // Emergency contact
                emergency_contact_name: regEmergencyName || undefined,
                emergency_contact_phone: regEmergencyPhone || undefined,
                emergency_contact_relationship: regEmergencyRelationship || undefined,
                // Medical history
                allergies: regAllergies || undefined,
                chronic_conditions: regChronicConditions || undefined,
                current_medications: regCurrentMedications || undefined
            });

            if (!res.success) {
                throw new Error(res.error || 'Failed to register patient');
            }

            alert('Patient registered successfully!');
            setSelectedPatient(res.patient);
            setShowRegisterModal(false);
            
            // Clear all registration form fields
            setRegName('');
            setRegEmail('');
            setRegPhone('');
            setRegDob('');
            setRegBloodGroup('');
            setRegEmergencyName('');
            setRegEmergencyPhone('');
            setRegEmergencyRelationship('');
            setRegAllergies('');
            setRegChronicConditions('');
            setRegCurrentMedications('');
        } catch (err: any) {
            console.error('Registration error:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setRegistering(false);
        }
    };

    // --- Bed Assignment Methods ---
    const loadVacantBedsForWard = async (wardId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('beds')
                .select('*')
                .eq('ward_id', wardId)
                .eq('status', 'vacant')
                .order('bed_number', { ascending: true });

            if (error) throw error;
            setAssignBeds(data || []);
            if (data && data.length > 0) {
                setSelectedAssignBedId(data[0].id);
            } else {
                setSelectedAssignBedId('');
            }
        } catch (err) {
            console.error('Error loading vacant beds:', err);
        }
    };

    const handleAssignWardChange = async (wardId: string) => {
        setSelectedAssignWardId(wardId);
        await loadVacantBedsForWard(wardId);
    };

    const openAssignBedModal = async (patient: any) => {
        setAssignBedPatient(patient);
        setAssignDiagnosis('');
        setSelectedAssignBedId('');
        
        try {
            const { data: wardData, error: wardErr } = await (supabase as any)
                .from('wards')
                .select('*')
                .eq('facility_id', staffInfo.facility_id)
                .order('name', { ascending: true });

            if (wardErr) throw wardErr;
            setAssignBedWards(wardData || []);
            
            if (wardData && wardData.length > 0) {
                const firstWardId = wardData[0].id;
                setSelectedAssignWardId(firstWardId);
                await loadVacantBedsForWard(firstWardId);
            } else {
                setSelectedAssignWardId('');
                setAssignBeds([]);
            }

            if (facilityDoctors && facilityDoctors.length > 0) {
                setAssignAdmittingDocId(facilityDoctors[0].profile_id);
            } else {
                setAssignAdmittingDocId('');
            }

            setShowAssignBedModal(true);
        } catch (err) {
            console.error('Error opening bed assign modal:', err);
            alert('Failed to load wards for bed assignment.');
        }
    };

    const handleConfirmAssignBed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignBedPatient || !selectedAssignBedId || !staffInfo) return;

        setAssigningBed(true);
        try {
            const { error } = await (supabase as any)
                .from('ward_admissions')
                .insert({
                    facility_id: staffInfo.facility_id,
                    patient_id: assignBedPatient.id,
                    bed_id: selectedAssignBedId,
                    admitting_doctor_id: assignAdmittingDocId || null,
                    assigned_nurse_id: user?.id,
                    diagnosis: assignDiagnosis,
                    status: 'admitted'
                });

            if (error) throw error;

            alert(`Patient ${assignBedPatient.full_name} successfully admitted to bed!`);
            setShowAssignBedModal(false);
            setAssignBedPatient(null);
            setAssignDiagnosis('');
            
            loadTriageHistory(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Bed assignment error:', err);
            alert(`Failed to assign bed: ${err.message}`);
        } finally {
            setAssigningBed(false);
        }
    };

    // --- Daily Vitals Update Methods ---
    const openUpdateVitalsModal = (record: any) => {
        setVitalsUpdatePatient(record.patient);
        setVitalsUpdateRecord(record);
        setUpdateTemp(record.temperature ? record.temperature.toString() : '');
        setUpdateBp(record.blood_pressure || '');
        setUpdatePulse(record.pulse_rate ? record.pulse_rate.toString() : '');
        setUpdateResp(record.respiration_rate ? record.respiration_rate.toString() : '');
        setUpdateWeight(record.weight ? record.weight.toString() : '');
        setUpdateSpo2(record.spo2 ? record.spo2.toString() : '');
        setUpdateNotes(record.chief_complaint || '');
        
        setShowUpdateVitalsModal(true);
    };

    const handleConfirmUpdateVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vitalsUpdateRecord || !staffInfo) return;

        setUpdatingVitals(true);
        try {
            // 1. Update the triage record in triage_records
            const { error: triageErr } = await (supabase as any)
                .from('triage_records')
                .update({
                    temperature: updateTemp ? parseFloat(updateTemp) : null,
                    blood_pressure: updateBp || null,
                    pulse_rate: updatePulse ? parseInt(updatePulse) : null,
                    respiration_rate: updateResp ? parseInt(updateResp) : null,
                    weight: updateWeight ? parseFloat(updateWeight) : null,
                    spo2: updateSpo2 ? parseInt(updateSpo2) : null,
                    chief_complaint: updateNotes
                })
                .eq('id', vitalsUpdateRecord.id);

            if (triageErr) throw triageErr;

            // 2. If the patient is admitted (has an admission record), also write to ward_clinical_logs
            if (vitalsUpdateRecord.admission) {
                const { error: logErr } = await (supabase as any)
                    .from('ward_clinical_logs')
                    .insert({
                        admission_id: vitalsUpdateRecord.admission.id,
                        recorded_by: user?.id,
                        temperature: updateTemp ? parseFloat(updateTemp) : null,
                        blood_pressure: updateBp || null,
                        pulse_rate: updatePulse ? parseInt(updatePulse) : null,
                        clinical_notes: `Daily Nurse Vitals Update: ${updateNotes}`
                    });

                if (logErr) throw logErr;
            }

            alert('Vitals updated successfully!');
            setShowUpdateVitalsModal(false);
            setVitalsUpdatePatient(null);
            setVitalsUpdateRecord(null);
            
            loadTriageHistory(staffInfo.facility_id);
        } catch (err: any) {
            console.error('Update vitals error:', err);
            alert(`Failed to update vitals: ${err.message}`);
        } finally {
            setUpdatingVitals(false);
        }
    };

    // --- Telemedicine Booking Methods ---
    const openTelemedSelectDoc = (patient: any) => {
        setTelemedPatient(patient);
        if (facilityDoctors && facilityDoctors.length > 0) {
            setSelectedTelemedDoctorId(facilityDoctors[0].profile_id);
        } else {
            setSelectedTelemedDoctorId('');
        }
        setShowSelectDocForTelemedModal(true);
    };

    const handleConfirmTelemedDocSelection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTelemedDoctorId) {
            alert('Please select a doctor to conduct the virtual consultation.');
            return;
        }
        setShowSelectDocForTelemedModal(false);
        setShowTelemedEscalateModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing triage portal...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profile?.role === 'partner';
    const isAuthorized = staffInfo && (['nurse', 'ward_manager'].includes(userRole) || isPartner);

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
                                ? "You must be registered as active hospital staff in the database to access this triage check-in system." 
                                : `Your role (${userRole?.replace('_', ' ')}) does not have permission to access the Nurse Triage dashboard.`}
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

    // Triage log helpers — computed before return
    const triageColorMap: Record<string, string> = {
        RED: 'bg-rose-50 border-rose-200 text-rose-700',
        ORANGE: 'bg-orange-50 border-orange-200 text-orange-700',
        YELLOW: 'bg-amber-50 border-amber-200 text-amber-700',
        GREEN: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        BLUE: 'bg-slate-50 border-slate-200 text-slate-600',
    };
    const triageTimeAgo = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
    };
    const waitingPatients = triageHistory.filter((r: any) => !r.admission);
    const admittedPatients = triageHistory.filter((r: any) => !!r.admission);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
                            <h1 className="text-2xl font-extrabold text-slate-900">Nurse Triage & Intake</h1>
                            <p className="text-xs text-slate-500">Search for registered patients, record initial clinical vitals, and assign care queues.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <Button 
                            onClick={handleLogout}
                            variant="outline" 
                            size="sm"
                            className="rounded-xl flex items-center gap-1.5 text-xs font-bold border-gray-200 text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all px-4"
                        >
                            <LogOut size={14} />
                            <span>Log Out</span>
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white p-1 rounded-2xl border border-gray-150 shadow-sm mb-8 w-fit gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setActiveDashboardTab('INTAKE')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeDashboardTab === 'INTAKE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Activity size={14} /> Intake & Vitals
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveDashboardTab('TELEMEDICINE')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeDashboardTab === 'TELEMEDICINE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Video size={14} /> Telemedicine Schedule
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveDashboardTab('PRESCRIPTIONS')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeDashboardTab === 'PRESCRIPTIONS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Pill size={14} /> Doctors' Prescriptions
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveDashboardTab('LOOKUP')}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeDashboardTab === 'LOOKUP' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <Search size={14} /> Patient EMR Lookup
                    </button>
                </div>

                {/* Tab content: INTAKE */}
                {activeDashboardTab === 'INTAKE' && (
                    <div className="animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Patient search left column */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 text-sm">Patient Search</h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegName('');
                                                setRegEmail('');
                                                setRegPhone('');
                                                setRegGender('male');
                                                setRegDob('');
                                                setRegBloodGroup('');
                                                setShowRegisterModal(true);
                                            }}
                                            className="text-[10px] text-emerald-600 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                                        >
                                            <Plus size={12} /> Register Patient
                                        </button>
                                    </div>
                                    
                                    <form onSubmit={handlePatientSearch} className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Enter Name, Email, or MED-ID"
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 bg-gray-50/30 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </form>

                                    {searchingPatient && (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="animate-spin text-emerald-600" size={20} />
                                        </div>
                                    )}

                                    {searchResults.length > 0 && !selectedPatient && (
                                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                            {searchResults.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setSelectedPatient(p)}
                                                    className="w-full p-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-xs">{p.full_name}</div>
                                                        <div className="text-[9px] text-slate-400 font-semibold">{p.med_id || 'No ID'}</div>
                                                    </div>
                                                    <Plus size={14} className="text-emerald-600" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchResults.length === 0 && patientSearch && !searchingPatient && (
                                        <div className="text-center py-4 space-y-3">
                                            <p className="text-[10px] text-slate-400">No patients found matching "{patientSearch}".</p>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setRegName(patientSearch);
                                                    setRegEmail('');
                                                    setRegPhone('');
                                                    setRegGender('male');
                                                    setRegDob('');
                                                    setRegBloodGroup('');
                                                    setShowRegisterModal(true);
                                                }}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2 shadow-sm flex items-center justify-center gap-1.5"
                                            >
                                                <Plus size={14} /> Register "{patientSearch}"
                                            </Button>
                                        </div>
                                    )}

                                    {selectedPatient && (
                                        <div className="bg-emerald-50/45 p-4 rounded-xl border border-emerald-100/60 space-y-2 text-xs">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-extrabold text-slate-800 text-sm">{selectedPatient.full_name}</div>
                                                    <p className="text-[9px] text-slate-400 font-semibold">MED-ID: {selectedPatient.med_id}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSelectedPatient(null)}
                                                        className="text-[10px] text-rose-500 font-bold hover:underline"
                                                    >
                                                        Change
                                                    </button>
                                                    <Link href={`/dashboard/staff/emr/${selectedPatient.id}`}>
                                                        <button type="button" className="text-[9px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                                                            <FileText size={10} /> EMR History
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-emerald-100/40">
                                                <p>🩸 Blood Group: <strong>{selectedPatient.blood_group || 'N/A'}</strong></p>
                                                <p>📞 Phone: <strong>{selectedPatient.phone || 'N/A'}</strong></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vitals Form details */}
                            <div className="md:col-span-2">
                                <form onSubmit={handleSaveTriage} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <Heart className="text-emerald-600" size={18} /> Vital Signs & Triage Queue
                                    </h3>

                                    {!selectedPatient ? (
                                        <div className="text-center py-12 text-slate-400 font-medium text-xs">
                                            Please search and select a patient to unlock vitals check-in.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Grid of vitals */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Thermometer size={12} /> Temp (°C)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="e.g. 36.8"
                                                        value={temp}
                                                        onChange={(e) => setTemp(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Heart size={12} /> Blood Pressure
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 120/80"
                                                        value={bp}
                                                        onChange={(e) => setBp(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Heart size={12} /> Pulse Rate (BPM)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 72"
                                                        value={pulse}
                                                        onChange={(e) => setPulse(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <TrendingUp size={12} /> Respiration (BPM)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 18"
                                                        value={resp}
                                                        onChange={(e) => setResp(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <User size={12} /> Weight (kg)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="e.g. 70"
                                                        value={weight}
                                                        onChange={(e) => setWeight(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Activity size={12} /> SpO2 (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 98"
                                                        value={spo2}
                                                        onChange={(e) => setSpo2(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                            </div>

                                            {/* Chief Complaint */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chief Complaint / Symptoms</label>
                                                <textarea
                                                    placeholder="Enter symptoms or patient reasons for clinical check-in..."
                                                    value={complaint}
                                                    onChange={(e) => setComplaint(e.target.value)}
                                                    rows={3}
                                                    required
                                                    className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                ></textarea>
                                            </div>

                                            {/* Queue Settings (Triage priority / Dept / Doctor) */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Triage Severity Code</label>
                                                    <select
                                                        value={triageColor}
                                                        onChange={(e) => setTriageColor(e.target.value as any)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer font-bold"
                                                    >
                                                        <option value="RED" className="text-rose-600 font-bold">🔴 RED - Resuscitation (Emergency)</option>
                                                        <option value="ORANGE" className="text-orange-550 font-bold">🟠 ORANGE - Emergent</option>
                                                        <option value="YELLOW" className="text-amber-500 font-bold">🟡 YELLOW - Urgent</option>
                                                        <option value="GREEN" className="text-emerald-600 font-bold">🟢 GREEN - Standard Consultation</option>
                                                        <option value="BLUE" className="text-slate-500 font-bold">🔵 BLUE - Non-Urgent Care</option>
                                                    </select>
                                                </div>
 
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Route to Department</label>
                                                    <select
                                                        value={targetDeptId}
                                                        onChange={(e) => setTargetDeptId(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                                                    >
                                                        {departments.length === 0 ? (
                                                            <option value="">No departments available</option>
                                                        ) : (
                                                            departments.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign to Doctor (Optional)</label>
                                                    <select
                                                        value={targetDoctorId}
                                                        onChange={(e) => setTargetDoctorId(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer text-slate-800 font-medium"
                                                    >
                                                        <option value="">-- General Queue (No Doctor) --</option>
                                                        {facilityDoctors.map(d => (
                                                            <option key={d.profile_id} value={d.profile_id}>
                                                                Dr. {d.profiles?.full_name || 'Practitioner'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <Button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="animate-spin" size={14} /> Saving vitals...</>
                                                ) : (
                                                    <><CheckCircle size={14} /> Save Triage & Route Patient</>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </form>
                            </div>
                        </div>

                        {/* Today's Triage History */}
                        <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <Activity className="text-emerald-600" size={16} /> Today's Triage Log
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => staffInfo?.facility_id && loadTriageHistory(staffInfo.facility_id)}
                                    className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                                >
                                    Refresh
                                </button>
                            </div>

                            {triageHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Activity className="mx-auto mb-2 opacity-30" size={32} />
                                    <p className="text-xs font-semibold">No patients have been triaged today yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Waiting / In Queue */}
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                                            Waiting / In Queue ({waitingPatients.length})
                                        </p>
                                        {waitingPatients.length === 0 ? (
                                            <p className="text-[11px] text-slate-400 italic pl-1">All triaged patients have been admitted.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {waitingPatients.map((record: any) => (
                                                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white transition-colors">
                                                        <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${triageColorMap[record.triage_color] || triageColorMap.GREEN}`}>
                                                            {record.triage_color}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                                {record.patient?.full_name || 'Unknown Patient'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                                MED-ID: {record.patient?.med_id || '--'} • {record.chief_complaint || 'No complaint noted'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[10px] text-slate-400 font-semibold">{triageTimeAgo(record.created_at)}</span>
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                                record.status === 'waiting' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                record.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            } uppercase`}>
                                                                {record.status?.replace('_', ' ') || 'waiting'}
                                                            </span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Link href={`/dashboard/staff/emr/${record.patient_id}`}>
                                                                    <button type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition-colors flex items-center gap-0.5">
                                                                        <FileText size={10} /> EMR
                                                                    </button>
                                                                </Link>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => openAssignBedModal(record.patient)}
                                                                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Assign Bed
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => openUpdateVitalsModal(record)}
                                                                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Update Vitals
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => openTelemedSelectDoc(record.patient)}
                                                                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Virtual Consult
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
 
                                    {/* Admitted to Ward */}
                                    {admittedPatients.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                                Admitted to Ward ({admittedPatients.length})
                                            </p>
                                            <div className="space-y-2">
                                                {admittedPatients.map((record: any) => (
                                                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 transition-colors">
                                                        <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${triageColorMap[record.triage_color] || triageColorMap.GREEN}`}>
                                                            {record.triage_color}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                                {record.patient?.full_name || 'Unknown Patient'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                                MED-ID: {record.patient?.med_id || '--'} • {record.chief_complaint || 'No complaint noted'}
                                                                {record.admission?.beds?.bed_number && (
                                                                    <span className="ml-2 text-blue-600 font-bold">
                                                                        📋 {record.admission.beds.wards?.name} — {record.admission.beds.bed_number}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[10px] text-slate-400 font-semibold">{triageTimeAgo(record.created_at)}</span>
                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 uppercase">
                                                                Admitted
                                                            </span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Link href={`/dashboard/staff/emr/${record.patient_id}`}>
                                                                    <button type="button" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition-colors flex items-center gap-0.5">
                                                                        <FileText size={10} /> EMR
                                                                    </button>
                                                                </Link>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => openUpdateVitalsModal(record)}
                                                                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Update Vitals
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => openTelemedSelectDoc(record.patient)}
                                                                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Virtual Consult
                                                                </button>
                                                                <Link href="/saas/dashboard/wards">
                                                                    <button type="button" className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold transition-colors flex items-center gap-0.5">
                                                                        View Ward →
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab content: TELEMEDICINE */}
                {activeDashboardTab === 'TELEMEDICINE' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pl-1">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Video className="text-emerald-600" size={18} /> Scheduled Telemedicine Consultations
                            </h2>
                            <button
                                type="button"
                                onClick={() => staffInfo?.facility_id && fetchTelemedSchedule(staffInfo.facility_id)}
                                className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                            >
                                Refresh
                            </button>
                        </div>

                        {loadingTelemed ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-emerald-600" size={24} />
                            </div>
                        ) : telemedSchedule.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm text-slate-400">
                                <Video className="mx-auto mb-3 opacity-30" size={40} />
                                <p className="text-xs font-semibold">No scheduled virtual consultations found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {telemedSchedule.map(apt => {
                                    const aptDate = apt.date ? new Date(apt.date) : null;
                                    const dateStr = aptDate ? aptDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                                    const timeStr = aptDate ? aptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                                    
                                    return (
                                        <div key={apt.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-200">
                                                        {apt.type?.toUpperCase()} CONSULT
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                        <Clock size={12} /> {dateStr} at {timeStr}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-800">Patient: {apt.patient?.full_name || 'Unknown Patient'}</h3>
                                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                                        MED-ID: <strong className="text-slate-800">{apt.patient?.med_id || 'N/A'}</strong> 
                                                        {apt.patient?.email ? ` • Email: ${apt.patient.email}` : ''}
                                                        {apt.patient?.phone ? ` • Phone: ${apt.patient.phone}` : ''}
                                                    </p>
                                                    {apt.symptoms && (
                                                        <p className="text-[11px] text-slate-500 italic mt-1">"Notes/Instructions: {apt.symptoms}"</p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Consulting Doctor: Dr. {apt.doctor?.full_name || 'Practitioner'}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                <Link href={`/dashboard/staff/emr/${apt.user_id}`}>
                                                    <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white text-xs rounded-xl flex items-center gap-1.5 font-bold">
                                                        <FileText size={12} /> View EMR
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/telemedicine/session/${apt.id}`}>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center gap-1.5 font-bold">
                                                        <Video size={12} /> Join Session
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content: PRESCRIPTIONS */}
                {activeDashboardTab === 'PRESCRIPTIONS' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pl-1">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Pill className="text-emerald-600" size={18} /> Doctors' Prescription Log
                            </h2>
                            <button
                                type="button"
                                onClick={() => staffInfo?.facility_id && fetchPrescriptions(staffInfo.facility_id)}
                                className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                            >
                                Refresh
                            </button>
                        </div>

                        {loadingPrescriptions ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-emerald-600" size={24} />
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm text-slate-400">
                                <Pill className="mx-auto mb-3 opacity-30" size={40} />
                                <p className="text-xs font-semibold">No prescriptions found in the system.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map(rx => (
                                    <div key={rx.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                                    rx.pharmacy_fulfillment_status === 'pending'
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                                }`}>
                                                    {rx.pharmacy_fulfillment_status === 'pending' ? 'PENDING DISPENSING' : 'FULFILLED'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(rx.created_at).toLocaleDateString()} at {new Date(rx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">Prescribing Doctor: Dr. {rx.doctor?.full_name || 'Practitioner'}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <Link href={`/dashboard/staff/emr/${rx.patient_id}`}>
                                                <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white text-xs rounded-xl flex items-center gap-1.5 font-bold">
                                                    <FileText size={12} /> View Patient EMR
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab content: LOOKUP */}
                {activeDashboardTab === 'LOOKUP' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Search className="text-emerald-600" size={18} /> Global Patient Lookup
                            </h2>
                            <form onSubmit={handleGlobalPatientSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={globalSearchQuery}
                                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                        placeholder="Search patients by name, email, or MED-ID..."
                                        className="w-full text-xs border border-gray-250 rounded-xl py-3 pl-10 pr-4 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <Button type="submit" disabled={searchingGlobalPatient} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6">
                                    {searchingGlobalPatient ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                                </Button>
                            </form>
                        </div>

                        {globalSearchResults.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Search Results ({globalSearchResults.length})</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {globalSearchResults.map(patient => (
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
                                                    <FileText size={12} /> View EMR & Progress
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : globalSearchQuery && !searchingGlobalPatient ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                                <User className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-700 font-bold text-sm">No patients found</p>
                                <p className="text-slate-400 text-xs mt-1">Try another search query.</p>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm text-slate-400">
                                <Search className="mx-auto mb-3 opacity-30" size={40} />
                                <p className="text-xs font-semibold">Enter name or MED-ID to locate patient charts.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Patient Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Register New Patient</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Complete intake form — emergency contact & medical history will appear in the patient EMR</p>
                            </div>
                            <button type="button" onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleRegisterPatient} className="space-y-5">

                            {/* ── Section 1: Basic Info ── */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={11} /> Patient Information
                                </p>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Seyi Makinde" 
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Optional)</label>
                                        <input 
                                            type="email" 
                                            placeholder="e.g. patient@example.com" 
                                            value={regEmail}
                                            onChange={(e) => setRegEmail(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone (Optional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. +234..." 
                                            value={regPhone}
                                            onChange={(e) => setRegPhone(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                                        <select 
                                            value={regGender}
                                            onChange={(e) => setRegGender(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            value={regDob}
                                            onChange={(e) => setRegDob(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</label>
                                        <select 
                                            value={regBloodGroup}
                                            onChange={(e) => setRegBloodGroup(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 2: Emergency Contact ── */}
                            <div className="space-y-3 pt-2 border-t border-dashed border-gray-100">
                                <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                    🚨 Emergency Contact
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1 sm:col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Mrs. Adeola Makinde" 
                                            value={regEmergencyName}
                                            onChange={(e) => setRegEmergencyName(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. +234 801 234 5678" 
                                            value={regEmergencyPhone}
                                            onChange={(e) => setRegEmergencyPhone(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship</label>
                                        <select
                                            value={regEmergencyRelationship}
                                            onChange={(e) => setRegEmergencyRelationship(e.target.value)}
                                            className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                                        >
                                            <option value="">Select</option>
                                            <option value="spouse">Spouse</option>
                                            <option value="parent">Parent</option>
                                            <option value="sibling">Sibling</option>
                                            <option value="child">Child</option>
                                            <option value="guardian">Guardian</option>
                                            <option value="friend">Friend</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 3: Medical History ── */}
                            <div className="space-y-3 pt-2 border-t border-dashed border-gray-100">
                                <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                                    🩺 Medical History
                                </p>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Known Allergies <span className="text-slate-300">(comma-separated)</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Penicillin, Pollen, Latex" 
                                        value={regAllergies}
                                        onChange={(e) => setRegAllergies(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chronic Conditions <span className="text-slate-300">(comma-separated)</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma" 
                                        value={regChronicConditions}
                                        onChange={(e) => setRegChronicConditions(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Medications</label>
                                    <textarea 
                                        rows={2}
                                        placeholder="e.g. Amlodipine 5mg OD, Metformin 500mg BD" 
                                        value={regCurrentMedications}
                                        onChange={(e) => setRegCurrentMedications(e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                            </div>

                            <div className="pt-1">
                                <Button 
                                    type="submit" 
                                    disabled={registering} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs shadow-md shadow-emerald-600/10"
                                >
                                    {registering ? 'Registering Patient...' : 'Register & Select Patient'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inline Bed Assignment Modal */}
            {showAssignBedModal && assignBedPatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Assign Inpatient Bed</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Patient: {assignBedPatient.full_name}</p>
                            </div>
                            <button type="button" onClick={() => setShowAssignBedModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmAssignBed} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Ward</label>
                                <select
                                    value={selectedAssignWardId}
                                    onChange={(e) => handleAssignWardChange(e.target.value)}
                                    className="w-full border border-gray-250 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                >
                                    {assignBedWards.map(w => (
                                        <option key={w.id} value={w.id}>
                                            🏢 {w.name} ({w.capacity} Beds)
                                        </option>
                                    ))}
                                    {assignBedWards.length === 0 && (
                                        <option value="">No wards set up at this facility</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Bed</label>
                                <select
                                    value={selectedAssignBedId}
                                    onChange={(e) => setSelectedAssignBedId(e.target.value)}
                                    required
                                    className="w-full border border-gray-250 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                >
                                    {assignBeds.map(b => (
                                        <option key={b.id} value={b.id}>
                                            🛌 {b.bed_number} (Vacant)
                                        </option>
                                    ))}
                                    {assignBeds.length === 0 && (
                                        <option value="">No vacant beds in this ward</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admitting Doctor (Optional)</label>
                                <select
                                    value={assignAdmittingDocId}
                                    onChange={(e) => setAssignAdmittingDocId(e.target.value)}
                                    className="w-full border border-gray-250 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                                >
                                    <option value="">-- No Doctor Assigned --</option>
                                    {facilityDoctors.map(d => (
                                        <option key={d.profile_id} value={d.profile_id}>
                                            Dr. {d.profiles?.full_name || 'Practitioner'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initial Diagnosis / Clinical Notes</label>
                                <textarea
                                    rows={3}
                                    value={assignDiagnosis}
                                    onChange={(e) => setAssignDiagnosis(e.target.value)}
                                    placeholder="Enter reason for admission, admitting symptoms or patient history..."
                                    className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowAssignBedModal(false)}
                                    variant="outline"
                                    className="flex-1 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={assigningBed || !selectedAssignBedId}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1.5"
                                >
                                    {assigningBed ? (
                                        <><Loader2 className="animate-spin" size={14} /> Admitting...</>
                                    ) : (
                                        <>Admit Patient</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Daily Vitals Update Modal */}
            {showUpdateVitalsModal && vitalsUpdatePatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Update Patient Daily Vitals</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Patient: {vitalsUpdatePatient.full_name} {vitalsUpdateRecord?.admission ? '(Inpatient - Ward Admission)' : '(Outpatient)'}
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowUpdateVitalsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmUpdateVitals} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temp (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 36.8"
                                        value={updateTemp}
                                        onChange={(e) => setUpdateTemp(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Pressure</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 120/80"
                                        value={updateBp}
                                        onChange={(e) => setUpdateBp(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pulse Rate (BPM)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 72"
                                        value={updatePulse}
                                        onChange={(e) => setUpdatePulse(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Respiration (BPM)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 18"
                                        value={updateResp}
                                        onChange={(e) => setUpdateResp(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 70"
                                        value={updateWeight}
                                        onChange={(e) => setUpdateWeight(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SpO2 (%)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 98"
                                        value={updateSpo2}
                                        onChange={(e) => setUpdateSpo2(e.target.value)}
                                        className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Clinical Notes / Chief Complaint Update</label>
                                <textarea
                                    rows={3}
                                    value={updateNotes}
                                    onChange={(e) => setUpdateNotes(e.target.value)}
                                    placeholder="Enter current symptoms, state changes, or daily nursing progression notes..."
                                    required
                                    className="w-full border border-gray-250 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowUpdateVitalsModal(false)}
                                    variant="outline"
                                    className="flex-1 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updatingVitals}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1.5"
                                >
                                    {updatingVitals ? (
                                        <><Loader2 className="animate-spin" size={14} /> Saving...</>
                                    ) : (
                                        <>Save Vitals Update</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Step 1: Select Doctor for Virtual Consultation Modal */}
            {showSelectDocForTelemedModal && telemedPatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Book Virtual Consultation</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Patient: {telemedPatient.full_name}</p>
                            </div>
                            <button type="button" onClick={() => setShowSelectDocForTelemedModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmTelemedDocSelection} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conducting Doctor</label>
                                <select
                                    value={selectedTelemedDoctorId}
                                    onChange={(e) => setSelectedTelemedDoctorId(e.target.value)}
                                    required
                                    className="w-full border border-gray-250 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                                >
                                    <option value="">-- Choose Doctor --</option>
                                    {facilityDoctors.map(d => (
                                        <option key={d.profile_id} value={d.profile_id}>
                                            Dr. {d.profiles?.full_name || 'Practitioner'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowSelectDocForTelemedModal(false)}
                                    variant="outline"
                                    className="flex-1 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                                >
                                    Next: Set Channel & Details
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Step 2: Agora Telemedicine Escalation Modal */}
            {showTelemedEscalateModal && telemedPatient && (
                <EscalateTelemedicineModal
                    isOpen={showTelemedEscalateModal}
                    onClose={() => {
                        setShowTelemedEscalateModal(false);
                        setTelemedPatient(null);
                    }}
                    patientId={telemedPatient.id}
                    patientName={telemedPatient.full_name}
                    patientEmail={telemedPatient.email || undefined}
                    doctorId={selectedTelemedDoctorId}
                    doctorName={
                        facilityDoctors.find(d => d.profile_id === selectedTelemedDoctorId)?.profiles?.full_name || 'Practitioner'
                    }
                    onSuccess={() => {
                        setShowTelemedEscalateModal(false);
                        setTelemedPatient(null);
                    }}
                />
            )}
        </div>
    );
}
