import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // 1. Fetch consultation using service role client (bypasses RLS)
        const { data: consultation, error: cErr } = await supabaseAdmin
            .from('consultations')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (cErr) {
            console.error('[ConsultationCheck] Error fetching consultation:', cErr);
            return NextResponse.json({ error: 'Database query failed', details: cErr.message }, { status: 500 });
        }

        if (!consultation) {
            return NextResponse.json({ exists: false });
        }

        // 2. Fetch patient and doctor profiles
        const patientId = consultation.user_id;
        const doctorId = consultation.doctor_id;

        const [patientRes, doctorRes] = await Promise.all([
            patientId ? supabaseAdmin.from('profiles').select('full_name, email').eq('id', patientId).maybeSingle() : Promise.resolve({ data: null }),
            doctorId ? supabaseAdmin.from('profiles').select('full_name, email').eq('id', doctorId).maybeSingle() : Promise.resolve({ data: null })
        ]);

        return NextResponse.json({
            exists: true,
            consultationType: consultation.consultation_type,
            status: consultation.status,
            patientId: consultation.user_id,
            patientName: patientRes.data?.full_name || 'Unknown Patient',
            patientEmail: patientRes.data?.email || '',
            doctorId: consultation.doctor_id,
            doctorName: doctorRes.data?.full_name || 'Unknown Doctor',
            doctorEmail: doctorRes.data?.email || ''
        });

    } catch (error: any) {
        console.error('[ConsultationCheck] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
