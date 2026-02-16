import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
    start: Date;
    end: Date;
}

export interface AnalyticsData {
    userRegistrations: { date: string; count: number }[];
    appointmentsByCategory: { category: string; count: number }[];
    appointmentsByHour: { hour: number; count: number }[];
    totalUsers: number;
    totalAppointments: number;
    pendingAppointments: number;
    activeStaff: number;
}

/**
 * Get date range based on time range selection
 */
export function getDateRange(timeRange: TimeRange, customRange?: DateRange): DateRange {
    const now = new Date();

    switch (timeRange) {
        case 'today':
            return {
                start: startOfDay(now),
                end: endOfDay(now)
            };
        case 'week':
            return {
                start: startOfDay(subDays(now, 7)),
                end: endOfDay(now)
            };
        case 'month':
            return {
                start: startOfMonth(now),
                end: endOfMonth(now)
            };
        case 'year':
            return {
                start: startOfYear(now),
                end: endOfYear(now)
            };
        case 'custom':
            return customRange || { start: startOfDay(now), end: endOfDay(now) };
        default:
            return {
                start: startOfDay(subDays(now, 7)),
                end: endOfDay(now)
            };
    }
}

/**
 * Fetch analytics data for admin dashboard
 */
export async function fetchAnalyticsData(dateRange: DateRange): Promise<AnalyticsData> {
    const { start, end } = dateRange;

    // Fetch user registrations over time
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

    // Fetch appointments by category
    const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('category, created_at, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    // Fetch total counts
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

    const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

    const { count: activeStaff } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['doctor', 'nurse', 'nurse-assistant', 'mental-health']);

    // Process user registrations by date
    const userRegistrations = processUserRegistrations(users || []);

    // Process appointments by category
    const appointmentsByCategory = processAppointmentsByCategory(appointments || []);

    // Process appointments by hour
    const appointmentsByHour = processAppointmentsByHour(appointments || []);

    return {
        userRegistrations,
        appointmentsByCategory,
        appointmentsByHour,
        totalUsers: totalUsers || 0,
        totalAppointments: totalAppointments || 0,
        pendingAppointments: pendingAppointments || 0,
        activeStaff: activeStaff || 0
    };
}

function processUserRegistrations(users: any[]): { date: string; count: number }[] {
    const registrationMap = new Map<string, number>();

    users.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString();
        registrationMap.set(date, (registrationMap.get(date) || 0) + 1);
    });

    return Array.from(registrationMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function processAppointmentsByCategory(appointments: any[]): { category: string; count: number }[] {
    const categoryMap = new Map<string, number>();

    appointments.forEach(apt => {
        const category = apt.category || 'general';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
        count
    }));
}

function processAppointmentsByHour(appointments: any[]): { hour: number; count: number }[] {
    const hourMap = new Map<number, number>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
        hourMap.set(i, 0);
    }

    appointments.forEach(apt => {
        const hour = new Date(apt.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    return Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);
}
