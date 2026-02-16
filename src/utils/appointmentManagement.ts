import { supabase } from '@/lib/supabase';
import { notifyPatientOfAppointmentEvent } from './notifications';

export interface AppointmentHistory {
    id: string;
    appointment_id: string;
    changed_by: string;
    old_status: string | null;
    new_status: string | null;
    old_staff_id: string | null;
    new_staff_id: string | null;
    change_note: string | null;
    created_at: string;
    changed_by_profile?: {
        full_name: string;
        email: string;
    };
}

/**
 * Log appointment status or staff change
 */
export async function logAppointmentChange(
    appointmentId: string,
    changedBy: string,
    changes: {
        oldStatus?: string;
        newStatus?: string;
        oldStaffId?: string;
        newStaffId?: string;
        note?: string;
    }
): Promise<void> {
    const { error } = await supabase
        .from('appointment_history')
        .insert({
            appointment_id: appointmentId,
            changed_by: changedBy,
            old_status: changes.oldStatus || null,
            new_status: changes.newStatus || null,
            old_staff_id: changes.oldStaffId || null,
            new_staff_id: changes.newStaffId || null,
            change_note: changes.note || null
        });

    if (error) {
        console.error('Error logging appointment change:', error);
        throw error;
    }

    // Proactively notify patient on major status changes if logged here
    if (changes.newStatus && ['APPROVED', 'COMPLETED', 'CANCELED'].includes(changes.newStatus)) {
        await notifyPatientOfAppointmentEvent(appointmentId, changes.newStatus as any, { note: changes.note });
    }
}

/**
 * Get appointment history
 */
export async function getAppointmentHistory(appointmentId: string): Promise<AppointmentHistory[]> {
    const { data, error } = await supabase
        .from('appointment_history')
        .select(`
            *,
            changed_by_profile:profiles!changed_by(full_name, email)
        `)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching appointment history:', error);
        return [];
    }

    return data || [];
}

/**
 * Reassign appointment to different staff member
 */
export async function reassignAppointment(
    appointmentId: string,
    newStaffId: string,
    changedBy: string,
    oldStaffId?: string
): Promise<void> {
    // Get staff name for notification
    const { data: staff } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', newStaffId)
        .single();

    const { error } = await supabase
        .from('appointments')
        .update({ staff_id: newStaffId })
        .eq('id', appointmentId);

    if (error) {
        console.error('Error reassigning appointment:', error);
        throw error;
    }

    // Log the change
    await logAppointmentChange(appointmentId, changedBy, {
        oldStaffId,
        newStaffId,
        note: 'Appointment reassigned'
    });

    // Notify Patient
    await notifyPatientOfAppointmentEvent(appointmentId, 'REASSIGNED', {
        doctorName: staff?.full_name
    });
}

/**
 * Bulk update appointment status
 */
export async function bulkUpdateAppointmentStatus(
    appointmentIds: string[],
    newStatus: string,
    changedBy: string
): Promise<void> {
    // Update all appointments
    const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .in('id', appointmentIds);

    if (error) {
        console.error('Error bulk updating appointments:', error);
        throw error;
    }

    // Log changes for each appointment (this will trigger notifications via logAppointmentChange)
    const logPromises = appointmentIds.map(id =>
        logAppointmentChange(id, changedBy, {
            newStatus,
            note: `Bulk status update to ${newStatus}`
        })
    );

    await Promise.all(logPromises);
}

/**
 * Fetch all staff members for assignment
 */
export async function getAvailableStaff() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['doctor', 'nurse', 'nurse-assistant', 'mental-health'])
        .order('full_name');

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }

    return data || [];
}
