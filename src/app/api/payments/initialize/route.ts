import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, amount, metadata, purpose } = await req.json();

        if (!email || !amount) {
            return NextResponse.json({ error: 'email and amount are required' }, { status: 400 });
        }

        const secret = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!secret) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        // Generate a unique transaction reference
        const reference = `medlud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tx_ref: reference,
                amount,
                currency: 'NGN',
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/wallet?payment=success`,
                customer: {
                    email,
                },
                meta: {
                    ...metadata,
                    purpose: purpose || 'wallet_funding',
                },
                customizations: {
                    title: 'Medlud Payment',
                    description: purpose === 'wallet_funding' ? 'Wallet Top-Up' : 'Consultation Payment',
                    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
                },
            }),
        });

        const data = await response.json();

        if (data.status !== 'success') {
            return NextResponse.json({ error: data.message || 'Flutterwave initialization failed' }, { status: 400 });
        }

        return NextResponse.json({
            authorization_url: data.data.link,
            reference,
            access_code: reference,
        });

    } catch (error: any) {
        console.error('Payment initialization error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
