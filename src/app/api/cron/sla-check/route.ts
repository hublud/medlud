import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notifySLAReminder } from '@/lib/notifications';

/**
 * CRON JOB: SLA Monitoring
 * This endpoint should be called every 15-30 minutes by a cron service.
 * It checks for active consultations where no reply has been sent for > 30 minutes.
 */
export async function GET(req: Request) {
    try {
        // Authenticate the cron request if needed (e.g., check for a secret header)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);

        console.log(`Running SLA check at ${now.toISOString()}`);

        // 1. Fetch active appointments with assigned doctors
        const { data: appointments, error: aptError } = await supabaseAdmin
            .from('appointments')
            .select('id, title, status, doctor_id, user_id')
            .in('status', ['PENDING', 'RESPONDED'])
            .not('doctor_id', 'is', null);

        if (aptError) throw aptError;
        if (!appointments || appointments.length === 0) {
            return NextResponse.json({ message: 'No active appointments found for SLA check' });
        }

        let notificationsSent = 0;

        // 2. For each appointment, check the last message
        for (const apt of appointments) {
            const { data: messages, error: msgError } = await supabaseAdmin
                .from('messages')
                .select('*')
                .eq('appointment_id', apt.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (msgError) {
                console.error(`Error fetching messages for apt ${apt.id}:`, msgError);
                continue;
            }

            // If no messages yet, check the appointment's created_at (initial patient query)
            if (!messages || messages.length === 0) {
                // If it's a new appointment with no doctor message yet, the doctor is "due"
                // But we only care if it's been > 30 mins since the appointment was created
                const { data: aptData } = await supabaseAdmin
                    .from('appointments')
                    .select('created_at')
                    .eq('id', apt.id)
                    .single();
                
                if (aptData && new Date(aptData.created_at!) < thirtyMinsAgo && new Date(aptData.created_at!) > fortyFiveMinsAgo) {
                    await notifySLAReminder(apt.id, 'DOCTOR');
                    notificationsSent++;
                }
                continue;
            }

            const lastMsg = messages[0];
            const lastMsgTime = new Date(lastMsg.created_at!);

            // 3. Apply the 30-45 minute window logic
            // This ensures if the cron runs every 15 mins, we only hit this message ONCE.
            if (lastMsgTime < thirtyMinsAgo && lastMsgTime > fortyFiveMinsAgo) {
                // Determine who is "lagging"
                // If last message was from USER, then DOCTOR is lagging.
                // If last message was from DOCTOR, then USER is lagging.
                const targetRole = lastMsg.role === 'USER' ? 'DOCTOR' : 'USER';
                
                console.log(`SLA Breach detected for ${apt.id}. Notifying ${targetRole}.`);
                await notifySLAReminder(apt.id, targetRole);
                notificationsSent++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            checked: appointments.length,
            notified: notificationsSent,
            timestamp: now.toISOString()
        });

    } catch (error: any) {
        console.error('SLA Check Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
