'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Stethoscope, Phone, Mail, MapPin } from 'lucide-react';
import moment from 'moment';

export default function PrintPrescriptionPage() {
    const params = useParams();
    const [callData, setCallData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrescription() {
            try {
                const callId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
                
                const { data, error } = await supabase
                    .from('telemedicine_calls')
                    .select(`
                        *,
                        patient:patient_id(full_name, med_id, dob, gender),
                        provider:provider_id(full_name)
                    `)
                    .eq('id', callId)
                    .single();

                if (error) throw error;
                setCallData(data);
                
                // Allow a tiny bit of time for rendering before popping print dialog
                setTimeout(() => {
                    window.print();
                }, 500);

            } catch (err) {
                console.error('Error fetching prescription:', err);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) fetchPrescription();
    }, [params.id]);

    if (loading) return <div className="p-10">Loading prescription...</div>;
    if (!callData) return <div className="p-10">Prescription not found.</div>;

    const patient = callData.patient || {};
    const doctor = callData.provider || {};

    return (
        <div className="bg-white min-h-screen text-black">
            {/* Print-only styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto p-8 border border-gray-200 shadow-sm print:shadow-none print:border-none mt-8 print:mt-0 relative">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-emerald-900">MedLud Telemedicine</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Official Prescription</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-600 space-y-1">
                        <p className="flex items-center justify-end gap-1"><MapPin size={12}/> 123 Health Avenue, Lagos</p>
                        <p className="flex items-center justify-end gap-1"><Phone size={12}/> +234 800 MEDLUD</p>
                        <p className="flex items-center justify-end gap-1"><Mail size={12}/> support@medlud.com</p>
                    </div>
                </div>

                {/* Patient & Rx Info */}
                <div className="flex justify-between mb-8">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase">Patient Information</p>
                        <p className="font-bold text-lg">{patient.full_name}</p>
                        <p className="text-sm">MED ID: {patient.med_id || 'N/A'}</p>
                        {patient.dob && <p className="text-sm">Age/DOB: {moment().diff(patient.dob, 'years')} yrs ({moment(patient.dob).format('DD/MM/YYYY')})</p>}
                        {patient.gender && <p className="text-sm capitalize">Gender: {patient.gender}</p>}
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase">Prescription Details</p>
                        <p className="text-sm"><span className="font-semibold">Tx Date:</span> {moment(callData.created_at).format('MMM Do, YYYY')}</p>
                        <p className="text-sm"><span className="font-semibold">Rx Ref:</span> RX-{callData.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Prescription Content */}
                <div className="mb-12 min-h-[300px]">
                    <div className="text-4xl font-serif italic text-emerald-900 mb-6 font-bold">Rx</div>
                    
                    {callData.diagnosis_notes && (
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-100 pb-1 mb-2">Diagnosis</h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{callData.diagnosis_notes}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-100 pb-1 mb-2">Treatment / Medication</h4>
                        <div className="text-base leading-loose whitespace-pre-wrap pl-2">
                            {callData.treatment_instructions || 'No treatment instructions recorded.'}
                        </div>
                    </div>
                </div>

                {/* Signature Footer */}
                <div className="flex justify-between items-end border-t border-gray-200 pt-8 mt-16">
                    <div>
                        <p className="text-xs text-gray-400">This prescription is digitally generated via MedLud Telemedicine.</p>
                        <p className="text-xs text-gray-400">Valid for exactly 30 days from issued date.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 h-12 mb-2 border-b border-gray-300"></div>
                        <p className="font-bold text-gray-900">Dr. {doctor.full_name}</p>
                        <p className="text-xs text-gray-600">{doctor.specialization || 'Consulting Physician'}</p>
                        {doctor.mdcn_number && <p className="text-xs text-gray-500 font-mono">MDCN: {doctor.mdcn_number}</p>}
                    </div>
                </div>

                {/* Print button (hidden in print) */}
                <div className="mt-8 text-center no-print">
                    <button 
                        onClick={() => window.print()} 
                        className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-emerald-700"
                    >
                        Print Document
                    </button>
                </div>
            </div>
        </div>
    );
}
