'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Activity, 
    User, 
    Heart, 
    Thermometer, 
    Clock, 
    Search,
    Loader2,
    CheckCircle,
    PhoneCall,
    FileText,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function DoctorQueuePage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState<any[]>([]);
    const [myConsultations, setMyConsultations] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('ALL');
    const [departments, setDepartments] = useState<any[]>([]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStaffAndQueue();
        }
    }, [user]);

    const fetchStaffAndQueue = async () => {
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

            // 2. Fetch departments
            const { data: deptData } = await (supabase as any)
                .from('departments')
                .select('*')
                .eq('facility_id', staffData.facility_id);
            setDepartments(deptData || []);

            // 3. Fetch active queue
            await loadQueueData(staffData.facility_id, staffData.role);
        } catch (e) {
            console.error('Error fetching queue details:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadQueueData = async (facilityId: string, role?: string) => {
        if (!user?.id) return;

        const activeRole = role || staffInfo?.role;
        const isDoctor = activeRole === 'doctor' || profile?.role === 'partner';

        // --- Pending queue (all if nurse/ward manager, only doctor's if doctor) ---
        let query = (supabase as any)
            .from('internal_referrals')
            .select(`
                *,
                patient:profiles!internal_referrals_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                department:departments(name)
            `)
            .eq('facility_id', facilityId)
            .eq('status', 'pending');

        if (isDoctor) {
            query = query.eq('target_doctor_id', user.id);
        }

        const { data: referralData, error } = await query;

        if (error) {
            console.error('Queue load error:', error.message || error);
            return;
        }

        // Query triage details for pending patients
        const patientIds = referralData?.map((r: any) => r.patient_id) || [];
        let triageMap: Record<string, any> = {};

        if (patientIds.length > 0) {
            const { data: triageData } = await (supabase as any)
                .from('triage_records')
                .select('*')
                .in('patient_id', patientIds)
                .eq('facility_id', facilityId)
                .order('created_at', { ascending: false });

            (triageData || []).forEach((t: any) => {
                if (!triageMap[t.patient_id]) {
                    triageMap[t.patient_id] = t;
                }
            });
        }

        const combined = (referralData || []).map((ref: any) => ({
            ...ref,
            triage: triageMap[ref.patient_id] || {}
        }));

        const priorityWeights: Record<string, number> = {
            'RED': 1, 'ORANGE': 2, 'YELLOW': 3, 'GREEN': 4, 'BLUE': 5
        };

        combined.sort((a: any, b: any) => {
            const weightA = priorityWeights[a.triage?.triage_color] || 99;
            const weightB = priorityWeights[b.triage?.triage_color] || 99;
            if (weightA !== weightB) return weightA - weightB;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setQueue(combined);

        // --- My Active Consultations (accepted by this doctor today) ---
        if (!user?.id) return;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: myData } = await (supabase as any)
            .from('internal_referrals')
            .select(`
                *,
                patient:profiles!internal_referrals_patient_id_fkey(id, full_name, med_id, date_of_birth, blood_group),
                department:departments(name)
            `)
            .eq('facility_id', facilityId)
            .eq('status', 'completed')
            .eq('target_doctor_id', user.id)
            .gte('updated_at', todayStart.toISOString())
            .order('updated_at', { ascending: false });

        // Enrich with triage data
        const myPatientIds = (myData || []).map((r: any) => r.patient_id);
        let myTriageMap: Record<string, any> = {};
        if (myPatientIds.length > 0) {
            const { data: myTriageData } = await (supabase as any)
                .from('triage_records')
                .select('*')
                .in('patient_id', myPatientIds)
                .eq('facility_id', facilityId)
                .order('created_at', { ascending: false });
            (myTriageData || []).forEach((t: any) => {
                if (!myTriageMap[t.patient_id]) myTriageMap[t.patient_id] = t;
            });
        }

        setMyConsultations((myData || []).map((ref: any) => ({
            ...ref,
            triage: myTriageMap[ref.patient_id] || {}
        })));
    };

    const handleAcceptConsultation = async (refId: string) => {
        try {
            // Update internal referral status to completed
            const { error } = await (supabase as any)
                .from('internal_referrals')
                .update({ 
                    status: 'completed',
                    target_doctor_id: user?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', refId);

            if (error) throw error;
            
            // Refresh queue
            if (staffInfo) {
                loadQueueData(staffInfo.facility_id, staffInfo.role);
            }
        } catch (e: any) {
            console.error('Accept consultation error:', e);
            alert(`Failed to start consultation: ${e.message}`);
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

    // Filter queue list
    const filteredQueue = queue.filter(item => {
        const matchesSearch = item.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.patient?.med_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDept === 'ALL' || item.target_department_id === filterDept;
        return matchesSearch && matchesDept;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Accessing clinic queue...</p>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profile?.role === 'partner';
    const canViewQueue = staffInfo && (['doctor'].includes(userRole) || isPartner);
    const canAcceptConsultation = canViewQueue;

    if (!staffInfo || !canViewQueue) {
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
                                ? "You must be registered as active hospital staff in the database to access this patient queue dashboard." 
                                : `Your role (${userRole?.replace('_', ' ')}) does not have permission to access the Consult Queue.`}
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
                            <h1 className="text-2xl font-extrabold text-slate-900">Outpatient Consultation Queue</h1>
                            <p className="text-xs text-slate-500">Live clinical triage dashboard. Complete vital screenings and initiate consultations.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 self-start md:self-auto">
                        <Button 
                            onClick={() => loadQueueData(staffInfo.facility_id, staffInfo.role)} 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl bg-white text-slate-600 gap-1.5"
                        >
                            <RefreshCw size={14} /> Refresh Queue
                        </Button>
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

                {/* Queue Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Waiting</p>
                        <p className="text-xl font-extrabold text-slate-800 mt-0.5">{queue.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm border-l-4 border-l-rose-500">
                        <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wider">🔴 Red Priorities</p>
                        <p className="text-xl font-extrabold text-rose-600 mt-0.5">{queue.filter(q => q.triage?.triage_color === 'RED').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm border-l-4 border-l-orange-400">
                        <p className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">🟠 Orange Priorities</p>
                        <p className="text-xl font-extrabold text-orange-600 mt-0.5">{queue.filter(q => q.triage?.triage_color === 'ORANGE').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm border-l-4 border-l-amber-400">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">🟡 Yellow Priorities</p>
                        <p className="text-xl font-extrabold text-amber-600 mt-0.5">{queue.filter(q => q.triage?.triage_color === 'YELLOW').length}</p>
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
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="w-full sm:w-48 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* My Active Consultations — patients already accepted by this doctor today */}
                {myConsultations.length > 0 && (
                    <div className="mb-8">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            My Active Consultations Today ({myConsultations.length})
                        </p>
                        <div className="space-y-3">
                            {myConsultations.map(item => {
                                const triage = item.triage || {};
                                const priorityColorClass =
                                    triage.triage_color === 'RED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                    triage.triage_color === 'ORANGE' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    triage.triage_color === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    triage.triage_color === 'GREEN' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                    'bg-slate-100 text-slate-700 border-slate-200';
                                return (
                                    <div key={item.id} className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${priorityColorClass}`}>
                                                    {triage.triage_color || '--'} PRIORITY
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-white border border-slate-100">
                                                    📍 {item.department?.name || 'General Clinic'}
                                                </span>
                                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    ✓ Accepted
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800">{item.patient?.full_name || 'Patient'}</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                MED-ID: {item.patient?.med_id} • Age: {calculateAge(item.patient?.date_of_birth)} • Blood: {item.patient?.blood_group || '--'}
                                            </p>
                                            {triage.chief_complaint && (
                                                <p className="text-[11px] text-slate-500 italic">"{triage.chief_complaint}"</p>
                                            )}
                                        </div>
                                        <Link href={`/dashboard/staff/emr/${item.patient_id}`} className="shrink-0">
                                            <button className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                                                <FileText size={14} /> View Patient EMR
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pending Queue */}
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    Waiting for Consultation ({filteredQueue.length})
                </p>

                {/* Patient Cards */}
                {filteredQueue.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                        <Activity className="mx-auto text-slate-200 mb-3" size={48} />
                        <p className="text-slate-700 font-bold text-sm">Outpatient queue is empty</p>
                        <p className="text-slate-400 text-xs mt-1">No triage referrals are currently pending consultation.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQueue.map(item => {
                            const triage = item.triage || {};
                            const priorityColorClass = 
                                triage.triage_color === 'RED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                triage.triage_color === 'ORANGE' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                triage.triage_color === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                triage.triage_color === 'GREEN' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                'bg-slate-100 text-slate-700 border-slate-200';

                            return (
                                <div key={item.id} className={`bg-white p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                                    triage.triage_color === 'RED' ? 'border-rose-200 bg-rose-50/5' :
                                    triage.triage_color === 'ORANGE' ? 'border-orange-200 bg-orange-50/5' : 'border-gray-150'
                                }`}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1">
                                            {/* Status Row */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded border ${priorityColorClass}`}>
                                                    {triage.triage_color || 'GREEN'} PRIORITY
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                                                    📍 {item.department?.name || 'General Clinic'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> Waiting: {getWaitTimeText(item.created_at)}
                                                </span>
                                            </div>

                                            {/* Patient info */}
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">{item.patient?.full_name || 'Patient'}</h3>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                    MED-ID: {item.patient?.med_id} • Age: {calculateAge(item.patient?.date_of_birth)} • Blood Group: {item.patient?.blood_group || '--'}
                                                </p>
                                            </div>

                                            {/* Vitals screening details */}
                                            {triage.id && (
                                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 text-xs">
                                                    <p className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider">Vital Screening Log</p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-semibold text-slate-650">
                                                        <div>🌡️ Temp: <strong className="text-slate-800">{triage.temperature ? `${triage.temperature}°C` : '--'}</strong></div>
                                                        <div>💓 Pulse: <strong className="text-slate-800">{triage.pulse_rate ? `${triage.pulse_rate} bpm` : '--'}</strong></div>
                                                        <div>🌬️ Resp: <strong className="text-slate-800">{triage.respiration_rate ? `${triage.respiration_rate} bpm` : '--'}</strong></div>
                                                        <div>🩺 BP: <strong className="text-slate-800">{triage.blood_pressure || '--'}</strong></div>
                                                        <div>⚖️ Weight: <strong className="text-slate-800">{triage.weight ? `${triage.weight} kg` : '--'}</strong></div>
                                                        <div>🩸 SpO2: <strong className="text-slate-800">{triage.spo2 ? `${triage.spo2}%` : '--'}</strong></div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 italic border-t border-slate-200/50 pt-1.5 mt-1">
                                                        "Chief Complaint: {triage.chief_complaint}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex md:flex-col gap-2 w-full md:w-44 self-stretch justify-end md:justify-start">
                                            <Link href={`/dashboard/staff/emr/${item.patient_id}`} className="w-full">
                                                <button 
                                                    onClick={() => handleAcceptConsultation(item.id)}
                                                    className="w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <PhoneCall size={14} /> Open EMR Consult
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
