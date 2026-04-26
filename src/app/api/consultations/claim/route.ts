import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { consultationId, doctorId } = await req.json();

        if (!consultationId || !doctorId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch consultation to check current status and data
        const { data: consultation, error: fetchError } = await supabaseAdmin
            .from('consultations')
            .select('id, doctor_id, status, doctor_amount, commission_amount, user_id')
            .eq('id', consultationId)
            .single();

        if (fetchError || !consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        if (consultation.doctor_id) {
            return NextResponse.json({ 
                error: 'Case already claimed', 
                already_claimed: true 
            }, { status: 409 });
        }

        // 2. Perform Atomic Update
        // We use .match({ doctor_id: null }) to ensure no one else has claimed it in the meantime
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('consultations')
            .update({ 
                doctor_id: doctorId,
                status: 'in-progress',
                // updated_at is usually automatic
            })
            .match({ id: consultationId, doctor_id: null }) // Extra check for null
            .select()
            .single();

        if (updateError || !updated) {
            return NextResponse.json({ 
                error: 'Failed to claim case. It may have just been taken by another doctor.', 
                already_claimed: true 
            }, { status: 409 });
        }

        // 3. Create Commission Record
        // This ensures the case shows up in the doctor's earnings and admin payroll
        const { error: commError } = await supabaseAdmin
            .from('commission_records')
            .insert({
                consultation_id: consultationId,
                doctor_amount: consultation.doctor_amount,
                commission_amount: consultation.commission_amount,
                payout_status: 'pending'
            });

        if (commError) {
            console.error('Error creating commission record:', commError);
            // We don't fail the whole claim if this part fails, but it's important log
        }

        // 4. Create an in-app notification for the patient
        // Assuming we have a notifications table
        await supabaseAdmin.from('notifications').insert({
            user_id: consultation.user_id,
            title: 'Doctor Joined',
            message: 'A doctor has claimed your consultation and will connect with you shortly.',
            type: 'consultation_update',
            link: `/dashboard/telemedicine/session/${consultationId}`
        });

        return NextResponse.json({ success: true, consultation: updated });

    } catch (error: any) {
        console.error('Claim consultation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
