'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Hospital, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    CheckCircle, 
    AlertTriangle, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    FileText, 
    Briefcase,
    Shield, 
    Loader2, 
    BarChart3, 
    ArrowUpRight, 
    Building2,
    Users,
    SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NIGERIAN_STATES } from '@/lib/constants';

interface FacilityType {
    id: string;
    name: string;
}

interface Facility {
    id: string;
    name: string;
    type_id: string;
    facility_type?: FacilityType;
    status: 'pending_approval' | 'approved' | 'suspended' | 'active';
    partner_status: 'partnered' | 'independent' | 'none';
    accreditation_status: 'accredited' | 'pending' | 'suspended';
    license_number: string | null;
    logo_url: string | null;
    contact_phone: string | null;
    email: string | null;
    operating_hours: string | null;
    location?: {
        state: string;
        city: string;
        full_address: string;
        latitude: number | null;
        longitude: number | null;
    };
    services?: Array<{ service_name: string }>;
}

const PRESET_SERVICES = [
  {
    category: 'Laboratory Services',
    type: 'lab',
    items: [
      'Full Blood Count (FBC)',
      'Malaria Parasite Panel',
      'Blood Sugar Test (Fasting/Random)',
      'Lipid Profile',
      'Urinalysis',
      'Kidney Function Test (KFT)',
      'Liver Function Test (LFT)',
      'Typhoid Widal Test'
    ]
  },
  {
    category: 'Imaging & Radiology',
    type: 'imaging',
    items: [
      'Obstetric Ultrasound Scan',
      'Digital Chest X-Ray',
      'Pelvic Scan',
      'Abdominal Scan',
      'Mammography',
      'CT Scan',
      'MRI Scan',
      'ECG / Electrocardiogram'
    ]
  },
  {
    category: 'Pharmacy Services',
    type: 'pharmacy',
    items: [
      'Prescription Dispensing',
      'OTC Medicines',
      'Vitals Monitoring (BP, Blood Sugar)',
      'Vaccine Administration'
    ]
  },
  {
    category: 'Hospital / Clinical Services',
    type: 'hospital',
    items: [
      'General Consultation',
      'Emergency Room Care',
      'Antenatal & Postnatal Care',
      'Immunization & Pediatric Care',
      'Wound Dressing & Minor Surgery',
      'Specialist Consultation'
    ]
  }
];

