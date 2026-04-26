const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPlatformSettings() {
    process.stdout.write('--- Platform Settings Verification ---\n');
    
    // 1. Check current limit in DB
    const { data: settings, error: settingsError } = await supabase.from('platform_settings').select('*').limit(1).single();
    if (settingsError) {
        console.error('Error fetching settings:', settingsError.message);
        return;
    }

    console.log(`Current DB Message Limit: ${settings.chat_message_limit}`);
    console.log(`Specialist Chat Price: ₦${settings.specialist_chat_price}`);
    console.log(`Base Chat Price: ₦${settings.chat_price}`);

    // 2. Fetch a valid user ID for testing count
    const { data: profile } = await supabase.from('profiles').select('id, full_name').limit(1).single();
    if (!profile) {
        console.error('No profile found for testing');
        return;
    }
    const userId = profile.id;
    console.log(`\nTesting Count for User: ${profile.full_name} (${userId})`);

    // 3. Check current message count for today
    const today = new Date();
    today.setHours(0,0,0,0);
    const { count, error: countError } = await supabase
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'user')
        .gte('created_at', today.toISOString());
    
    if (countError) {
        console.error('Error fetching message count:', countError.message);
    } else {
        console.log(`Messages sent today: ${count}`);
        if (count >= settings.chat_message_limit) {
            console.log('✅ STATUS: Daily Limit Reached for this user.');
        } else {
            console.log(`✅ STATUS: User has ${settings.chat_message_limit - count} messages remaining.`);
        }
    }
    
    console.log('\nVerification Complete.');
}

verifyPlatformSettings();
