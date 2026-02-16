'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Video, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function TelenusingPage() {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const timeSlots: TimeSlot[] = [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: false },
        { time: '11:00 AM', available: true },
        { time: '02:00 PM', available: true },
        { time: '03:00 PM', available: true },
        { time: '04:00 PM', available: false }
    ];

    const availableNurses = [
        { id: '1', name: 'Nurse Amina', specialty: 'Certified Midwife', rating: 4.9, available: true },
        { id: '2', name: 'Nurse Chioma', specialty: 'Maternal Health Specialist', rating: 4.8, available: true },
        { id: '3', name: 'Nurse Fatima', specialty: 'High-Risk Pregnancy Expert', rating: 4.9, available: false }
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard/maternal"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Maternal Health</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-primary">Telenursing Consultation</h1>
                    <p className="text-text-secondary">Video consultation with maternal health specialists</p>
                </div>

                {/* Available Nurses */}
                <div className="space-y-4">
                    <h3 className="font-bold text-text-primary">Available Nurses</h3>
                    <div className="grid gap-4">
                        {availableNurses.map((nurse) => (
                            <div
                                key={nurse.id}
                                className={`bg-white rounded-xl border border-border p-5 ${nurse.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
                                    } transition-all`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                                        <User size={24} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-text-primary">{nurse.name}</h4>
                                            {nurse.available && (
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text-secondary mb-2">{nurse.specialty}</p>
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="text-yellow-500">★</span>
                                            <span className="font-medium text-text-primary">{nurse.rating}</span>
                                            <span className="text-text-secondary">(100+ consultations)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schedule Consultation */}
                <div className="bg-white rounded-xl border border-border p-6 space-y-6">
                    <h3 className="font-bold text-text-primary">Schedule Consultation</h3>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                            <Calendar size={16} />
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Time Slots */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                            <Clock size={16} />
                            Select Time
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {timeSlots.map((slot) => (
                                <button
                                    key={slot.time}
                                    onClick={() => slot.available && setSelectedTime(slot.time)}
                                    disabled={!slot.available}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${selectedTime === slot.time
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : slot.available
                                            ? 'border-border hover:border-primary/50 text-text-primary'
                                            : 'border-border bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {slot.time}
                                    {!slot.available && <span className="block text-xs">Booked</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Book Button */}
                    <Link href="/dashboard/appointments/book?category=maternal">
                        <Button
                            className="w-full"
                            disabled={!selectedDate || !selectedTime}
                        >
                            <Video size={20} className="mr-2" />
                            Book Video Consultation
                        </Button>
                    </Link>
                </div>

                {/* Info Box */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-900">
                    <p className="font-medium mb-1">📹 What to Expect</p>
                    <ul className="text-purple-700 space-y-1 mt-2">
                        <li>• 30-minute video consultation</li>
                        <li>• Private and secure connection</li>
                        <li>• Pregnancy-focused guidance</li>
                        <li>• Follow-up notes provided</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
