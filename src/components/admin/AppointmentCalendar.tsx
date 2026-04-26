'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types/appointment';

const localizer = momentLocalizer(moment);



interface CalendarEvent extends BigCalendarEvent {
    id: string;
    appointment: Appointment;
    resource?: any;
}

interface AppointmentCalendarProps {
    onEventClick?: (appointment: Appointment) => void;
    onEventDrop?: (appointmentId: string, newStaffId: string, oldStaffId: string | null) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
    onEventClick,
    onEventDrop
}) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            // Step 1: Fetch appointments and staff profiles
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    staff:profiles!staff_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (aptError) {
                console.error('Supabase error fetching appointments for calendar:', aptError);
                throw aptError;
            }

            if (!aptData || aptData.length === 0) {
                setAppointments([]);
                return;
            }

            // Step 2: Fetch user profiles separately
            const userIds = [...new Set(aptData.map((apt: any) => apt.user_id).filter(Boolean))];

            let userProfiles: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds);

                if (profilesError) {
                    console.error('Error fetching user profiles for calendar:', profilesError);
                } else {
                    profilesData?.forEach(p => {
                        userProfiles[p.id] = p;
                    });
                }
            }

            // Step 3: Map data together
            const mappedData: Appointment[] = aptData.map((apt: any) => ({
                ...apt,
                user: userProfiles[apt.user_id] || null,
                staff: Array.isArray(apt.staff) ? apt.staff[0] : apt.staff
            }));

            setAppointments(mappedData);
        } catch (error: any) {
            console.error('Error loading appointments for calendar (catch):', error);
        } finally {
            setLoading(false);
        }
    };

    const events: CalendarEvent[] = useMemo(() => {
        return appointments.map(apt => {
            // Use date field if available, otherwise use created_at
            const eventDate = apt.date ? new Date(apt.date) : (apt.created_at ? new Date(apt.created_at) : new Date());

            return {
                id: apt.id,
                title: `${apt.title} - ${apt.user?.full_name || 'Unknown'}`,
                start: eventDate,
                end: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour duration
                appointment: apt,
                resource: apt
            };
        });
    }, [appointments]);

    const eventStyleGetter = (event: CalendarEvent) => {
        const { category, status } = event.appointment;

        let backgroundColor = '#3b82f6'; // blue for general

        if (category === 'mental-health') {
            backgroundColor = '#8b5cf6'; // purple
        } else if (category === 'maternal') {
            backgroundColor = '#ec4899'; // pink
        }

        if (status === 'COMPLETED') {
            backgroundColor = '#10b981'; // green
        } else if (status === 'CANCELLED') {
            backgroundColor = '#ef4444'; // red
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (onEventClick) {
            onEventClick(event.appointment);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-white rounded-xl border border-border">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-text-secondary">Loading calendar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="h-[600px]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    views={['month', 'week', 'day']}
                />
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-text-secondary">General</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <span className="text-text-secondary">Mental Health</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-pink-500"></div>
                    <span className="text-text-secondary">Maternal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-text-secondary">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-text-secondary">Cancelled</span>
                </div>
            </div>
        </div>
    );
};
