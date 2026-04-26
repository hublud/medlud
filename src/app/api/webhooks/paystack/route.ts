import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This Paystack webhook endpoint is no longer active.
 * Payments are now processed via Flutterwave.
 * New webhook endpoint: /api/webhooks/flutterwave
 */
export async function POST() {
    return NextResponse.json(
        { message: 'This endpoint is deprecated. Payments have migrated to Flutterwave.' },
        { status: 410 }
    );
}
