'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StaffAvailability } from '@/utils/staffManagement';

interface AvailabilityManagerProps {
    staffId: string;
    staffName: string;
    availability: StaffAvailability[];
    onUpdate: (availability: Omit<StaffAvailability, 'id' | 'staff_id'>[]) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
    staffId,
    staffName,
    availability,
    onUpdate
}) => {
    const [slots, setSlots] = useState<Omit<StaffAvailability, 'id' | 'staff_id'>[]>(
        availability.map(({ day_of_week, start_time, end_time, is_available }) => ({
            day_of_week,
            start_time,
            end_time,
            is_available
        }))
    );
    const [isEditing, setIsEditing] = useState(false);

    const addSlot = () => {
        setSlots([
            ...slots,
            {
                day_of_week: 1, // Monday
                start_time: '09:00',
                end_time: '17:00',
                is_available: true
            }
        ]);
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: keyof Omit<StaffAvailability, 'id' | 'staff_id'>, value: any) => {
        const updated = [...slots];
        updated[index] = { ...updated[index], [field]: value };
        setSlots(updated);
    };

    const handleSave = () => {
        onUpdate(slots);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Calendar size={24} className="text-primary" />
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Availability Schedule</h3>
                        <p className="text-sm text-text-secondary">{staffName}</p>
                    </div>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} size="sm">
                        Edit Schedule
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm">
                            Save Changes
                        </Button>
                        <Button
                            onClick={() => {
                                setIsEditing(false);
                                setSlots(availability.map(({ day_of_week, start_time, end_time, is_available }) => ({
                                    day_of_week,
                                    start_time,
                                    end_time,
                                    is_available
                                })));
                            }}
                            variant="outline"
                            size="sm"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {slots.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                        <Clock size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No availability slots configured</p>
                        {isEditing && (
                            <Button onClick={addSlot} size="sm" className="mt-4">
                                <Plus size={16} className="mr-1" />
                                Add Slot
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {slots.map((slot, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                {isEditing ? (
                                    <>
                                        <select
                                            value={slot.day_of_week}
                                            onChange={(e) => updateSlot(index, 'day_of_week', parseInt(e.target.value))}
                                            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            {DAYS.map((day, i) => (
                                                <option key={i} value={i}>{day}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="time"
                                            value={slot.start_time}
                                            onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                                            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <span className="text-text-secondary">to</span>
                                        <input
                                            type="time"
                                            value={slot.end_time}
                                            onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                                            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            onClick={() => removeSlot(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <p className="font-semibold text-text-primary">
                                                {DAYS[slot.day_of_week]}
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                {slot.start_time} - {slot.end_time}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${slot.is_available
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {slot.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <Button onClick={addSlot} variant="outline" size="sm" className="w-full">
                                <Plus size={16} className="mr-1" />
                                Add Another Slot
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
