import React from 'react';
import Image from 'next/image';
import { Pill, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PrescriptionItem {
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
}

interface PrescriptionCardProps {
    id?: string;
    doctorName: string;
    date: string;
    items: PrescriptionItem[];
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ id, doctorName, date, items }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-xl border-2 border-primary/20 overflow-hidden shadow-sm prescription-printable">
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        {/* Logo */}
                        <div className="relative w-16 h-16">
                            <Image
                                src="/medlud-logo.png"
                                alt="MedLud Logo"
                                width={64}
                                height={64}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">MedLud</h1>
                            <p className="text-xs text-primary font-medium tracking-wide uppercase mt-0.5">Empowering Healthcare Through Intelligence</p>
                            <p className="text-xs text-gray-500 mt-1">www.medlud.com</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="bg-primary/5 px-3 py-1 rounded-lg border border-primary/10 inline-block mb-2">
                            <h3 className="font-bold text-primary text-sm uppercase tracking-wide">E-Prescription</h3>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Dr. {doctorName}</p>
                        <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="font-mono text-[10px] text-gray-400 mt-1">RX ID: #{id ? id.slice(0, 8).toUpperCase() : 'PENDING'}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-text-secondary text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3">Medicine</th>
                            <th className="px-4 py-3">Dosage</th>
                            <th className="px-4 py-3">Frequency</th>
                            <th className="px-4 py-3 text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-medium text-text-primary">
                                    <div className="flex items-center gap-2">
                                        <Pill size={14} className="text-primary/60" />
                                        {item.medicine}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-text-secondary">{item.dosage}</td>
                                <td className="px-4 py-3 text-text-secondary">{item.frequency}</td>
                                <td className="px-4 py-3 text-right text-text-primary font-medium">{item.duration}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Actions */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-2 no-print">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer size={16} className="mr-2" /> Print E-Copy
                </Button>
                <Button size="sm" onClick={handlePrint}>
                    <Download size={16} className="mr-2" /> Download e-Prescription
                </Button>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body * { visibility: hidden; }
                    .prescription-printable, .prescription-printable * { visibility: visible; }
                    .prescription-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
};
