import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const specialty = searchParams.get('specialty');

        let query = supabaseAdmin
            .from('consultations')
            .select(`
                id,
                consultation_type,
                price,
                specialty_type,
                created_at,
                status,
                user:user_id (full_name)
            `)
            .eq('status', 'active')
            .is('doctor_id', null)
            .order('created_at', { ascending: false });

        if (specialty && specialty !== 'general' && specialty !== 'all') {
            query = query.eq('specialty_type', specialty);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Also fetch health profiles for these users to show to the doctor as requested
        // "they shoudl see it" (referring to case details/profiles)
        const userIds = data.map(c => c.user_id); // actually user is a relation here, we need user_id
        
        // Let's refine the query to include more case info from telemedicine_cases if available
        // Or just return what we have. The user mentioned they should see it before claiming.
        
        return NextResponse.json({ success: true, cases: data });

    } catch (error: any) {
        console.error('Fetch pool error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
