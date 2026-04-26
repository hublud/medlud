import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { broadcastNewConsultation } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const { consultationId } = await req.json();

        if (!consultationId) {
            return NextResponse.json({ error: 'Missing consultation ID' }, { status: 400 });
        }

        // 1. Fetch consultation details to get price and user
        const { data: consultation, error: fetchError } = await supabaseAdmin
            .from('consultations')
            .select('id, user_id, price, status')
            .eq('id', consultationId)
            .single();

        if (fetchError || !consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        if (consultation.status !== 'pending') {
            return NextResponse.json({ error: 'Consultation is already processed' }, { status: 400 });
        }

        // 2. Fetch platform commission percentage
        const { data: settings } = await supabaseAdmin
            .from('platform_settings')
            .select('commission_percentage')
            .single();

        const commissionPct = settings?.commission_percentage || 20;

        // Calculate commission
        const commissionAmount = (consultation.price * commissionPct) / 100;
        const doctorAmount = consultation.price - commissionAmount;

        // 3. Verify User Wallet Balance
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('wallet_balance')
            .eq('id', consultation.user_id as string)
            .single();

        const currentBalance = profile?.wallet_balance || 0;

        if (currentBalance < consultation.price) {
            return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
        }

        // 4. Perform Wallet Deduction transaction
        const newBalance = currentBalance - consultation.price;
        const { error: deductError } = await supabaseAdmin
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', consultation.user_id as string);

        if (deductError) throw deductError;

        // 5. Update Consultation to Active and insert calculations
        const { error: updateConsultError } = await supabaseAdmin
            .from('consultations')
            .update({
                status: 'active',
                commission_amount: commissionAmount,
                doctor_amount: doctorAmount
            })
            .eq('id', consultation.id);

        if (updateConsultError) throw updateConsultError;

        // 5b. Broadcast to all doctors if it's a pool case (doctor_id is null)
        // We do this in a non-blocking way
        broadcastNewConsultation(consultation.id);

        // 6. Record Wallet Transaction
        await supabaseAdmin.from('wallet_transactions').insert({
            user_id: consultation.user_id as string,
            type: 'consultation_payment',
            amount: -consultation.price,
            status: 'success',
            reference_id: `consult_${consultation.id}`
        });

        return NextResponse.json({ success: true, balance: newBalance });

    } catch (error: any) {
        console.error('Wallet Payment processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
