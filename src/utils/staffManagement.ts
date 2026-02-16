import { supabase } from '@/lib/supabase';

export interface StaffMetrics {
    staffId: string;
    staffName: string;
    role: string;
    totalAppointments: number;
    completedAppointments: number;
    averageRating: number;
    totalRatings: number;
    responseTime: number; // in hours
    completionRate: number; // percentage
}

export interface StaffRating {
    id: string;
    staff_id: string;
    appointment_id: string;
    patient_id: string;
    rating: number;
    feedback: string | null;
    created_at: string;
    patient?: {
        full_name: string;
        email: string;
    };
}

export interface StaffAvailability {
    id: string;
    staff_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

/**
 * Fetch comprehensive staff performance metrics
 */
export async function getStaffMetrics(): Promise<StaffMetrics[]> {
    // Get all staff members
    const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['doctor', 'nurse', 'nurse-assistant', 'mental-health']);

    if (staffError || !staff) {
        console.error('Error fetching staff:', staffError);
        return [];
    }

    // Get metrics for each staff member
    const metricsPromises = staff.map(async (member) => {
        // Total appointments
        const { count: totalAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', member.id);

        // Completed appointments
        const { count: completedAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', member.id)
            .eq('status', 'COMPLETED');

        // Ratings
        const { data: ratings } = await supabase
            .from('staff_ratings')
            .select('rating')
            .eq('staff_id', member.id);

        const averageRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        const completionRate = totalAppointments && totalAppointments > 0
            ? (completedAppointments || 0) / totalAppointments * 100
            : 0;

        return {
            staffId: member.id,
            staffName: member.full_name || member.id,
            role: member.role,
            totalAppointments: totalAppointments || 0,
            completedAppointments: completedAppointments || 0,
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings: ratings?.length || 0,
            responseTime: 0, // Placeholder - would need appointment timestamps
            completionRate: Math.round(completionRate * 10) / 10
        };
    });

    return Promise.all(metricsPromises);
}

/**
 * Get staff ratings with patient info
 */
export async function getStaffRatings(staffId: string): Promise<StaffRating[]> {
    const { data, error } = await supabase
        .from('staff_ratings')
        .select(`
            *,
            patient:profiles!patient_id(full_name, email)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching ratings:', error);
        return [];
    }

    return data || [];
}

/**
 * Submit a rating for a staff member
 */
export async function submitStaffRating(
    staffId: string,
    appointmentId: string,
    patientId: string,
    rating: number,
    feedback?: string
): Promise<void> {
    const { error } = await supabase
        .from('staff_ratings')
        .insert({
            staff_id: staffId,
            appointment_id: appointmentId,
            patient_id: patientId,
            rating,
            feedback: feedback || null
        });

    if (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
}

/**
 * Get staff availability schedule
 */
export async function getStaffAvailability(staffId: string): Promise<StaffAvailability[]> {
    const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week');

    if (error) {
        console.error('Error fetching availability:', error);
        return [];
    }

    return data || [];
}

/**
 * Update staff availability
 */
export async function updateStaffAvailability(
    staffId: string,
    availability: Omit<StaffAvailability, 'id' | 'staff_id'>[]
): Promise<void> {
    // Delete existing availability
    await supabase
        .from('staff_availability')
        .delete()
        .eq('staff_id', staffId);

    // Insert new availability
    const { error } = await supabase
        .from('staff_availability')
        .insert(
            availability.map(slot => ({
                staff_id: staffId,
                ...slot
            }))
        );

    if (error) {
        console.error('Error updating availability:', error);
        throw error;
    }
}
