import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Call the new RPC
    const { data: count, error } = await supabase.rpc('get_daily_ai_message_count', {
        user_uuid: userId
    });

    return NextResponse.json({
        userId,
        rpcCount: count,
        rpcError: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        } : null,
        isLimitReached: count !== null && count >= 25
    });
}
