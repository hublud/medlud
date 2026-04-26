import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { broadcastNewConsultation } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const { reference } = await req.json();

        if (!reference) {
            return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
        }

        const secret = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!secret) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        // Verify with Flutterwave using tx_ref
        const response = await fetch(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
            {
                headers: { Authorization: `Bearer ${secret}` },
            }
        );

        const data = await response.json();

        if (data.status !== 'success' || data.data?.status !== 'successful') {
            return NextResponse.json(
                { error: 'Payment not successful', status: data.data?.status },
                { status: 400 }
            );
        }

        const txData = data.data;
        // Flutterwave stores custom metadata in data.meta
        const rawMeta = txData.meta || {};

        const user_id = rawMeta.user_id;
        const purpose = rawMeta.purpose;
        const consultation_id = rawMeta.consultation_id;
        const appointment_id = rawMeta.appointment_id; // Case for regular appointments

        if (!user_id) {
            console.error('Payment verify: user_id missing from meta', rawMeta);
            return NextResponse.json({ error: 'Cannot identify user from payment metadata' }, { status: 400 });
        }

        // Check idempotency
        const { data: existingTx } = await supabaseAdmin
            .from('wallet_transactions')
            .select('id')
            .eq('reference_id', reference)
            .single();

        if (existingTx) {
            return NextResponse.json({ status: 'already_processed', message: 'Payment already applied' });
        }

        // Flutterwave returns amount in Naira directly
        const amountNaira = txData.amount;

        if (purpose === 'consultation_payment' && consultation_id) {
            // Directly activate consultation (no wallet intermediary)
            const { data: consultation } = await supabaseAdmin
                .from('consultations')
                .select('id, price, doctor_id')
                .eq('id', consultation_id)
                .single();

            if (consultation) {
                const { data: settings } = await supabaseAdmin.from('platform_settings').select('commission_percentage').single();
                const commissionPct = (settings as any)?.commission_percentage || 20;
                const commissionAmount = (amountNaira * commissionPct) / 100;
                const doctorAmount = amountNaira - commissionAmount;

                await supabaseAdmin.from('consultations').update({
                    status: 'active',
                    commission_amount: commissionAmount,
                    doctor_amount: doctorAmount,
                }).eq('id', consultation_id);

                await supabaseAdmin.from('wallet_transactions').insert({
                    user_id,
                    type: 'consultation_payment',
                    amount: amountNaira,
                    status: 'success',
                    reference_id: reference,
                });

                // Trigger broadcast to doctors
                broadcastNewConsultation(consultation_id);
            }

            return NextResponse.json({ status: 'success', purpose: 'consultation_payment', consultation_id });

        } else if (purpose === 'appointment_payment' && appointment_id) {
            // Activate professional appointment (chat case)
            const { error: updateError } = await supabaseAdmin
                .from('appointments')
                .update({
                    status: 'PENDING',
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointment_id);

            if (updateError) {
                console.error('Failed to activate appointment:', updateError);
                return NextResponse.json({ error: 'Failed to activate appointment' }, { status: 500 });
            }

            await supabaseAdmin.from('wallet_transactions').insert({
                user_id,
                type: 'consultation_payment',
                amount: amountNaira,
                status: 'success',
                reference_id: reference,
            });

            return NextResponse.json({ status: 'success', purpose: 'appointment_payment', appointment_id });

        } else if (purpose === 'wallet_funding') {
            // Top up wallet - insert transaction record first
            const { error: txInsertError } = await supabaseAdmin.from('wallet_transactions').insert({
                user_id,
                type: 'deposit',
                amount: amountNaira,
                status: 'success',
                reference_id: reference,
            });

            if (txInsertError) {
                console.error('Failed to insert wallet transaction:', txInsertError);
                return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
            }

            // @ts-ignore
            const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
                user_uuid: user_id,
                amount_to_add: amountNaira,
            });

            if (rpcError) {
                console.error('Failed to increment wallet balance:', rpcError);
                return NextResponse.json({ error: 'Wallet update failed. Contact support with ref: ' + reference }, { status: 500 });
            }

            return NextResponse.json({ status: 'success', purpose: 'wallet_funding', amount: amountNaira, new_balance: newBalance });
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
