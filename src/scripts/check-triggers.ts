import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envConfig[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkTriggers() {
    console.log('Inspecting auth.users triggers...');

    // Query triggers on auth.users
    const sql = `
        SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_orientation,
            action_timing
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth' AND event_object_table = 'users';
    `;

    const { data: triggers, error: triggerErr } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (triggerErr) {
        console.error('Error fetching triggers:', triggerErr);
    } else {
        console.log('Triggers on auth.users:', triggers);
    }

    // Query source code of handle_new_user function
    const sqlFunc = `
        SELECT 
            proname,
            prosrc
        FROM pg_proc
        WHERE proname = 'handle_new_user';
    `;

    const { data: funcs, error: funcErr } = await supabaseAdmin.rpc('exec_sql', { sql_query: sqlFunc });
    if (funcErr) {
        console.error('Error fetching handle_new_user source:', funcErr);
    } else {
        console.log('handle_new_user functions:', funcs);
    }
}

checkTriggers();
