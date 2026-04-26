'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FlaskConical, Phone, Mail, MapPin } from 'lucide-react';
import moment from 'moment';

export default function PrintLabRequestPage() {
    const params = useParams();
    const [callData, setCallData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLabRequest() {
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
                
                setTimeout(() => {
                    window.print();
                }, 500);

            } catch (err) {
                console.error('Error fetching lab request:', err);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) fetchLabRequest();
    }, [params.id]);

    if (loading) return <div className="p-10">Loading lab request...</div>;
    if (!callData) return <div className="p-10">Lab request not found.</div>;

    const patient = callData.patient || {};
    const doctor = callData.provider || {};

    return (
        <div className="bg-white min-h-screen text-black">
            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto p-8 border border-gray-200 shadow-sm print:shadow-none print:border-none mt-8 print:mt-0 relative">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-orange-600 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                            <FlaskConical size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-orange-900">MedLud Telemedicine</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Official Lab Requisition Form</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-600 space-y-1">
                        <p className="flex items-center justify-end gap-1"><MapPin size={12}/> 123 Health Avenue, Lagos</p>
                        <p className="flex items-center justify-end gap-1"><Phone size={12}/> +234 800 MEDLUD</p>
                        <p className="flex items-center justify-end gap-1"><Mail size={12}/> support@medlud.com</p>
                    </div>
                </div>

                {/* Patient & Req Info */}
                <div className="flex justify-between mb-8">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase">Patient Information</p>
                        <p className="font-bold text-lg">{patient.full_name}</p>
                        <p className="text-sm">MED ID: {patient.med_id || 'N/A'}</p>
                        {patient.dob && <p className="text-sm">Age/DOB: {moment().diff(patient.dob, 'years')} yrs ({moment(patient.dob).format('DD/MM/YYYY')})</p>}
                        {patient.gender && <p className="text-sm capitalize">Gender: {patient.gender}</p>}
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-sm font-bold text-gray-500 uppercase">Request Details</p>
                        <p className="text-sm"><span className="font-semibold">Date:</span> {moment(callData.created_at).format('MMM Do, YYYY')}</p>
                        <p className="text-sm"><span className="font-semibold">Req No:</span> LAB-{callData.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Lab Tests Content */}
                <div className="mb-12 min-h-[300px]">
                    
                    {callData.diagnosis_notes && (
                        <div className="mb-8 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Clinical Indication / Diagnosis</h4>
                            <p className="text-sm">{callData.diagnosis_notes}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                            Requested Investigations
                        </h4>
                        
                        <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                            {callData.required_lab_tests ? (
                                <ul className="list-inside list-disc space-y-3 text-lg font-medium text-gray-800 whitespace-pre-wrap pl-4">
                                    {callData.required_lab_tests.split('\n').map((test: string, idx: number) => (
                                        test.trim() ? <li key={idx}>{test.trim()}</li> : null
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No specific tests recorded in text.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Signature Footer */}
                <div className="flex justify-between items-end border-t border-gray-200 pt-8 mt-16">
                    <div>
                        <p className="text-xs text-gray-400">This lab request is digitally generated via MedLud Telemedicine.</p>
                        <p className="text-xs text-gray-400">Please attach original printed receipt to samples if required.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 h-12 mb-2 border-b border-gray-300"></div>
                        <p className="font-bold text-gray-900">Dr. {doctor.full_name}</p>
                        <p className="text-xs text-gray-600">{doctor.specialization || 'Consulting Physician'}</p>
                        {doctor.mdcn_number && <p className="text-xs text-gray-500 font-mono">MDCN: {doctor.mdcn_number}</p>}
                    </div>
                </div>

                {/* Print button */}
                <div className="mt-8 text-center no-print">
                    <button 
                        onClick={() => window.print()} 
                        className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-orange-700"
                    >
                        Print Lab Request
                    </button>
                </div>
            </div>
        </div>
    );
}
