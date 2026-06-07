'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Video, 
    Phone, 
    MessageSquare, 
    Plus, 
    Search, 
    Loader2, 
    User, 
    Clock, 
    Filter, 
    AlertCircle, 
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { EscalateTelemedicineModal } from '@/components/staff/EscalateTelemedicineModal';

export default function TelemedicineCalendarPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [staffInfo, setStaffInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [facilityDoctors, setFacilityDoctors] = useState<any[]>([]);
    
    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterOwnOnly, setFilterOwnOnly] = useState(false);

    // Patient Search and Booking Escalation state
    const [patientSearch, setPatientSearch] = useState('');
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<any | null>(null);
    const [showEscalateModal, setShowEscalateModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    const fetchInitialData = async () => {
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
            
            // Default select current user if they are a doctor
            if (staffData.role === 'doctor') {
                setSelectedDoctorForBooking({
                    id: user?.id,
                    full_name: profile?.full_name || staffData.email
                });
            }

            // 2. Fetch facility doctors
            const { data: docData } = await (supabase as any)
                .from('facility_staff')
                .select('profile_id, profiles(id, full_name, email)')
                .eq('facility_id', staffData.facility_id)
                .eq('role', 'doctor')
                .eq('status', 'active');
            
            setFacilityDoctors(docData || []);

            // 3. Fetch scheduled telemedicine appointments
            await fetchAppointments(staffData.facility_id);

        } catch (err) {
            console.error('Error fetching telemedicine data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async (facilityId: string) => {
        // Query appointments for the current facility.
        // We query all appointments where the doctor is a staff of the facility
        const { data: apts, error: aptsError } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey(full_name, email)
            `)
            .eq('status', 'SCHEDULED')
            .order('date', { ascending: true });

        if (aptsError) {
            console.error('Appointments query error:', aptsError);
            return;
        }

        if (apts && apts.length > 0) {
            const patientIds = apts.map((a: any) => a.user_id).filter(Boolean);
            const { data: patients, error: patientError } = await supabase
                .from('profiles')
                .select('id, full_name, email, med_id')
                .in('id', patientIds);

            if (patientError) {
                console.error('Patients query error:', patientError);
                return;
            }

            const mapped = apts.map(apt => ({
                ...apt,
                patient: patients?.find(p => p.id === apt.user_id) || null
            }));

            setAppointments(mapped);
        } else {
            setAppointments([]);
        }
    };

    const handlePatientSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientSearch.trim()) return;
        setSearchingPatient(true);
        setSearchResults([]);
        try {
            // Find patients
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, med_id')
                .eq('role', 'patient')
                .or(`full_name.ilike.%${patientSearch}%,med_id.eq.${patientSearch}`);
            setSearchResults(data || []);
        } catch (err) {
            console.error('Patient lookup error:', err);
        } finally {
            setSearchingPatient(false);
        }
    };

    // Filter appointments based on selection and filter mode
    const filteredAppointments = appointments.filter(apt => {
        if (filterOwnOnly && apt.doctor_id !== user?.id) {
            return false;
        }
        return true;
    });

    // Calendar Calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Fill in previous month's padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        calendarCells.push({
            date: new Date(year, month - 1, prevMonthDays - i),
            isCurrentMonth: false
        });
    }

    // Fill in current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarCells.push({
            date: new Date(year, month, i),
            isCurrentMonth: true
        });
    }

    // Fill in next month's padding to make multiple of 7 (full grid rows)
    const totalCells = Math.ceil(calendarCells.length / 7) * 7;
    const nextPadding = totalCells - calendarCells.length;
    for (let i = 1; i <= nextPadding; i++) {
        calendarCells.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false
        });
    }

    // Navigate Month
    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Filter appointments belonging to a specific date
    const getAppointmentsForDate = (date: Date) => {
        return filteredAppointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === date.toDateString();
        });
    };

    const appointmentsOnSelectedDay = getAppointmentsForDate(selectedDate);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Opening Telemedicine Schedule...</p>
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
                            You must be registered as facility staff to view this calendar.
                        </p>
                    </div>
                    <Link href="/saas/dashboard">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isDoctor = staffInfo.role === 'doctor';

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back button and title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/saas/dashboard')}
                            className="w-10 h-10 bg-white hover:bg-slate-100 border border-gray-200 text-slate-600 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                                <Video size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Facility Telemedicine Platform</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Telemedicine Scheduler</h1>
                            <p className="text-xs text-slate-500">Coordinate virtual clinics, prevent double bookings, and launch live rooms.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setFilterOwnOnly(!filterOwnOnly)}
                            variant="outline"
                            className={`rounded-xl text-xs font-bold py-2.5 px-4 flex items-center gap-1.5 border-slate-200 transition-colors ${
                                filterOwnOnly ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white hover:bg-slate-50'
                            }`}
                        >
                            <Filter size={14} />
                            {filterOwnOnly ? 'Showing My Bookings' : 'Showing All Bookings'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar grid on the left */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            {/* Calendar Month Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="font-extrabold text-lg text-slate-800">
                                    {currentDate.toLocaleString('default', { month: 'long' })} {year}
                                </h3>
                                <div className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
                                    <button 
                                        onClick={prevMonth}
                                        className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={nextMonth}
                                        className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div>
                                <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-3">
                                    <span>Sun</span>
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                </div>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {calendarCells.map((cell, idx) => {
                                        const dateStr = cell.date.toDateString();
                                        const isSelected = dateStr === selectedDate.toDateString();
                                        const isToday = dateStr === new Date().toDateString();
                                        const apts = getAppointmentsForDate(cell.date);

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedDate(cell.date)}
                                                className={`min-h-[75px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                    cell.isCurrentMonth ? 'bg-slate-50/20' : 'bg-slate-50/10 text-slate-350 opacity-40'
                                                } ${
                                                    isSelected 
                                                        ? 'border-indigo-600 ring-2 ring-indigo-600/10 bg-indigo-50/10' 
                                                        : isToday
                                                        ? 'border-emerald-500 bg-emerald-50/10'
                                                        : 'border-slate-100 hover:border-slate-250 hover:bg-slate-50/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-extrabold ${
                                                        isSelected ? 'text-indigo-700' : isToday ? 'text-emerald-700' : 'text-slate-700'
                                                    }`}>
                                                        {cell.date.getDate()}
                                                    </span>
                                                    {isToday && (
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                    )}
                                                </div>

                                                {/* Appointment Dots/Indicators */}
                                                {apts.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {apts.slice(0, 3).map((apt, aptIdx) => (
                                                            <span 
                                                                key={aptIdx}
                                                                className={`w-2 h-2 rounded-full ${
                                                                    apt.type === 'chat' ? 'bg-emerald-500' :
                                                                    apt.type === 'video' ? 'bg-indigo-500' :
                                                                    'bg-sky-500'
                                                                }`}
                                                                title={apt.title}
                                                            />
                                                        ))}
                                                        {apts.length > 3 && (
                                                            <span className="text-[8px] font-extrabold text-indigo-700 bg-indigo-50 px-1 rounded-sm">
                                                                +{apts.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Patient scheduling escalation lookup panel */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                                <Sparkles size={13} className="text-indigo-600" /> Book New Virtual Session
                            </h3>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Search for a registered patient via Medical ID (MED-ID) or Name to schedule a virtual consult.
                            </p>
                            <form onSubmit={handlePatientSearch} className="flex gap-2 text-xs">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter patient full name or numeric Medical ID..."
                                        value={patientSearch}
                                        onChange={e => setPatientSearch(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-indigo-600 font-semibold"
                                    />
                                </div>
                                <Button type="submit" disabled={searchingPatient} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                                    {searchingPatient ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
                                </Button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden text-xs mt-2 bg-slate-50/20">
                                    {searchResults.map(p => (
                                        <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-800">{p.full_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">MED-ID: {p.med_id} | {p.email || 'No Email'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!isDoctor && (
                                                    <select
                                                        onChange={(e) => {
                                                            const d = facilityDoctors.find(doc => doc.profiles?.id === e.target.value);
                                                            if (d) {
                                                                setSelectedDoctorForBooking({
                                                                    id: d.profiles.id,
                                                                    full_name: d.profiles.full_name
                                                                });
                                                            }
                                                        }}
                                                        className="border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold bg-white"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Select Doctor...</option>
                                                        {facilityDoctors.map(doc => (
                                                            <option key={doc.profile_id} value={doc.profiles?.id}>
                                                                Dr. {doc.profiles?.full_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <Button
                                                    onClick={() => {
                                                        if (isDoctor) {
                                                            setSelectedPatient(p);
                                                            setShowEscalateModal(true);
                                                        } else {
                                                            if (!selectedDoctorForBooking) {
                                                                alert('Please select a doctor to assign this telemedicine consult to first.');
                                                            } else {
                                                                setSelectedPatient(p);
                                                                setShowEscalateModal(true);
                                                            }
                                                        }
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg"
                                                >
                                                    Select & Book
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Day Schedule Panel on the right */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -z-10 animate-pulse"></div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                                <Clock size={13} className="text-indigo-600" /> Bookings on {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </h3>

                            {appointmentsOnSelectedDay.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-[11px] text-slate-400 font-medium">No telemedicine appointments booked for this day.</p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {appointmentsOnSelectedDay.map(apt => {
                                        const aptDate = new Date(apt.date);
                                        const isToday = aptDate.toDateString() === new Date().toDateString();

                                        return (
                                            <div key={apt.id} className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-150/40 space-y-3 shadow-sm">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-xs leading-snug">{apt.title}</h4>
                                                        <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">
                                                            {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({apt.duration})
                                                        </p>
                                                    </div>
                                                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                        apt.type === 'chat' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                        apt.type === 'video' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                                        'bg-sky-100 text-sky-800 border border-sky-200'
                                                    }`}>
                                                        {apt.type}
                                                    </span>
                                                </div>

                                                <div className="text-[10px] space-y-1 text-slate-600 border-t border-indigo-100/50 pt-2 font-medium">
                                                    <p className="flex justify-between">
                                                        <span className="text-slate-400">Patient:</span>
                                                        <span className="font-bold text-slate-800">{apt.patient?.full_name}</span>
                                                    </p>
                                                    <p className="flex justify-between">
                                                        <span className="text-slate-400">Doctor:</span>
                                                        <span className="font-bold text-slate-800">Dr. {apt.doctor?.full_name}</span>
                                                    </p>
                                                    {apt.symptoms && (
                                                        <p className="bg-white/60 p-2 rounded-lg border border-indigo-100/30 text-[9px] text-slate-500 italic mt-1 leading-normal">
                                                            "{apt.symptoms}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 pt-1">
                                                    <Link href={`/dashboard/staff/emr/${apt.user_id}`} className="flex-1">
                                                        <Button variant="outline" className="w-full text-[10px] h-8 font-bold border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50">
                                                            EMR Record
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/dashboard/telemedicine/session/${apt.id}`} className="flex-1">
                                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-8 font-bold flex items-center justify-center gap-0.5 shadow-md shadow-indigo-100">
                                                            <Video size={11} /> Join Room
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Escalate Telemedicine Modal popup */}
            {showEscalateModal && selectedPatient && selectedDoctorForBooking && (
                <EscalateTelemedicineModal
                    isOpen={showEscalateModal}
                    onClose={() => {
                        setShowEscalateModal(false);
                        setSelectedPatient(null);
                        setPatientSearch('');
                        setSearchResults([]);
                        // Refresh appointments list
                        fetchAppointments(staffInfo.facility_id);
                    }}
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.full_name}
                    patientEmail={selectedPatient.email}
                    doctorId={selectedDoctorForBooking.id}
                    doctorName={selectedDoctorForBooking.full_name}
                    onSuccess={() => {
                        fetchAppointments(staffInfo.facility_id);
                    }}
                />
            )}
        </div>
    );
}
