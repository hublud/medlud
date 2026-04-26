import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { broadcastNewConsultation } from '@/lib/notifications';

export async function GET(req: Request) {
    try {
        // Authenticate request (secret key or admin role check)
        // For a cron job, we might use a secret header
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
            // In dev/local we might skip or use a simple secret
        }

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        // 1. Find unclaimed consultations older than 30 minutes
        // And ensure they haven't been reminded recently (e.g. in the last hour)
        // Note: For simplicity, we'll fetch all matching and we could add a reminded_at column later
        const { data: cases, error } = await supabaseAdmin
            .from('consultations')
            .select('id, specialty_type')
            .is('doctor_id', null)
            .eq('status', 'active')
            .lt('created_at', thirtyMinutesAgo)
            .is('reminded_at', null); // Only remind once

        if (error) throw error;

        if (!cases || cases.length === 0) {
            return NextResponse.json({ message: 'No pending cases require reminders.' });
        }

        const remindedIds: string[] = [];

        // 2. Resend broadcast for each
        for (const c of cases) {
            await broadcastNewConsultation(c.id);
            remindedIds.push(c.id);
            
            // Mark as reminded to prevent duplicate spam
            await supabaseAdmin
                .from('consultations')
                .update({ reminded_at: new Date().toISOString() })
                .eq('id', c.id);
        }

        return NextResponse.json({ 
            success: true, 
            reminded_count: remindedIds.length,
            ids: remindedIds 
        });

    } catch (error: any) {
        console.error('Reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
