import { supabase } from '@/lib/supabase';

export interface AdminNotification {
    id: string;
    type: 'appointment' | 'user' | 'system' | 'alert';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    action_url: string | null;
    created_at: string;
    read_at: string | null;
}

export interface SystemActivity {
    id: string;
    activity_type: 'login' | 'appointment' | 'user_action' | 'system';
    user_id: string | null;
    description: string;
    metadata: any;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export interface SystemHealthMetric {
    id: string;
    metric_type: 'database' | 'api' | 'storage';
    metric_name: string;
    metric_value: number;
    status: 'healthy' | 'warning' | 'critical';
    created_at: string;
}

/**
 * Fetch unread notifications
 */
export async function getUnreadNotifications(): Promise<AdminNotification[]> {
    const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch all notifications with pagination
 */
export async function getAllNotifications(limit: number = 100): Promise<AdminNotification[]> {
    const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
    const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

/**
 * Create a new notification
 */
export async function createNotification(
    type: AdminNotification['type'],
    title: string,
    message: string,
    severity: AdminNotification['severity'] = 'info',
    actionUrl?: string
): Promise<void> {
    const { error } = await supabase
        .from('admin_notifications')
        .insert({
            type,
            title,
            message,
            severity,
            action_url: actionUrl || null
        });

    if (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Fetch recent system activity
 */
export async function getSystemActivity(limit: number = 50): Promise<SystemActivity[]> {
    const { data, error } = await supabase
        .from('system_activity')
        .select(`
            *,
            user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching system activity:', error);
        return [];
    }

    return data || [];
}

/**
 * Log system activity
 */
export async function logSystemActivity(
    activityType: SystemActivity['activity_type'],
    description: string,
    userId?: string,
    metadata?: any
): Promise<void> {
    const { error } = await supabase
        .from('system_activity')
        .insert({
            activity_type: activityType,
            user_id: userId || null,
            description,
            metadata: metadata || null
        });

    if (error) {
        console.error('Error logging system activity:', error);
    }
}

/**
 * Fetch system health metrics
 */
export async function getSystemHealthMetrics(): Promise<{
    database: SystemHealthMetric[];
    api: SystemHealthMetric[];
    storage: SystemHealthMetric[];
}> {
    const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching health metrics:', error);
        return { database: [], api: [], storage: [] };
    }

    const metrics = data || [];

    return {
        database: metrics.filter(m => m.metric_type === 'database'),
        api: metrics.filter(m => m.metric_type === 'api'),
        storage: metrics.filter(m => m.metric_type === 'storage')
    };
}

/**
 * Record system health metric
 */
export async function recordHealthMetric(
    metricType: SystemHealthMetric['metric_type'],
    metricName: string,
    metricValue: number,
    status: SystemHealthMetric['status'] = 'healthy'
): Promise<void> {
    const { error } = await supabase
        .from('system_health_metrics')
        .insert({
            metric_type: metricType,
            metric_name: metricName,
            metric_value: metricValue,
            status
        });

    if (error) {
        console.error('Error recording health metric:', error);
    }
}

/**
 * Get current system health summary
 */
export async function getSystemHealthSummary() {
    // Get database stats
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

    // Calculate response time (mock - would need actual API monitoring)
    const apiResponseTime = Math.random() * 200 + 50; // 50-250ms

    // Calculate storage usage (mock - would need actual storage API)
    const storageUsed = Math.random() * 50 + 10; // 10-60 GB

    return {
        database: {
            status: 'healthy' as const,
            totalUsers: totalUsers || 0,
            totalAppointments: totalAppointments || 0,
            connectionPool: 95 // percentage
        },
        api: {
            status: apiResponseTime < 200 ? 'healthy' as const : 'warning' as const,
            responseTime: Math.round(apiResponseTime),
            uptime: 99.9,
            requestsPerMinute: Math.floor(Math.random() * 100 + 50)
        },
        storage: {
            status: storageUsed < 50 ? 'healthy' as const : 'warning' as const,
            used: Math.round(storageUsed),
            total: 100,
            percentage: Math.round(storageUsed)
        }
    };
}

/**
 * USER NOTIFICATIONS
 */

export interface UserNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'APPOINTMENT' | 'TELEMEDICINE' | 'SYSTEM' | 'PRESCRIPTION';
    is_read: boolean;
    action_url: string | null;
    created_at: string;
    read_at: string | null;
}

/**
 * Fetch notifications for a specific user
 */
export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching user notifications:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark user notification as read
 */
export async function markUserNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking user notification as read:', error);
        throw error;
    }
}

/**
 * Create a notification for a specific user
 */
export async function createUserNotification(
    userId: string,
    title: string,
    message: string,
    type: UserNotification['type'] = 'SYSTEM',
    actionUrl?: string
): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .insert({
            user_id: userId,
            title,
            message,
            type,
            action_url: actionUrl || null
        });

    if (error) {
        console.error('Error creating user notification:', error);
        throw error;
    }
}

/**
 * Broadcast a notification to ALL profiles in the system
 */
export async function broadcastToAllUsers(
    title: string,
    message: string,
    type: UserNotification['type'] = 'SYSTEM',
    actionUrl?: string
): Promise<{ success: boolean; count: number; error?: any }> {
    try {
        // 1. Fetch all profile IDs (target EVERYONE)
        const { data: users, error: fetchError } = await supabase
            .from('profiles')
            .select('id');

        if (fetchError) throw fetchError;
        if (!users || users.length === 0) return { success: true, count: 0 };

        // 2. Prepare batch insert
        const notifications = users.map(user => ({
            user_id: user.id,
            title,
            message,
            type,
            action_url: actionUrl || null
        }));

        // 3. Insert in batches
        const { error: insertError } = await supabase
            .from('user_notifications')
            .insert(notifications);

        if (insertError) throw insertError;

        return { success: true, count: users.length };
    } catch (error) {
        console.error('Error broadcasting to users:', error);
        return { success: false, count: 0, error };
    }
}

/**
 * Automate a notification for a patient based on an appointment event
 */
export async function notifyPatientOfAppointmentEvent(
    appointmentId: string,
    event: 'APPROVED' | 'COMPLETED' | 'CANCELED' | 'REASSIGNED',
    metadata?: { doctorName?: string; note?: string }
): Promise<void> {
    try {
        // 1. Get the patient ID for this appointment
        const { data: apt, error: fetchError } = await supabase
            .from('appointments')
            .select('user_id, title')
            .eq('id', appointmentId)
            .single();

        if (fetchError || !apt?.user_id) {
            console.error('Could not fetch patient ID for notification:', fetchError);
            return;
        }

        let title = 'Appointment Update';
        let message = '';
        let type: UserNotification['type'] = 'APPOINTMENT';

        switch (event) {
            case 'APPROVED':
                title = 'Appointment Approved';
                message = `Your appointment "${apt.title}" has been approved.`;
                break;
            case 'COMPLETED':
                title = 'Consultation Completed';
                message = `Your consultation for "${apt.title}" is complete. Check your results.`;
                if (metadata?.note) message += ` Note: ${metadata.note}`;
                break;
            case 'CANCELED':
                title = 'Appointment Canceled';
                message = `Your appointment "${apt.title}" was canceled.`;
                break;
            case 'REASSIGNED':
                title = 'Doctor Assigned';
                message = metadata?.doctorName
                    ? `Dr. ${metadata.doctorName} has been assigned to your case: "${apt.title}".`
                    : `A new doctor has been assigned to your case: "${apt.title}".`;
                break;
        }

        await createUserNotification(
            apt.user_id,
            title,
            message,
            type,
            `/dashboard/appointments/${appointmentId}`
        );
    } catch (err) {
        console.error('Error in notifyPatientOfAppointmentEvent:', err);
    }
}

/**
 * Notify patient about a new prescription
 */
export async function notifyPatientOfPrescription(
    appointmentId: string,
    medicationCount: number
): Promise<void> {
    try {
        const { data: apt, error: fetchError } = await supabase
            .from('appointments')
            .select('user_id, title')
            .eq('id', appointmentId)
            .single();

        if (fetchError || !apt?.user_id) return;

        await createUserNotification(
            apt.user_id,
            'New Prescription Added',
            `Your doctor has added ${medicationCount} medication(s) to your consultation: "${apt.title}".`,
            'PRESCRIPTION',
            `/dashboard/appointments/${appointmentId}`
        );
    } catch (err) {
        console.error('Error in notifyPatientOfPrescription:', err);
    }
}

/**
 * Notify patient of a new message from the doctor
 */
export async function notifyPatientOfNewMessage(
    appointmentId: string,
    doctorName: string,
    messageSnippet: string
): Promise<void> {
    try {
        const { data: apt, error: fetchError } = await supabase
            .from('appointments')
            .select('user_id, title')
            .eq('id', appointmentId)
            .single();

        if (fetchError || !apt?.user_id) return;

        await createUserNotification(
            apt.user_id,
            `New Message from Dr. ${doctorName}`,
            `"${messageSnippet.slice(0, 50)}${messageSnippet.length > 50 ? '...' : ''}"`,
            'TELEMEDICINE',
            `/dashboard/appointments/${appointmentId}`
        );
    } catch (err) {
        console.error('Error in notifyPatientOfNewMessage:', err);
    }
}
