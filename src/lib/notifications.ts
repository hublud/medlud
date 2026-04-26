import { supabaseAdmin } from './supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'missing_key');

export async function broadcastNewConsultation(consultationId: string) {
    try {
        // 1. Fetch consultation details
        const { data: consultation, error: consultError } = await supabaseAdmin
            .from('consultations')
            .select(`
                id, 
                consultation_type, 
                specialty_type,
                user:user_id (full_name)
            `)
            .eq('id', consultationId)
            .single();

        if (consultError || !consultation) {
            console.error('Error fetching consultation for broadcast:', consultError);
            return;
        }

        // 2. Fetch all doctors
        // Assuming doctors have role 'doctor' or 'specialist' in profiles table
        const { data: doctors, error: doctorsError } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .in('role', ['doctor', 'specialist']);

        if (doctorsError || !doctors || doctors.length === 0) {
            console.warn('No doctors found to notify');
            return;
        }

        const doctorEmails = doctors.map(d => d.email).filter(Boolean) as string[];

        // 3. Send email via Resend
        const patientName = (consultation.user as any)?.full_name || 'A patient';
        const type = consultation.consultation_type === 'chat' ? 'Chat' : 
                     consultation.consultation_type === 'video' ? 'Video' : 'Voice';
        const specialty = consultation.specialty_type ? `(${consultation.specialty_type})` : '';

        const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/doctor/cases`;

        const { data, error } = await resend.emails.send({
            from: 'Medlud Notifications <notifications@medlud.com>',
            to: doctorEmails,
            subject: `New ${type} Consultation Request ${specialty}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #0d9488;">New Consultation Request</h2>
                    <p>Hello Doctor,</p>
                    <p>A new <strong>${type}</strong> consultation has been requested by <strong>${patientName}</strong>.</p>
                    ${consultation.specialty_type ? `<p><strong>Department:</strong> ${consultation.specialty_type}</p>` : ''}
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${claimUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            View and Claim Case
                        </a>
                    </div>
                    
                    <p style="font-size: 0.875rem; color: #64748b;">
                        This case is currently available in the pool. The first doctor to claim it will be assigned the consultation.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
                        &copy; 2026 Medlud. All rights reserved.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend email error:', error);
        } else {
            console.log('Broadcast email sent successfully:', data?.id);
        }

    } catch (err) {
        console.error('Unexpected error in broadcastNewConsultation:', err);
    }
}
/**
 * Helper to send a standardized Medlud email
 */
async function sendMedludEmail({ to, subject, title, body, actionUrl, actionText }: {
    to: string | string[],
    subject: string,
    title: string,
    body: string,
    actionUrl?: string,
    actionText?: string
}) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://medlud.com';
    const finalActionUrl = actionUrl?.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`;

    return await resend.emails.send({
        from: 'Medlud Notifications <notifications@medlud.com>',
        to,
        subject,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #334155;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #0d9488; margin: 0;">Medlud</h1>
                </div>
                <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
                <div style="line-height: 1.6; font-size: 16px;">
                    ${body}
                </div>
                
                ${actionUrl ? `
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${finalActionUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        ${actionText || 'View Details'}
                    </a>
                </div>
                ` : ''}
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                    Medlud - Your Health, Our Priority.<br />
                    &copy; 2026 Medlud. All rights reserved.
                </p>
            </div>
        `
    });
}

/**
 * Notify patient that a doctor has accepted their case
 */
export async function notifyPatientOfClaimedCase(appointmentId: string) {
    try {
        const { data: apt, error: aptError } = await supabaseAdmin
            .from('appointments')
            .select('title, user_id, profiles!appointments_user_id_fkey(email, full_name), doctor:profiles!appointments_doctor_id_fkey(full_name)')
            .eq('id', appointmentId)
            .single();

        if (aptError || !apt || !(apt.profiles as any)?.email) return;

        const patientEmail = (apt.profiles as any).email;
        const doctorName = (apt.doctor as any)?.full_name || 'A doctor';

        await sendMedludEmail({
            to: patientEmail,
            subject: `Dr. ${doctorName} has accepted your case`,
            title: 'Your Consultation is Ready',
            body: `<p>Great news! <strong>Dr. ${doctorName}</strong> has accepted your consultation request for <strong>"${apt.title}"</strong>.</p>
                   <p>The doctor is currently reviewing your case details and will respond shortly.</p>`,
            actionUrl: `/dashboard/appointments/${appointmentId}`,
            actionText: 'Join Consultation'
        });
    } catch (err) {
        console.error('Error in notifyPatientOfClaimedCase:', err);
    }
}

/**
 * Notify recipient of a new message
 */
export async function notifyNewResponse(appointmentId: string, senderRole: 'USER' | 'DOCTOR', messageContent: string) {
    try {
        const { data: apt, error: aptError } = await supabaseAdmin
            .from('appointments')
            .select(`
                title, 
                user_id, 
                doctor_id,
                patient:profiles!appointments_user_id_fkey(email, full_name),
                doctor:profiles!appointments_doctor_id_fkey(email, full_name)
            `)
            .eq('id', appointmentId)
            .single();

        if (aptError || !apt) return;

        const isPatientRecipient = senderRole === 'DOCTOR';
        const recipient = isPatientRecipient ? (apt.patient as any) : (apt.doctor as any);
        const senderName = isPatientRecipient ? ((apt.doctor as any)?.full_name || 'The Doctor') : ((apt.patient as any)?.full_name || 'The Patient');
        
        if (!recipient?.email) return;

        await sendMedludEmail({
            to: recipient.email,
            subject: `New message from ${senderName}`,
            title: 'New Consultation Message',
            body: `<p>You have a new message regarding <strong>"${apt.title}"</strong>:</p>
                   <blockquote style="background: #f8fafc; padding: 15px; border-left: 4px solid #0d9488; font-style: italic; margin: 20px 0;">
                     "${messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent}"
                   </blockquote>`,
            actionUrl: isPatientRecipient ? `/dashboard/appointments/${appointmentId}` : `/dashboard/staff/appointments/${appointmentId}`,
            actionText: 'Reply Now'
        });
    } catch (err) {
        console.error('Error in notifyNewResponse:', err);
    }
}

/**
 * Send an SLA reminder email
 */
export async function notifySLAReminder(appointmentId: string, targetRole: 'USER' | 'DOCTOR') {
    try {
        const { data: apt, error: aptError } = await supabaseAdmin
            .from('appointments')
            .select(`
                title, 
                patient:profiles!appointments_user_id_fkey(email, full_name),
                doctor:profiles!appointments_doctor_id_fkey(email, full_name)
            `)
            .eq('id', appointmentId)
            .single();

        if (aptError || !apt) return;

        const recipient = targetRole === 'USER' ? (apt.patient as any) : (apt.doctor as any);
        if (!recipient?.email) return;

        await sendMedludEmail({
            to: recipient.email,
            subject: `URGENT: Response Needed for "${apt.title}"`,
            title: 'Action Required',
            body: `<p>Hello ${recipient.full_name},</p>
                   <p>This is a reminder that there is an unresponded message in your consultation <strong>"${apt.title}"</strong>.</p>
                   <p>It has been over 30 minutes since the last message. Please reply to ensure the consultation proceeds efficiently.</p>`,
            actionUrl: targetRole === 'USER' ? `/dashboard/appointments/${appointmentId}` : `/dashboard/staff/appointments/${appointmentId}`,
            actionText: 'Go to Chat'
        });
    } catch (err) {
        console.error('Error in notifySLAReminder:', err);
    }
}
