import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();

        // Flutterwave sends the "Secret hash" (set in dashboard) in the verif-hash header
        const signature = req.headers.get('verif-hash');
        const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('FLUTTERWAVE_WEBHOOK_SECRET is not set');
            return NextResponse.json({ message: 'Server config error' }, { status: 500 });
        }

        // Validate — reject any request that doesn't carry the exact secret hash
        if (!signature || signature !== webhookSecret) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(rawBody);

        // Flutterwave successful charge event
        if (event.event === 'charge.completed' && event.data?.status === 'successful') {
            const data = event.data;
            const reference = data.tx_ref; // our custom reference

            // Parse metadata from payment
            const metadata = data.meta || {};
            const { user_id, purpose } = metadata;

            if (!user_id || purpose !== 'wallet_funding') {
                // Not a wallet funding event, just return success
                return NextResponse.json({ status: 'success' });
            }

            // Check if reference already processed to ensure idempotency
            const { data: existingTx } = await supabaseAdmin
                .from('wallet_transactions')
                .select('id')
                .eq('reference_id', reference)
                .single();

            if (existingTx) {
                return NextResponse.json({ status: 'already_processed' });
            }

            // Flutterwave amount is already in Naira
            const fundingAmount = data.amount;

            // 1. Insert transaction
            const { error: txError } = await supabaseAdmin
                .from('wallet_transactions')
                .insert({
                    user_id,
                    type: 'deposit',
                    amount: fundingAmount,
                    status: 'success',
                    reference_id: reference
                });

            if (txError) throw txError;

            // 2. Increment wallet balance using RPC
            // @ts-ignore
            const { error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
                user_uuid: user_id,
                amount_to_add: fundingAmount
            });

            if (rpcError) throw rpcError;
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Flutterwave webhook error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
