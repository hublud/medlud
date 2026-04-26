import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAiLimit() {
    console.log('--- AI Limit Verification ---');
    
    // 1. Check current limit in DB
    const { data: settings } = await supabase.from('platform_settings').select('chat_message_limit').single();
    const limit = settings?.chat_message_limit;
    console.log(`Current Limit in DB: ${limit}`);

    // 2. Fetch a valid user ID
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    if (!profile) {
        console.error('No profile found for testing');
        return;
    }
    const userId = profile.id;
    console.log(`Testing with User ID: ${userId}`);

    // 3. Check current message count for today
    const now = new Date();
    now.setHours(0,0,0,0);
    const { count } = await supabase
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'user')
        .gte('created_at', now.toISOString());
    
    console.log(`Current Message Count today: ${count}`);

    if (count !== null && count >= (limit || 0)) {
        console.log('✅ LIMIT REACHED: The user already hit the limit.');
    } else {
        console.log(`User has ${ (limit || 0) - (count || 0) } messages remaining.`);
    }

    console.log('\n--- Price Verification ---');
    const { data: latestSettings } = await supabase.from('platform_settings').select('*').single();
    console.log('Latest Platform Settings:');
    console.log(`- Specialist Chat: ₦${latestSettings?.specialist_chat_price}`);
    console.log(`- Base Chat: ₦${latestSettings?.chat_price}`);
    console.log(`- Base Video: ₦${latestSettings?.video_price}`);
}

verifyAiLimit();
