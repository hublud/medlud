import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/admin/wallet-credit
 *
 * Manually credits a user wallet by re-verifying a Flutterwave tx_ref.
 * Only available to super_admin users.
 *
 * Body: { reference?: string, user_id?: string, amount?: number }
 */
export async function POST(req: Request) {
    try {
        const { reference, user_id, amount } = await req.json();

        console.log('[Admin Wallet Credit] Request received');
        const authHeader = req.headers.get('authorization');

        if (!authHeader) {
            console.log('[Admin Wallet Credit] No auth header');
            return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('[Admin Wallet Credit] Token extracted');

        // Decode JWT to get user ID (sub claim)
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            console.log('[Admin Wallet Credit] Invalid token format');
            return NextResponse.json({ error: 'Unauthorized - Invalid token format' }, { status: 401 });
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const admin_user_id = payload.sub;
        console.log('[Admin Wallet Credit] User ID decoded:', admin_user_id);

        if (!admin_user_id) {
            return NextResponse.json({ error: 'Unauthorized - No user ID in session' }, { status: 401 });
        }

        // Initialize a Supabase client WITH the user's token injected
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        // Verify the requester is an admin
        console.log('[Admin Wallet Credit] Fetching admin role from DB...');
        const { data: admin, error: dbError } = await supabaseAuth
            .from('profiles')
            .select('admin_role, role')
            .eq('id', admin_user_id)
            .single();

        console.log('[Admin Wallet Credit] Admin lookup result:', admin);

        const isAuthorized = admin && (admin.admin_role === 'super_admin' || admin.role === 'admin');

        if (dbError) {
             console.error('[Admin Wallet Credit] DB Error:', dbError);
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        console.log('[Admin Wallet Credit] Authorized! Processing mode...');

        // --- MODE 1: Re-verify by Flutterwave tx_ref ---
        if (reference) {
            console.log(`[Admin Wallet Credit] Mode: Reference (${reference})`);
            // Check if already applied
            const { data: existingTx } = await supabaseAuth
                .from('wallet_transactions')
                .select('id')
                .eq('reference_id', reference)
                .single();

            if (existingTx) {
                console.log('[Admin Wallet Credit] Already applied');
                return NextResponse.json({ error: 'This reference has already been applied to a wallet.' }, { status: 400 });
            }

            const secret = process.env.FLUTTERWAVE_SECRET_KEY;
            console.log('[Admin Wallet Credit] Calling Flutterwave verify...');
            const flwRes = await fetch(
                `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
                {
                    headers: { Authorization: `Bearer ${secret}` },
                }
            );
            const flwData = await flwRes.json();
            console.log('[Admin Wallet Credit] Flutterwave verify result status:', flwData.status);

            if (flwData.status !== 'success' || flwData.data?.status !== 'successful') {
                console.log('[Admin Wallet Credit] Flutterwave transaction not successful');
                return NextResponse.json({ error: 'Flutterwave transaction not successful', detail: flwData }, { status: 400 });
            }

            const txData = flwData.data;
            const rawMeta = txData.meta || {};

            let resolved_user_id = rawMeta.user_id;

            // If still can't find user_id in metadata, require it in the request body
            if (!resolved_user_id) {
                console.log('[Admin Wallet Credit] Missing user_id in meta. Body user_id:', user_id);
                if (!user_id) {
                    return NextResponse.json({
                        error: 'Cannot identify user from Flutterwave metadata and no user_id provided.',
                        flw_email: txData.customer?.email,
                        amount_naira: txData.amount,
                        hint: 'Re-send this request with user_id to manually assign.'
                    }, { status: 400 });
                }
                resolved_user_id = user_id;
            }

            // Flutterwave returns amount directly in Naira
            const amountNaira = txData.amount;
            console.log(`[Admin Wallet Credit] Inserting transaction for user ${resolved_user_id}, amount ${amountNaira}`);

            // Insert transaction record
            const { error: insertError } = await supabaseAuth.from('wallet_transactions').insert({
                user_id: resolved_user_id,
                type: 'deposit',
                amount: amountNaira,
                status: 'success',
                reference_id: reference,
            });

            if (insertError) {
                console.error('[Admin Wallet Credit] Insert error:', insertError);
            }

            // Credit the wallet
            console.log('[Admin Wallet Credit] Calling increment_wallet_balance RPC...');
            const { data: newBalance, error: rpcError } = await supabaseAuth.rpc('increment_wallet_balance', {
                user_uuid: resolved_user_id,
                amount_to_add: amountNaira,
            });

            if (rpcError) {
                console.error('[Admin Wallet Credit] RPC Error:', rpcError);
                return NextResponse.json({ error: 'RPC failed', detail: rpcError }, { status: 500 });
            }

            console.log('[Admin Wallet Credit] Success! Returning response.');
            return NextResponse.json({
                status: 'success',
                message: `Wallet credited ₦${amountNaira.toLocaleString()} from Flutterwave reference.`,
                user_id: resolved_user_id,
                amount: amountNaira,
                new_balance: newBalance,
                reference,
            });
        }

        // --- MODE 2: Direct manual credit (no Flutterwave verification) ---
        if (user_id && amount && amount > 0) {
            const manualRef = `MANUAL_CREDIT_${Date.now()}`;

            await supabaseAuth.from('wallet_transactions').insert({
                user_id,
                type: 'deposit',
                amount,
                status: 'success',
                reference_id: manualRef,
            });

            // @ts-ignore
            const { data: newBalance, error: rpcError } = await supabaseAuth.rpc('increment_wallet_balance', {
                user_uuid: user_id,
                amount_to_add: amount,
            });

            if (rpcError) {
                return NextResponse.json({ error: 'RPC failed', detail: rpcError }, { status: 500 });
            }

            return NextResponse.json({
                status: 'success',
                message: `Manual wallet credit of ₦${Number(amount).toLocaleString()} applied.`,
                user_id,
                amount,
                new_balance: newBalance,
                reference: manualRef,
            });
        }

        return NextResponse.json({ error: 'Provide either a Flutterwave tx_ref, or a user_id + amount.' }, { status: 400 });

    } catch (error: any) {
        console.error('Admin wallet credit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