export default function AdminFacilitiesPage() {
    const db = supabase as any;
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([]);
    const [referralRequests, setReferralRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'LIST' | 'REQUESTS' | 'ANALYTICS'>('LIST');
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');
    const [selectedServiceFilter, setSelectedServiceFilter] = useState('ALL');

    // Modals
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [typeId, setTypeId] = useState('');
    const [status, setStatus] = useState<'pending_approval' | 'approved' | 'suspended' | 'active'>('active');
    const [partnerStatus, setPartnerStatus] = useState<'partnered' | 'independent' | 'none'>('partnered');
    const [accreditationStatus, setAccreditationStatus] = useState<'accredited' | 'pending' | 'suspended'>('accredited');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [email, setEmail] = useState('');
    const [operatingHours, setOperatingHours] = useState('');
    const [stateVal, setStateVal] = useState('');
    const [cityVal, setCityVal] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [otherServices, setOtherServices] = useState('');

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Types
            const { data: typesData } = await db.from('facility_types').select('*');
            setFacilityTypes(typesData || []);

            // 2. Fetch Facilities with Locations and Services
            const { data: facsData } = await db
                .from('facilities')
                .select(`
                    *,
                    facility_type:facility_types(*),
                    location:facility_locations(state, city, full_address, latitude, longitude),
                    services:facility_services(service_name)
                `)
                .order('created_at', { ascending: false });

            setFacilities(facsData || []);

            // 3. Fetch Referral Requests
            const { data: refsData } = await db
                .from('referral_requests')
                .select(`
                    *,
                    patient:profiles!referral_requests_patient_id_fkey(full_name),
                    doctor:profiles!referral_requests_doctor_id_fkey(full_name),
                    facility:facilities(name)
                `)
                .order('created_at', { ascending: false });

            setReferralRequests(refsData || []);

        } catch (err) {
            console.error('Error fetching admin facility data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingFacility(null);
        setName('');
        setTypeId(facilityTypes[0]?.id || '');
        setStatus('active');
        setPartnerStatus('partnered');
        setAccreditationStatus('accredited');
        setLicenseNumber('');
        setLogoUrl('');
        setContactPhone('');
        setEmail('');
        setOperatingHours('24/7');
        setStateVal('');
        setCityVal('');
        setFullAddress('');
        setLatitude('');
        setLongitude('');
        setSelectedServices([]);
        setOtherServices('');
        setIsAddEditOpen(true);
    };

    const handleOpenEdit = (fac: Facility) => {
        setEditingFacility(fac);
        setName(fac.name);
        setTypeId(fac.type_id);
        setStatus(fac.status);
        setPartnerStatus(fac.partner_status);
        setAccreditationStatus(fac.accreditation_status);
        setLicenseNumber(fac.license_number || '');
        setLogoUrl(fac.logo_url || '');
        setContactPhone(fac.contact_phone || '');
        setEmail(fac.email || '');
        setOperatingHours(fac.operating_hours || '');

        const loc = Array.isArray(fac.location) ? fac.location[0] : fac.location;
        setStateVal(loc?.state || '');
        setCityVal(loc?.city || '');
        setFullAddress(loc?.full_address || '');
        setLatitude(loc?.latitude?.toString() || '');
        setLongitude(loc?.longitude?.toString() || '');
        
        const presetItems = PRESET_SERVICES.flatMap(cat => cat.items);
        const existingServices = fac.services?.map(s => s.service_name) || [];
        const selectedPreset = existingServices.filter(s => presetItems.includes(s));
        const selectedOther = existingServices.filter(s => !presetItems.includes(s)).join(', ');
        setSelectedServices(selectedPreset);
        setOtherServices(selectedOther);
        setIsAddEditOpen(true);
    };

    const handleSaveFacility = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const facilityData = {
                name,
                type_id: typeId,
                status,
                partner_status: partnerStatus,
                accreditation_status: accreditationStatus,
                license_number: licenseNumber || null,
                logo_url: logoUrl || null,
                contact_phone: contactPhone || null,
                email: email || null,
                operating_hours: operatingHours || null,
                updated_at: new Date().toISOString()
            };

            let savedFacilityId = '';

            if (editingFacility) {
                // Update
                const { error } = await db
                    .from('facilities')
                    .update(facilityData)
                    .eq('id', editingFacility.id);

                if (error) throw error;
                savedFacilityId = editingFacility.id;
            } else {
                // Insert
                const { data, error } = await db
                    .from('facilities')
                    .insert([facilityData])
                    .select()
                    .single();

                if (error) throw error;
                savedFacilityId = data.id;
            }

            // Save Location
            if (savedFacilityId) {
                const locationData = {
                    facility_id: savedFacilityId,
                    state: stateVal,
                    city: cityVal,
                    full_address: fullAddress,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null
                };

                // Check if location exists
                const hasExistingLoc = editingFacility && (Array.isArray(editingFacility.location) ? editingFacility.location.length > 0 : !!editingFacility.location);
                if (hasExistingLoc) {
                    await db
                        .from('facility_locations')
                        .update(locationData)
                        .eq('facility_id', savedFacilityId);
                } else {
                    await db
                        .from('facility_locations')
                        .insert([locationData]);
                }

                // Save Services (delete existing, then insert)
                await db
                    .from('facility_services')
                    .delete()
                    .eq('facility_id', savedFacilityId);

                const combinedServices = [
                    ...selectedServices,
                    ...otherServices.split(',').map(s => s.trim()).filter(Boolean)
                ];

                if (combinedServices.length > 0) {
                    const servicesArray = combinedServices.map(s => ({
                        facility_id: savedFacilityId,
                        service_name: s
                    }));

                    await db
                        .from('facility_services')
                        .insert(servicesArray);
                }
            }

            setIsAddEditOpen(false);
            fetchInitialData();
            alert(`Facility ${editingFacility ? 'updated' : 'created'} successfully!`);
        } catch (err: any) {
            console.error('Error saving facility:', err);
            alert(`Error saving facility: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteFacility = async (id: string) => {
        if (!confirm('Are you sure you want to delete this partnered facility?')) return;

        try {
            const { error } = await db.from('facilities').delete().eq('id', id);
            if (error) throw error;

            setFacilities(prev => prev.filter(f => f.id !== id));
            alert('Facility deleted successfully.');
        } catch (err: any) {
            console.error('Error deleting facility:', err);
            alert(`Failed to delete facility: ${err.message}`);
        }
    };

    const handleToggleStatus = async (fac: Facility, newStatus: 'active' | 'suspended') => {
        try {
            const { error } = await db
                .from('facilities')
                .update({ status: newStatus })
                .eq('id', fac.id);

            if (error) throw error;

            setFacilities(prev => prev.map(f => f.id === fac.id ? { ...f, status: newStatus } : f));
            alert(`Facility status updated to ${newStatus}.`);
        } catch (err: any) {
            console.error('Error updating status:', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const filteredFacilities = facilities.filter(fac => {
        const loc = Array.isArray(fac.location) ? fac.location[0] : fac.location;
        const matchesSearch = fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loc?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loc?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fac.services?.some(s => s.service_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = selectedType === 'ALL' || fac.type_id === selectedType;
        const matchesStatus = selectedStatus === 'ALL' || fac.status === selectedStatus;

        // Advanced Filters
        const matchesState = selectedStateFilter === 'ALL' || 
            (loc?.state?.toLowerCase().trim() === selectedStateFilter.toLowerCase().trim());
            
        const matchesService = selectedServiceFilter === 'ALL' || 
            fac.services?.some(s => s.service_name.toLowerCase().trim() === selectedServiceFilter.toLowerCase().trim());

        return matchesSearch && matchesType && matchesStatus && matchesState && matchesService;
    });

    // Analytics Calculations
    const totalPartners = facilities.filter(f => f.partner_status === 'partnered').length;
    const activePartners = facilities.filter(f => f.status === 'active' || f.status === 'approved').length;
    const suspendedPartners = facilities.filter(f => f.status === 'suspended').length;
    
    // Type metrics
    const hospitalCount = facilities.filter(f => f.facility_type?.name === 'Hospital').length;
    const labCount = facilities.filter(f => f.facility_type?.name === 'Laboratory').length;
    const pharmacyCount = facilities.filter(f => f.facility_type?.name === 'Pharmacy').length;
    const imagingCount = facilities.filter(f => f.facility_type?.name === 'Imaging Center').length;
    const clinicCount = facilities.filter(f => f.facility_type?.name === 'Specialist Clinic').length;

    // Referral metrics
    const totalReferrals = referralRequests.length;
    const pendingReferrals = referralRequests.filter(r => r.status === 'pending').length;
    const completedReferrals = referralRequests.filter(r => r.status === 'completed').length;
    const externalReferrals = referralRequests.filter(r => r.is_external).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Partnered Facilities</h1>
                    <p className="text-slate-500">Manage hospitals, labs, pharmacies, imaging centers, and clinic partners.</p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleOpenAdd}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Add New Facility
                    </button>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('LIST')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'LIST' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    Facilities List
                </button>
                <button
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'REQUESTS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    Referral Requests ({referralRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('ANALYTICS')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'ANALYTICS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                    Analytics & Performance
                </button>
            </div>

            {/* ── TAB 1: LIST ── */}
            {activeTab === 'LIST' && (
                <div className="space-y-6">
                    {/* Filters bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search facilities, city..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border-0 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
                                        showAdvancedSearch 
                                            ? 'bg-primary/10 border-primary/20 text-primary' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <SlidersHorizontal size={16} />
                                    {showAdvancedSearch ? 'Hide Filters' : 'Advanced Filters'}
                                </button>

                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700"
                                >
                                    <option value="ALL">All Types</option>
                                    {facilityTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedSearch && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by State</label>
                                    <select
                                        value={selectedStateFilter}
                                        onChange={e => setSelectedStateFilter(e.target.value)}
                                        className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 bg-white"
                                    >
                                        <option value="ALL">All States</option>
                                        {NIGERIAN_STATES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Service</label>
                                    <select
                                        value={selectedServiceFilter}
                                        onChange={e => setSelectedServiceFilter(e.target.value)}
                                        className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 bg-white"
                                    >
                                        <option value="ALL">All Services</option>
                                        {PRESET_SERVICES.map((cat, idx) => (
                                            <optgroup key={idx} label={cat.category}>
                                                {cat.items.map((item, itemIdx) => (
                                                    <option key={itemIdx} value={item}>{item}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={e => setSelectedStatus(e.target.value)}
                                        className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 bg-white"
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="pending_approval">Pending Approval</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border">
                            <Loader2 className="animate-spin text-primary mr-3" size={32} />
                            <span className="text-slate-500 font-medium">Loading facilities...</span>
                        </div>
                    ) : filteredFacilities.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                            <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-slate-800">No Facilities Found</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">Try modifying your search or filters, or add a new partnered facility to get started.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="py-4 px-6">Logo / Name</th>
                                        <th className="py-4 px-6">Type</th>
                                        <th className="py-4 px-6">Location</th>
                                        <th className="py-4 px-6">Accreditation</th>
                                        <th className="py-4 px-6">Services</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {filteredFacilities.map((fac) => (
                                        <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                        {fac.logo_url ? (
                                                            <img src={fac.logo_url} alt={fac.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Hospital size={20} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-tight">{fac.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{fac.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
                                                    {fac.facility_type?.name}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-start gap-1">
                                                     <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                     <div>
                                                         <p className="font-semibold text-slate-800 leading-tight">
                                                             {((Array.isArray(fac.location) ? fac.location[0] : fac.location) as any)?.city || 'No City'}
                                                         </p>
                                                         <p className="text-xs text-slate-500 mt-0.5">
                                                             {((Array.isArray(fac.location) ? fac.location[0] : fac.location) as any)?.state || 'No State'} State
                                                         </p>
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${
                                                    fac.accreditation_status === 'accredited' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    fac.accreditation_status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                    'bg-rose-100 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {fac.accreditation_status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 max-w-[200px] truncate">
                                                <div className="flex flex-wrap gap-1">
                                                    {fac.services && fac.services.length > 0 ? (
                                                        fac.services.slice(0, 2).map((s, idx) => (
                                                            <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                {s.service_name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">None</span>
                                                    )}
                                                    {fac.services && fac.services.length > 2 && (
                                                        <span className="bg-slate-100 text-slate-400 px-1 py-0.5 rounded text-[9px] font-bold">
                                                            +{fac.services.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                                    fac.status === 'active' || fac.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    fac.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {fac.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {fac.status === 'active' || fac.status === 'approved' ? (
                                                        <button
                                                            onClick={() => handleToggleStatus(fac, 'suspended')}
                                                            title="Suspend Partner"
                                                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                        >
                                                            <AlertTriangle size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleStatus(fac, 'active')}
                                                            title="Approve/Activate Partner"
                                                            className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenEdit(fac)}
                                                        title="Edit Facility"
                                                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-primary rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFacility(fac.id)}
                                                        title="Delete Facility"
                                                        className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: REFERRAL REQUESTS ── */}
            {activeTab === 'REQUESTS' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">Active Patient Referrals Log</h2>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{referralRequests.length} Referrals</span>
                        </div>
                        {referralRequests.length === 0 ? (
                            <div className="text-center py-20">
                                <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-slate-500 font-medium">No referral requests logged yet.</p>
                                <p className="text-xs text-slate-400 mt-1">When doctors refer patients for labs or clinical care, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <th className="py-4 px-6">Referral ID / Patient</th>
                                            <th className="py-4 px-6">Doctor</th>
                                            <th className="py-4 px-6">Request Type</th>
                                            <th className="py-4 px-6">Target Facility</th>
                                            <th className="py-4 px-6">Created At</th>
                                            <th className="py-4 px-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {referralRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <p className="font-bold text-slate-950">#{req.id.slice(0, 8).toUpperCase()}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{req.patient?.full_name || 'Patient'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-800">
                                                    {req.doctor?.full_name || 'System / Direct'}
                                                </td>
                                                <td className="py-4 px-6 capitalize">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        req.request_type === 'lab' ? 'bg-amber-50 text-amber-700' :
                                                        req.request_type === 'imaging' ? 'bg-purple-50 text-purple-700' :
                                                        req.request_type === 'pharmacy' ? 'bg-emerald-50 text-emerald-700' :
                                                        'bg-indigo-50 text-indigo-700'
                                                    }`}>
                                                        {req.request_type} request
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.is_external ? (
                                                        <div>
                                                            <p className="font-semibold text-rose-600 flex items-center gap-1">
                                                                <Shield size={12} /> External Facility
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{req.external_facility_name || 'Patient Choice'}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium text-slate-800">{req.facility?.name || 'Unassigned'}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-slate-500">
                                                    {new Date(req.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full ${
                                                        req.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        req.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 3: ANALYTICS ── */}
            {activeTab === 'ANALYTICS' && (
                <div className="space-y-6">
                    {/* Analytics Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Facilities</span>
                                <span className="p-1 bg-blue-50 text-blue-600 rounded-lg"><Hospital size={16} /></span>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{facilities.length}</p>
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <span className="text-emerald-600 font-bold flex items-center">{totalPartners}</span> verified partners
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Partners</span>
                                <span className="p-1 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={16} /></span>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{activePartners}</p>
                            <p className="text-xs text-slate-400 mt-2">
                                {suspendedPartners} suspended partners currently
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Referrals</span>
                                <span className="p-1 bg-amber-50 text-amber-600 rounded-lg"><FileText size={16} /></span>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{totalReferrals}</p>
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <span className="text-emerald-600 font-semibold">{completedReferrals}</span> completed successfully
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">External Visit Ratio</span>
                                <span className="p-1 bg-rose-50 text-rose-600 rounded-lg"><Shield size={16} /></span>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">
                                {totalReferrals > 0 ? Math.round((externalReferrals / totalReferrals) * 100) : 0}%
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                {externalReferrals} referrals routed externally
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Facility Breakdown */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                                <Building2 size={20} className="text-primary" /> Facility Types Distribution
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Hospitals</span>
                                        <span className="text-slate-950 font-bold">{hospitalCount} ({facilities.length > 0 ? Math.round((hospitalCount / facilities.length) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${facilities.length > 0 ? (hospitalCount / facilities.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Laboratories</span>
                                        <span className="text-slate-950 font-bold">{labCount} ({facilities.length > 0 ? Math.round((labCount / facilities.length) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${facilities.length > 0 ? (labCount / facilities.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Pharmacies</span>
                                        <span className="text-slate-950 font-bold">{pharmacyCount} ({facilities.length > 0 ? Math.round((pharmacyCount / facilities.length) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${facilities.length > 0 ? (pharmacyCount / facilities.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Imaging/Scan Centers</span>
                                        <span className="text-slate-950 font-bold">{imagingCount} ({facilities.length > 0 ? Math.round((imagingCount / facilities.length) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${facilities.length > 0 ? (imagingCount / facilities.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Specialist Clinics</span>
                                        <span className="text-slate-950 font-bold">{clinicCount} ({facilities.length > 0 ? Math.round((clinicCount / facilities.length) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${facilities.length > 0 ? (clinicCount / facilities.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral Pipeline */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                                <BarChart3 size={20} className="text-primary" /> Referral Request Statuses
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Pending Patient Visit / Completion</span>
                                        <span className="text-slate-950 font-bold">{pendingReferrals} ({totalReferrals > 0 ? Math.round((pendingReferrals / totalReferrals) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${totalReferrals > 0 ? (pendingReferrals / totalReferrals) * 100 : 0}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">Completed Reviews / Results Checked</span>
                                        <span className="text-slate-950 font-bold">{completedReferrals} ({totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-green-600 h-full rounded-full" style={{ width: `${totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0}%` }} />
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
                                    <div className="p-3 bg-white text-slate-600 rounded-xl shadow-sm"><Users size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Top Referred Area</p>
                                        <p className="text-sm font-bold text-slate-900">Kaduna State Partners (80% of volume)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD/EDIT FACILITY MODAL ── */}
            {isAddEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-250">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6">
                            <h2 className="text-xl font-bold">{editingFacility ? 'Edit Partnered Facility' : 'Add New Partnered Facility'}</h2>
                            <p className="text-slate-300 text-sm mt-1">Populate facility profile details to add them to doctor and patient selection feeds.</p>
                        </div>

                        {/* Modal Scrollable Content */}
                        <form onSubmit={handleSaveFacility} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Facility Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Kaduna Diagnostic Partners"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Facility Type *</label>
                                    <select
                                        value={typeId}
                                        onChange={e => setTypeId(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    >
                                        {facilityTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Partner Status</label>
                                    <select
                                        value={partnerStatus}
                                        onChange={e => setPartnerStatus(e.target.value as any)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    >
                                        <option value="partnered">Partnered (Primary)</option>
                                        <option value="independent">Independent (Accredited)</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Accreditation Status</label>
                                    <select
                                        value={accreditationStatus}
                                        onChange={e => setAccreditationStatus(e.target.value as any)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    >
                                        <option value="accredited">Accredited</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">License Number</label>
                                    <input
                                        type="text"
                                        value={licenseNumber}
                                        onChange={e => setLicenseNumber(e.target.value)}
                                        placeholder="e.g. LIC-LAB-KD-001"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Logo URL / Image</label>
                                    <input
                                        type="text"
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        placeholder="Paste image URL..."
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={contactPhone}
                                        onChange={e => setContactPhone(e.target.value)}
                                        placeholder="e.g. +23480..."
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="e.g. info@clinic.com"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Operating Hours</label>
                                    <input
                                        type="text"
                                        value={operatingHours}
                                        onChange={e => setOperatingHours(e.target.value)}
                                        placeholder="e.g. 08:00 - 18:00 or 24/7"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as any)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="pending_approval">Pending Approval</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <MapPin size={16} className="text-primary" /> Location & Coordinates
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">State *</label>
                                    <select
                                        required
                                        value={stateVal}
                                        onChange={e => setStateVal(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold bg-white cursor-pointer"
                                    >
                                        <option value="">Select State</option>
                                        {NIGERIAN_STATES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City *</label>
                                    <input
                                        type="text"
                                        required
                                        value={cityVal}
                                        onChange={e => setCityVal(e.target.value)}
                                        placeholder="e.g. Kaduna North"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Address *</label>
                                    <textarea
                                        required
                                        value={fullAddress}
                                        onChange={e => setFullAddress(e.target.value)}
                                        placeholder="e.g. 15 Waff Road, Kaduna, Kaduna State"
                                        rows={2}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">GPS Latitude (Optional)</label>
                                    <input
                                        type="text"
                                        value={latitude}
                                        onChange={e => setLatitude(e.target.value)}
                                        placeholder="e.g. 10.5186"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">GPS Longitude (Optional)</label>
                                    <input
                                        type="text"
                                        value={longitude}
                                        onChange={e => setLongitude(e.target.value)}
                                        placeholder="e.g. 7.4379"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Services Offered</label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-4 bg-slate-50 border border-slate-150 rounded-2xl custom-scrollbar">
                                    {PRESET_SERVICES.map((cat, idx) => (
                                        <div key={idx} className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                                            <p className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                                {cat.category === 'Laboratory Services' && '🔬'}
                                                {cat.category === 'Imaging & Radiology' && '📸'}
                                                {cat.category === 'Pharmacy Services' && '💊'}
                                                {cat.category === 'Hospital / Clinical Services' && '🏥'}
                                                {cat.category}
                                            </p>
                                            <div className="space-y-1.5">
                                                {cat.items.map((item, itemIdx) => {
                                                    const isChecked = selectedServices.includes(item);
                                                    return (
                                                        <label key={itemIdx} className="flex items-start gap-2 cursor-pointer py-0.5 hover:bg-slate-50 rounded px-1 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                className="w-3.5 h-3.5 mt-0.5 rounded text-primary focus:ring-primary/20 border-slate-300"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedServices(prev => [...prev, item]);
                                                                    } else {
                                                                        setSelectedServices(prev => prev.filter(s => s !== item));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[11px] font-semibold text-slate-600 leading-tight">{item}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Other / Custom Services (Comma Separated)</label>
                                    <textarea
                                        value={otherServices}
                                        onChange={e => setOtherServices(e.target.value)}
                                        placeholder="e.g. Physiotherapy, Dental Checkups, Ophthalmology..."
                                        rows={2}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                                    />
                                    <p className="text-[9px] text-slate-400 font-semibold">Any services not listed above, separated by commas.</p>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddEditOpen(false)}
                                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-primary hover:bg-primary-hover text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center shadow-lg shadow-primary/10 transition-all active:scale-95"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                                    ) : (
                                        'Save Facility'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
