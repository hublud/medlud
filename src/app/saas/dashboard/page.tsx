'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Layers,
    Pill,
    Sliders,
    Loader2,
    AlertCircle,
    ShieldCheck,
    ArrowLeft,
    Hospital,
    LogOut,
    Bell,
    Video,
    FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function SaasPortalLandingPage() {
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileRole, setProfileRole] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [pendingCount, setPendingCount] = useState<number>(0);

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login?redirectTo=/saas/dashboard');
                    return;
                }

                // Fetch staff mapping and facility information
                const { data: staffData } = await (supabase as any)
                    .from('facility_staff')
                    .select('*, facility:facilities(*)')
                    .eq('profile_id', user.id)
                    .eq('status', 'active')
                    .maybeSingle();

                if (!staffData) {
                    setStaffInfo(null);
                    return;
                }

                // Check if SaaS subscription is active
                const facility = staffData.facility;
                const isSaasActive = facility?.saas_enabled && 
                    (facility.saas_subscription_status === 'active' && 
                     (!facility.saas_subscription_expires_at || new Date(facility.saas_subscription_expires_at) > new Date()));

                if (!isSaasActive) {
                    setStaffInfo({ ...staffData, expired: true });
                } else {
                    setStaffInfo(staffData);
                }

                // Fetch profile role to check if they are also a partner
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();
                setProfileRole(profileData?.role || null);

                // Fetch pending counts (labs + prescriptions + scans)
                const [prescRes, labRes, scanRes] = await Promise.all([
                    (supabase as any).from('prescription_history').select('id', { count: 'exact', head: true }).eq('pharmacy_fulfillment_status', 'pending'),
                    (supabase as any).from('lab_history').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
                    (supabase as any).from('imaging_history').select('id', { count: 'exact', head: true }).eq('status', 'scheduled')
                ]);
                
                const totalPending = (prescRes.count || 0) + (labRes.count || 0) + (scanRes.count || 0);
                setPendingCount(totalPending);

            } catch (err) {
                console.error('Error verifying staff access:', err);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [router]);



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Opening SaaS portal...</p>
                </div>
            </div>
        );
    }


    if (!staffInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-150 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            You must be registered as active hospital staff in the database to access this SaaS portal.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                            Go to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (staffInfo.expired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl border border-gray-150 shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">License Expired</h2>
                        <p className="text-xs text-slate-500 leading-normal">
                            Your hospital subscription to MEDLUD SaaS has expired. Please contact your administrator to renew.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                            Return to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const userRole = staffInfo?.role;
    const isPartner = profileRole === 'partner';
    const isDoctor = userRole === 'doctor';

    // Doctors/partners should not see nurse/billing/pharmacy tools.
    // They should strictly see: Consult Queue and Clinical Requests & Search.
    const showTriage = !isDoctor && !isPartner && (['nurse', 'ward_manager'].includes(userRole));
    const showQueue = isDoctor || isPartner || (['nurse', 'ward_manager'].includes(userRole));
    const showWards = !isDoctor && !isPartner && (['nurse', 'ward_manager'].includes(userRole));
    const showPharmacy = !isDoctor && !isPartner && (['pharmacist', 'lab_tech'].includes(userRole));
    const showBilling = !isDoctor && !isPartner && (['receptionist', 'billing_specialist'].includes(userRole));
    const showSettings = isPartner;
    const showRequests = isDoctor || isPartner || (['nurse', 'receptionist', 'ward_manager'].includes(userRole));
    const showTelemed = isDoctor || isPartner || (['nurse', 'ward_manager'].includes(userRole));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">{staffInfo.facility?.name}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hospital SaaS Dashboard</h1>
                        <p className="text-gray-500">Manage triage routing, inpatient wards, prescriptions, and local invoicing.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {profileRole === 'partner' && (
                            <Link href="/dashboard/partner">
                                <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 shadow-md shadow-indigo-100 flex items-center gap-1.5"
                                >
                                    <Hospital size={16} /> Referrals Partner Portal
                                </Button>
                            </Link>
                        )}
                        <Button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            variant="outline"
                            className="rounded-xl text-xs font-bold py-2.5 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 flex items-center gap-1.5 transition-colors"
                        >
                            {loggingOut ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <LogOut size={14} />
                            )}
                            {loggingOut ? 'Signing out...' : 'Log Out'}
                        </Button>
                    </div>
                </div>

                {/* SaaS Modules Grid */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                🏢 Clinical Staff Console
                            </h2>
                            <p className="text-xs text-slate-400">Select a module below to start managing local operations.</p>
                        </div>
                        <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            SaaS Role: {staffInfo.role?.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {showTriage && (
                            <Link href="/saas/dashboard/triage" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Activity size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Nurse Triage</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Check-in patients and log priority vitals.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showQueue && (
                            <Link href="/saas/dashboard/queue" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Users size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Consult Queue</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Manage outpatient queues and trigger visits.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showWards && (
                            <Link href="/saas/dashboard/wards" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Layers size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Wards & Beds</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Monitor occupancy and log clinical rounds.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showPharmacy && (
                            <Link href="/saas/dashboard/pharmacy" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        {userRole === 'lab_tech' ? <FlaskConical size={22} /> : <Pill size={22} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                            {userRole === 'lab_tech' ? 'Labs' : userRole === 'pharmacist' ? 'Pharmacy' : 'Pharmacy & Labs'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {userRole === 'lab_tech' 
                                                ? 'Upload diagnostic findings and manage lab requests.' 
                                                : userRole === 'pharmacist' 
                                                ? 'Dispense prescription drugs to patients.' 
                                                : 'Dispense drugs and upload diagnostic findings.'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showBilling && (
                            <Link href="/saas/dashboard/billing" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Sliders size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Local Invoicing</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Issue bills and record offline cash payments.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showRequests && (
                            <Link href="/saas/dashboard/requests" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer relative">
                                    {pendingCount > 0 && (
                                        <span className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                                            {pendingCount} new
                                        </span>
                                    )}
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Bell size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Clinical Requests & Search</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Lookup EMRs, scan reports, lab & pharmacy requests.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showTelemed && (
                            <Link href="/saas/dashboard/telemedicine" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer relative">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                                        <Video size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Telemedicine Schedule</p>
                                        <p className="text-[10px] text-slate-400 mt-1">View calendar bookings and launch virtual sessions.</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {showSettings && (
                            <Link href="/saas/dashboard/settings" className="group">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-emerald-50/10 hover:border-emerald-250 transition-all flex flex-col items-center text-center gap-3 cursor-pointer">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center border border-slate-200">
                                        <Sliders size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-slate-800 transition-colors">Facility Settings</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Manage staff lists and toggle lab/pharmacy.</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
