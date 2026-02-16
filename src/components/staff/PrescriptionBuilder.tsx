'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Prescription } from '@/types/appointment';

interface PrescriptionBuilderProps {
    value: Prescription[];
    onChange: (prescriptions: Prescription[]) => void;
    appointmentId?: string;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({ value, onChange, appointmentId }) => {
    const addMedication = () => {
        const newPrescription: Prescription = {
            id: Date.now().toString(),
            appointment_id: appointmentId || '',
            medication: '',
            dosage: '',
            frequency: '',
            duration: '',
        };
        onChange([...value, newPrescription]);
    };

    const updateMedication = (id: string, field: keyof Prescription, val: string) => {
        const updated = value.map(p =>
            p.id === id ? { ...p, [field]: val } : p
        );
        onChange(updated);
    };

    const removeMedication = (id: string) => {
        onChange(value.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Pill size={16} className="text-primary" />
                    Prescriptions
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                    className="text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                >
                    <Plus size={14} className="mr-1" /> Add Medication
                </Button>
            </div>

            {value.length === 0 ? (
                <div
                    className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 hover:bg-gray-100/80 transition-colors cursor-pointer"
                    onClick={addMedication}
                >
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <Pill size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">No medications added yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Add Medication" to start a prescription.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {value.map((presc) => (
                        <div key={presc.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => removeMedication(presc.id)}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove medication"
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Medication Name</label>
                                    <input
                                        type="text"
                                        value={presc.medication}
                                        onChange={(e) => updateMedication(presc.id, 'medication', e.target.value)}
                                        placeholder="e.g. Amoxicillin"
                                        className="w-full text-sm font-medium p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Dosage</label>
                                    <input
                                        type="text"
                                        value={presc.dosage}
                                        onChange={(e) => updateMedication(presc.id, 'dosage', e.target.value)}
                                        placeholder="e.g. 500mg"
                                        className="w-full text-sm font-medium p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Frequency</label>
                                    <input
                                        type="text"
                                        value={presc.frequency}
                                        onChange={(e) => updateMedication(presc.id, 'frequency', e.target.value)}
                                        placeholder="e.g. Twice daily after food"
                                        className="w-full text-sm font-medium p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Duration</label>
                                    <input
                                        type="text"
                                        value={presc.duration}
                                        onChange={(e) => updateMedication(presc.id, 'duration', e.target.value)}
                                        placeholder="e.g. 5 days"
                                        className="w-full text-sm font-medium p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Notes (Optional)</label>
                                <input
                                    type="text"
                                    value={presc.notes || ''}
                                    onChange={(e) => updateMedication(presc.id, 'notes', e.target.value)}
                                    placeholder="Special instructions for the patient..."
                                    className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addMedication}
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-primary border-2 border-dashed border-primary/20 rounded-2xl hover:bg-primary/5 hover:border-primary/40 transition-all group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Add Another Medication
                    </button>
                </div>
            )}
        </div>
    );
};
