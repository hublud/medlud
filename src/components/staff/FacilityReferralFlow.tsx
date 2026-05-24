import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Search, 
    MapPin, 
    Shield, 
    Clock, 
    Hospital, 
    Check, 
    AlertTriangle, 
    Navigation,
    Loader2,
    FileText,
    Activity,
    Compass
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FacilityReferralFlowProps {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    callId?: string;
    onSuccess?: () => void;
}

interface PatientProfile {
    id: string;
    full_name: string;
    state: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface Facility {
    id: string;
    name: string;
    type_name: string;
    partner_status: 'partnered' | 'independent' | 'none';
    accreditation_status: 'accredited' | 'pending' | 'suspended';
    license_number: string | null;
    logo_url: string | null;
    contact_phone: string | null;
    email: string | null;
    operating_hours: string | null;
    state: string;
    city: string;
    full_address: string;
    latitude: number | null;
    longitude: number | null;
    services: string[];
    distanceKm?: number;
}

const matchesRequestType = (facility: any, reqType: string): boolean => {
    const typeName = (facility.facility_type?.name || '').toLowerCase();
    
    // Check primary type matching
    if (reqType === 'lab' && typeName === 'laboratory') return true;
    if (reqType === 'hospital' && typeName === 'hospital') return true;
    if (reqType === 'pharmacy' && typeName === 'pharmacy') return true;
    if (reqType === 'imaging' && typeName === 'imaging center') return true;

    // Check services matching
    const servicesList: any[] = facility.services || [];
    const serviceNames = servicesList.map((s: any) => (s.service_name || '').toLowerCase());

    if (reqType === 'lab') {
        const labKeywords = ['fbc', 'blood', 'malaria', 'sugar', 'lipid', 'urine', 'kidney', 'liver', 'typhoid', 'lab', 'laboratory', 'diagnostic', 'haematology', 'chemistry', 'pathology'];
        return serviceNames.some(name => labKeywords.some(kw => name.includes(kw)));
    }
    if (reqType === 'imaging') {
        const imgKeywords = ['scan', 'ultrasound', 'x-ray', 'radiology', 'mammography', 'ct scan', 'mri', 'electrocardiogram', 'ecg', 'imaging', 'xray', 'sonography'];
        return serviceNames.some(name => imgKeywords.some(kw => name.includes(kw)));
    }
    if (reqType === 'pharmacy') {
        const pharmKeywords = ['pharmacy', 'dispensing', 'otc', 'medicine', 'drug', 'prescription', 'chemist', 'stores'];
        return serviceNames.some(name => pharmKeywords.some(kw => name.includes(kw)));
    }
    if (reqType === 'hospital') {
        const hospKeywords = ['consultation', 'emergency', 'care', 'antenatal', 'postnatal', 'immunization', 'pediatric', 'wound', 'surgery', 'clinic', 'hospital', 'inpatient', 'outpatient'];
        return serviceNames.some(name => hospKeywords.some(kw => name.includes(kw)));
    }

    return false;
};

export const FacilityReferralFlow: React.FC<FacilityReferralFlowProps> = ({
    patientId,
    doctorId,
    appointmentId,
    callId,
    onSuccess
}) => {
    const [patient, setPatient] = useState<PatientProfile | null>(null);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filters & Searches
    const [requestType, setRequestType] = useState<'lab' | 'hospital' | 'pharmacy' | 'imaging'>('lab');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
    const [clinicalNotes, setClinicalNotes] = useState('');

    // External facility fallback
    const [useExternal, setUseExternal] = useState(false);
    const [externalName, setExternalName] = useState('');
    const [externalAddress, setExternalAddress] = useState('');
    const [patientCanVisitIndependently, setPatientCanVisitIndependently] = useState(true);

    useEffect(() => {
        fetchData();
    }, [patientId, requestType]);

    // Haversine distance calculation
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((R * c) * 10) / 10; // Round to 1 decimal place
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Patient Location details
            const { data: patData } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, state, city, latitude, longitude')
                .eq('id', patientId)
                .single();
            
            setPatient(patData as any);

            // 2. Map request types to DB type names
            let typeSearchName = '';
            if (requestType === 'lab') typeSearchName = 'Laboratory';
            if (requestType === 'hospital') typeSearchName = 'Hospital';
            if (requestType === 'pharmacy') typeSearchName = 'Pharmacy';
            if (requestType === 'imaging') typeSearchName = 'Imaging Center';

            // 3. Fetch active facilities
            const { data: facsData } = await (supabase as any)
                .from('facilities')
                .select(`
                    *,
                    facility_type:facility_types(name),
                    location:facility_locations(*),
                    services:facility_services(service_name)
                `)
                .eq('status', 'active');

            if (facsData) {
                // Filter by type or services matching
                let mapped: Facility[] = facsData
                    .filter((f: any) => matchesRequestType(f, requestType))
                    .map((f: any) => ({
                        id: f.id,
                        name: f.name,
                        type_name: f.facility_type?.name || '',
                        partner_status: f.partner_status,
                        accreditation_status: f.accreditation_status,
                        license_number: f.license_number,
                        logo_url: f.logo_url,
                        contact_phone: f.contact_phone,
                        email: f.email,
                        operating_hours: f.operating_hours,
                        state: f.location?.[0]?.state || '',
                        city: f.location?.[0]?.city || '',
                        full_address: f.location?.[0]?.full_address || '',
                        latitude: f.location?.[0]?.latitude || null,
                        longitude: f.location?.[0]?.longitude || null,
                        services: f.services?.map((s: any) => s.service_name) || []
                    }));

                // Calculate distance if patient coordinates are present
                if (patData?.latitude && patData?.longitude) {
                    mapped = mapped.map(f => {
                        if (f.latitude && f.longitude) {
                            return {
                                ...f,
                                distanceKm: calculateDistance(
                                    patData.latitude, 
                                    patData.longitude, 
                                    f.latitude, 
                                    f.longitude
                                )
                            };
                        }
                        return f;
                    });
                }

                // Sort: Prioritize Kaduna/patient location first, then Partnered, then Distance
                const patientState = patData?.state?.toLowerCase().trim() || '';
                const patientCity = patData?.city?.toLowerCase().trim() || '';

                mapped.sort((a, b) => {
                    // 1. Patient State matching priority
                    const aMatchesState = a.state?.toLowerCase().trim() === patientState;
                    const bMatchesState = b.state?.toLowerCase().trim() === patientState;
                    if (aMatchesState && !bMatchesState) return -1;
                    if (!aMatchesState && bMatchesState) return 1;

                    // 2. Patient City matching priority
                    const aMatchesCity = a.city?.toLowerCase().trim() === patientCity;
                    const bMatchesCity = b.city?.toLowerCase().trim() === patientCity;
                    if (aMatchesCity && !bMatchesCity) return -1;
                    if (!aMatchesCity && bMatchesCity) return 1;

                    // 3. Partner Status priority (partnered > independent > none)
                    const partnerScore = { partnered: 3, independent: 2, none: 1 };
                    const scoreA = partnerScore[a.partner_status] || 0;
                    const scoreB = partnerScore[b.partner_status] || 0;
                    if (scoreA !== scoreB) return scoreB - scoreA;

                    // 4. Distance Priority
                    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
                        return a.distanceKm - b.distanceKm;
                    }

                    return a.name.localeCompare(b.name);
                });

                setFacilities(mapped);
                
                // Pre-select first facility if exists
                if (mapped.length > 0) {
                    setSelectedFacilityId(mapped[0].id);
                    setUseExternal(false);
                } else {
                    setSelectedFacilityId(null);
                    setUseExternal(true);
                }
            }

        } catch (err) {
            console.error('Error fetching referral workflow data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReferral = async () => {
        if (!useExternal && !selectedFacilityId) {
            return alert('Please select a facility or choose external care.');
        }
        if (useExternal && !externalName && !patientCanVisitIndependently) {
            return alert('Please enter the external facility name or allow independent selection.');
        }

        setSubmitting(true);
        try {
            const selectedFac = facilities.find(f => f.id === selectedFacilityId);

            // 1. Insert Referral Request
            const referralData = {
                patient_id: patientId,
                doctor_id: doctorId,
                appointment_id: appointmentId || null,
                call_id: callId || null,
                request_type: requestType,
                facility_id: useExternal ? null : selectedFacilityId,
                is_external: useExternal,
                external_facility_name: useExternal ? (patientCanVisitIndependently ? 'Patient Selection (Independent Accredited Center)' : externalName) : null,
                external_facility_address: useExternal ? (patientCanVisitIndependently ? 'Independent Location' : externalAddress) : null,
                clinical_notes: clinicalNotes,
                status: 'pending'
            };

            const { data: refReq, error: refError } = await (supabase as any)
                .from('referral_requests')
                .insert([referralData])
                .select()
                .single();

            if (refError) throw refError;

            // 2. Insert Medico-Legal Logs
            const logDetails = {
                doctor_recommendation: requestType + '_referral',
                facility_selected: useExternal ? 'External / Independent' : selectedFac?.name,
                is_partnered: useExternal ? false : selectedFac?.partner_status === 'partnered',
                accreditation: useExternal ? 'manual_verification_required' : selectedFac?.accreditation_status,
                patient_coordinates: patient?.latitude ? { lat: patient.latitude, lon: patient.longitude } : null,
                clinical_context: clinicalNotes,
                independent_selection: useExternal && patientCanVisitIndependently
            };

            const { error: logError } = await (supabase as any)
                .from('referral_logs')
                .insert([{
                    referral_request_id: refReq.id,
                    doctor_id: doctorId,
                    patient_id: patientId,
                    event_type: 'created',
                    details: logDetails
                }]);

            if (logError) throw logError;

            // 3. Post a message to case messages stream to notify patient automatically
            const notificationText = `🚨 Referral Issued: Dr. referred you for a ${requestType.toUpperCase()} test/referral.\n` + 
                `📍 Center: ${useExternal ? (patientCanVisitIndependently ? 'Any Accredited External Center (Independent)' : externalName) : selectedFac?.name}\n` +
                `📝 Notes: ${clinicalNotes || 'None'}`;

            // Check if there is an appointment table linked to post message
            if (appointmentId) {
                await supabase
                    .from('messages')
                    .insert([{
                        appointment_id: appointmentId,
                        sender_id: doctorId,
                        role: 'DOCTOR',
                        content: notificationText
                    }]);
            }

            // If session calls are active, send to session room
            if (callId) {
                // Post inside session messages
                await supabase
                    .from('session_messages')
                    .insert([{
                        consultation_id: callId,
                        sender_id: doctorId,
                        content: notificationText
                    }]);
            }

            alert('Referral created successfully! The patient has been notified.');
            setClinicalNotes('');
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error('Error creating referral:', err);
            alert(`Failed to create referral: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter local region partners vs other state partners
    const patientState = patient?.state?.toLowerCase().trim() || '';
    const hasLocalPartners = facilities.some(f => f.state.toLowerCase().trim() === patientState);

    const searchedFacilities = facilities.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Hospital className="text-primary" size={20} />
                    Issue Referral & External Care Request
                </h3>
            </div>

            {/* Request Type Dropdown */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Referral Request Type</label>
                <select
                    value={requestType}
                    onChange={e => { setRequestType(e.target.value as any); setUseExternal(false); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                    <option value="lab">🔬 Lab Request</option>
                    <option value="hospital">🏥 Hospital Request</option>
                    <option value="pharmacy">💊 Pharmacy Request</option>
                    <option value="imaging">📸 Imaging Request</option>
                </select>
            </div>

            {/* Patient location display */}
            {patient && (
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-primary animate-pulse" size={16} />
                        <div>
                            <p className="text-slate-400 font-bold uppercase">Patient Location</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                                {patient.city || 'Unknown City'}, {patient.state || 'Unknown State'}
                            </p>
                        </div>
                    </div>
                    {patient.latitude && (
                        <span className="text-[10px] text-slate-400 font-bold bg-white px-2.5 py-1 rounded-lg border flex items-center gap-1">
                            <Compass size={12} /> GPS Active
                        </span>
                    )}
                </div>
            )}

            {/* Facility Selector Toggles */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setUseExternal(false)}
                    disabled={facilities.length === 0}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        !useExternal
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50'
                    }`}
                >
                    Select Partnered Facility ({facilities.length})
                </button>
                <button
                    type="button"
                    onClick={() => setUseExternal(true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        useExternal
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Accredited External Center
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-slate-400 text-sm ml-2 font-medium">Querying facilities...</span>
                </div>
            ) : !useExternal ? (
                /* PARTNERED FACILITIES LIST */
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={`Search partnered ${requestType}s...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border-0 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                        />
                    </div>

                    {/* Kaduna / Local prioritization warning */}
                    {!hasLocalPartners && patientState && (
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-start gap-2 text-xs text-amber-800 leading-normal">
                            <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                            <div>
                                <span className="font-bold">No partnered facility found in {patient?.state || 'patient State'}.</span>
                                <p className="mt-0.5">Showing nearest alternatives. Patient may visit an external center independently.</p>
                            </div>
                        </div>
                    )}

                    {/* Facility Scrollable Cards */}
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                        {searchedFacilities.map(fac => {
                            const isSelected = selectedFacilityId === fac.id;
                            const isLocal = fac.state.toLowerCase().trim() === patientState;
                            
                            return (
                                <div
                                    key={fac.id}
                                    onClick={() => setSelectedFacilityId(fac.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-start gap-4 ${
                                        isSelected 
                                            ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/20' 
                                            : 'bg-white hover:bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-1.5">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">{fac.name}</h4>
                                            
                                            {/* Badges */}
                                            {fac.partner_status === 'partnered' && (
                                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Partner</span>
                                            )}
                                            {isLocal && (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Local</span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin size={12} className="shrink-0 text-slate-400" />
                                            <span className="truncate">{fac.full_address}</span>
                                        </p>

                                        {/* Services */}
                                        {fac.services.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {fac.services.map((s, i) => (
                                                    <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Distance & Accreditation */}
                                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                        {fac.distanceKm !== undefined ? (
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                                <Navigation size={12} className="text-primary rotate-45" /> {fac.distanceKm} km
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border uppercase">
                                                {fac.city}
                                            </span>
                                        )}

                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                            fac.accreditation_status === 'accredited' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                                : 'bg-amber-50 text-amber-700 border border-amber-150'
                                        }`}>
                                            {fac.accreditation_status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* EXTERNAL FACILITY FALLBACK FORM */
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                    <div className="flex items-start gap-2 mb-2 text-xs text-slate-500">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={14} />
                        <div>
                            <p className="font-bold text-slate-800">No Nearby Partnered Facility Found</p>
                            <p className="leading-normal">Please authorize the patient to use an accredited external clinic or hospital. This recommendation will be logged legally.</p>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 mb-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-slate-300"
                            checked={patientCanVisitIndependently}
                            onChange={e => setPatientCanVisitIndependently(e.target.checked)}
                        />
                        <span className="text-xs font-bold text-slate-800">Patient can visit any accredited center independently</span>
                    </label>

                    {!patientCanVisitIndependently && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">External Facility Name</label>
                                <input
                                    type="text"
                                    required={!patientCanVisitIndependently}
                                    value={externalName}
                                    onChange={e => setExternalName(e.target.value)}
                                    placeholder="Enter hospital/lab name..."
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase">Address / Location</label>
                                <input
                                    type="text"
                                    value={externalAddress}
                                    onChange={e => setExternalAddress(e.target.value)}
                                    placeholder="Enter street name, state..."
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Clinical context */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Clinical Notes & Requisition Details</label>
                <textarea
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="Describe diagnostic tests needed, referral reason, and patient symptoms..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
            </div>

            <Button
                type="button"
                onClick={handleCreateReferral}
                disabled={submitting}
                className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-primary/20 font-bold"
            >
                {submitting ? (
                    <><Loader2 className="animate-spin mr-2" size={16} /> Creating Referral...</>
                ) : (
                    'Issue Medical Referral'
                )}
            </Button>
        </div>
    );
};
